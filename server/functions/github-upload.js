import { randomUUID } from 'node:crypto';
import { endpoint, session, json } from './lib/security.js';
import { github, branch } from './lib/github.js';
import { validateImage } from './lib/image.js';
export const handler = endpoint('POST', async event => {
  await session(event, true);
  if ((event.body || '').length > 2900000) return json(413, { error: 'Image must be under 2 MB' });
  let body; try { body = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { bytes, extension: ext } = validateImage(body?.data);
  const path = `assets/uploads/${randomUUID()}.${ext}`;
  await github(`contents/${path}`, 'PUT', { message: 'Upload website image from YPP admin', branch: branch(), content: bytes.toString('base64') });
  return json(200, { path });
});
