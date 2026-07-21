# Phase 4: Mobile Admin

## Status

Phase 4 implements the protected admin workflows that write directly to the data
already consumed by the public homepage and map.

Before using the GPS form, apply:

```text
supabase/migrations/002_admin_location_rpc.sql
```

## Routes

- `/admin` - dashboard and quick actions
- `/admin/recaps` - all draft, published, and archived recaps
- `/admin/recaps/new` - new local-first recap draft
- `/admin/recaps/[id]/edit` - edit, preview, upload, and publish
- `/admin/location` - quick GPS update with optional country update
- `/admin/map-events` - all emoji event pins
- `/admin/map-events/new` - new event pin
- `/admin/map-events/[id]/edit` - edit pin and images
- `/admin/settings` - trip statistics and donation settings

Every protected page and server action verifies the active Supabase user against
`ALLOWED_ADMIN_EMAILS`. Database and Storage RLS remain the final authorization
layer.

## Recap Workflow

1. Enter day, date, and title.
2. Save the draft to create its database ID.
3. Upload up to 10 images. Originals can be up to 20 MB; the browser compresses
   them to WebP, at most 2000 px and approximately 82% quality.
4. Complete the route, coordinates, distance, story, highlight, problem, and
   fatigue fields.
5. Open the full-screen preview and publish.

Text changes are debounced into `localStorage`. If the page is reopened after a
network failure, the form offers to restore the local draft. Upload failures are
tracked per image and can be retried without clearing form content.

Recaps archive first. Permanent deletion is only available for archived recaps
and removes their Storage objects before deleting the database row.

## GPS and Map Events

The GPS form supports browser geolocation and manual coordinates. The migration
RPC saves a location and optional `trip_settings.current_country` update in one
database transaction.

Event pins are public immediately after save. They support edit, permanent delete,
browser GPS, manual coordinates, and up to five compressed images.

## Deferred to Phase 5

Dashboard counts for pending comments and Wall notes are visible, but moderation
actions remain intentionally disabled until Phase 5.
