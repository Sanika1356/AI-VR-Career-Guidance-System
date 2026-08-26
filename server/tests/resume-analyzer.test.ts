import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import type { AdvisorProvider } from "../src/services/advisor.js";
import {
  analyzeResume,
  extractResumeText,
  resumeAnalyzerLimits,
} from "../src/services/resume-analyzer.service.js";

const fixturePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/resume-fixture.pdf",
);

class StructuredProvider implements AdvisorProvider {
  async generate(): Promise<string> {
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
}

test("extractResumeText reads a text-readable PDF without storing it", async () => {
  const buffer = await readFile(fixturePath);
  const text = await extractResumeText(buffer);
  assert.match(text, /Python/);
  assert.match(text, /SQL/);
});

test("analyzeResume returns bounded structured results from the existing provider interface", async () => {
  const buffer = await readFile(fixturePath);
  const result = await analyzeResume(
    {
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
    new StructuredProvider(),
  );

  assert.equal(result.overallScore, 82);
  assert.deepEqual(result.matchingSkills, ["Python", "SQL", "Data analysis"]);
  assert.equal(result.provider, "custom");
});

test("analyzeResume rejects missing fields and non-PDF files", async () => {
  const buffer = await readFile(fixturePath);
  await assert.rejects(
    () =>
      analyzeResume(
        {
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
        new StructuredProvider(),
      ),
    /Company name, job role, and job description are required/,
  );
  await assert.rejects(
    () =>
      analyzeResume(
        {
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
        new StructuredProvider(),
      ),
    /Upload your resume as a PDF file/,
  );
});

test("resume analyzer limits stay bounded for safe request handling", () => {
  assert.equal(resumeAnalyzerLimits.maxFileBytes, 8 * 1024 * 1024);
  assert.equal(resumeAnalyzerLimits.maxJobDescriptionChars, 12_000);
});
