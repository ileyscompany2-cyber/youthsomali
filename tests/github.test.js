import test from 'node:test';
import assert from 'node:assert/strict';
import { github, branch } from '../server/functions/lib/github.js';

test('GitHub integration defaults to the configured repository and production branch', async () => {
  const previous = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH,
    fetch: globalThis.fetch,
  };
  let requestUrl;
  let requestOptions;
  try {
    process.env.GITHUB_TOKEN = 'test-token-not-a-credential';
    delete process.env.GITHUB_OWNER;
    delete process.env.GITHUB_REPO;
    delete process.env.GITHUB_BRANCH;
    globalThis.fetch = async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    assert.equal(branch(), 'main');
    assert.deepEqual(await github('contents/content/site.json?ref=main'), { ok: true });
    assert.equal(requestUrl, 'https://api.github.com/repos/ileyscompany2-cyber/youthsomali/contents/content/site.json?ref=main');
    assert.equal(requestOptions.headers.Authorization, 'Bearer test-token-not-a-credential');
    assert.equal(requestOptions.headers['X-GitHub-Api-Version'], '2022-11-28');
  } finally {
    if (previous.token === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = previous.token;
    if (previous.owner === undefined) delete process.env.GITHUB_OWNER; else process.env.GITHUB_OWNER = previous.owner;
    if (previous.repo === undefined) delete process.env.GITHUB_REPO; else process.env.GITHUB_REPO = previous.repo;
    if (previous.branch === undefined) delete process.env.GITHUB_BRANCH; else process.env.GITHUB_BRANCH = previous.branch;
    globalThis.fetch = previous.fetch;
  }
});

test('GitHub publishing fails clearly when the token is absent', async () => {
  const previous = process.env.GITHUB_TOKEN;
  try {
    delete process.env.GITHUB_TOKEN;
    await assert.rejects(github('contents/content/site.json'), /GitHub publishing is not configured/);
  } finally {
    if (previous === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = previous;
  }
});
