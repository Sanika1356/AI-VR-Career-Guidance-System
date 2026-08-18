import { request } from './api';
import type { CareerDetail, CareerSummary } from '../types/domain';

export function getCareers(): Promise<CareerSummary[]> {
  return request<CareerSummary[]>('/careers');
}

export function getCareer(careerId: string): Promise<CareerDetail> {
  return request<CareerDetail>(`/careers/${encodeURIComponent(careerId)}`);
}
