import { endpoint, session, json, cookie, config } from './lib/security.js';

export const handler = endpoint('POST', async event => {
  await session(event, true);
  const settings = config();
  const logout = new URL('v2/logout', settings.issuer);
  logout.search = new URLSearchParams({ client_id: settings.client, returnTo: settings.origin }).toString();
  return {
    ...json(200, { ok: true, logoutUrl: logout.href }),
    multiValueHeaders: { 'Set-Cookie': [cookie('session', '', 0), cookie('flow', '', 0)] },
  };
});
