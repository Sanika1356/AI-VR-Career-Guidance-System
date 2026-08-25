import {
  AdvisorProviderError,
  GeminiAdvisorProvider,
} from "../src/services/advisor.service.js";
import { env } from "../src/config/env.js";

const smokeQuestion =
  "What skills should I learn first to become an AI Engineer, and why?";

if (!env.geminiEnabled || !env.geminiApiKey?.trim()) {
  console.error(
    JSON.stringify({
      provider: "gemini",
      status: "not_configured",
    }),
  );
  process.exitCode = 2;
} else {
  try {
    const answer = await new GeminiAdvisorProvider().generate(smokeQuestion);
    console.log(
      JSON.stringify({
        provider: "gemini",
        status: "succeeded",
        mode: "provider",
        responseLength: answer.length,
      }),
    );
  } catch (error: unknown) {
    const details =
      error instanceof AdvisorProviderError
        ? {
            category: error.category,
            statusCode: error.statusCode,
            providerErrorCode: error.providerErrorCode,
          }
        : {};
    console.error(
      JSON.stringify({
        provider: "gemini",
        status: "failed",
        ...details,
      }),
    );
    process.exitCode = 1;
  }
}
