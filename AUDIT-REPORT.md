# YPP website technical audit

Audit date: 10 November 2026 (Africa/Nairobi). Scope: the local website, admin portal, Node backend, JSON storage, media, authentication, production source and Netlify configuration. No GitHub push or Netlify deployment was performed. No production credentials were requested or inserted.

Execution environment: Windows, Node.js v26.13.0, installed Edge and Chrome in headless mode. The Node 22 Netlify runtime was not directly executed. Windows terminal PATH needed the installed Node directory for direct npm commands; the provided launcher already detects standard installation paths.

## Verified assessment

The core local CMS is ready for continued local use based on the checks below. The result is **not a certification that the application is completely secure**, a full WCAG conformance assessment, or a completed production deployment.

- **PASS:** 28 automated Node tests, production build, JavaScript syntax checks, clean dependency installation from the lockfile, and npm's production dependency advisory check (zero reported vulnerabilities).
- **PASS:** 54 browser workflow checks in Edge, 14 supplemental checks across installed Edge/Chrome and photographic-size analysis, seven final keyboard/navigation/draft controls checks, one self-edit reauthentication check, and three news/project/page-entry CRUD checks. These counts include navigation/rendering checks and should not be interpreted as independent security tests.
- **PASS:** ten CSS files parsed; six axe accessibility scans of public/login/dashboard/editor states reported zero violations after fixes. Some image-background contrast checks remain incomplete and need human assessment.
- **PASS:** all three HTML documents parsed without parser errors; 58 local HTML references resolved; no duplicate HTML IDs or invalid project JSON were found. The source inventory was 262 files before this report was added.
- **PASS:** 182 original JPEG/PNG images decoded without errors. All original media is retained. Responsive derivatives were generated for eight referenced photographs, reducing their combined 1600px-file budget from 11,637,181 to 2,211,367 bytes (81%). This is a file-size comparison, not a Lighthouse score or real-user speed estimate.
- **NEEDS CONFIGURATION:** production Auth0 tenant settings, verified administrator subjects, GitHub token/permissions, canonical HTTPS origin and Netlify deployment settings.

Browser mutations used disposable project copies with generated test credentials. They did not overwrite the real `content/site.json`, create real local user accounts, or delete original media. Temporary audit servers were stopped after testing. The existing local server is separate from those fixtures.

Final SHA-256 comparison against the initial audit snapshot checked 183 files (`content/site.json` and all 182 original images): zero changed files. A generated 2×2 WebP fixture also passed the shared upload validator. The existing local server was restarted on port 8888 with the updated implementation; existing browser sessions must sign in again.

## Issue register and fixes

