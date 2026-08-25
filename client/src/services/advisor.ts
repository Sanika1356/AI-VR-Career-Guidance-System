import { authenticatedRequest } from './auth';
import type {
  AdvisorChatRequest,
  AdvisorChatResponse,
  AdvisorFeedbackRequest,
  AdvisorFeedbackResponse,
  ClearAdvisorHistoryResponse,
} from '../types/domain';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function parseAdvisorResponse(value: unknown): AdvisorChatResponse {
  if (!isRecord(value)) {
    throw new Error('The advisor returned an invalid response.');
  }

  const conversationId = value.conversationId;
  const answer = value.answer;
  const createdAt = value.createdAt;
  const sources = value.sources;
  const confidence = value.confidence;
  const caveat = value.caveat;
  const mode = value.mode;

  if (
    typeof conversationId !== 'string' ||
    conversationId.length === 0 ||
    typeof answer !== 'string' ||
    answer.trim().length === 0 ||
    typeof createdAt !== 'string' ||
    !Array.isArray(sources) ||
    sources.some((source) => typeof source !== 'string') ||
    (confidence !== undefined && !['low', 'medium', 'high'].includes(confidence as string)) ||
    (caveat !== undefined && typeof caveat !== 'string') ||
    (mode !== undefined && !['provider', 'deterministic_fallback'].includes(mode as string))
  ) {
    throw new Error('The advisor returned an incomplete response.');
  }

  return {
    conversationId,
    answer,
    createdAt,
    sources,
    confidence: confidence as AdvisorChatResponse['confidence'],
    caveat: typeof caveat === 'string' ? caveat : undefined,
    mode: mode as AdvisorChatResponse['mode'],
  };
}

export function submitAdvisorFeedback(
  input: AdvisorFeedbackRequest,
): Promise<AdvisorFeedbackResponse> {
  return authenticatedRequest<AdvisorFeedbackResponse>('/advisor/feedback', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function clearAdvisorHistory(conversationId: string): Promise<ClearAdvisorHistoryResponse> {
  return authenticatedRequest<ClearAdvisorHistoryResponse>(
    `/advisor/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: 'DELETE' },
  );
}

async function waitForAdvisorBackend(): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await authenticatedRequest<unknown>('/health');
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('The advisor backend is not ready.');
}

export async function chatAdvisor(input: AdvisorChatRequest): Promise<AdvisorChatResponse> {
  await waitForAdvisorBackend();
  const response = await authenticatedRequest<unknown>('/advisor/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return parseAdvisorResponse(response);
}

export function getAdvisorCareerId(): string | undefined {
  const careerId = new URLSearchParams(window.location.search).get('careerId');
  return careerId && careerId.trim().length > 0 ? careerId : undefined;
}
