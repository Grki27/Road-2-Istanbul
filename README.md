# Sedmo Nebo: Road to Istanbul

Interactive Croatian travel diary for the Dubrovnik to Istanbul bicycle journey.

## Current Phase

Phase 2 is complete and verified. Supabase is connected, the environment variables
are configured, the database schema and storage policies are applied, and admin
magic-link login works for an allowed email.

The public frontend still uses dummy/preview content. Final copy will replace the
placeholder text in a later content pass.

- Next.js, TypeScript, Tailwind CSS
- Warm adventure journal visual system
- Hero using the provided hero image
- GPX route preview from `public/assets/ruta.gpx`
- Stats, latest update empty state, timeline preview
- Wall of Support preview
- Humanitarian section with 0 EUR starting value and donation link placeholder
- Marin and Marko cards
- Partner logos and public partner links
- Social links config
- Supabase client/server helpers
- Working email magic-link admin login
- Admin allow-list handling
- Initial SQL schema, RLS policies, and storage buckets
- Verified access to the protected admin dashboard

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Editable Config

Most temporary values live in `src/config/site.ts`:

- donation URL
- donation goal and raised amount
- social links
- partner links
- admin email allow-list

The donation URL is intentionally empty until the external campaign page exists.

## Supabase

Supabase is connected locally through the root `.env.local` file. The required
variables are documented in `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ALLOWED_ADMIN_EMAILS=sedmonebo27@gmail.com,marko.crepulja007@gmail.com
```

Run the schema in:

```text
supabase/migrations/001_initial_schema.sql
```

More setup notes are in `docs/supabase-setup.md`.

## Phase Progress

- [x] Phase 1: Project setup, visual system, public layout, and preview data
- [x] Phase 2: Supabase schema, auth, storage, and verified admin login
- [ ] Phase 3: Connect the public homepage and map to live Supabase data
- [ ] Phase 4: Build mobile-first admin tools for recaps, GPS, map events, uploads, moderation, and settings
- [ ] Phase 5: Comments, emoji reactions, and Wall of Support
- [ ] Phase 6: Final polish, content replacement, accessibility, SEO, and deployment notes

## Next Step

Wire the existing public experience to Supabase:

- fetch trip settings and calculate live stats
- fetch the latest current location
- render published daily recap pins
- render extra emoji event pins
- replace public empty/preview states with database-backed states

After that, build the mobile admin actions that create and update those records.
