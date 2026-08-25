const MAX_ERROR_MESSAGE_LENGTH = 240;

function redactSensitiveText(value: string): string {
  return value
    .replace(/(?:postgres(?:ql)?|mysql):\/\/[^\s]+/gi, "[redacted-database-url]")
    .replace(/(api[-_ ]?key|authorization|token|password|secret)\s*[:=]\s*[^\s,;]+/gi, (_match, label: string) => `${label}=[redacted]`)
    .slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

export function safeErrorDetails(error: unknown): {
  errorName: string;
  message: string;
} {
  if (error instanceof Error) {
    const errorName = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(error.name)
      ? error.name
      : "Error";
    return {
      errorName,
      message: redactSensitiveText(error.message || "Unspecified error"),
    };
  }

  return {
    errorName: "NonErrorFailure",
    message: "A non-error failure was reported.",
  };
}
