import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config, open, seal, readCookie, equal, random, cookie, redirect } from './lib/security.js';
export async function handler(event) {
  const clear = cookie('flow', '', 0);
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: '' };
  try {
    const c = config(), q = event.queryStringParameters || {}, flow = await open(readCookie(event, 'flow'), 'flow');
    if (!equal(flow.state, q.state) || !q.code || q.error) throw new Error('Invalid callback');
    const response = await fetch(new URL('oauth/token', c.issuer), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code: q.code, code_verifier: flow.verifier, client_id: c.client, client_secret: c.secret, redirect_uri: `${c.origin}/.netlify/functions/auth-callback` }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Token exchange failed');
    const tokens = await response.json();
    const { payload } = await jwtVerify(tokens.id_token, createRemoteJWKSet(new URL('.well-known/jwks.json', c.issuer)), { issuer: c.issuer, audience: c.client, algorithms: ['RS256'], maxTokenAge: '10m', requiredClaims: ['sub', 'exp', 'iat', 'nonce'] });
    if (!equal(payload.nonce, flow.nonce) || payload.email_verified !== true || !process.env.ADMIN_SUBJECTS.split(',').map(v => v.trim()).includes(payload.sub)) throw new Error('Not authorized');
    // max_age=0 requests fresh authentication; verify the provider's evidence too.
    if (!Number.isFinite(payload.auth_time) || payload.auth_time < flow.iat - 60 || payload.auth_time > Math.floor(Date.now() / 1000) + 60) throw new Error('Fresh authentication required');
    const age = flow.remember ? 604800 : 28800;
    return redirect('/admin/index.html', [clear, cookie('session', await seal({ sub: payload.sub, email: payload.email, csrf: random() }, age, 'session'), flow.remember ? age : undefined)]);
  } catch { return redirect('/admin/login.html?error=signin', [clear]); }
}
