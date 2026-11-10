import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { EncryptJWT, jwtDecrypt } from 'jose';
export const random = () => randomBytes(32).toString('base64url');
export const hash = value => createHash('sha256').update(value).digest('base64url');
export function config() {
  const env = process.env;
  if (!/^https:\/\/[^/]+$/.test(env.SITE_ORIGIN || '') || !/^[a-z0-9.-]+$/.test(env.AUTH0_DOMAIN || '') || !/^[a-f0-9]{64}$/i.test(env.SESSION_SECRET || '') || !env.AUTH0_CLIENT_ID || !env.AUTH0_CLIENT_SECRET || !env.ADMIN_SUBJECTS) throw new Error('Authentication is not configured');
  return { origin: env.SITE_ORIGIN, issuer: `https://${env.AUTH0_DOMAIN}/`, key: Buffer.from(env.SESSION_SECRET, 'hex'), client: env.AUTH0_CLIENT_ID, secret: env.AUTH0_CLIENT_SECRET };
}
export const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' };
export const json = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
export const redirect = (location, cookies = []) => ({ statusCode: 302, headers: { ...headers, Location: location }, multiValueHeaders: { 'Set-Cookie': cookies }, body: '' });
export const cookie = (name, value, age) => `__Host-${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax${age === undefined ? '' : `; Max-Age=${age}`}`;
export function readCookie(event, name) { return (event.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`__Host-${name}=`))?.slice(name.length + 8); }
export async function seal(payload, seconds, audience) { const c = config(); return new EncryptJWT(payload).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).setIssuedAt().setIssuer(c.origin).setAudience(audience).setExpirationTime(`${seconds}s`).encrypt(c.key); }
export async function open(token, audience) { const c = config(); return (await jwtDecrypt(token, c.key, { issuer: c.origin, audience, keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] })).payload; }
export function equal(a, b) { if (typeof a !== 'string' || typeof b !== 'string') return false; const left = Buffer.from(a), right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
export async function session(event, write = false) {
  // Never trust a dashboard redirect as authorization. Each API call validates
  // the encrypted cookie and the current administrator allowlist on the server.
  let user;
  try { user = await open(readCookie(event, 'session'), 'session'); } catch { throw Object.assign(new Error('Your session has expired. Please sign in again.'), { status: 401 }); }
  if (!(process.env.ADMIN_SUBJECTS || '').split(',').map(v => v.trim()).includes(user.sub)) throw Object.assign(new Error('Administrator access required.'), { status: 403 });
  // Origin + a session-bound CSRF token prevent another website from submitting writes.
  if (write && (event.headers.origin !== config().origin || !equal(event.headers['x-csrf-token'], user.csrf))) throw Object.assign(new Error('Request verification failed.'), { status: 403 });
  return user;
}
export function endpoint(method, action) { return async event => {
  if (event.httpMethod !== method) return { ...json(405, { error: 'Method not allowed' }), headers: { ...headers, Allow: method } };
  try { return await action(event); } catch (e) { return json(e.status || 503, { error: e.status ? e.message : 'Service unavailable. Check server configuration or try again later.' }); }
}; }
