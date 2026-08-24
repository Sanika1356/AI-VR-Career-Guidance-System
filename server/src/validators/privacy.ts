import { AppError } from '../utils/app-error.js';

export interface PrivacyConsentInput {
  analytics: boolean;
  personalizedAi: boolean;
  vrTelemetry: boolean;
}

export function validatePrivacyConsentInput(value: unknown): PrivacyConsentInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(400, 'validation_error', 'Privacy consent must be a JSON object.');
  }

  const body = value as Record<string, unknown>;
  const keys: Array<keyof PrivacyConsentInput> = ['analytics', 'personalizedAi', 'vrTelemetry'];
  for (const key of keys) {
    if (typeof body[key] !== 'boolean') {
      throw new AppError(400, 'validation_error', `${key} must be a boolean.`);
    }
  }

  return {
    analytics: body.analytics as boolean,
    personalizedAi: body.personalizedAi as boolean,
    vrTelemetry: body.vrTelemetry as boolean,
  };
}
