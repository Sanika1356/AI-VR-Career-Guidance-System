import { env } from "../config/env.js";
import type { DatabaseClient, DatabasePool } from "../db/types.js";
import { AppError } from "../utils/app-error.js";
import { createId } from "../utils/id.js";
import { requirePool } from "../db/pool.js";
import type { AdvisorChatInput } from "../validators/advisor.js";
import { observeAiRequest } from "../utils/metrics.js";

interface ProfileRow {
  name: string;
  interests: string[] | string | null;
  current_skills: string[] | string | null;
  experience: string | null;
  learning_preferences: string | null;
}

interface AssessmentRow {
  category_scores: Record<string, number> | string | null;
  top_career_ids: string[] | string | null;
}

interface CareerRow {
  id: string;
  name: string;
  description: string;
  skill_name: string | null;
}

interface RoadmapRow {
  title: string;
  skill: string;
  completed: boolean;
}

interface ConversationRow {
  id: string;
}

export interface AdvisorResponse {
  conversationId: string;
  answer: string;
  sources: string[];
  createdAt: string;
}

export interface AdvisorProvider {
  generate(prompt: string): Promise<string>;
}

function parseArray(value: string[] | string | null): string[] {
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseObject(
  value: Record<string, number> | string | null,
): Record<string, number> {
  if (!value) return {};
  if (typeof value !== "string") return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

function normalizeSkill(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function groupCareerRows(
  rows: CareerRow[],
): { id: string; name: string; description: string; skills: string[] } | null {
  const first = rows[0];
  if (!first) return null;
  return {
    id: first.id,
    name: first.name,
    description: first.description,
    skills: rows
      .filter((row) => row.skill_name)
      .map((row) => row.skill_name as string),
  };
}

function fallbackAnswer(
  message: string,
  careerName: string | undefined,
  missingSkills: string[],
): string {
  const focus = careerName ? ` for ${careerName}` : "";
  const skills =
    missingSkills.length > 0
      ? ` Prioritize ${missingSkills.slice(0, 3).join(", ")} next.`
      : " Continue with a small practical project and review your progress weekly.";
  return `I can help you plan your next career step${focus}. Based on the information available, start with one achievable learning activity related to your question: “${message}”.${skills} This is general guidance, not a guarantee of an employment outcome.`;
}

function limitAdvisorOutput(value: string): string {
  const answer = value.trim();
  if (answer.length <= env.aiMaxResponseChars) return answer;
  const suffix = "…";
  return `${answer.slice(0, Math.max(0, env.aiMaxResponseChars - suffix.length)).trimEnd()}${suffix}`;
}

async function generateWithRetry(
  provider: AdvisorProvider,
  prompt: string,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= env.aiRetryAttempts; attempt += 1) {
    try {
      const answer = limitAdvisorOutput(await provider.generate(prompt));
      if (answer.length === 0)
        throw new Error("Advisor provider returned an empty answer");
      return answer;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Advisor provider failed");
}

function buildPrompt(
  input: AdvisorChatInput,
  profile: ProfileRow | undefined,
  assessment: AssessmentRow | undefined,
  career: {
    id: string;
    name: string;
    description: string;
    skills: string[];
  } | null,
  roadmap: RoadmapRow[],
  missingSkills: string[],
  allowPersonalization: boolean,
): string {
  const profileData = {
    name: profile?.name ?? "Not provided",
    interests: parseArray(profile?.interests ?? []),
    currentSkills: parseArray(profile?.current_skills ?? []),
    experience: profile?.experience ?? "Not provided",
    learningPreferences: profile?.learning_preferences ?? "Not provided",
  };
  return [
    "You are a cautious career guidance advisor. Give practical, concise guidance based only on the supplied context.",
    "Do not invent labor-market facts, guarantees, credentials, salaries, or links. State uncertainty when context is incomplete.",
    `User question: ${input.message}`,
    `Profile context: ${allowPersonalization ? JSON.stringify(profileData) : "Not shared by the user."}`,
    `Latest assessment context: ${
      allowPersonalization
        ? JSON.stringify({
            categoryScores: parseObject(assessment?.category_scores ?? null),
            topCareerIds: parseArray(assessment?.top_career_ids ?? []),
          })
        : "Not shared by the user."
    }`,
    `Selected career context: ${JSON.stringify(career ?? { selected: false })}`,
    `Missing skills for the selected career: ${JSON.stringify(allowPersonalization ? missingSkills : [])}`,
    `Roadmap progress context: ${allowPersonalization ? JSON.stringify(roadmap) : "Not shared by the user."}`,
    "Answer in plain text with a short explanation and concrete next steps.",
  ].join("\n");
}

export class OllamaAdvisorProvider implements AdvisorProvider {
  async generate(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      env.aiRequestTimeoutMs,
    );
    try {
      const response = await fetch(
        `${env.ollamaBaseUrl.replace(/\/$/, "")}/api/chat`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model: env.ollamaModel,
            stream: false,
            messages: [
              {
                role: "system",
                content: "You are a careful, evidence-aware career advisor.",
              },
              { role: "user", content: prompt },
            ],
            options: { temperature: 0.2 },
          }),
          signal: controller.signal,
        },
      );
      if (!response.ok)
        throw new Error(`Ollama returned HTTP ${response.status}`);
      const payload: unknown = await response.json();
      const content = (payload as { message?: { content?: unknown } }).message
        ?.content;
      if (typeof content !== "string" || content.trim().length === 0)
        throw new Error("Ollama returned an empty answer");
      return content.trim();
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class FallbackAdvisorProvider implements AdvisorProvider {
  constructor(
    private readonly context: {
      message: string;
      careerName?: string;
      missingSkills: string[];
    },
  ) {}

  async generate(): Promise<string> {
    return fallbackAnswer(
      this.context.message,
      this.context.careerName,
      this.context.missingSkills,
    );
  }
}

export async function chatAdvisor(
  userId: string,
  input: AdvisorChatInput,
  database: DatabasePool = requirePool(),
  provider: AdvisorProvider = new OllamaAdvisorProvider(),
): Promise<AdvisorResponse> {
  const client = await database.connect();
  try {
    const [profileResult, assessmentResult, consentResult] = await Promise.all([
      client.query<ProfileRow>(
        `SELECT u.name, p.interests, p.current_skills, p.experience, p.learning_preferences
         FROM profiles p JOIN users u ON u.id = p.user_id
         WHERE p.user_id = $1`,
        [userId],
      ),
      client.query<AssessmentRow>(
        `SELECT category_scores, top_career_ids FROM assessment_results
         WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1`,
        [userId],
      ),
      client.query<{ personalized_ai: boolean }>(
        "SELECT personalized_ai FROM privacy_consents WHERE user_id = $1",
        [userId],
      ),
    ]);

    let career: {
      id: string;
      name: string;
      description: string;
      skills: string[];
    } | null = null;
    let roadmap: RoadmapRow[] = [];
    if (input.careerId) {
      const careerResult = await client.query<CareerRow>(
        `SELECT c.id, c.name, c.description, s.name AS skill_name
         FROM careers c
         LEFT JOIN career_skills cs ON cs.career_id = c.id
         LEFT JOIN skills s ON s.id = cs.skill_id
         WHERE c.id = $1 ORDER BY s.name`,
        [input.careerId],
      );
      career = groupCareerRows(careerResult.rows);
      if (!career)
        throw new AppError(
          404,
          "career_not_found",
          "The selected career does not exist.",
        );
      const roadmapResult = await client.query<RoadmapRow>(
        `SELECT rs.title, rs.skill, COALESCE(rp.completed, FALSE) AS completed
         FROM roadmap_steps rs
         LEFT JOIN roadmap_progress rp ON rp.step_id = rs.id AND rp.user_id = $1
         WHERE rs.career_id = $2 ORDER BY rs.display_order ASC`,
        [userId, input.careerId],
      );
      roadmap = roadmapResult.rows.map((row) => ({
        ...row,
        completed: Boolean(row.completed),
      }));
    }

    const currentSkills = parseArray(
      profileResult.rows[0]?.current_skills ?? [],
    );
    const currentSkillSet = new Set(currentSkills.map(normalizeSkill));
    const missingSkills =
      career?.skills.filter(
        (skill) => !currentSkillSet.has(normalizeSkill(skill)),
      ) ?? [];
    const allowPersonalization =
      consentResult.rows[0]?.personalized_ai === true;
    const prompt = buildPrompt(
      input,
      profileResult.rows[0],
      assessmentResult.rows[0],
      career,
      roadmap,
      missingSkills,
      allowPersonalization,
    );

    let answer: string;
    const aiStartedAt = Date.now();
    try {
      answer = await generateWithRetry(provider, prompt);
      observeAiRequest({
        success: true,
        fallback: false,
        durationMs: Date.now() - aiStartedAt,
      });
    } catch {
      observeAiRequest({
        success: false,
        fallback: true,
        durationMs: Date.now() - aiStartedAt,
      });
      answer = limitAdvisorOutput(
        await new FallbackAdvisorProvider({
          message: input.message,
          careerName: career?.name,
          missingSkills: allowPersonalization ? missingSkills : [],
        }).generate(),
      );
    }

    await client.query("BEGIN");
    let conversationId = input.conversationId;
    if (conversationId) {
      const conversationResult = await client.query<ConversationRow>(
        "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
        [conversationId, userId],
      );
      if (!conversationResult.rows[0])
        throw new AppError(
          404,
          "conversation_not_found",
          "The conversation does not exist.",
        );
    } else {
      conversationId = createId("conversation");
      await client.query(
        "INSERT INTO conversations (id, user_id, career_id) VALUES ($1, $2, $3)",
        [conversationId, userId, input.careerId ?? null],
      );
    }

    const createdAt = new Date().toISOString();
    await client.query(
      "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5)",
      [createId("message"), conversationId, "user", input.message, createdAt],
    );
    await client.query(
      "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5)",
      [createId("message"), conversationId, "assistant", answer, createdAt],
    );
    await client.query("COMMIT");
    return { conversationId, answer, sources: [], createdAt };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original application error when rollback is unavailable.
    }
    throw error;
  } finally {
    client.release();
  }
}

export type { DatabaseClient };
