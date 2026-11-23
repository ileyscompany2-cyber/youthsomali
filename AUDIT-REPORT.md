# Production-readiness audit — Vercel

Audit date: 23 November 2026
Repository: `ileyscompany2-cyber/youthsomali`
Vercel project: `youthsomali-tc` (`prj_UPvXkeHmbDMXiq2exb6PDeBtk79M`)
Canonical site: `https://www.youthpp.org`

## Executive status

The public site is deployed and reachable on Vercel. The latest inspected Production deployment was **Ready**, served both configured domains, and used `npm run build`, `dist`, and Node.js 26.x. The apex domain redirects to `www` with HTTP 308. No domain, DNS, Auth0, production environment, or Production deployment settings were changed during this audit.

The reported failure is the admin backend, not the public root page: live checks returned 200 for `/` and `/admin/login.html`, but 404 for both the old `/.netlify/functions/auth-session` path and the not-yet-deployed `/api/auth-session` path. The repository previously had Netlify Functions and Netlify routing, which a Vercel static deployment does not execute. This change migrates those handlers to Vercel Node.js Functions under `api/`, changes the browser calls to `/api/*`, and preserves the existing static build. The migration is verified locally, but it is **not live until the branch is merged and Vercel creates a new deployment**.

## Root causes and remediation

| Finding | Root cause / evidence | Remediation and status |
| --- | --- | --- |
| Public-site 404 concern | Current Vercel Production deployment is Ready; `https://www.youthpp.org/` and `/admin/login.html` both return HTTP 200. The build command and output directory already match the static app. | Kept `npm run build` and `dist`; verified `dist/index.html`. No SPA fallback was added because the site is a static multi-page site and direct HTML routes already work. |
| Admin/API 404 | The live site requested Netlify Function URLs, but Vercel did not serve the old `netlify/functions` handlers. Live `/.netlify/functions/auth-session` returns 404. | Added seven `/api/*` Vercel function entry points and a Web-standard Request/Response adapter; updated the admin client to call `/api/*`. Vercel’s local production build packages all seven functions. Deployment is still pending. |
| Authentication configuration | Auth0 client ID, domain, and secret exist in Production, but `SITE_ORIGIN`, `SESSION_SECRET`, and `ADMIN_SUBJECTS` are absent. The code correctly refuses to create a session without them. | Updated the example and instructions; retained server-side validation, PKCE, nonce/state checks, verified-email and subject allowlisting, encrypted sessions, CSRF/Origin checks, and secure HttpOnly cookies. Full Auth0 sign-in cannot be verified until the missing values and tenant URLs are configured and the branch is deployed. |
| GitHub publishing configuration | The production `GITHUB_TOKEN` is absent. The code already defaults to the requested repository and `main` branch and keeps the token server-side. | Added tests for the repository/branch defaults and safe GitHub error handling. Publishing remains unavailable until a repository-limited token is configured. |
| Domain / TLS | Vercel assigns both `youthpp.org` and `www.youthpp.org` to `youthsomali-tc`; the apex redirects to `www`. HTTPS requests succeed. The registrar still supplies nameservers, while the observed DNS answers route to Vercel. | No DNS changes are indicated. Keep the registrar nameservers and their current Vercel targets unless intentionally moving DNS hosting to Vercel. |

## Production configuration

The latest Production environment-variable listing contained only these names (secret values were not read):

- Present: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`.
- Required but missing: `SITE_ORIGIN`, `SESSION_SECRET`, `ADMIN_SUBJECTS`, `GITHUB_TOKEN`.
- Optional in this code because of exact defaults: `GITHUB_OWNER=ileyscompany2-cyber`, `GITHUB_REPO=youthsomali`, `GITHUB_BRANCH=main`.

Add the missing values to **Vercel → project `youthsomali-tc` → Settings → Environment Variables → Production**. `SITE_ORIGIN` must be `https://www.youthpp.org` with no trailing slash. `SESSION_SECRET` must be 64 hexadecimal characters generated from 32 cryptographically random bytes; do not commit or share it. `ADMIN_SUBJECTS` is a comma-separated list of authorized Auth0 `sub` identifiers, not email addresses; the callback also requires `email_verified=true`. Create a fine-grained GitHub token restricted to `ileyscompany2-cyber/youthsomali` with Contents read/write permission for CMS publishing; never put it in client code or chat.

In the Auth0 application, set:

- Allowed Callback URL: `https://www.youthpp.org/api/auth-callback`
- Allowed Logout URL: `https://www.youthpp.org`
- Allowed Web Origin: `https://www.youthpp.org`

Then redeploy Production. The route names now match the Vercel entry points: `GET /api/auth-start`, `GET /api/auth-callback`, `GET /api/auth-session`, `POST /api/auth-logout`, plus the three GitHub content/publish/upload endpoints.

## Domain and deployment observations

- Vercel project inspection: root directory `.`, Framework `Other`, Node.js `26.x`, Build Command `npm run build`, Output Directory `dist`.
- Latest inspected Production deployment: Ready; its aliases included `youthpp.org`, `www.youthpp.org`, and the `git-main` project alias.
- Vercel reports third-party nameservers (`dns1.registrar-servers.com`, `dns2.registrar-servers.com`) rather than Vercel nameservers. At audit time, DNS resolved apex A to `216.198.79.1`; `www` had a Vercel CNAME (`e84a4bd3fbf7ccb0.vercel-dns-017.com`) and Vercel A answers. Both HTTPS URLs responded. DNS changes were not made.
- Production was not deployed or modified by this audit. Until the feature branch is merged, the live API paths remain 404.

