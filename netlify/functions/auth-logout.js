import { endpoint, session, json, cookie } from './lib/security.js';
export const handler = endpoint('POST', async event => { await session(event, true); return { ...json(200, { ok: true }), multiValueHeaders: { 'Set-Cookie': [cookie('session', '', 0), cookie('flow', '', 0)] } }; });