| No. | Component | Issue found / root cause | Severity | Fix applied | Test result |
| --- | --- | --- | --- | --- | --- |
| 1 | Homepage contrast | The photograph could paint over the hero gradient because the overlay had no explicit stacking order. | Medium | Put the gradient above the photo and the content above the gradient; retained the existing photo and forest-green/gold palette. | PASS — screenshot reviewed; browser rendering and accessibility checks completed. Text over photographs still requires human judgment. |
| 2 | Homepage layout | Hero content used a full-width container while other sections were constrained. Facts text overflowed at 320px. | Medium | Restored the shared container width; allowed facts/long managed text to wrap. | PASS — no horizontal overflow at 320, 390, 768 and 1440px. |
| 3 | Mobile navigation | JSON-created links only reset `aria-expanded`; the button continued to be named “Close menu.” | Medium | One delegated navigation handler now closes original and generated links and restores the label. Added Escape-to-close/focus behavior. | PASS — managed Programs link and newly created custom navigation link close the menu with the correct accessible state. |
| 4 | Login accessibility | The requested visual heading removal also removed the page's H1. | Low | Added an invisible descriptive H1 without restoring the removed visible copy. | PASS — one accessible H1; login axe scans pass in light/dark modes. |
| 5 | Admin presentation | Bootstrap, icons and DM Sans relied on CDN requests; the audit browser reported network-access failures. | Medium | Bundled existing Bootstrap 5.3.3 CSS, Bootstrap Icons 1.11.3/font files and DM Sans Latin variable font locally, retaining licenses. | PASS — subsequent full workflow run had no failed network requests; no external presentation asset dependency. |
| 6 | Small text / dark mode | Eyebrows and team positions narrowly missed 4.5:1; some admin text and dark action buttons had insufficient contrast. | Medium | Adjusted secondary text shades and separated dark accent-label color from button background color. Core brand colors remain `#123D35` and `#D9A441`. | PASS — six subsequent axe scans report no violations, with image-background contrast items still requiring manual review. |
| 7 | Local URLs | The server rejected `localhost`, had no `/admin/` route, and `npm run dev` did not use the requested port. | Medium | Safe GET/HEAD requests on localhost redirect to the same-port 127.0.0.1 canonical origin; `/admin/` and `/admin` redirect to the dashboard; npm dev selects port 3000. | PASS — homepage, login and admin-directory flows tested through `http://localhost:3000`; anonymous dashboard navigation reaches login. |
| 8 | Login rate limiting | Attempt counters were reserved after awaiting the body, permitting a group of concurrent requests to pass the initial limit check. | High | Reserve attempts before awaiting request input. | PASS — parallel invalid attempts trigger 429 and do not exceed the permitted failed-attempt count. |
| 9 | Upload validation | Files were accepted from magic bytes alone, including truncated/disguised content. | High | Shared local/Netlify structural PNG/JPEG/WebP validation, canonical base64 checks, size checks, dimensions and a 40-megapixel cap. | PASS — valid PNG/JPEG, UI image replacements and multiple uploads work; truncated/disguised/oversized/excess-dimension fixtures are rejected. Full decoding/malware scanning is not implemented. |
| 10 | Oversized requests | Throwing inside the stream iterator could close the socket before a useful response. | Medium | Drain oversized requests without buffering them; respond 413. Bound request/header timeouts. | PASS — an oversized content write receives HTTP 413. |
| 11 | JSON validation | Unknown document/entry keys could accidentally publish unexpected metadata. | Medium | Reject unknown root and entry keys in addition to existing record/path validation. | PASS — document/entry secret-field fixtures and invalid structured records are rejected. |
| 12 | Program statistics | The facts strip said seven programs while six cards existed. | Low | Compute the facts count from program records; the dashboard displays a read-only derived count. | PASS — displayed count matches the seeded six-card collection; browser CRUD renders additional/removal records correctly. |
| 13 | Users editor | Editing the current account revokes its session, leaving the refresh request unauthorized. | Low | Users-panel refresh now returns to login on HTTP 401. | PASS — a browser test updated the currently signed-in secondary administrator and verified return to login; role and revocation API tests also pass. |
| 14 | Security headers | The local responses lacked CSP; production image previews needed blob URLs. | Medium | Added self-hosted CSP, nosniff, frame protection and referrer policy locally; production static CSP permits self/data/blob images and local fonts/styles only. | PASS — local headers checked; real browser preview/upload flows work with normal CSP. Netlify's deployed behavior needs production verification. |
| 15 | Apache fallback | Optional root hosting rules did not explicitly protect local account state and tool folders. | High if the source root is served by Apache | Deny dotfiles, tools, backups, backend/tests and local/config source. | NOT TESTED — rules inspected but Apache is unavailable. Node denial routes and the Netlify build exclusion are tested. |
| 16 | Page performance | Several displayed photographs were multi-megabyte originals and the hero also specified an unnecessary background image. | Medium | Added 800/1600px photographic derivatives and responsive sources, retained original gallery download links, removed duplicate hero background loading, and prioritized the hero. | PASS — original and derivative images decode; browser requests responsive derivatives. Original files were retained. |
| 17 | Maintainability / CSP | Public menu/contact behavior was compressed into an inline script, and homepage overrides were inline. | Low | Moved readable, commented behavior to `assets/js/site.js` and preserved overrides in `assets/css/home.css`, allowing a self-only CSP. | PASS — HTML/CSS/JS parsing, keyboard login/navigation and full CMS browser flows pass. |
| 18 | SEO | No robots policy for admin/API routes. | Low | Added `robots.txt` and admin `noindex` headers; retained existing public title/description and managed metadata. | PASS — build includes robots; admin HTML/meta and local response headers checked. A production-domain sitemap still needs configuration. |

No critical exploit was demonstrated in this audit. This does not establish that no critical vulnerability exists.

## Functional coverage

