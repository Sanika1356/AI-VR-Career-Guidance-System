import assert from "node:assert/strict";
import test from "node:test";
import {
  appendAdvisorResources,
  selectAdvisorResources,
} from "../src/services/advisor-resources.js";

test("selectAdvisorResources prioritizes data-analysis resources for SQL questions", () => {
  const resources = selectAdvisorResources(
    "I know Python and basic SQL. What should I learn next to become a Data Analyst?",
  );

  assert.ok(
    resources.some((resource) => resource.title === "pandas getting started"),
  );
  assert.ok(
    resources.some((resource) => resource.title === "PostgreSQL SQL tutorial"),
  );
  assert.ok(resources.every((resource) => resource.url.startsWith("https://")));
});

test("selectAdvisorResources adds focused resources for placement DSA and ML questions", () => {
  const resources = selectAdvisorResources(
    "I have six months before placements. Should I prioritize DSA, machine learning, or projects?",
  );
  const titles = resources.map((resource) => resource.title);

  assert.ok(titles.includes("LeetCode problem set"));
  assert.ok(titles.includes("Google Machine Learning Crash Course"));
  assert.ok(titles.includes("Kaggle datasets"));
});

test("appendAdvisorResources appends curated Markdown links within the answer budget", () => {
  const answer = appendAdvisorResources(
    "## Short answer\n\nStart with advanced SQL and pandas.",
    "What should I learn next for data analysis and SQL?",
    1_000,
  );

  assert.match(answer, /## Recommended resources/);
  assert.match(
    answer,
    /\[pandas getting started\]\(https:\/\/pandas\.pydata\.org/,
  );
  assert.ok(answer.length <= 1_000);
});

test("appendAdvisorResources does not duplicate a link already supplied by the provider", () => {
  const existing =
    "Read the [pandas getting started](https://pandas.pydata.org/docs/getting_started/index.html) guide.";
  const answer = appendAdvisorResources(
    existing,
    "How do I learn pandas?",
    2_000,
  );

  assert.equal(
    answer.match(
      /https:\/\/pandas\.pydata\.org\/docs\/getting_started\/index\.html/g,
    )?.length,
    1,
  );
  assert.match(answer, /## Recommended resources/);
});
