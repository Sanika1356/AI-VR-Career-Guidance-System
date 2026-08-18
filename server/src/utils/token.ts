import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

const TOKEN_VERSION = 'v1';

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(input: string): string {
  return createHmac('sha256', env.authSecret).update(input).digest('base64url');
}

export function createAccessToken(userId: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const payload: TokenPayload = {
    sub: userId,
    iat: nowSeconds,
    exp: nowSeconds + env.tokenExpirySeconds,
  };
  const encodedPayload = encode(payload);
  const unsignedToken = `${TOKEN_VERSION}.${encodedPayload}`;
  return `${unsignedToken}.${sign(unsignedToken)}`;
}

export function verifyAccessToken(token: string, nowSeconds = Math.floor(Date.now() / 1000)): TokenPayload | null {
  const [version, encodedPayload, encodedSignature] = token.split('.');
  if (version !== TOKEN_VERSION || !encodedPayload || !encodedSignature) return null;

  const expectedSignature = sign(`${version}.${encodedPayload}`);
  const received = Buffer.from(encodedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.sub || !Number.isFinite(payload.exp) || payload.exp <= nowSeconds) return null;
    return payload;
  } catch {
    return null;
  }
}
