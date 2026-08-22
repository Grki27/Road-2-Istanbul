# Deployment

## Vercel

The production site is deployed from the GitHub `main` branch. Configure these variables in Vercel Project Settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ALLOWED_ADMIN_EMAILS`

Use the same Supabase project locally and in production only when production data changes are intentional.

## Release Flow

1. Pull the latest `main` branch.
2. Make and review changes locally.
3. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
4. Commit and push to `main`.
5. Wait for the Vercel deployment to become Ready.
6. Smoke-test `https://sedmonebo.com` and `/admin/login` on desktop and mobile.

Content changes made through the admin do not require a Git push or Vercel deployment.

## Domain and SEO

The canonical production domain is `https://sedmonebo.com`. The application publishes `/robots.txt` and `/sitemap.xml`. Submit the sitemap through Google Search Console after DNS ownership verification.

## Rollback

Code deployments can be rolled back from Vercel or by reverting the Git commit. Database and Storage changes are separate from Git, so export important production data before destructive maintenance.
