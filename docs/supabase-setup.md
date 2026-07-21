# Supabase Setup

## Project Status

Supabase setup is complete for local development:

- project credentials are configured in the root `.env.local`
- the initial SQL migration has been applied
- database tables, RLS policies, and storage buckets are available
- email magic-link authentication works
- an allowed admin can open the protected `/admin` dashboard

This document remains the setup checklist for new environments and production.

## 1. Create Project

Create a Supabase project and copy:

- Project URL
- anon public key
- service role key

Add them to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ALLOWED_ADMIN_EMAILS=sedmonebo27@gmail.com,marko.crepulja007@gmail.com
```

Restart `npm run dev` after changing env variables.

## 2. Apply Schema

In Supabase SQL Editor, run the contents of:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_admin_location_rpc.sql
```

Run migrations in numerical order. Migration `002` adds the protected atomic GPS
update used by the Phase 4 mobile admin.

Or use the Supabase CLI later:

```bash
supabase db push
```

## 3. Auth

Enable email magic-link auth in Supabase Auth settings.

Add this redirect URL locally:

```text
http://localhost:3000/auth/callback
```

For deployment, also add:

```text
https://YOUR_DOMAIN/auth/callback
```

Admin access is allowed only for emails in `ALLOWED_ADMIN_EMAILS`.

## 4. Storage Buckets

The migration creates these public-read buckets:

- `recap-images`
- `map-event-images`
- `wall-drawings`
- `site-assets`

Only admins can upload, update, or delete objects through RLS policies.
