import test from 'node:test';
import assert from 'node:assert/strict';
import { createVercelFunction } from '../server/vercel-handler.js';

test('Vercel adapter maps requests and preserves redirect headers and separate cookies', async () => {
  let received;
  const route = createVercelFunction(async event => {
    received = event;
    return {
      statusCode: 302,
      headers: { Location: '/admin/index.html', 'Cache-Control': 'no-store' },
      multiValueHeaders: { 'Set-Cookie': ['__Host-flow=; Path=/; Secure; HttpOnly', '__Host-session=token; Path=/; Secure; HttpOnly'] },
      body: '',
    };
  });
  const request = new Request('https://www.youthpp.org/api/auth-start?remember=1', {
    method: 'POST',
    headers: { Cookie: 'session=abc', Origin: 'https://www.youthpp.org', 'X-CSRF-Token': 'token' },
    body: '{"value":"test"}',
  });
  const response = await route.fetch(request);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/admin/index.html');
  assert.deepEqual(response.headers.getSetCookie(), ['__Host-flow=; Path=/; Secure; HttpOnly', '__Host-session=token; Path=/; Secure; HttpOnly']);
  assert.equal(received.httpMethod, 'POST');
  assert.equal(received.headers.cookie, 'session=abc');
  assert.equal(received.headers.origin, 'https://www.youthpp.org');
  assert.equal(received.headers['x-csrf-token'], 'token');
  assert.deepEqual(received.queryStringParameters, { remember: '1' });
  assert.equal(received.body, '{"value":"test"}');
});

test('Vercel adapter hides unexpected handler errors', async () => {
  const route = createVercelFunction(async () => { throw new Error('sensitive provider detail'); });
  const response = await route.fetch(new Request('https://www.youthpp.org/api/example'));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Service unavailable. Please try again later.' });
});
