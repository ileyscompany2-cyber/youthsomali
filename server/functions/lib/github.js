const owner = () => process.env.GITHUB_OWNER || 'ileyscompany2-cyber';
const repository = () => process.env.GITHUB_REPO || 'youthsomali';

export async function github(path, method = 'GET', body) {
  const { GITHUB_TOKEN } = process.env;
  if (!GITHUB_TOKEN) throw new Error('GitHub publishing is not configured');
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner())}/${encodeURIComponent(repository())}/${path}`, { method, headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Object.assign(new Error(response.status === 409 || response.status === 422 ? 'Content changed. Reload before publishing again.' : 'GitHub request failed. Check repository permissions and retry.'), { status: response.status === 409 || response.status === 422 ? 409 : 502 });
  return response.json();
}
export const branch = () => process.env.GITHUB_BRANCH || 'main';
