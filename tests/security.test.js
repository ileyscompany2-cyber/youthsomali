import test from 'node:test';
import assert from 'node:assert/strict';
import { seal, open, cookie, readCookie, session, equal } from '../netlify/functions/lib/security.js';
import { validateContent } from '../netlify/functions/lib/content.js';
import { handler as publish } from '../netlify/functions/github-publish.js';
import { handler as start } from '../netlify/functions/auth-start.js';
import { handler as callback } from '../netlify/functions/auth-callback.js';
import { imagePath, safeLink } from '../assets/js/cms-schema.js';
import { readFile } from 'node:fs/promises';
process.env.SITE_ORIGIN = 'https://example.com'; process.env.AUTH0_DOMAIN = 'test.auth0.com'; process.env.AUTH0_CLIENT_ID = 'test'; process.env.AUTH0_CLIENT_SECRET = 'test'; process.env.SESSION_SECRET = 'ab'.repeat(32); process.env.ADMIN_SUBJECTS = 'auth0|admin';
test('encrypted session rejects tampering and wrong purpose', async () => { const token = await seal({ sub: 'auth0|admin' },60,'session'); assert.equal((await open(token,'session')).sub,'auth0|admin'); await assert.rejects(open(token,'flow')); await assert.rejects(open(token.slice(0,-8)+'aaaaaaaa','session')); });
test('expired tokens fail closed', async () => { const token = await seal({},-1,'session'); await assert.rejects(open(token,'session')); });
test('write needs an authorized subject, correct origin and CSRF token', async () => { const token = await seal({ sub:'auth0|admin',csrf:'random-token' },60,'session'); const event = { headers:{ cookie:`__Host-session=${token}`, origin:process.env.SITE_ORIGIN,'x-csrf-token':'random-token' } }; assert.equal((await session(event,true)).sub,'auth0|admin'); await assert.rejects(session({ headers:{ ...event.headers,origin:'https://evil.example' } },true)); await assert.rejects(session({ headers:{ ...event.headers,'x-csrf-token':'wrong' } },true)); process.env.ADMIN_SUBJECTS='auth0|other'; await assert.rejects(session(event)); process.env.ADMIN_SUBJECTS='auth0|admin'; });
test('cookies have host-only protections', () => { const value = cookie('session','token',60); assert.match(value,/Secure; HttpOnly; SameSite=Lax/); assert.equal(readCookie({headers:{cookie:value}},'session'),'token'); assert.equal(equal(undefined,'x'),false); });
test('content rejects unsafe images and unknown sections', () => { for (const value of ['https://evil.example/a.png','assets/images/../secret.png','assets/images/a.svg']) assert.throws(() => validateContent({version:1,sections:{home:[{id:'image',type:'image',label:'Image',value}]}})); assert.throws(() => validateContent({version:1,sections:{secrets:[]}})); });
test('publishing rejects anonymous and incorrect-method requests before GitHub access', async () => { assert.equal((await publish({httpMethod:'POST',headers:{},body:'{}'})).statusCode,401); assert.equal((await publish({httpMethod:'GET',headers:{}})).statusCode,405); });
test('sign-in uses PKCE and a protected flow cookie', async () => {
  const result = await start({ httpMethod: 'GET', headers: {}, queryStringParameters: { remember: '1' } });
  assert.equal(result.statusCode, 302);
  const url = new URL(result.headers.Location);
  assert.equal(url.origin, 'https://test.auth0.com');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('max_age'), '0');
  assert.match(result.multiValueHeaders['Set-Cookie'][0], /__Host-flow=.*Secure; HttpOnly; SameSite=Lax; Max-Age=600/);
});
test('callback refuses missing browser flow without making a token exchange', async () => {
  const result = await callback({ httpMethod: 'GET', headers: {}, queryStringParameters: { state: 'forged', code: 'forged' } });
  assert.equal(result.headers.Location, '/admin/login.html?error=signin');
  assert.match(result.multiValueHeaders['Set-Cookie'][0], /Max-Age=0/);
});
test('missing authentication configuration returns to the login page', async () => {
  const saved = process.env.SESSION_SECRET;
  try {
    delete process.env.SESSION_SECRET;
    const result = await start({ httpMethod: 'GET', headers: {} });
    assert.equal(result.headers.Location, '/admin/login.html?error=configuration');
  } finally { process.env.SESSION_SECRET = saved; }
});
test('the deployed CMS seed validates and preserves all original repeated cards', async () => {
  const seed=JSON.parse(await readFile(new URL('../content/site.json',import.meta.url),'utf8'));
  assert.equal(validateContent(seed),seed);
  assert.equal(seed.collections.programs.length,6);
  assert.equal(seed.collections.team.length,5);
  assert.equal(seed.collections.gallery.length,4);
  assert.equal(seed.collections.events.length,1);
});
test('structured records reject unsafe links, images and invalid publication state', () => {
  const doc = record => ({version:1,sections:{},collections:{events:[record]}});
  const record={id:'event_test',title:'Peace forum',description:'Community dialogue',image:'assets/uploads/photo.jpg',date:'2026-12-01',location:'Mogadishu',published:true};
  assert.equal(validateContent(doc(record)).collections.events.length,1);
  assert.throws(()=>validateContent(doc({...record,published:'yes'})));
  assert.throws(()=>validateContent(doc({...record,image:'assets/uploads/../secret.png'})));
  assert.throws(()=>validateContent({version:1,sections:{},collections:{navigation:[{id:'bad_link',label:'Bad',href:'javascript:alert(1)'}]}}));
  assert.equal(imagePath('assets/uploads/new.webp'),true);
  assert.equal(safeLink('//external.example'),false);
  assert.equal(safeLink('#programs'),true);
});
test('public content schema does not accept accidental secret fields', () => {
  assert.throws(()=>validateContent({version:1,sections:{},password:'do-not-publish'}));
  assert.throws(()=>validateContent({version:1,sections:{home:[{id:'home_title',type:'text',label:'Title',value:'YPP',token:'do-not-publish'}]}}));
});
