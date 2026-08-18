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

export interface ProfileUpdateInput {
  name?: string;
  interests?: string[];
  currentSkills?: string[];
  experience?: string;
  learningPreferences?: Record<string, unknown>;
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

function stringArray(value: unknown, field: string, maxItems: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new AppError(400, 'validation_error', `${field} must be an array of at most ${maxItems} non-empty strings.`);
  }
  return value.map((item) => item.trim());
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
  const allowed = new Set(['name', 'interests', 'currentSkills', 'experience', 'learningPreferences']);
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) throw new AppError(400, 'validation_error', `Unknown profile field: ${key}.`);
  }
  if (Object.keys(body).length === 0) throw new AppError(400, 'validation_error', 'At least one profile field is required.');

  const result: ProfileUpdateInput = {};
  const name = optionalString(body.name, 'name', 120);
  const experience = optionalString(body.experience, 'experience', 2000);
  if (name !== undefined) result.name = name;
  if (experience !== undefined) result.experience = experience;
  if (body.interests !== undefined) result.interests = stringArray(body.interests, 'interests', 50);
  if (body.currentSkills !== undefined) result.currentSkills = stringArray(body.currentSkills, 'currentSkills', 100);
  if (body.learningPreferences !== undefined) {
    if (!isPlainObject(body.learningPreferences)) {
      throw new AppError(400, 'validation_error', 'learningPreferences must be a JSON object.');
    }
    result.learningPreferences = body.learningPreferences;
  }
  return result;
}
