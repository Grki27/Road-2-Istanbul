# Admin Guide

The protected admin is available at `/admin/login`. Only emails listed in `ALLOWED_ADMIN_EMAILS` can sign in.

## Daily Workflow

1. Open the admin dashboard on a phone.
2. Add a GPS location, daily recap, or event pin.
3. Use browser GPS or select coordinates directly on the map.
4. Compress and upload photos from the recap or pin editor.
5. Save incomplete recaps as drafts and publish only when ready.
6. Update donation progress and trip statistics under Settings.

Publishing a recap or event pin also updates the public journey position using the established location-offset behavior. Public pages read directly from Supabase, so saved changes appear without a code deployment.

## Content Management

- Recaps support draft, published, and archived states.
- Archived recaps can be restored or permanently deleted after confirmation.
- Event pins can be edited or permanently deleted.
- Comments and sticky notes can be reviewed or removed from their moderation pages.
- Failed photo uploads can be retried without losing form text.

## Weak Connection Safety

Recap forms save a local browser draft. If the connection drops, reopen the form on the same device and restore the offered local draft before continuing.
