import type {
  AccountDeletionResponse,
  PrivacyConsent,
  PrivacyConsentResponse,
} from '../types/domain';
import { authenticatedRequest, authenticatedResponse } from './auth';

export async function getPrivacyConsent(): Promise<PrivacyConsent> {
  const payload = await authenticatedRequest<PrivacyConsentResponse>('/privacy/consent');
  return payload.consent;
}

export async function updatePrivacyConsent(
  consent: Pick<PrivacyConsent, 'analytics' | 'personalizedAi' | 'vrTelemetry'>,
): Promise<PrivacyConsent> {
  const payload = await authenticatedRequest<PrivacyConsentResponse>('/privacy/consent', {
    method: 'PUT',
    body: JSON.stringify(consent),
  });
  return payload.consent;
}

export function exportAccountData(): Promise<Blob> {
  return authenticatedResponse('/privacy/export').then((response) => response.blob());
}

export function deleteAccount(): Promise<AccountDeletionResponse> {
  return authenticatedRequest<AccountDeletionResponse>('/privacy/account', { method: 'DELETE' });
}
