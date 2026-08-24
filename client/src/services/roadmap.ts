import { authenticatedRequest } from './auth';
import type { RoadmapResponse, RoadmapStepStatus, RoadmapStepUpdate } from '../types/domain';

export function getRoadmap(careerId: string) {
  return authenticatedRequest<RoadmapResponse>(`/careers/${encodeURIComponent(careerId)}/roadmap`);
}

export function updateRoadmapStep(stepId: string, input: RoadmapStepUpdate) {
  return authenticatedRequest<{
    stepId: string;
    careerId: string;
    completed: boolean;
    targetDate: string | null;
    status: RoadmapStepStatus;
    notes: string;
    evidenceLinks: { label: string; url: string }[];
    position: number | null;
  }>(`/roadmap/${encodeURIComponent(stepId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function reorderRoadmapStep(stepId: string, targetPosition: number) {
  return authenticatedRequest<{
    careerId: string;
    positions: Array<{ stepId: string; position: number }>;
  }>(`/roadmap/${encodeURIComponent(stepId)}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ targetPosition }),
  });
}
