# Youth for Peace and Prosperous (YPP)

YPP's public website and content-management system use Next.js App Router, React, TypeScript, Tailwind CSS, native parameterized MySQL queries through `mysql2/promise`, and S3-compatible object storage. There is no ORM. Published content and administrator sessions are stored in MySQL.

## Requirements

- Node.js 22.12 or newer
- npm
- MySQL 8.0 or a compatible managed MySQL service
- An S3-compatible bucket for CMS uploads (Cloudflare R2 is supported)

## Local setup

1. Install the locked dependencies:

   ```powershell
   npm ci
   ```

2. Create the local environment file and enter the connection settings for an existing MySQL database:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. Grant the app user only the permissions the app needs on its database. For local MySQL use `DB_SSL=false`; set `APP_URL` to the exact browser origin (`http://127.0.0.1:3000` by default). For backward compatibility, the server can also read a MySQL `DATABASE_URL` when the `DB_*` values are not configured.

3. Apply the native SQL migrations:

   ```powershell
   npm run db:migrate
   ```

   On an empty database, this applies `database/migrations/001_initial_schema.sql`. If all existing YPP application tables already exist, it records a non-destructive baseline in `native_schema_migrations` rather than recreating tables. A partially populated or mismatched schema stops with an error for manual inspection. Back up the database before any structural operation.

   `database/schema.sql` contains the initial schema for manual inspection or import. `database.sql` contains the same schema plus verified baseline content; import it only into a new, empty database after selecting that database. Neither file contains credentials or creates an administrator account.

4. Insert the verified baseline content:

   ```powershell
   npm run db:seed
   ```

   Seeding is repeatable and preserves existing records. It adds the seven supplied program areas, the verified Executive Director, organization settings, and records for the 168 bundled gallery images. The image files themselves remain under `public/images/gallery` and must be deployed with the site. No unverified projects, partners, impact statistics, news, or testimonials are invented.

5. Create the first super-administrator:

   ```powershell
   npm run admin:create
   ```

   The command prompts for name, email, and password. Use a unique password with at least 12 characters. For automation, temporarily set `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD` in the process environment; remove the password variable immediately after use. Do not commit credentials or add the initial password to Vercel build variables.

6. Run the website:

   ```powershell
   npm run dev
   ```

   Visit `http://127.0.0.1:3000`. Admin sign-in is at `/admin/login`.

## Database and security

- All application SQL uses prepared statements through `mysql2/promise`; table and column identifiers are selected only from server-side allowlists.
- A lazy, per-runtime MySQL pool is shared across warm Vercel function instances and limited to one connection per instance on Vercel. Size the database connection limit for the expected function concurrency.
- Set `DB_SSL=true` for a remote database. TLS certificate verification is enabled; set `DB_SSL_CA` only when your provider requires a custom CA certificate.
- Administrator passwords use Argon2id. Sessions use random HTTP-only, secure-in-production, same-site cookies; only SHA-256 token hashes are persisted.
- Admin routes enforce session authentication, role permissions, request-origin checks, and server-side Zod validation. Authentication and contact forms use database-backed rate limiting.
- Never expose `DB_*`, `DATABASE_URL`, or S3 credentials to client-side code or commit `.env` files.
- The project does not send contact-message email notifications. Administrators review stored messages in the dashboard.

## Object storage

Uploads require an S3-compatible bucket. Configure `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, and `NEXT_PUBLIC_MEDIA_BASE_URL`. For Cloudflare R2, use the account endpoint, region `auto`, path-style access `true`, a bucket-scoped read/write token, and an HTTPS public custom domain for media. The app accepts JPEG, PNG, WebP, and PDF files up to 5 MB, checks file signatures, and assigns server-generated object keys. Uploads remain unavailable until valid storage settings are configured.

## Validation

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Deploy to GitHub and Vercel

1. Initialize or use the intended GitHub repository, inspect the staged files, and verify `.env` is not tracked. Commit and push only after your review; this project does not push or deploy automatically.
2. Import the GitHub repository into Vercel as a Next.js project. Choose Node.js 22.x. The standard build command is `npm run build`; no database migration is run as part of the build.
3. Provision a managed MySQL 8 database reachable from Vercel over TLS. Vercel does not host MySQL itself. Add these Vercel environment variables for the required Preview and Production scopes:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - `DB_SSL=true` (and `DB_SSL_CA` only if required by the database provider)
   - `APP_URL` set to the exact HTTPS origin for each deployment environment
   - S3/R2 variables described above
4. Back up the target MySQL database. For a new empty database, run `npm run db:deploy`, then `npm run db:seed` once. For an existing YPP database, `npm run db:deploy` checks for the complete existing schema and only records a native migration baseline; it does not drop or recreate the app tables. Stop if it reports a partial schema and inspect the backup/schema before proceeding.
5. Create the production administrator once from a secure terminal that has the Production `DB_*` variables. Do not use the build step for migrations, seeding, or password provisioning.
6. Configure `youthpp.org` under Vercel Project → Settings → Domains, then follow Vercel's exact DNS instructions at your domain registrar. Set Production `APP_URL=https://youthpp.org` (or your chosen canonical `www` host) and configure the redirect/canonical domain in Vercel. Verify DNS and HTTPS in the Vercel dashboard.
7. Smoke-test public pages, the contact form, admin login/RBAC, and an S3 upload on the deployed site. Confirm MySQL backups, least-privilege users, TLS, and object-storage access before launch.

Vercel does not provide the remote MySQL server or object-storage bucket. Configure and pay for those services separately. No deployment, GitHub push, or remote database setup is performed by these instructions.

## Verified YPP information

Youth for Peace and Prosperous was established on 5 February 2017 and works in Southwest State of Somalia and Mogadishu. The supplied information identifies Ibrahim Aden Ali as Executive Director and provides `youthforpeace15@gmail.com` and `+252 612 029 321`. Testimonials, partners, achievements, and impact figures are not invented.
