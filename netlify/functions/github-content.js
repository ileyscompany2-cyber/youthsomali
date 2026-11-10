import { endpoint, session, json } from './lib/security.js';
import { github, branch } from './lib/github.js';
export const handler = endpoint('GET', async event => { await session(event); const file = await github(`contents/content/site.json?ref=${encodeURIComponent(branch())}`); return json(200, { sha: file.sha, content: JSON.parse(Buffer.from(file.content, 'base64').toString()) }); });
