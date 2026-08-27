const RESPONSE_CONTAINER_KEYS = [
  'message',
  'content',
  'text',
  'output_text',
  'answer',
  'response',
  'result',
  'data',
  'choices',
  'output',
  'generated_text',
  'body',
  'payload',
  'value',
  'parts',
] as const;

function isLikelyAnalysisObject(value: Record<string, unknown>): boolean {
  return 'overallScore' in value || 'matchingSkills' in value || 'roleFit' in value;
}

function collectResponseText(value: unknown, depth = 0, seen = new Set<object>()): string[] {
  if (depth > 7) return [];
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  if (seen.has(value)) return [];
  seen.add(value);

  if (Array.isArray(value)) {
    const parts = value.flatMap((part) => collectResponseText(part, depth + 1, seen));
    return parts.length > 1 ? [...parts, parts.join('')] : parts;
  }

  const record = value as Record<string, unknown>;
  if (isLikelyAnalysisObject(record)) return [JSON.stringify(record)];

  const parts: string[] = [];
  const visitedKeys = new Set<string>();
  for (const key of RESPONSE_CONTAINER_KEYS) {
    if (key in record) {
      visitedKeys.add(key);
      parts.push(...collectResponseText(record[key], depth + 1, seen));
    }
  }
  for (const [key, nested] of Object.entries(record)) {
    if (!visitedKeys.has(key)) parts.push(...collectResponseText(nested, depth + 1, seen));
  }
  return parts;
}

export function getPuterResponseText(response: unknown): string {
  const candidates = collectResponseText(response).filter(
    (candidate) => candidate.trim().length > 0,
  );
  const text = candidates.sort((a, b) => b.length - a.length)[0];
  if (text) return text;
  throw new Error('The AI returned an unexpected response format. Please try again.');
}