| Component / test | Status | Evidence and limits |
| --- | --- | --- |
| Homepage/hero/About/mission/vision/values | PASS | Original sections retained; browser edit/save/public-render tests cover hero and mission. Other mapped About fields use the same editor path. |
| Programs | PASS | Browser create/edit/upload/reorder/save/render/delete sequence; seed validation. |
| Events | PASS | Browser create/upload/reorder/publish/unpublish/delete; title/description controls exercised. Date/location controls render; their specific published text was not separately asserted. |
| Team | PASS | Browser create/name/position/photo/reorder/delete with public rendering. |
| News, projects and additional page blocks | PASS | Each module's text/image creation, text update, save, public rendering and removal was exercised in the browser. These are plain content blocks on the existing single-page website, not separate page routes or rich blog templates. |
| Gallery | PASS | Browser caption/alt/group/image/reorder/remove-entry flows and public display. Original downloadable files remain available. |
| Contact | PASS | Managed email updates both mailto links; phone/location mappings inspected; title/description form renders. Contact is a client mailto form, not server email delivery. |
| Email delivery | NOT TESTED | Sending an email through a user's mail application was not attempted. No email delivery service exists in the app. |
| Settings/navigation | PASS | Browser metadata edits, saved custom navigation link, preserved Contact YPP/admin links, and mobile selection. Footer/logo controls render and their bindings were inspected. |
| Admin login | PASS | Invalid/valid passwords, show/hide, required browser controls, Enter-to-submit, redirect and authenticated session. |
| Session expiry/restart/logout | PASS | Local short-expiry fixture, cookie invalidation after restart, browser/API logout, encrypted production-session expiration unit tests. |
| Remember Me | PASS | Cookie/session lifetime implementation inspected and session cookies checked; the seven-day real-world duration was not observed over seven days. |
| Users | PASS | Hashed credential persistence, password reset, duplicates/weak password rejection, Admin/Editor authorization, disable/delete/revocation APIs, browser create/name edit. Local users are not Auth0 production users. |
| Media selection/preview/multiple upload/replacement | PASS | Two selected images render previews and produce different stored paths; card image replacement and public display tested. |
| Permanent media file deletion | NOT IMPLEMENTED | Removing a gallery/card entry removes it from the website; original and unreferenced files are deliberately retained for rollback. No repository-file deletion button is advertised. |
| Media search | NOT IMPLEMENTED | No search control exists. Image Library lists referenced images; it is not a searchable inventory of every original/unreferenced repository file. |
| Drafts/Preview/Cancel/Reload | PASS | Drafts stay in memory; a preview tab shows unsaved text safely. Dismissing reload confirmation keeps edits; accepting restores saved content. There is no separate persistent draft store or dedicated Cancel button. |
| Content/image persistence and manual backup restore | PASS | Isolated restart test confirms JSON and uploaded image persistence; backup contents match previous JSON and restoring the backup returns that content. Restore is a documented file operation, not a dashboard Restore button. |
| Concurrent edits / invalid JSON content | PASS | SHA conflict returns 409; invalid fields/unsafe paths/public anonymous writes are rejected; backups precede atomic replacement. |
| XSS / CSRF / path controls | PASS | Browser script-markup preview stays text; server checks Origin/CSRF; unknown source/private routes denied; path validators exercised. This is targeted testing, not exhaustive penetration testing. |
| Files, links, modules, media | PASS | Three HTML documents, project JSON, local asset references, JS syntax, ten CSS parses and 182 original image decodes. Browser section anchors resolve. |
| Edge and Chrome | PASS | Installed desktop versions used in headless mode; responsive viewport checks at 320/390/768/1440px. |
| Literal `npm run dev` startup | PASS | Started in the disposable fixture after making Node available on PATH; homepage, login and `/admin/` returned HTTP 200 through localhost:3000. The owned npm test server was stopped afterward. |
| Safari/Firefox/physical devices/assistive technology | NOT TESTED | Not available for this run. Desktop responsive emulation is not a substitute for these tests. |
| Lighthouse/Core Web Vitals/production latency | NOT TESTED | No field data or Lighthouse score was generated. Local timings are not representative of hosting performance. |
| Automatic accessibility | PASS | Six sampled axe scans have no violations after changes. Incomplete image-background contrast results, screen-reader usability and full WCAG conformance still need human testing. |
| Dependency advisories | PASS | npm audit for the locked production dependency reports zero known advisories at audit time. This does not assess unknown vulnerabilities or certify all vendored assets. |
| Production GitHub/Netlify/Auth0 | NEEDS CONFIGURATION | Adapter/functions/configuration code exists, but no live provider callback, GitHub write, Netlify deployment or production rollback was performed. |
| Git history secret scan | NOT TESTED | This checkout has no `.git` history. Current source scan found no GitHub token or private-key patterns; ignored local state is excluded from builds. |
| Sitemap/canonical public domain | NEEDS CONFIGURATION | No production domain was supplied; no invented domain or invalid relative sitemap was generated. |

