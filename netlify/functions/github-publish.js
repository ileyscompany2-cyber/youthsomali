import { endpoint, session, json } from './lib/security.js';
import { github, branch } from './lib/github.js';
import { validateContent } from './lib/content.js';
export const handler = endpoint('POST', async event => {
  await session(event, true);
  if ((event.body || '').length > 800000) return json(413, { error: 'Content is too large' });
  let body; try { body = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }
  const content = validateContent(body?.content);
  if (!/^[a-f0-9]{40}$/.test(body.sha || '')) return json(400, { error: 'Reload content before publishing' });
  const result = await github('contents/content/site.json', 'PUT', { message: 'Update website content from YPP admin', branch: branch(), sha: body.sha, content: Buffer.from(JSON.stringify(content, null, 2) + '\n').toString('base64') });
  return json(200, { sha: result.content.sha, commit: result.commit.sha, message: 'Committed to GitHub. Netlify deployment is queued; check Netlify for completion.' });
});
