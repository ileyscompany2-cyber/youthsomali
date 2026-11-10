import { config, random, hash, seal, cookie, redirect, json } from './lib/security.js';
export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  try {
  const c = config(), state = random(), nonce = random(), verifier = random();
  const remember = event.queryStringParameters?.remember === '1';
  const url = new URL('authorize', c.issuer);
  url.search = new URLSearchParams({ response_type: 'code', client_id: c.client, redirect_uri: `${c.origin}/.netlify/functions/auth-callback`, scope: 'openid email', state, nonce, code_challenge: hash(verifier), code_challenge_method: 'S256', max_age: '0' });
  return redirect(url.href, [cookie('flow', await seal({ state, nonce, verifier, remember }, 600, 'flow'), 600)]);
  } catch {
    return redirect('/admin/login.html?error=configuration', [cookie('flow', '', 0)]);
  }
}
