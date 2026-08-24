import { request } from './api';
import type { CareerComparisonResponse, CareerDetail, CareerSummary } from '../types/domain';

export function getCareers(language = 'en'): Promise<CareerSummary[]> {
  const query = new URLSearchParams({ language });
  return request<CareerSummary[]>(`/careers?${query.toString()}`);
}

export function getCareer(careerId: string, language = 'en'): Promise<CareerDetail> {
  const query = new URLSearchParams({ language });
  return request<CareerDetail>(`/careers/${encodeURIComponent(careerId)}?${query.toString()}`);
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
