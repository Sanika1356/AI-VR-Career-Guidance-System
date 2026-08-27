import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  AdvisorProviderError,
  type AdvisorProvider,
} from "../src/services/advisor.service.js";
import type { DatabasePool } from "../src/db/types.js";
import {
  analyzeResume,
  extractResumeText,
  getResumeAnalysis,
  listResumeAnalyses,
  normalizePreferredOutputs,
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
    roleFit:
      "The resume provides direct evidence for the target analysis role.",
    atsKeywords: ["Python", "SQL"],
    priorityActions: ["Add measurable outcomes to project descriptions."],
    interviewTopics: ["Explain the SQL analysis project."],
    learningPlan: ["Build a dashboard project using the target data tools."],
    preferredOutputs: [
      "role_fit",
      "ats_keywords",
      "skill_gaps",
      "learning_plan",
    ],
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
      preferredOutputs: ["role_fit", "ats_keywords"],
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
  assert.deepEqual(result.analysis.preferredOutputs, [
    "role_fit",
    "ats_keywords",
  ]);
  assert.equal(result.analysis.roleFit.length > 0, true);
  assert.equal(result.analysis.learningPlan.length > 0, true);
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
        company_name: "Microsoft",
        job_role: "Data Analyst Intern",
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
  assert.equal(result.companyName, "Microsoft");
  assert.equal(result.jobRole, "Data Analyst Intern");
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

test("preferred output focuses are bounded, unique, and stable", () => {
  assert.deepEqual(normalizePreferredOutputs(["role_fit", "learning_plan"]), [
    "role_fit",
    "learning_plan",
  ]);
  assert.equal(normalizePreferredOutputs(undefined).length, 6);
  assert.throws(
    () => normalizePreferredOutputs(["role_fit", "role_fit"]),
    /unsupported or repeated/,
  );
  assert.throws(
    () => normalizePreferredOutputs(["unknown"]),
    /unsupported or repeated/,
  );
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
      preferredOutputs: ["role_fit", "ats_keywords"],
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

class FailingProvider implements AdvisorProvider {
  async generate(): Promise<string> {
    throw new AdvisorProviderError(
      "gemini",
      "timeout",
      "provider request timed out",
    );
  }
}

test("analyzeResume logs safe provider failure diagnostics", async () => {
  const buffer = await readFile(fixturePath);
  const originalInfo = console.info;
  const logs: string[] = [];
  console.info = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };

  try {
    await assert.rejects(
      analyzeResume(
        {
          userId: "user_resume_test",
          companyName: "Example Analytics",
          jobRole: "Data Analyst Intern",
          jobDescription: "Use Python and SQL to analyze product data.",
          file: {
            buffer,
            mimetype: "application/pdf",
            originalname: "resume.pdf",
            size: buffer.length,
          },
        },
        createDatabase(),
        new FailingProvider(),
      ),
      { code: "resume_analysis_provider_unavailable" },
    );
    const failure = logs
      .map((entry) => JSON.parse(entry) as Record<string, unknown>)
      .find((entry) => entry.event === "resume_analysis_provider_failed");
    assert.equal(failure?.provider, "gemini");
    assert.equal(failure?.model, "gemini-2.5-flash-lite");
    assert.equal(failure?.category, "timeout");
    assert.equal(typeof failure?.durationMs, "number");
    assert.doesNotMatch(logs.join("\n"), /provider request timed out/);
    assert.doesNotMatch(logs.join("\n"), /Use Python and SQL/);
  } finally {
    console.info = originalInfo;
  }
});

test("persistPuterResumeAnalysis stores only a normalized owned report", async () => {
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

  const { persistPuterResumeAnalysis } =
    await import("../src/services/resume-analyzer.service.js");
  const result = await persistPuterResumeAnalysis(
    {
      userId: "user_puter_test",
      companyName: "Example Analytics",
      jobRole: "Data Analyst Intern",
      fileName: "resume.pdf",
      analysis: {
        overallScore: "88",
        matchingSkills: ["Python", "SQL"],
        missingSkills: ["Power BI"],
        strengths: ["Relevant project evidence"],
        improvements: ["Add measurable outcomes"],
        recommendations: ["Document a dashboard project"],
        summary: "A strong evidence-based match.",
        provider: "gemini",
      },
    },
    database,
  );

  assert.equal(result.analysis.provider, "puter");
  assert.equal(result.analysis.overallScore, 88);
  assert.equal(queries.length, 1);
  assert.equal(queries[0]?.values?.[1], "user_puter_test");
  assert.equal(queries[0]?.values?.includes("resume bytes"), false);
});

test("persistPuterResumeAnalysis rejects malformed or non-PDF reports", async () => {
  const { persistPuterResumeAnalysis } =
    await import("../src/services/resume-analyzer.service.js");
  await assert.rejects(
    () =>
      persistPuterResumeAnalysis(
        {
          userId: "user_puter_test",
          companyName: "Example Analytics",
          jobRole: "Data Analyst Intern",
          fileName: "resume.txt",
          analysis: {},
        },
        createDatabase(),
      ),
    /PDF file/,
  );
  await assert.rejects(
    () =>
      persistPuterResumeAnalysis(
        {
          userId: "user_puter_test",
          companyName: "Example Analytics",
          jobRole: "Data Analyst Intern",
          fileName: "resume.pdf",
          analysis: { overallScore: 90 },
        },
        createDatabase(),
      ),
    /incomplete/,
  );
});
