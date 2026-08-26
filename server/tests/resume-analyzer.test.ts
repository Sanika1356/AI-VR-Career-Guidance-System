import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import type { AdvisorProvider } from "../src/services/advisor.js";
import type { DatabasePool } from "../src/db/types.js";
import {
  analyzeResume,
  extractResumeText,
  getResumeAnalysis,
  listResumeAnalyses,
  resumeAnalyzerLimits,
} from "../src/services/resume-analyzer.service.js";

const fixturePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/resume-fixture.pdf",
);

function validAnalysisJson(): string {
  return JSON.stringify({
    overallScore: 82,
    matchingSkills: ["Python", "SQL", "Data analysis"],
    missingSkills: ["Power BI"],
    strengths: ["The resume shows relevant Python and SQL evidence."],
    improvements: ["Add measurable outcomes to project descriptions."],
    recommendations: [
      "Build and document one dashboard project aligned with the role.",
    ],
    summary:
      "The resume is a promising match for an entry-level data analysis role.",
  });
}

class StructuredProvider implements AdvisorProvider {
  constructor(private readonly output = validAnalysisJson()) {}

  async generate(): Promise<string> {
    return this.output;
  }
}

function createDatabase(
  rows: Array<Record<string, unknown>> = [],
): DatabasePool {
  return {
    connect: async () => ({
      query: async () => ({ rows, rowCount: rows.length }),
      release: () => undefined,
    }),
  };
}

test("extractResumeText reads a text-readable PDF without storing it", async () => {
  const buffer = await readFile(fixturePath);
  const text = await extractResumeText(buffer);
  assert.match(text, /Python/);
  assert.match(text, /SQL/);
});

test("analyzeResume returns bounded structured results and persists no resume bytes", async () => {
  const buffer = await readFile(fixturePath);
  const queries: Array<{ text: string; values?: readonly unknown[] }> = [];
  const database: DatabasePool = {
    connect: async () => ({
      query: async (text: string, values?: readonly unknown[]) => {
        queries.push({ text, values });
        return { rows: [], rowCount: 1 };
      },
      release: () => undefined,
    }),
  };

  const result = await analyzeResume(
    {
      userId: "user_resume_test",
      companyName: "Microsoft",
      jobRole: "Data Analyst Intern",
      jobDescription:
        "Use SQL and Python to analyze data and communicate insights.",
      file: {
        buffer,
        mimetype: "application/pdf",
        originalname: "resume.pdf",
        size: buffer.length,
      },
    },
    database,
    new StructuredProvider(),
  );

  assert.equal(result.analysis.overallScore, 82);
  assert.deepEqual(result.analysis.matchingSkills, [
    "Python",
    "SQL",
    "Data analysis",
  ]);
  assert.equal(result.analysis.provider, "custom");
  assert.match(queries[0]?.text ?? "", /INSERT INTO resume_analyses/);
  assert.equal(queries[0]?.values?.[1], "user_resume_test");
  assert.equal(queries[0]?.values?.includes(buffer), false);
});

test("resume history maps only the authenticated user’s stored analysis metadata", async () => {
  const history = await listResumeAnalyses(
    "user_resume_test",
    createDatabase([
      {
        id: "resume_analysis_1",
        file_name: "resume.pdf",
        company_name: "Microsoft",
        job_role: "Data Analyst Intern",
        overall_score: 82,
        created_at: "2026-08-26T00:00:00.000Z",
      },
    ]),
  );
  assert.deepEqual(history, [
    {
      id: "resume_analysis_1",
      fileName: "resume.pdf",
      companyName: "Microsoft",
      jobRole: "Data Analyst Intern",
      overallScore: 82,
      status: "completed",
      analyzedAt: "2026-08-26T00:00:00.000Z",
    },
  ]);
});

test("resume analysis detail is ownership-scoped and returns the stored structured report", async () => {
  const result = await getResumeAnalysis(
    "user_resume_test",
    "resume_analysis_1",
    createDatabase([
      {
        id: "resume_analysis_1",
        file_name: "resume.pdf",
        analysis: {
          overallScore: 82,
          matchingSkills: ["SQL"],
          missingSkills: [],
          strengths: ["Relevant evidence"],
          improvements: [],
          recommendations: ["Build a dashboard"],
          summary: "Promising match.",
          provider: "groq",
        },
        created_at: "2026-08-26T00:00:00.000Z",
      },
    ]),
  );
  assert.equal(result.analysisId, "resume_analysis_1");
  assert.equal(result.analysis.provider, "groq");
});

test("analyzeResume rejects missing fields and non-PDF files", async () => {
  const buffer = await readFile(fixturePath);
  await assert.rejects(
    () =>
      analyzeResume(
        {
          userId: "user_resume_test",
          companyName: "",
          jobRole: "Data Analyst",
          jobDescription: "SQL",
          file: {
            buffer,
            mimetype: "application/pdf",
            originalname: "resume.pdf",
            size: buffer.length,
          },
        },
        createDatabase(),
        new StructuredProvider(),
      ),
    /Company name, job role, and job description are required/,
  );
  await assert.rejects(
    () =>
      analyzeResume(
        {
          userId: "user_resume_test",
          companyName: "Microsoft",
          jobRole: "Data Analyst",
          jobDescription: "SQL",
          file: {
            buffer,
            mimetype: "text/plain",
            originalname: "resume.txt",
            size: buffer.length,
          },
        },
        createDatabase(),
        new StructuredProvider(),
      ),
    /Upload your resume as a PDF file/,
  );
});

test("resume analyzer limits stay bounded for safe request handling", () => {
  assert.equal(resumeAnalyzerLimits.maxFileBytes, 8 * 1024 * 1024);
  assert.equal(resumeAnalyzerLimits.maxJobDescriptionChars, 12_000);
});

test("analyzeResume accepts fenced JSON with surrounding provider commentary", async () => {
  const buffer = await readFile(fixturePath);
  const wrapped = `Here is the structured resume review:\n\n\`\`\`json\n${validAnalysisJson()}\n\`\`\`\n`;
  const result = await analyzeResume(
    {
      userId: "user_resume_test",
      companyName: "Microsoft",
      jobRole: "Data Analyst Intern",
      jobDescription:
        "Use SQL and Python to analyze data and communicate insights.",
      file: {
        buffer,
        mimetype: "application/pdf",
        originalname: "resume.pdf",
        size: buffer.length,
      },
    },
    createDatabase(),
    new StructuredProvider(wrapped),
  );
  assert.equal(result.analysis.overallScore, 82);
  assert.equal(
    result.analysis.summary,
    "The resume is a promising match for an entry-level data analysis role.",
  );
});
