import { PDFParse } from "pdf-parse";
import { AppError } from "../utils/app-error.js";
import {
  generateAdvisorProviderText,
  type AdvisorProvider,
} from "./advisor.service.js";

const MAX_JOB_DESCRIPTION_CHARS = 12_000;
const MAX_EXTRACTED_RESUME_CHARS = 24_000;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export interface ResumeAnalysis {
  overallScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  summary: string;
  provider: "gemini" | "groq" | "ollama" | "custom" | "none";
}

export interface ResumeAnalyzeInput {
  companyName: string;
  jobRole: string;
  jobDescription: string;
  file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  };
}

function boundedText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength)
    : "";
}

function boundedList(value: unknown, maxItems = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => boundedText(item, 240))
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseJsonObject(value: string): Record<string, unknown> {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? value;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new AppError(
      502,
      "resume_analysis_invalid_response",
      "The AI analysis returned an unreadable result.",
    );
  }
  try {
    const parsed: unknown = JSON.parse(fenced.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("not an object");
    return parsed as Record<string, unknown>;
  } catch {
    throw new AppError(
      502,
      "resume_analysis_invalid_response",
      "The AI analysis returned an unreadable result.",
    );
  }
}

function normalizeAnalysis(
  value: Record<string, unknown>,
  provider: ResumeAnalysis["provider"],
): ResumeAnalysis {
  const scoreValue =
    typeof value.overallScore === "number"
      ? value.overallScore
      : Number(value.overallScore);
  if (!Number.isFinite(scoreValue)) {
    throw new AppError(
      502,
      "resume_analysis_invalid_response",
      "The AI analysis did not include a valid match score.",
    );
  }
  const summary = boundedText(value.summary, 1_000);
  const result: ResumeAnalysis = {
    overallScore: Math.min(100, Math.max(0, Math.round(scoreValue))),
    matchingSkills: boundedList(value.matchingSkills),
    missingSkills: boundedList(value.missingSkills),
    strengths: boundedList(value.strengths),
    improvements: boundedList(value.improvements),
    recommendations: boundedList(value.recommendations),
    summary,
    provider,
  };
  if (
    !result.summary ||
    result.strengths.length === 0 ||
    result.recommendations.length === 0
  ) {
    throw new AppError(
      502,
      "resume_analysis_invalid_response",
      "The AI analysis was incomplete. Please try again.",
    );
  }
  return result;
}

function buildResumePrompt(
  input: ResumeAnalyzeInput,
  resumeText: string,
): string {
  return [
    "You are a senior technical recruiter and career coach evaluating a resume against one target role.",
    "Return ONLY valid JSON matching the requested fields. Do not use Markdown fences, commentary, a confidence label, or a feedback question.",
    "Do not invent experience, skills, achievements, companies, or certifications. Base every observation on the supplied resume and job description. If evidence is missing, say so in improvements or recommendations.",
    "Scoring rule: overallScore is a whole number from 0 to 100 representing evidence-based alignment with the target role, not a prediction of hiring outcome.",
    'Required JSON shape: {"overallScore":number,"matchingSkills":string[],"missingSkills":string[],"strengths":string[],"improvements":string[],"recommendations":string[],"summary":string}',
    `Target company: ${boundedText(input.companyName, 160)}`,
    `Target role: ${boundedText(input.jobRole, 160)}`,
    `Job description: ${boundedText(input.jobDescription, MAX_JOB_DESCRIPTION_CHARS)}`,
    `Resume text: ${boundedText(resumeText, MAX_EXTRACTED_RESUME_CHARS)}`,
    "Keep each list focused and specific. Mention measurable resume improvements where the evidence supports them. Do not include URLs.",
  ].join("\n\n");
}

export async function extractResumeText(buffer: Buffer): Promise<string> {
  if (buffer.length === 0 || buffer.length > MAX_FILE_BYTES) {
    throw new AppError(
      413,
      "resume_file_too_large",
      "Resume files must be between 1 byte and 8 MB.",
    );
  }
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    const text = boundedText(result.text, MAX_EXTRACTED_RESUME_CHARS);
    if (!text) throw new Error("empty PDF text");
    return text;
  } catch {
    throw new AppError(
      422,
      "resume_text_extraction_failed",
      "The PDF could not be read. Upload a text-readable PDF and try again.",
    );
  }
}

export async function analyzeResume(
  input: ResumeAnalyzeInput,
  provider?: AdvisorProvider,
): Promise<ResumeAnalysis> {
  const companyName = boundedText(input.companyName, 160);
  const jobRole = boundedText(input.jobRole, 160);
  const jobDescription = boundedText(
    input.jobDescription,
    MAX_JOB_DESCRIPTION_CHARS,
  );
  if (!companyName || !jobRole || !jobDescription) {
    throw new AppError(
      400,
      "resume_fields_required",
      "Company name, job role, and job description are required.",
    );
  }
  if (
    input.file.mimetype !== "application/pdf" ||
    !/\.pdf$/i.test(input.file.originalname)
  ) {
    throw new AppError(
      415,
      "resume_pdf_required",
      "Upload your resume as a PDF file.",
    );
  }
  const resumeText = await extractResumeText(input.file.buffer);
  let generated: { text: string; provider: ResumeAnalysis["provider"] };
  try {
    generated = await generateAdvisorProviderText(
      buildResumePrompt(
        { ...input, companyName, jobRole, jobDescription },
        resumeText,
      ),
      provider,
    );
  } catch {
    throw new AppError(
      503,
      "resume_analysis_provider_unavailable",
      "The resume analysis service is temporarily unavailable. Please try again.",
    );
  }
  return normalizeAnalysis(parseJsonObject(generated.text), generated.provider);
}

export const resumeAnalyzerLimits = {
  maxFileBytes: MAX_FILE_BYTES,
  maxJobDescriptionChars: MAX_JOB_DESCRIPTION_CHARS,
};
