// Runs the existing Netlify-style handlers on Vercel. vercel.json rewrites
// /.netlify/functions/:fn here so OAuth redirect URIs and admin URLs stay the same.
import { handler as authCallback } from '../netlify/functions/auth-callback.js';
import { handler as authLogout } from '../netlify/functions/auth-logout.js';
import { handler as authSession } from '../netlify/functions/auth-session.js';
import { handler as authStart } from '../netlify/functions/auth-start.js';
import { handler as githubContent } from '../netlify/functions/github-content.js';
import { handler as githubPublish } from '../netlify/functions/github-publish.js';
import { handler as githubUpload } from '../netlify/functions/github-upload.js';

const handlers = {
  'auth-callback': authCallback,
  'auth-logout': authLogout,
  'auth-session': authSession,
  'auth-start': authStart,
  'github-content': githubContent,
  'github-publish': githubPublish,
  'github-upload': githubUpload,
};

const MAX_BODY_BYTES = 3_000_000;

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Payload too large'), { status: 413 });
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks).toString('utf8') : '';
}

export default async function vercelHandler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname.split('/').filter(Boolean).pop();
  const handler = Object.hasOwn(handlers, name) ? handlers[name] : undefined;
  res.setHeader('Cache-Control', 'no-store');
  if (!handler) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try { body = await readBody(req); } catch (error) {
      res.statusCode = error.status || 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.status === 413 ? 'Payload too large' : 'Invalid request body' }));
      return;
    }
  }

  const query = Object.fromEntries([...url.searchParams].filter(([key]) => key !== 'fn'));
  const result = await handler({
    httpMethod: req.method,
    headers: req.headers,
    queryStringParameters: query,
    body,
    isBase64Encoded: false,
  });

  res.statusCode = result.statusCode || 200;
  for (const [key, value] of Object.entries(result.headers || {})) res.setHeader(key, value);
  for (const [key, values] of Object.entries(result.multiValueHeaders || {})) {
    if (values?.length) res.setHeader(key, values);
  }
  res.end(result.body || '');
}
