export async function api(name, options = {}) {
  // The same API contract is used by the local backend and Netlify Functions.
  // Authentication is always checked by the server; no localStorage login flags.
  const response = await fetch(`/.netlify/functions/${name}`, { credentials: 'same-origin', cache: 'no-store', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const result = await response.json().catch(() => ({ error: 'Unable to contact the server. Please try again.' }));
  if (!response.ok) throw Object.assign(new Error(result.error || 'Request failed'), { status: response.status });
  return result;
}
export function themeControl() {
  let saved; try { saved = localStorage.getItem('ypp-theme'); } catch {}
  if (['light', 'dark'].includes(saved)) document.documentElement.dataset.theme = saved;
  document.querySelector('#theme')?.addEventListener('click', () => { const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; const theme = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; try { localStorage.setItem('ypp-theme', theme); } catch {} });
}
export async function requireSession() { try { return await api('auth-session'); } catch (error) { if ([401,403].includes(error.status)) location.replace('/admin/login.html?expired=1'); throw error; } }
