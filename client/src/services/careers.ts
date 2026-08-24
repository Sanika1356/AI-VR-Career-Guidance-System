import { request } from './api';
import type {
  CareerComparisonResponse,
  CareerDetail,
  CareerSummary,
  LearningResourceResponse,
} from '../types/domain';

export function getCareers(language = 'en'): Promise<CareerSummary[]> {
  const query = new URLSearchParams({ language });
  return request<CareerSummary[]>(`/careers?${query.toString()}`);
}

export function getCareer(careerId: string, language = 'en'): Promise<CareerDetail> {
  const query = new URLSearchParams({ language });
  return request<CareerDetail>(`/careers/${encodeURIComponent(careerId)}?${query.toString()}`);
}

export function getLearningResources(
  careerId: string,
  options: { skill?: string; language?: string; limit?: number } = {},
): Promise<LearningResourceResponse> {
  const query = new URLSearchParams();
  if (options.skill) query.set('skill', options.skill);
  if (options.language) query.set('language', options.language);
  if (options.limit !== undefined) query.set('limit', String(options.limit));
  const queryString = query.toString();
  return request<LearningResourceResponse>(
    `/careers/${encodeURIComponent(careerId)}/resources${queryString ? `?${queryString}` : ''}`,
  );
}

export function compareCareers(
  careerIds: string[],
  language = 'en',
): Promise<CareerComparisonResponse> {
  const query = new URLSearchParams({
    careerIds: careerIds.join(','),
    language,
  });
  return request<CareerComparisonResponse>(`/careers/comparison?${query.toString()}`);
}
