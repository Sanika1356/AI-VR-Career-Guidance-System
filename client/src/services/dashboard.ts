import { authenticatedRequest } from './auth';
import type { DashboardResponse } from '../types/domain';

export function getDashboard(): Promise<DashboardResponse> {
  return authenticatedRequest<DashboardResponse>('/dashboard');
}
