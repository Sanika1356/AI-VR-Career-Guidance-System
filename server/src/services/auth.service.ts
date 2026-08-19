import { requirePool } from '../db/pool.js';
import type { DatabasePool } from '../db/types.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createAccessToken } from '../utils/token.js';
import { createId } from '../utils/id.js';
import { AppError } from '../utils/app-error.js';
import type { LoginInput, RegisterInput } from '../validators/auth.js';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

function toPublicUser(user: UserRow): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export async function registerUser(input: RegisterInput, database: DatabasePool = requirePool()): Promise<AuthResponse> {
  const client = await database.connect();
  const userId = createId('user');
  const passwordHash = await hashPassword(input.password);

  try {
    await client.query('BEGIN');
    const existing = await client.query<UserRow>('SELECT id FROM users WHERE email = $1', [input.email]);
    if (existing.rowCount) {
      throw new AppError(400, 'email_already_registered', 'An account with this email already exists.');
    }

    const userResult = await client.query<UserRow>(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email`,
      [userId, input.name, input.email, passwordHash],
    );
    await client.query('INSERT INTO profiles (user_id) VALUES ($1)', [userId]);
    await client.query('COMMIT');

    const user = userResult.rows[0];
    return { user: toPublicUser(user), token: createAccessToken(user.id) };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof AppError) throw error;
    if (isUniqueViolation(error)) {
      throw new AppError(400, 'email_already_registered', 'An account with this email already exists.');
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function loginUser(input: LoginInput, database: DatabasePool = requirePool()): Promise<AuthResponse> {
  const client = await database.connect();
  try {
    const result = await client.query<UserRow>(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = $1 AND status = 'active'`,
      [input.email],
    );
    const user = result.rows[0];
    if (!user?.password_hash || !(await verifyPassword(input.password, user.password_hash))) {
      throw new AppError(401, 'invalid_credentials', 'Email or password is incorrect.');
    }
    return { user: toPublicUser(user), token: createAccessToken(user.id) };
  } finally {
    client.release();
  }
}
