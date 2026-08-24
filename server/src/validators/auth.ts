import { AppError } from '../utils/app-error.js';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type EducationStage =
  | 'secondary'
  | 'undergraduate'
  | 'graduate'
  | 'career-changer'
  | 'working-professional'
  | 'other';

export interface ProfileUpdateInput {
  name?: string;
  interests?: string[];
  currentSkills?: string[];
  experience?: string;
  learningPreferences?: Record<string, unknown>;
  goals?: string[];
  constraints?: string[];
  preferredWorkConditions?: string[];
  educationStage?: EducationStage | null;
  locationPreference?: string | null;
  weeklyTimeBudgetMinutes?: number | null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new AppError(400, 'validation_error', `${field} must be a non-empty string of at most ${maxLength} characters.`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  return requiredString(value, field, maxLength);
}

function nullableString(value: unknown, field: string, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return requiredString(value, field, maxLength);
}

function stringArray(value: unknown, field: string, maxItems: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new AppError(400, 'validation_error', `${field} must be an array of at most ${maxItems} non-empty strings.`);
  }
  return value.map((item) => item.trim());
}

const educationStages = new Set<NonNullable<ProfileUpdateInput['educationStage']>>([
  'secondary',
  'undergraduate',
  'graduate',
  'career-changer',
  'working-professional',
  'other',
]);

function optionalInteger(value: unknown, field: string, min: number, max: number): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new AppError(400, 'validation_error', `${field} must be an integer from ${min} to ${max}.`);
  }
  return value as number;
}

function nullableInteger(value: unknown, field: string, min: number, max: number): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return optionalInteger(value, field, min, max) ?? null;
}

export function normalizeEmail(value: unknown): string {
  const email = requiredString(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(400, 'validation_error', 'email must be a valid email address.');
  }
  return email;
}

export function validateRegisterInput(body: unknown): RegisterInput {
  if (!isPlainObject(body)) throw new AppError(400, 'validation_error', 'Request body must be a JSON object.');
  const password = requiredString(body.password, 'password', 128);
  if (password.length < 8) {
    throw new AppError(400, 'validation_error', 'password must be at least 8 characters.');
  }
  return {
    name: requiredString(body.name, 'name', 120),
    email: normalizeEmail(body.email),
    password,
  };
}

export function validateLoginInput(body: unknown): LoginInput {
  if (!isPlainObject(body)) throw new AppError(400, 'validation_error', 'Request body must be a JSON object.');
  return {
    email: normalizeEmail(body.email),
    password: requiredString(body.password, 'password', 128),
  };
}

export function validateProfileUpdateInput(body: unknown): ProfileUpdateInput {
  if (!isPlainObject(body)) throw new AppError(400, 'validation_error', 'Request body must be a JSON object.');
  const allowed = new Set([
    'name',
    'interests',
    'currentSkills',
    'experience',
    'learningPreferences',
    'goals',
    'constraints',
    'preferredWorkConditions',
    'educationStage',
    'locationPreference',
    'weeklyTimeBudgetMinutes',
  ]);
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) throw new AppError(400, 'validation_error', `Unknown profile field: ${key}.`);
  }
  if (Object.keys(body).length === 0) throw new AppError(400, 'validation_error', 'At least one profile field is required.');

  const result: ProfileUpdateInput = {};
  const name = optionalString(body.name, 'name', 120);
  const experience = optionalString(body.experience, 'experience', 2000);
  const locationPreference = nullableString(body.locationPreference, 'locationPreference', 200);
  if (name !== undefined) result.name = name;
  if (experience !== undefined) result.experience = experience;
  if (locationPreference !== undefined) result.locationPreference = locationPreference;
  if (body.interests !== undefined) result.interests = stringArray(body.interests, 'interests', 50);
  if (body.currentSkills !== undefined) result.currentSkills = stringArray(body.currentSkills, 'currentSkills', 100);
  if (body.goals !== undefined) result.goals = stringArray(body.goals, 'goals', 20);
  if (body.constraints !== undefined) result.constraints = stringArray(body.constraints, 'constraints', 20);
  if (body.preferredWorkConditions !== undefined) {
    result.preferredWorkConditions = stringArray(body.preferredWorkConditions, 'preferredWorkConditions', 20);
  }
  if (body.educationStage !== undefined) {
    if (body.educationStage !== null && (typeof body.educationStage !== 'string' || !educationStages.has(body.educationStage as NonNullable<ProfileUpdateInput['educationStage']>))) {
      throw new AppError(400, 'validation_error', 'educationStage must be one of the supported values or null.');
    }
    result.educationStage = body.educationStage as ProfileUpdateInput['educationStage'];
  }
  const weeklyTimeBudgetMinutes = nullableInteger(body.weeklyTimeBudgetMinutes, 'weeklyTimeBudgetMinutes', 30, 10080);
  if (weeklyTimeBudgetMinutes !== undefined) result.weeklyTimeBudgetMinutes = weeklyTimeBudgetMinutes;
  if (body.learningPreferences !== undefined) {
    if (!isPlainObject(body.learningPreferences)) {
      throw new AppError(400, 'validation_error', 'learningPreferences must be a JSON object.');
    }
    result.learningPreferences = body.learningPreferences;
  }
  return result;
}
