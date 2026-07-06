# Sedmo Nebo: Road to Istanbul

Interactive Croatian travel diary for the Dubrovnik to Istanbul bicycle journey.

## Current Phase

Phase 1 is implemented as a polished public frontend with dummy/preview data:

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

## Next Phases

Phase 2 should add Supabase schema/auth/storage and environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Phase 3 should replace the static GPX preview with Leaflet + OpenStreetMap and live pins.
