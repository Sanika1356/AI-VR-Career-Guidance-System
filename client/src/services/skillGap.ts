import type { SkillGapResponse } from '../types/domain';
import { authenticatedRequest } from './auth';

export function getSkillGap(careerId: string): Promise<SkillGapResponse> {
  return authenticatedRequest<SkillGapResponse>(
    `/careers/${encodeURIComponent(careerId)}/skill-gap`,
  );
}
