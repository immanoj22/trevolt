// Password hashing (scrypt), tiny HS256 JWT, cookie parsing and auth middleware.
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

// Dev-only placeholder secrets; set real ones through env.
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-user-jwt-secret-change-me';
export const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-jwt-secret-change-me';
export const COOKIE = 'auth_token';

export const hashPassword = (pw) => {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(pw, salt, 64).toString('hex')}`;
};
export const verifyPassword = (pw, stored) => {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex'), b = scryptSync(String(pw), Buffer.from(salt, 'hex'), 64);
  return a.length === b.length && timingSafeEqual(a, b);
};

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const mac = (data, secret) => createHmac('sha256', secret).update(data).digest('base64url');

export const signJwt = (payload, secret, ttlSec = 7 * 86400) => {
  const iat = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ ...payload, iat, exp: iat + ttlSec })}`;
  return `${body}.${mac(body, secret)}`;
};
// Returns the payload, or null when the signature is wrong or the token expired.
export const verifyJwt = (token, secret) => {
  const [h, p, s] = String(token || '').split('.');
  if (!s) return null;
  const good = mac(`${h}.${p}`, secret);
  if (s.length !== good.length || !timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
  try {
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch { return null; }
};

export const parseCookies = (header = '') =>
  Object.fromEntries(header.split(';').map((c) => c.trim().split(/=(.*)/s).slice(0, 2)).filter(([k]) => k));

// Token from the httpOnly cookie (web) or the Bearer header (mobile).
export const tokenFrom = (headers) => {
  const m = /^Bearer (.+)$/i.exec(headers.authorization || '');
  return m ? m[1] : parseCookies(headers.cookie)[COOKIE];
};

export const setAuthCookie = (res, token) =>
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 86400}`);
export const clearAuthCookie = (res) =>
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
