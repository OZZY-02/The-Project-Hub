# The Project Hub

The Project Hub is a single-package Next.js app for profile creation, portfolio generation, matching, and bilingual community discovery. The app uses Supabase for auth and profile data, plus a few server routes for portfolio rendering, AI-assisted editing, and resume thumbnailing.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

`npm run lint` currently reports pre-existing issues in untouched parts of the app, so use it as a broad code-health signal rather than a strict gate. `npm run test` covers the environment and request-security helpers.

## Local Setup

1. Install dependencies with `npm install`.
2. Create `.env.local`.
3. Add the required client env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

4. Add the optional server env vars when you need the related features:

```bash
OPENAI_API_KEY="your-openai-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

5. Restart the dev server whenever environment variables change.

The app no longer falls back to embedded Supabase credentials. Missing Supabase env vars fail with an explicit setup error so local and production behavior stay aligned.

### Founder mode (temporary)

`NEXT_PUBLIC_FOUNDER_MODE=true` disables the client auth guard so the app can be demoed without signing in. It is ignored in production builds, and **should be deleted from the code and from `.env.local` before launch** — see the comment in `src/components/AuthGuard.tsx`.

## Supabase Setup

The app expects an existing `public.profiles` table tied to Supabase auth users. Apply the SQL scripts in `scripts/` **in this order**:

1. `scripts/add_username_column.sql`
2. `scripts/add_location_columns.sql`
3. `scripts/add_avatar_column.sql`
4. `scripts/add_profile_columns.sql`
5. `scripts/create_profile_intakes.sql`
6. `scripts/update_profile_intakes.sql` — adds `updated_at` and the unique `user_id` constraint the profile builder upserts against
7. `scripts/create_match_tables.sql` — `match_projects`, `match_saves`, and the `match-projects` storage bucket
8. `scripts/create_avatars_bucket.sql` — public `avatars` storage bucket

Steps 6–8 are new. Without them the matching hub silently keeps everything in the browser's localStorage, and completing the profile builder saves no skills or projects.

Important columns used by the UI include:

- `profiles.username`
- `profiles.first_name`
- `profiles.last_name`
- `profiles.location_country`
- `profiles.location_city`
- `profiles.major_field`
- `profiles.passion_sector`
- `profiles.is_mentor`
- `profiles.bio`
- `profiles.avatar_url` — public Storage URL (preferred)
- `profiles.avatar_data_url` — base64 fallback, only written when a Storage upload fails

`profile_intakes` stores one row per maker: the skills and projects captured by `/profile/create`, plus optional resume metadata. `/profile/[id]` reads it back to render the public profile. Shapes vary between builders, so always read it through `src/lib/intake.ts` rather than indexing the raw JSON.

## Images

Avatars and project images upload to Supabase Storage via `src/lib/storage.ts` and only the public URL is stored in Postgres. If the bucket or its policies are missing, uploads fall back to inlining a base64 data URL so nothing is lost — check the browser console for a warning if images look unexpectedly large.

## Route Intent

- Public: `/`, `/auth/*`, `/mentorship`, `/profile/[id]`
- Protected in the client: `/matching/*`, `/profile/settings`

`/mentorship` is deliberately public — the homepage markets it to logged-out visitors.

Auth is enforced in the browser via the Supabase client, not through a full server-side auth integration. A full SSR auth migration is still the right next step if you need stronger guarantees.

### Prototype routes

`/profile/mock-id-123` and `/profile/mock-id-123/portfolio` are a **scratch prototype** of the AI portfolio builder, kept aside for reference. They are not linked from anywhere and are not part of the live flow, which is `/profile/create` → `/profile/[id]`. Do not build on them without deciding first whether the portfolio should live at `/profile/[id]/portfolio`.

## Internationalisation

Every user-facing string goes through `t("key", "English fallback")` from `src/lib/i18n.tsx`, with translations in `locales/en.json` and `locales/ar.json`. Both files carry the same key set — if you add a string, add both. The fallback is what renders before translations load, so keep it accurate.

To list the keys referenced in code when checking coverage:

```bash
grep -rhoE 't\(\s*"[a-zA-Z_.]+"' src --include=*.tsx | sort -u
```

## API Notes

- `/api/portfolio/render` uses Puppeteer and escapes injected HTML content before rendering.
- `/api/portfolio/ai-edit` requires Supabase public env vars and an auth bearer token. AI editing also requires `OPENAI_API_KEY`.
- `/api/resume/thumbnail` only allows remote `http` and `https` URLs and blocks localhost/private-network targets to reduce SSRF risk.
- `/api/locations` reads from `src/data/countries.json`.

The PDF/image routes depend on `puppeteer`, `canvas`, and `pdfjs-dist`, which are the most environment-sensitive parts of the stack.

Note that `/api/portfolio/render` launches full `puppeteer` (bundled Chromium) while `@sparticuz/chromium-min` and `puppeteer-core` are installed but unused — that route is likely to fail on serverless hosts until it is switched over.