## Security boundaries that remain

1. The development server intentionally uses HTTP only on loopback. Its HttpOnly/SameSite=Strict cookie omits Secure there. Production remains Auth0 + HTTPS + Secure cookies; do not expose the local server to the internet.
2. Upload checking verifies structure/dimensions, not a complete image decoder, malware scan or PNG CRC audit. Upload access is limited to authenticated content editors and administrators, with size/pixel limits and safe MIME/CSP handling. Further hardening can re-encode uploads with a maintained image processing library.
3. Production encrypted cookies are stateless. Browser logout clears the current cookie; a copied cookie remains usable until expiry unless the subject is removed or the session key is rotated and redeployed. Per-session central production revocation is not implemented.
4. Local accounts are private salted hashes in `.local-users.json`, not a database and not public website content. Keep that file private and back it up separately if required. Local users do not automatically migrate to Auth0.
5. Drafts are not persisted across browser closure. Uploading a file writes the image immediately; publishing/saving content attaches its path to the website. Deleting an entry does not physically delete the image.
6. The provided Apache fallback rules need a real Apache test if that hosting option is ever used. The recommended production output remains Netlify's `dist` directory, which excludes all local source, credentials and backup state.
7. Retaining every original photograph keeps the repository/build relatively large (243,896,360 bytes of original media). Responsive files reduce displayed-image transfers; they do not shrink the retained original library or its deployment artifact. No unused originals were deleted without permission.

## Files changed

- Public behavior/layout: `index.html`, `assets/css/site.css`, `assets/css/home.css`, `assets/js/site.js`, `content.js`, `cms-render.js`, `image-variants.js`, `responsive-image.js`, `robots.txt`.
- Portal: `admin/login.html`, `admin/index.html`, `admin/css/login.css`, `polish.css`, `admin/js/dashboard.js`, `users.js`; local vendor CSS/fonts and their licenses under `assets/vendor/`.
- Backend/config: `scripts/local-server.mjs`, shared `netlify/functions/lib/image.js`, `lib/content.js`, `github-upload.js`, `scripts/build.mjs`, `package.json`, `netlify.toml`, `.htaccess`.
- Regression coverage: `tests/image.test.mjs`, `persistence.test.mjs`, `local-server.test.mjs`, `security.test.js`.

The content file and original photographs were not rewritten by audit tests. The optimized images are additional files, not replacements of originals.

## Reproduce the supported checks

```powershell
npm ci
npm test
npm run build
npm audit --omit=dev
npm run dev
```

Choose local credentials in the terminal. `npm run dev` uses port 3000 unless `LOCAL_PORT` is set. Open `http://localhost:3000/` or `/admin/login.html`; safe navigation redirects to the canonical `127.0.0.1` host for session consistency. `/admin/` is supported. `Start-Local.ps1` still uses the existing 8888 launcher workflow. `LOCAL_SESSION_SECONDS` optionally shortens local session lifetime for testing and is not used by production Functions.

If `node` or `npm` is not recognized in an existing Windows terminal, reopen VS Code/the terminal after installation or use `Start-Local.ps1`, which resolves the installed runtime without relying on PATH.

Temporary browser tooling and evidence are in ignored `.tools/qa/`: `workflows-results.json`, `supplement-results.json`, `final-smoke-results.json`, `accessibility-results.json`, `static-results.json`, `media.json` and screenshots under `evidence/`. Those files contain fixture-only results and should not be deployed. Browser scripts are local QA helpers, not production dependencies.

Before production: configure the canonical domain/Auth0/GitHub/Netlify settings in README, run staging provider and publishing checks, review token scope, and test deployment rollback. Deployment remains a separate explicitly authorized action.
