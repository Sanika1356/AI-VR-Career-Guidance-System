import type { UserSummary } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const SESSION_STORAGE_KEY = 'pathfinder.auth.session';
const SESSION_EXPIRED_EVENT = 'pathfinder:session-expired';

export interface AuthSession {
  user: UserSummary;
  token: string;
}

interface AuthCredentials {
  email: string;
  password: string;
}

interface RegisterInput extends AuthCredentials {
  name: string;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

export class AuthApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
  options: { expireSessionOnUnauthorized?: boolean } = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  } catch {
    throw new AuthApiError(
      'network_error',
      'The server could not be reached. Check your connection and try again.',
      0,
    );
  }

  if (!response.ok) {
    if (response.status === 401 && options.expireSessionOnUnauthorized) {
      expireAuthSession();
    }

    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new AuthApiError(
      payload.error ?? 'request_failed',
      payload.message ?? 'The request could not be completed. Please try again.',
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AuthSession>;
  return Boolean(
    candidate.token &&
    candidate.user &&
    typeof candidate.user.id === 'string' &&
    typeof candidate.user.name === 'string' &&
    typeof candidate.user.email === 'string',
  );
}

export function readAuthSession(): AuthSession | null {
  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent('pathfinder:auth-changed'));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('pathfinder:auth-changed'));
}

export function expireAuthSession(): void {
  clearAuthSession();
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

export function register(input: RegisterInput): Promise<AuthSession> {
  return request<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(input: AuthCredentials): Promise<AuthSession> {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readAuthSession();
  if (!session) {
    return Promise.reject(
      new AuthApiError('unauthorized', 'Your session has ended. Please sign in again.', 401),
    );
  }

  return request<T>(
    path,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${session.token}`,
        ...init.headers,
      },
    },
    { expireSessionOnUnauthorized: true },
  );
}

export async function authenticatedResponse(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const session = readAuthSession();
  if (!session) {
    throw new AuthApiError('unauthorized', 'Your session has ended. Please sign in again.', 401);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
        ...init.headers,
      },
    });
  } catch {
    throw new AuthApiError(
      'network_error',
      'The server could not be reached. Check your connection and try again.',
      0,
    );
  }

  if (!response.ok) {
    if (response.status === 401) expireAuthSession();
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new AuthApiError(
      payload.error ?? 'request_failed',
      payload.message ?? 'The request could not be completed. Please try again.',
      response.status,
    );
  }

  return response;
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof AuthApiError && error.status === 401;
}
