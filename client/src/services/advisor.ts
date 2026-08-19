import { authenticatedRequest } from './auth';
import type { AdvisorChatRequest, AdvisorChatResponse } from '../types/domain';

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

  if (
    typeof conversationId !== 'string' ||
    conversationId.length === 0 ||
    typeof answer !== 'string' ||
    answer.trim().length === 0 ||
    typeof createdAt !== 'string' ||
    !Array.isArray(sources) ||
    sources.some((source) => typeof source !== 'string')
  ) {
    throw new Error('The advisor returned an incomplete response.');
  }

  return {
    conversationId,
    answer,
    createdAt,
    sources,
  };
}

export async function chatAdvisor(input: AdvisorChatRequest): Promise<AdvisorChatResponse> {
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
