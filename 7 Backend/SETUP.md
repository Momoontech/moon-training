# Backend setup - what's needed to wire this up

Architecture: keep the site as-is (static HTML, no build step) and add Vercel
Serverless Functions under `/api` at the repo root - Vercel deploys these
automatically alongside static files with the "Other" framework preset, no
migration to Next.js required. Auth0's hosted login (Universal Login, redirect
based) needs no server of its own; the API functions just verify the token.

## Accounts to create (free tiers are enough for a 5-person pilot)

1. **Auth0** - tenant + one **Single Page Application** (not "Regular Web
   App" - the site is static HTML with no server, so it's a public client
   using redirect + PKCE, and doesn't need/hold a Client Secret at all).
   - Login method: passwordless email (magic link) is the best fit for
     "log in by email" with a known cohort - no passwords to manage.
   - Allowed Callback/Logout/Web Origin URLs: `https://moon-training.vercel.app`.
   - Need back: Domain, Client ID. (No Client Secret, no separate Auth0 "API"
     resource - the backend verifies the ID token Auth0 already issues to
     the SPA, which keeps the console setup to two fields.)
2. **Supabase** - one project (Postgres + REST API included).
   - Run `schema.sql` in the SQL editor once the project exists.
   - Need back: Project URL, service role key (service role key goes in
     Vercel env vars only, never in client-side code - the anon key isn't
     needed since the browser never talks to Supabase directly, only through
     our `/api` functions).
3. **Vercel** - add as Environment Variables on the existing `moon-training`
   project (Settings -> Environment Variables), never committed to the repo:
   `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Open questions (from CLAUDE.md's Phase 2 roadmap)

- Does a Moon Auth0 tenant already exist, or are we creating a new one for
  this app specifically?
- Confirm Supabase (fastest path) vs. Moon's own infra - and who owns/pays
  for the account long-term, since the plan is to hand this off to
  engineering once it's proven out.

## Handoff note

Everything here is plain Postgres + standard serverless functions - no
vendor lock-in beyond "which company hosts the Postgres instance," so
engineering can point their own backend at this schema (or migrate the data)
without a rewrite.
