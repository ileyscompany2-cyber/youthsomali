# Youth for Peace and Prosperous

Latest verified findings and remaining limitations: [AUDIT-REPORT.md](AUDIT-REPORT.md). No production deployment was performed during the audit.

## Local login and dashboard

**Users:** the local dashboard includes account creation, name/email edits, Admin/Editor roles, password reset, disable/enable and deletion. Only Admins can manage accounts; Editors can manage content. The terminal-configured owner cannot be deleted, disabled or changed through the UI. Additional accounts persist in ignored `.local-users.json` as salted scrypt hashes; this file is not public or included in builds/GitHub source packages. Account changes revoke that user's sessions immediately. Local accounts are not production Auth0 accounts. Production user authorization remains in Auth0 and Vercel's `ADMIN_SUBJECTS` configuration. All 28 automated tests and the production build passed after this addition.

**Windows launcher (also handles `node is not recognized`):** run `powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-Local.ps1`. It uses an existing Node 22+ runtime or downloads a checksum-verified portable runtime into ignored `.tools/`. Run the same launcher with `-Test` for the isolated local integration tests. See [LOCAL-WORKFLOW.md](LOCAL-WORKFLOW.md) for the local-first workflow. Node is installed. All 28 automated tests and the production build passed.

Use `node scripts/local-server.mjs` (Node.js 22+) from an interactive terminal. Choose a local email and a password of at least 12 characters when prompted, then open **http://127.0.0.1:8888/admin/login.html**. Login redirects to the existing dashboard. No npm install, Auth0 or GitHub credentials are required for this local mode. Never open admin pages via `file://` or a static-only preview server.

Local Save writes the real `content/site.json` file, creates a backup under `.local-backups/`, and stores uploads under `assets/uploads/`. Preview and edits use the same CMS as production. Local sessions are server-side, password verification uses scrypt, and writes require Origin and CSRF validation. The server binds only to 127.0.0.1 and is excluded from Vercel builds. Restarting invalidates local sessions. Production continues using Auth0 and Vercel Functions.

See [START-LOCAL.md](START-LOCAL.md) for Somali setup and troubleshooting. Run `node --test tests/local-server.test.mjs` to check local login, authorization, saves, conflicts, uploads and logout using an isolated temporary copy. The local integration tests passed using Node.js v26.13.0.

Existing static website with an Auth0 administrator portal and protected GitHub publishing through Vercel Functions. No application database. HTML, CSS, vanilla JavaScript, Bootstrap 5, Bootstrap Icons and Google Fonts. The runtime dependency is `jose` for OIDC verification and encrypted cookies.

## Included

- `/admin/login.html`: responsive light/dark sign-in entry, remember-device option, notices and redirect to Auth0 Universal Login.
- `/admin/index.html`: verified-session dashboard, overview, homepage text and images, programs, events, gallery, team, contact, website settings, and additional text/image entries for news, projects and pages.
- Original layout/content remain in HTML. `assets/js/content.js` applies `content/site.json` with textContent and restricted local image paths. New entries are plain text blocks/images. Pages are additional blocks on the current single-page website, not separate routes or a template builder.
- Upload PNG/JPEG/WebP images up to 2 MB. The library shows referenced images and previews multiple selected files. Replace references to stop displaying an old image; source files are retained for rollback. Uploads commit immediately, trigger deployment and become visible after deployment.
- Publish JSON to GitHub using the source SHA to reject concurrent-edit conflicts. Vercel's Git integration builds the update. The UI reports deployment pending; verify completion in Vercel. Structured program, event, gallery, team and navigation records support add/edit/delete/reorder operations.

## Auth0 setup

Create an Auth0 **Regular Web Application** using RS256 signing, Authorization Code grant and **POST** token endpoint authentication (client secret in request body). Record the tenant hostname, client ID and client secret. For production, configure these exact Auth0 values:

