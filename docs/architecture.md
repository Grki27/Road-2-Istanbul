# Architecture

## Public Application

The Next.js App Router homepage is rendered dynamically and loads journey data from Supabase on each request. A successful empty response produces real empty states; the production site never substitutes demo journey data.

`src/lib/public-data.ts` maps database rows into the public domain types. Trip statistics are derived from published recaps plus the single `trip_settings` row.

## Map and Route

Leaflet renders the public map. The planned route is loaded from `public/assets/ruta-v2.gpx`. The latest live location is matched to the closest GPX point so the route can be split into completed and remaining segments.

Daily recaps, event pins, and the team location are independent markers. Map popups coordinate with the timeline through browser events so a recap can be located without duplicating page state.

## Data and Storage

- `daily_recaps`, `recap_images`: daily journal content and ordered photos
- `current_locations`: append-only location history
- `map_events`, `map_event_images`: public event pins and photos
- `comments`, `comment_reactions`: moderated recap discussion
- `wall_notes`: moderated text and drawing data for the support board
- `trip_settings`: editable global journey and donation settings

Supabase RLS allows public reads where appropriate. Admin mutations verify the authenticated email server-side. Image uploads use dedicated public Storage buckets with admin-only write policies.

## Moderation

Public comments and sticky-note submissions are validated server-side and reviewed through the OpenAI moderation flow. Administrators retain manual approve, reject, and delete controls.
