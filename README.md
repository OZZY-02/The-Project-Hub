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

`npm run lint` currently reports pre-existing issues in untouched parts of the app, so use it as a broad code-health signal rather than a strict gate. `npm run test` covers the new environment and request-security helpers.

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

The app no longer falls back to embedded Supabase credentials. Missing Supabase env vars now fail with an explicit setup error so local and production behavior stay aligned.

## Supabase Setup

The app expects an existing `public.profiles` table tied to Supabase auth users. Then apply the SQL scripts in `scripts/` to bring the schema up to date:

1. `scripts/add_username_column.sql`
2. `scripts/add_location_columns.sql`
3. `scripts/add_avatar_column.sql`
4. `scripts/add_profile_columns.sql`
5. `scripts/create_profile_intakes.sql`

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
- `profiles.avatar_data_url`

`profile_intakes` stores intake JSON plus optional resume metadata. The SQL file includes example RLS guidance, but you still need to enable and tailor your policies in Supabase for your project.

If you want a public `avatars` storage bucket, run:

```bash
SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/create_avatar_bucket.js
```

## Route Intent

Current route behavior is:

- Public routes: `/`, `/auth/*`, `/profile/[id]`, `/profile/[id]/portfolio`
- Protected in the client: `/matching/*`, `/profile/settings`

Auth is still enforced in the browser via the Supabase client, not through a full server-side auth integration. That means protected-page redirects are clearer now, but a full SSR auth migration would still be the right next step if you need stronger guarantees.

## API Notes

- `/api/portfolio/render` uses Puppeteer and now escapes injected HTML content before rendering.
- `/api/portfolio/ai-edit` requires Supabase public env vars and an auth bearer token. AI editing also requires `OPENAI_API_KEY`.
- `/api/resume/thumbnail` only allows remote `http` and `https` URLs and blocks localhost/private-network targets to reduce SSRF risk.
- `/api/locations` reads from `src/data/countries.json`.

The PDF/image routes depend on `puppeteer`, `canvas`, and `pdfjs-dist`, which are the most environment-sensitive parts of the stack.
