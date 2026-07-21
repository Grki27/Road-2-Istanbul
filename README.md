# Sedmo Nebo: Road to Istanbul

Interactive Croatian travel diary for the Dubrovnik to Istanbul bicycle journey.

## Current Phase

Phase 4 is implemented. Supabase powers the public journey data and the protected,
mobile-first admin can now create and update the content used by the homepage.

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
- Server-side public data loader with graceful preview fallback
- Database-backed trip settings, statistics, donation progress, recaps, and rider fatigue
- Database-backed current location, daily recap pins, and emoji event pins
- Completed/planned GPX route split based on the latest location
- Interactive map controls for the full route, latest location, and latest recap
- Protected mobile admin shell with quick actions and logout
- Daily recap draft, preview, publish, archive, restore, and delete workflow
- Local recap autosave for weak or missing internet connections
- Compressed multi-image uploads with retry and ordering
- Quick GPS updates and editable emoji event pins
- Live trip statistics and donation settings editor

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
- [x] Phase 3: Connect the public homepage and map to live Supabase data
- [x] Phase 4: Build mobile-first admin tools for recaps, GPS, map events, uploads, and settings
- [ ] Phase 5: Comments, emoji reactions, and Wall of Support
- [ ] Phase 6: Final polish, content replacement, accessibility, SEO, and deployment notes

## Phase 3 Data Behavior

The homepage reads:

- `trip_settings`
- published `daily_recaps` and `recap_images`
- the newest `current_locations` row
- `map_events` and `map_event_images`

While all journey tables are empty, one clearly labeled preview recap, location,
and event are shown so the design can be reviewed. As soon as any real journey
record exists, the complete preview set disappears and only database records are
shown.

## Phase 4 Setup

Apply the additional GPS migration in Supabase SQL Editor:

```text
supabase/migrations/002_admin_location_rpc.sql
```

Admin routes are documented in `docs/phase-4-admin.md`.

## Next Step

Phase 5 adds public comments, emoji reactions, Wall of Support, and admin moderation.
