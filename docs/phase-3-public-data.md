# Phase 3: Public Data and Map

## Status

Phase 3 is implemented and verified with typecheck, lint, production build, and
local HTTP smoke tests.

## Public Data Flow

`app/page.tsx` calls `getPublicSiteData()` on every request. The loader reads the
public Supabase tables in parallel and maps database rows to the typed component
models used by the homepage.

The public page currently reads:

- trip settings and donation progress
- published daily recaps and ordered recap images
- the latest current location
- map events and ordered event images

Statistics are calculated from published recaps plus global trip settings.

## Map Behavior

The Leaflet map:

- loads the planned route from `public/assets/ruta.gpx`
- shows the completed route as a lighter dashed line
- shows the remaining route as a solid orange line
- uses the latest current location to split completed and remaining route
- shows the team photo as the current location marker
- shows daily recaps as numbered red pins
- shows extra events as emoji pins
- supports full-route, latest-location, and latest-recap controls
- can be focused from a daily timeline card

If the GPX file fails, the OpenStreetMap base remains usable and a Croatian error
message is shown over the map.

## Preview Fallback

When `daily_recaps`, `current_locations`, and `map_events` are all empty, the site
shows a small preview dataset. It is labeled `Preview podaci`.

The preview is all-or-nothing. Once any real journey record exists, every preview
map marker and recap disappears so preview content cannot be confused with live
trip data.

## Phase 4 Contract

The admin forms should write directly to the tables already consumed by this
public data layer. A successful admin save will therefore appear on the public
homepage on the next request without additional frontend changes.
