import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, encodedKey] = storedHash.split(':');
  if (!salt || !encodedKey) return false;

  const expectedKey = Buffer.from(encodedKey, 'hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey);
}
