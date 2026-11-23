import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent } from '../server/functions/lib/content.js';
const content = href => ({ version: 1, sections: {}, collections: { social: [{ id: 'social_test', label: 'YouTube', href, published: true }] } });
test('social media accepts HTTPS profiles and rejects unsafe or non-web destinations', () => {
  assert.equal(validateContent(content('https://www.youtube.com/@ypp')).collections.social.length, 1);
  for (const href of ['javascript:alert(1)', 'http://example.com', '#home', '/admin', 'https://']) assert.throws(() => validateContent(content(href)));
  const empty = content('https://example.org'); empty.collections.social = [];
  assert.deepEqual(validateContent(empty).collections.social, []);
});
