import { authenticatedRequest } from './auth';
import type { RoadmapResponse, RoadmapStepUpdate } from '../types/domain';

export function getRoadmap(careerId: string) {
  return authenticatedRequest<RoadmapResponse>(`/careers/${encodeURIComponent(careerId)}/roadmap`);
}

export function updateRoadmapStep(stepId: string, input: RoadmapStepUpdate) {
  return authenticatedRequest<{ stepId: string; careerId: string; completed: boolean }>(
    `/roadmap/${encodeURIComponent(stepId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}
