import { authenticatedRequest } from './auth';
import type { ProfileResponse, ProfileUpdateInput } from '../types/domain';

export function getProfile(): Promise<ProfileResponse> {
  return authenticatedRequest<ProfileResponse>('/profile');
}

export function updateProfile(input: ProfileUpdateInput): Promise<ProfileResponse> {
  return authenticatedRequest<ProfileResponse>('/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
