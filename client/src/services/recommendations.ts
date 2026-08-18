import type { RecommendationResponse } from '../types/domain';
import { authenticatedRequest } from './auth';

export function getRecommendations(resultId?: string): Promise<RecommendationResponse> {
  const query = resultId ? `?resultId=${encodeURIComponent(resultId)}` : '';
  return authenticatedRequest<RecommendationResponse>(`/recommendations${query}`);
}
