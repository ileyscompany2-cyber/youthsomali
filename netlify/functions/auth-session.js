import { endpoint, session, json } from './lib/security.js';
export const handler = endpoint('GET', async event => { const user = await session(event); return json(200, { email: user.email, csrf: user.csrf, expires: user.exp }); });
