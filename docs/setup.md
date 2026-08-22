# Project Setup

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project
- An OpenAI API key for public-content moderation

## Environment

Copy `.env.example` to `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ALLOWED_ADMIN_EMAILS=first@example.com,second@example.com
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Do not prefix it with `NEXT_PUBLIC_`, expose it to browser code, or commit it.

## Database

Run these files in Supabase SQL Editor in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_admin_location_rpc.sql`
3. `supabase/migrations/003_phase_5_comments_wall.sql`
4. `supabase/migrations/004_comment_reactions.sql`

The migrations create the public tables, RLS policies, helper functions, and Storage buckets used by the application.

## Admin Users

Add each email to `ALLOWED_ADMIN_EMAILS`, then create or update the corresponding Supabase Auth user with the existing script. Set the one-time variables only in the current shell:

```powershell
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="use-a-strong-password"
npm run admin:set-password
Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

Repeat for each administrator. Passwords must never be written to tracked files.

## Run and Verify

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```
