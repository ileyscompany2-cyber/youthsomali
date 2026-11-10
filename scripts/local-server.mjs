// Local development only. Never included in the Netlify publish directory.
import http from 'node:http';
import { readFile, writeFile, mkdir, rename, realpath } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { validateContent } from '../netlify/functions/lib/content.js';
import { createUserStore } from './local-users.mjs';
import { validateImage } from '../netlify/functions/lib/image.js';

// Derive paths from this file, never from user-provided request paths or the shell cwd.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.LOCAL_PORT || process.argv.find(value => value.startsWith('--port='))?.slice(7) || 8888);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid LOCAL_PORT');
const origin = `http://127.0.0.1:${port}`;
// Optional local-only lifetime supports short expiry checks without changing production auth.
const sessionSeconds = process.env.LOCAL_SESSION_SECONDS ? Number(process.env.LOCAL_SESSION_SECONDS) : undefined;
if (sessionSeconds !== undefined && (!Number.isInteger(sessionSeconds) || sessionSeconds < 1 || sessionSeconds > 604800)) throw new Error('Invalid LOCAL_SESSION_SECONDS');
let email = process.env.LOCAL_ADMIN_EMAIL, password = process.env.LOCAL_ADMIN_PASSWORD;
if (!email || !password) {
  if (!process.stdin.isTTY) throw new Error('Run this server in an interactive terminal to choose local login credentials.');
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  email = await reader.question('Choose your local admin email: '); reader.close();
  process.stdout.write('Choose a local password (12+ characters; hidden): ');
  const silent = new Writable({ write(chunk, encoding, callback) { callback(); } });
  const secretReader = createInterface({ input: process.stdin, output: silent, terminal: true });
  password = await secretReader.question(''); secretReader.close(); process.stdout.write('\n');
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || (password || '').length < 12) throw new Error('Use a valid email and password of at least 12 characters. Restart to try again.');
// Keep only a salted password hash in memory. Restarting discards credentials/sessions.
// Production authentication is handled separately by Auth0 in Netlify Functions.
const users = await createUserStore(root, email, password);
delete process.env.LOCAL_ADMIN_PASSWORD; password = undefined;
const sessions = new Map(), attempts = new Map();
const random = () => randomBytes(32).toString('base64url');
const digest = bytes => createHash('sha1').update(bytes).digest('hex');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const cookie = (value, age) => `ypp_local_session=${value}; Path=/; HttpOnly; SameSite=Strict${age === undefined ? '' : `; Max-Age=${age}`}`;
const securityHeaders = { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };
function reply(res, status, data, extra = {}) { res.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra }); res.end(JSON.stringify(data)); }
async function body(req, limit = 800000) {
  let size = 0; const chunks = [];
  // Drain oversized requests without buffering them or destroying the socket before 413.
  for await (const chunk of req) { size += chunk.length; if (size <= limit) chunks.push(chunk); }
  if (size > limit) fail(413, 'Request is too large.');
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400, 'Invalid JSON.'); }
}
// The cookie is an opaque random session ID, not a browser-controlled authentication flag.
// Every write needs both the correct Origin and the CSRF secret tied to this session.
function user(req, write = false) {
  const token = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('ypp_local_session='))?.slice(18);
  const session = sessions.get(token);
  if (!session || session.expires <= Math.floor(Date.now() / 1000)) { sessions.delete(token); fail(401, 'Your local session has expired. Please sign in again.'); }
  const account = users.get(session.userId);
  if (!account?.active) { sessions.delete(token); fail(401, 'Your account is no longer active.'); }
  if (write && (req.headers.origin !== origin || req.headers['x-csrf-token'] !== session.csrf)) fail(403, 'Request verification failed.');
  return { ...session, ...account, token };
}
const mime = { '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
// Serialize saves so two tabs cannot overwrite a document with the same SHA.
let queue = Promise.resolve();
function serialized(action) { const result = queue.then(action); queue = result.catch(() => {}); return result; }
const server = http.createServer(async (req, res) => {
  try {
    // Exact Host checking blocks DNS rebinding against this loopback-only development server.
    if (req.headers.host === `localhost:${port}` && ['GET','HEAD'].includes(req.method)) { res.writeHead(302, { Location: origin + new URL(req.url, origin).pathname + new URL(req.url, origin).search, 'Cache-Control': 'no-store' }); return res.end(); }
    if (req.headers.host !== `127.0.0.1:${port}`) fail(403, `Use ${origin}`);
    const url = new URL(req.url, origin), name = url.pathname.replace('/.netlify/functions/', '');
    if (url.pathname.startsWith('/.netlify/functions/')) {
      const methods = { 'local-info': 'GET', 'local-login': 'POST', 'local-users': 'GET', 'local-users-save': 'POST', 'auth-session': 'GET', 'auth-logout': 'POST', 'github-content': 'GET', 'github-publish': 'POST', 'github-upload': 'POST' };
      if (!methods[name]) fail(404, 'This function is not available on the local server.');
      if (req.method !== methods[name]) return reply(res, 405, { error: 'Method not allowed' }, { Allow: methods[name] });
      if (name === 'local-info') return reply(res, 200, { local: true });
      if (name === 'local-login') {
        if (req.headers.origin !== origin) fail(403, 'Request verification failed.');
        const key = req.socket.remoteAddress, now = Date.now();
        let rate = attempts.get(key); if (!rate || rate.reset < now) { rate = { count: 0, reset: now + 900000 }; attempts.set(key, rate); }
        if (rate.count >= 5) fail(429, 'Too many login attempts. Try again in 15 minutes.');
        // Reserve the attempt before awaiting input; concurrent requests cannot bypass the cap.
        rate.count++; const data = await body(req, 8000);
        if (typeof data?.email !== 'string' || typeof data?.password !== 'string' || data.password.length > 1024) fail(401, 'Incorrect email or password.');
        const account = users.authenticate(data.email, data.password);
        if (!account) fail(401, 'Incorrect email or password.');
        attempts.delete(key);
        const old = (req.headers.cookie || '').split(';').map(v=>v.trim()).find(v=>v.startsWith('ypp_local_session='))?.slice(18); sessions.delete(old);
        const token = random(), age = sessionSeconds ?? (data.remember === true ? 604800 : 28800);
        sessions.set(token, { userId: account.id, csrf: random(), expires: Math.floor(Date.now() / 1000) + age });
        return reply(res, 200, { ok: true }, { 'Set-Cookie': cookie(token, data.remember === true ? age : undefined) });
      }
      const session = user(req, req.method === 'POST');
      if (name === 'auth-session') return reply(res, 200, { email: session.email, role: session.role, csrf: session.csrf, expires: session.expires, local: true });
      if (name === 'local-users' || name === 'local-users-save') {
        if (session.role !== 'admin') fail(403, 'Only administrators can manage users.');
        if (name === 'local-users') return reply(res, 200, { users: users.list() });
        const result = await users.save(await body(req, 16000), session.userId);
        // Changing credentials/roles/status or deleting a user revokes all their sessions.
        for (const [token, existing] of sessions) if (existing.userId === result.id) sessions.delete(token);
        return reply(res, 200, { ok: true });
      }
      if (name === 'auth-logout') { sessions.delete(session.token); return reply(res, 200, { ok: true }, { 'Set-Cookie': cookie('', 0) }); }
      if (name === 'github-content') { const bytes = await readFile(resolve(root, 'content/site.json')); return reply(res, 200, { sha: digest(bytes), content: JSON.parse(bytes) }); }
      if (name === 'github-publish') {
        const data = await body(req), content = validateContent(data?.content);
        const result = await serialized(async () => {
          const path = resolve(root, 'content/site.json'), before = await readFile(path);
          if (digest(before) !== data.sha) fail(409, 'Content changed in another tab. Reload before saving again.');
          const bytes = Buffer.from(JSON.stringify(content, null, 2) + '\n');
          // Back up first, then atomically replace the JSON. Never write browser-supplied paths.
          await mkdir(resolve(root, '.local-backups'), { recursive: true });
          await writeFile(resolve(root, '.local-backups', `${Date.now()}-${randomUUID()}.json`), before);
          const temporary = path + '.local-tmp'; await writeFile(temporary, bytes); await rename(temporary, path);
          return { sha: digest(bytes), commit: digest(bytes), message: 'Saved to content/site.json on this computer. Refresh the local website to see your changes. Nothing was published to GitHub or Netlify.' };
        });
        return reply(res, 200, result);
      }
      if (name === 'github-upload') {
        const data = await body(req, 2900000);
        const { bytes, extension: ext } = validateImage(data?.data);
        const directory = resolve(root, 'assets/uploads'); await mkdir(directory, { recursive: true });
        // realpath prevents an upload directory symlink from escaping the checkout.
        if (await realpath(directory) !== directory) fail(403, 'Upload directory must be inside this project.');
        const path = `assets/uploads/${randomUUID()}.${ext}`; await writeFile(resolve(root,path), bytes, { flag: 'wx' });
        return reply(res, 200, { path });
      }
    }
    if (!['GET','HEAD'].includes(req.method)) fail(405, 'Method not allowed');
    let path; try { path = decodeURIComponent(url.pathname); } catch { fail(400, 'Invalid path'); }
    if (path === '/') path = '/index.html';
    if (path === '/admin' || path === '/admin/') { res.writeHead(302, { Location: '/admin/index.html', 'Cache-Control': 'no-store' }); return res.end(); }
    if (path.split('/').some(segment => segment === '.' || segment === '..')) fail(403, 'Invalid path');
    // Serve only public site folders: secrets, backups, source and .git are never exposed.
    if (!/^\/(?:index\.html|robots\.txt|admin\/[\w./-]+|assets\/[\w./-]+|Photos\/[\w./-]+|content\/site\.json)$/.test(path)) fail(404, 'File not found');
    const full = resolve(root, '.' + path);
    if (!full.startsWith(root + sep)) fail(403, 'Invalid path');
    const canonical = await realpath(full);
    if (!canonical.startsWith(root + sep)) fail(403, 'Invalid file');
    const bytes = await readFile(canonical);
    res.writeHead(200, { ...securityHeaders, 'Content-Type': mime[extname(full).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', ...(path.startsWith('/admin/') ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}) }); res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch (error) { reply(res, error.status || (error.code === 'ENOENT' ? 404 : 500), { error: error.status ? error.message : error.code === 'ENOENT' ? 'File not found.' : 'Local server error. Check the terminal.' }); if (!error.status && error.code !== 'ENOENT') console.error(error.message); }
});
server.requestTimeout = 30000;
server.headersTimeout = 10000;
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Stop the other server or set LOCAL_PORT.` : error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => { console.log(`\nYPP local website: ${origin}\nAdmin login: ${origin}/admin/login.html\nSign in with the credentials you chose in this terminal.\nLocal saves update this project; backups are in .local-backups/.\nSessions expire on restart. Press Ctrl+C to stop.\n`); });
setInterval(() => { const now = Math.floor(Date.now()/1000); for (const [key,value] of sessions) if (value.expires <= now) sessions.delete(key); },60000).unref();