- Allowed Callback URLs: `https://www.youthpp.org/api/auth-callback`
- Allowed Logout URLs: `https://www.youthpp.org`
- Allowed Web Origins: `https://www.youthpp.org`
- Vercel Production `SITE_ORIGIN`: `https://www.youthpp.org`

Use **Universal Login** for email/password required-field and format validation, show/hide password, keyboard access, loading and provider error messages. Password entry deliberately stays on the maintained identity provider. Brand that page with the YPP logo/colors. Disable public signup, provision administrators, require verified emails and enable MFA, brute-force protection, suspicious IP throttling and bot protection as supported by your Auth0 plan. Test tenant protection settings; site code cannot enable those policies.

Configure Auth0 password reset and a real email delivery provider for recovery. There is no fake recovery link on the local page; configured recovery appears in Universal Login.

Copy each authorized account's immutable Auth0 `user_id` (for example `auth0|abc123`) into `ADMIN_SUBJECTS`, comma separated. Emails are for display, not authorization. Unverified email accounts are refused even when allowlisted.

References: [Authorization Code flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow), [Universal Login](https://auth0.com/docs/authenticate/login/auth0-universal-login), [Attack Protection](https://auth0.com/docs/secure/attack-protection).

## GitHub setup

Push this project, including `content/site.json`, to the repository Vercel deploys. Create a fine-grained token restricted to **this repository**, with **Contents: read and write** (Metadata read is implicit). No workflow or organization administration permission is needed. Use an automation identity, set an expiration and rotate regularly. Store the token only in the Vercel `youthsomali-tc` project under **Settings → Environment Variables → Production**.

`GITHUB_BRANCH` defaults to `main`, the Vercel Production branch. If set explicitly, it must match the production branch and allow commits by the automation identity. If your policy requires pull requests, use a dedicated publishing branch or adapt this workflow to your review policy. Publishing fixes the writable path to `content/site.json`; uploads use generated paths under `assets/uploads/`. Credentials never reach the browser.

Reference: [GitHub repository contents API](https://docs.github.com/en/rest/repos/contents).

## Vercel setup and deployment

1. Install Node.js 22 or later. Run `npm ci`, `npm test`, then `npm run build`. Commit the generated `package-lock.json` to pin dependencies. The resolved dependency lockfile is included.
2. Connect `ileyscompany2-cyber/youthsomali` to the Vercel project `youthsomali-tc` with production branch `main`. The project build command is `npm run build`; `vercel.json` sets `dist` as the static output and applies security headers. Native Vercel Functions are discovered from `api/`. The verified custom domains are `youthpp.org` (308 redirect) and canonical `www.youthpp.org`.
3. In the Vercel `youthsomali-tc` project, open **Settings → Environment Variables** and add the required values to **Production**. Keep credentials server-side; do not commit a real `.env` or expose secrets to the browser. Use isolated staging values for Preview only if preview authentication or publishing is needed.

   | Variable | Purpose |
   | --- | --- |
   | `SITE_ORIGIN` | Canonical production HTTPS origin, with no trailing slash |
   | `AUTH0_DOMAIN` | Auth0 tenant hostname only, without protocol or path |
   | `AUTH0_CLIENT_ID` | Auth0 Regular Web Application client ID |
   | `AUTH0_CLIENT_SECRET` | Auth0 Regular Web Application client secret |
   | `SESSION_SECRET` | 64 hexadecimal characters (32 random bytes) for encrypted sessions |
   | `ADMIN_SUBJECTS` | Comma-separated Auth0 `user_id` values allowed to administer the site |
   | `GITHUB_TOKEN` | Fine-grained token used by the CMS publishing functions |
   | `GITHUB_OWNER` | Optional; defaults to `ileyscompany2-cyber` |
   | `GITHUB_REPO` | Optional; defaults to `youthsomali` |
   | `GITHUB_BRANCH` | Optional; defaults to production branch `main` |

   `SITE_ORIGIN`, the Auth0 tenant/client values, `SESSION_SECRET`, and at least one valid `ADMIN_SUBJECTS` entry are required for administrator sign-in. A valid `GITHUB_TOKEN` is required for CMS publishing. `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH` default to `ileyscompany2-cyber`, `youthsomali`, and `main`; set them explicitly in Vercel only if needed. Do not use placeholder credentials from `.env.example`.
4. In Auth0, set Allowed Callback URLs to `https://www.youthpp.org/api/auth-callback`, Allowed Logout URLs to `https://www.youthpp.org`, and Allowed Web Origins to `https://www.youthpp.org`. Set `SITE_ORIGIN` to exactly `https://www.youthpp.org` (HTTPS origin, no trailing slash); `AUTH0_DOMAIN` is the tenant hostname only, without protocol or path.
5. Generate `SESSION_SECRET` from 32 cryptographically random bytes and store its 64-character hexadecimal representation in Vercel. Never use a placeholder or expose this value in the browser or repository.
6. Deploy after the required variables and Auth0 callback are configured. Redeploy after changing environment variables. Use one canonical HTTPS domain and redirect alternate domains to it. Secure host cookies intentionally do not work over HTTP.
7. Visit `/admin/login.html`, sign in, edit, upload and publish. Verify the commit and successful Vercel deployment, then refresh the public website.

Only public site files are copied to `dist`. Vercel deploys the server functions from `api/` separately; `server/`, tests, documentation, and environment files are not included in the static output. Vercel is the only supported production hosting and deployment platform.

Reference: [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Security and session operations

Authorization Code + PKCE uses random state and nonce and a 10-minute encrypted flow cookie. Callback verifies RS256 signature, issuer, audience, expiration, recent issue time, nonce and explicit admin allowlist. Auth0 tokens are discarded after callback.

Sessions are AES-256-GCM encrypted cookies via jose, with Secure, HttpOnly, SameSite=Lax, host-only __Host- prefix and Path=/. No auth tokens are in browser storage; localStorage contains only theme preference. Every protected read/write validates the session and rechecks ADMIN_SUBJECTS. Writes require exact Origin and session-bound CSRF custom header.

Unchecked Remember Me uses a browser-session cookie and 8-hour absolute expiration. Checked uses a persistent cookie and 7-day absolute expiration. Browser restoration may retain session cookies; server expiration is always checked. No refresh tokens or sliding sessions are used.

Logout clears the app cookies and redirects through Auth0 logout to the canonical public homepage; it does not sign out other Auth0 applications or revoke a stolen stateless cookie. Each sign-in requests fresh provider authentication (`max_age=0`). To revoke an admin, remove their ID from ADMIN_SUBJECTS and redeploy. To invalidate all app sessions, rotate SESSION_SECRET and redeploy. Disabling a provider account alone does not invalidate an existing app cookie. Per-session central revocation would require additional server state.

The dashboard HTML shell is public and contains no private data. Client redirects improve navigation; functions enforce authorization. Website content JSON and images are intentionally public.

Content is schema-checked, limited to an 800 KB request and rendered as text, never HTML. Image upload validates signatures, encoding and 2 MB size, and rejects SVG/HTML. Signature checking is not full image decoding or malware scanning; uploads are available only to trusted administrators. Original and unreferenced image files are retained.

Auth0 handles password rate limiting. Configure Vercel platform/edge rate limits for public redirect/callback traffic appropriate to your plan. An in-memory serverless counter would not provide reliable protection. Production secrets must not be available in untrusted deploy previews or branches. Use an isolated HTTPS staging site with its own callback, secrets and publishing branch.

## Verification

Sign-in now returns configuration failures to the login card, shows an accessible loading indicator, and restores the button when returning from the provider. While loading, uploading or publishing, the dashboard locks editor actions so in-flight saves cannot silently discard new edits. Callback authentication time is checked against the initiating flow, following [Auth0 reauthentication guidance](https://auth0.com/docs/authenticate/login/max-age-reauthentication).

`npm test` covers cookie tampering/expiration, allowlist checks, CSRF, unsafe image paths and anonymous publishing rejection. All 28 automated tests passed, as did the production build and JavaScript syntax checks. Local Edge/Chrome browser workflows passed; real-provider/GitHub/Vercel checks still require configured services.

Before production, on an HTTPS staging deployment:

1. Verify anonymous dashboard redirects, direct publish/upload rejection, and non-admin/unverified account rejection.
2. Verify correct/incorrect password behavior, MFA, provider rate limits, password visibility, recovery and keyboard navigation in Universal Login.
3. Verify invalid state/nonce/PKCE failure, expired sessions (401), missing CSRF/wrong Origin (403), and wrong methods (405).
4. Verify remembered/unremembered cookie flags/expiration, logout, and administrator revocation after redeploy.
5. Verify edits/uploads reach GitHub and appear after successful Vercel deployment. Two tabs using the same source SHA must conflict instead of overwriting. Test failed GitHub permissions, oversize uploads and failed deployments.
6. Review mobile/tablet/desktop layouts, both color modes, focus visibility and reduced motion.

This checkout contains no service credentials and has not been deployed or live-tested.

## Structured CMS integrated with index.html

The existing homepage remains the public entry point. Its static sections are preserved as a fallback; deployed JSON supplies editable text, images, settings and repeated cards. The original six programs, one event, four gallery photos and five team members are seeded into `content/site.json` under `collections`. The original photographs, CSS classes, forest-green/gold colors, Contact YPP button and footer Admin link are retained. The navigation Admin Login button includes a shield icon.

In the dashboard:

- Homepage/About/Contact/Settings forms edit mapped text, hero button labels and destinations, director information, email/phone/location, logo, title, description, footer and navigation links. The contact form uses the managed email address.
- Programs and team cards support add, edit, delete and move up/down. Events also support date, location and published/unpublished state. Gallery records support captions, alt text, groups, replacement, removal and reordering.
- Click a content image or Choose replacement image to upload a new file. Image Library accepts multiple files and shows local selection previews. Successful upload paths appear individually. Uploads are sequential; if one fails, earlier committed files remain available and the failure is shown.
- Deleting a record removes it from the public page after publishing. Uploaded files remain in GitHub for rollback; the UI does not permanently delete repository files. An uploaded file becomes publicly available after its upload deployment completes, so a preview made immediately after upload may temporarily show an unavailable image.
- Preview opens a new tab with an in-memory copy of the current unsaved content. Only messages from the exact same-origin opener are accepted. No draft content or authentication tokens are saved in localStorage. Preview does not commit changes or authenticate anyone. Allow the new tab if your browser blocks it.
- Publish persists the complete validated JSON in GitHub. Reload discards unsaved edits after confirmation. Recent updates on Overview lists uploads and commits made in the current dashboard session; it is not a permanent audit log. GitHub commit history remains the permanent publishing record.

The public content loader is now an ES module. Serve the project over HTTP(S) rather than opening index.html as a file URL. Vercel remains required for production Auth0 authentication and GitHub publishing; the separate local server provides real local login and disk saves. Password fields, visibility controls, password errors and configured recovery are on Auth0 Universal Login, rather than embedded in index.html. Provider and GitHub credentials must remain in Vercel Functions environment settings.

Additional tests validate the complete seed and structured-record publication state, paths and navigation destinations. Static checks passed for original image paths, module imports, unique content IDs, page assets, HTML container balance and the managed contact recipient. All 28 automated Node tests and the production build passed. Local browser workflows passed. Live provider/GitHub/Vercel integration checks remain outstanding.


## Audited development URLs

`npm run dev` defaults to port 3000; `Start-Local.ps1` retains port 8888. Set LOCAL_PORT to override either. Localhost GET navigation redirects to 127.0.0.1 on the same port for consistent cookies. The /admin/ route is supported. Bootstrap, icons and DM Sans are now bundled locally; no CDN is needed for the local presentation. Password and recovery for production still use Auth0. Optional LOCAL_SESSION_SECONDS controls local-only expiry testing; production lifetimes are unchanged.
