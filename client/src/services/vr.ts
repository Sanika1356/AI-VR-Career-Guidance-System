import { request } from './api';
import type { VREnvironment, VREnvironmentResponse } from '../types/domain';

export function getVREnvironments(): Promise<VREnvironment[]> {
  return request<VREnvironmentResponse>('/vr/environments').then(
    (response) => response.environments,
  );
}