## Files changed and why

**Vercel deployment and documentation**

- `vercel.json` — retains `dist`, adds response/security/cache headers, and does not introduce an SPA rewrite that could shadow APIs.
- `package.json`, `package-lock.json` — constrain supported Node versions to `>=22 <27`, matching the verified Node 26 Vercel runtime.
- `.env.example` — supplies the real non-secret site/repository defaults and keeps credential values clearly marked as placeholders.
- `.gitignore` — removes the obsolete Netlify build directory entry.
- `README.md`, `LOCAL-WORKFLOW.md`, `START-LOCAL.md` — update platform, endpoints, Auth0 URLs, environment setup, and local workflow instructions.
- `Start-Local.ps1` — updates the local launcher's platform guidance from Netlify to Vercel.
- `.htaccess` — replaces obsolete Netlify source exclusions with `/api` and `/server` protections for optional Apache use; Vercel does not execute this file.
- `robots.txt` — replaces the obsolete Netlify function exclusion with `/api/`.
- `AUDIT-REPORT.md` — replaces the stale Netlify-focused audit with the current Vercel findings and verification record.

**Frontend and local development**

- `admin/index.html`, `admin/js/auth.js`, `admin/js/dashboard.js`, `admin/js/login.js`, `admin/js/users.js` — switch dashboard, Auth0, and publishing calls to the Vercel `/api/*` routes and remove Netlify-specific user-facing wording.
- `index.html` — removes the inline presentation rule that conflicted with the self-only Content Security Policy.
- `scripts/local-server.mjs` — supports the new API route mapping for local development and regression testing.

**Vercel functions and shared backend**

- `api/auth-callback.js`, `api/auth-logout.js`, `api/auth-session.js`, `api/auth-start.js`, `api/github-content.js`, `api/github-publish.js`, `api/github-upload.js` — Vercel Node.js function entry points.
- `server/vercel-handler.js` — adapts Web Requests to the existing handler contract, preserves multiple `Set-Cookie` headers, and converts responses safely.
- `server/functions/auth-callback.js`, `server/functions/auth-logout.js`, `server/functions/auth-session.js`, `server/functions/auth-start.js`, `server/functions/github-content.js`, `server/functions/github-publish.js`, `server/functions/github-upload.js`, `server/functions/lib/content.js`, `server/functions/lib/github.js`, `server/functions/lib/image.js`, `server/functions/lib/security.js` — portable server-side handlers and shared validation/security/GitHub logic; secrets remain server-side.
- Removed obsolete Netlify hosting files: `netlify.toml` and `netlify/functions/auth-callback.js`, `auth-logout.js`, `auth-session.js`, `auth-start.js`, `github-content.js`, `github-publish.js`, `github-upload.js`, `lib/content.js`, `lib/github.js`, `lib/image.js`, and `lib/security.js`.

**Regression tests**

- `tests/github.test.js`, `tests/vercel-handler.test.js` — add GitHub-default/error and Vercel request/response/cookie tests.
- `tests/image.test.mjs`, `tests/local-server.test.mjs`, `tests/persistence.test.mjs`, `tests/security.test.js`, `tests/social.test.mjs` — update coverage for the migrated endpoints and preserve existing upload, local CMS, auth, and content-security behaviors.

## Checks run

| Command / check | Result |
| --- | --- |
| `npm ci` | Pass; installed the locked dependency set, 0 reported vulnerabilities. |
| `npm test` | Pass; 34 tests, 34 passed, 0 failed. |
| `npm run build` | Pass; `dist/index.html` exists. |
| `npm audit --omit=dev` | Pass; 0 vulnerabilities reported. |
| `vercel build --prod --project youthsomali-tc --scope team_U7WHmt7EXbuK5OZVVcWGTQAK --yes` | Pass; generated `.vercel/output` with static files and seven Node.js 26.x API function bundles. Vercel reported that three Production secret values could not be pulled and wrote `[SENSITIVE]` placeholders to the ignored local env file; no values were exposed. |
| Local HTTP checks | Pass: `/` 200, `/admin/login.html` 200, unauthenticated `/api/auth-session` 401 as expected. |
| Live HTTP checks | `/` 200, `/admin/login.html` 200; both old Netlify and not-yet-deployed `/api/auth-session` return 404 on the current Production deployment. |
| `git diff --check` | Pass; no whitespace errors. |
| Current-source credential-pattern scan | No matching credential/private-key patterns found. Full history scan was not performed because this checkout is shallow. |
| Browser screenshot/interactive verification of the new local preview | Not completed: the workspace browser daemon returned a resource-unavailable error. Local route checks and automated tests passed; this is not a visual or authenticated end-to-end test. |

This is a JavaScript project; no TypeScript or lint script is configured. The optional Apache `.htaccess` rules were updated but not executed because Vercel ignores them. No Auth0 credentials, administrator subjects, GitHub token, DNS settings, or production deployment were changed. Production readiness still depends on adding the four missing environment variables, updating the Auth0 application URLs, merging the feature branch, and verifying the new production deployment and real Auth0/GitHub flows.
