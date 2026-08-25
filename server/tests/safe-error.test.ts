import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { safeErrorDetails } from "../src/utils/safe-error.js";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("safeErrorDetails never serializes a database client-like object", () => {
  const databaseClientLike = {
    connectionParameters: {
      host: "private.database.example",
      port: 5432,
      password: "private-password",
    },
    socket: {
      _tlsOptions: { servername: "private.database.example" },
      _handle: { fd: 42 },
    },
    query: () => undefined,
  };

  const details = safeErrorDetails(databaseClientLike);
  const serialized = JSON.stringify(details);

  assert.deepEqual(details, {
    errorName: "NonErrorFailure",
    message: "A non-error failure was reported.",
  });
  assert.doesNotMatch(serialized, /private\.database\.example|password|socket|tls|client|5432/i);
});

test("safeErrorDetails redacts connection URLs and credentials from Error messages", () => {
  const details = safeErrorDetails(
    new Error(
      "connect failed postgres://user:password@private.database.example:5432/career?sslmode=require api_key=secret-value",
    ),
  );

  assert.equal(details.errorName, "Error");
  assert.doesNotMatch(details.message, /postgres|private\.database\.example|password|secret-value/i);
  assert.match(details.message, /redacted-database-url/);
  assert.match(details.message, /api_key=\[redacted\]/);
});

test("process-level database and shutdown paths do not pass arbitrary errors to console.error", async () => {
  const files = [
    "src/db/migrate-cli.ts",
    "src/db/reset-dev.ts",
    "src/server.ts",
    "src/middleware/error-handler.ts",
  ];

  for (const relativePath of files) {
    const source = await readFile(join(projectRoot, relativePath), "utf8");
    assert.doesNotMatch(source, /console\.error\([^\n]*,\s*error\s*\)/);
    assert.match(source, /safeErrorDetails\(error\)/);
  }

  const errorHandlerSource = await readFile(
    join(projectRoot, "src/middleware/error-handler.ts"),
    "utf8",
  );
  assert.doesNotMatch(errorHandlerSource, /message:\s*unknownError\.message/);
  assert.doesNotMatch(errorHandlerSource, /console\.error\([^\n]*,\s*error\s*\)/);
});
