import {
  persistPuterResumeAnalysis,
  type ResumeAnalysis,
  type ResumeAnalysisResponse,
} from './resume-analyzer';

interface PuterFile {
  path?: unknown;
}

type PuterContentPart = {
  text?: unknown;
  type?: unknown;
};

type PuterChatResponse = {
  message?: {
    content?: unknown;
  };
  content?: unknown;
};

type PuterApi = {
  auth: {
    isSignedIn: () => Promise<boolean>;
    signIn: () => Promise<void>;
  };
  fs: {
    upload: (files: File[] | Blob[]) => Promise<PuterFile | undefined>;
  };
  ai: {
    chat: (
      prompt: unknown,
      imageURL?: string | Record<string, unknown>,
      testMode?: boolean,
      options?: Record<string, unknown>,
    ) => Promise<PuterChatResponse | string | undefined>;
  };
};

declare global {
  interface Window {
    puter?: PuterApi;
  }
}

const AI_TIMEOUT_MS = 180_000;

const AI_RESPONSE_FORMAT = `
{
  "overallScore": number,
  "matchingSkills": string[],
  "missingSkills": string[],
  "strengths": string[],
  "improvements": string[],
  "recommendations": string[],
  "summary": string
}`;

function getPuter(): PuterApi {
  if (typeof window === 'undefined' || !window.puter) {
    throw new Error('The resume analysis service is still loading. Please try again.');
  }
  return window.puter;
}

function buildPrompt(jobRole: string, jobDescription: string): string {
  return [
    'You are an expert in ATS (Applicant Tracking System) and resume analysis.',
    'Analyze the attached resume and rate it against the target role. Be thorough and specific. Do not invent experience, skills, achievements, companies, or certifications.',
    'Use the job description when it is provided. Give a skill-match percentage, list matching skills, and list important skills that are not clearly present. Summarize strengths, weaknesses as improvement areas, and concrete suggestions.',
    `The target job title is: ${jobRole.trim().slice(0, 160)}`,
    `The target job description is: ${jobDescription.trim().slice(0, 12_000)}`,
    'Return only one JSON object with this shape. Do not return Markdown fences, commentary, or any text outside the JSON object:',
    AI_RESPONSE_FORMAT,
    'overallScore must be an integer from 0 to 100. Keep every list focused and actionable. Do not include URLs.',
  ].join('\n\n');
}

function getResponseText(response: PuterChatResponse | string): string {
  if (typeof response === 'string') return response;
  const content = response.message?.content ?? response.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const textParts = content
      .map((part: unknown) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as PuterContentPart).text;
          return typeof text === 'string' ? text : '';
        }
        return '';
      })
      .filter(Boolean);
    if (textParts.length > 0) return textParts.join('');
  }
  throw new Error('The AI returned an unexpected response format. Please try again.');
}

function extractJsonFromText(text: string): Record<string, unknown> {
  const trimmed = text.trim().replace(/^\uFEFF/, '');
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidates = fenced ? [fenced, trimmed] : [trimmed];

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Continue with balanced-object extraction for provider commentary.
    }

    for (let start = 0; start < candidate.length; start += 1) {
      if (candidate[start] !== '{') continue;
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let end = start; end < candidate.length; end += 1) {
        const character = candidate[end];
        if (inString) {
          if (escaped) escaped = false;
          else if (character === '\\') escaped = true;
          else if (character === '"') inString = false;
          continue;
        }
        if (character === '"') {
          inString = true;
          continue;
        }
        if (character === '{') depth += 1;
        if (character === '}') depth -= 1;
        if (depth !== 0) continue;
        try {
          const parsed: unknown = JSON.parse(candidate.slice(start, end + 1));
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
          }
        } catch {
          // Keep scanning for the next candidate object.
        }
        break;
      }
    }
  }
  throw new Error('The AI returned unreadable analysis. Please try again.');
}

function boundedText(value: unknown, maxLength: number): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
    : '';
}

function boundedList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => boundedText(item, 240))
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeAnalysis(value: Record<string, unknown>): ResumeAnalysis {
  const score = Number(value.overallScore);
  const summary = boundedText(value.summary, 1_000);
  const analysis: ResumeAnalysis = {
    overallScore: Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : -1,
    matchingSkills: boundedList(value.matchingSkills),
    missingSkills: boundedList(value.missingSkills),
    strengths: boundedList(value.strengths),
    improvements: boundedList(value.improvements),
    recommendations: boundedList(value.recommendations),
    summary,
    provider: 'puter',
  };
  if (
    analysis.overallScore < 0 ||
    !analysis.summary ||
    analysis.strengths.length === 0 ||
    analysis.recommendations.length === 0
  ) {
    throw new Error('The AI returned an incomplete resume analysis. Please try again.');
  }
  return analysis;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Resume analysis timed out. Please try again.')), timeoutMs);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function analyzeResumeWithPuter(input: {
  companyName: string;
  jobRole: string;
  jobDescription: string;
  file: File;
}): Promise<ResumeAnalysisResponse> {
  const puter = getPuter();
  let signedIn = await puter.auth.isSignedIn();
  if (!signedIn) {
    await puter.auth.signIn();
    signedIn = await puter.auth.isSignedIn();
  }
  if (!signedIn) {
    throw new Error('Sign in to Puter to analyze your resume, then try again.');
  }

  const uploadedFile = await withTimeout(puter.fs.upload([input.file]), AI_TIMEOUT_MS);
  const puterPath = typeof uploadedFile?.path === 'string' ? uploadedFile.path : '';
  if (!puterPath) throw new Error('The resume could not be uploaded to the analysis service.');

  const prompt = buildPrompt(input.jobRole, input.jobDescription);
  const response = await withTimeout(
    puter.ai.chat(
      [
        {
          role: 'user',
          content: [
            { type: 'file', puter_path: puterPath },
            { type: 'text', text: prompt },
          ],
        },
      ],
      { model: 'claude-sonnet-4-6' },
    ),
    AI_TIMEOUT_MS,
  );
  if (!response) throw new Error('The AI returned no resume analysis. Please try again.');

  const analysis = normalizeAnalysis(extractJsonFromText(getResponseText(response)));
  return persistPuterResumeAnalysis({
    companyName: input.companyName,
    jobRole: input.jobRole,
    fileName: input.file.name,
    analysis,
  });
}
