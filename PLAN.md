# JadeWeb — Project Context & Plan

## What this is
Remote, read-only admin dashboard for JadeClinic POS & Inventory
(a LAN/local system). Web part only. Admins view reports remotely.
The web app NEVER writes to Supabase or to the local system.

## Architecture — core rule
```
  Local JadeClinic POS (LAN)  →  sole WRITER to Supabase
       ├── sync script + endpoint → tables (sales/inventory/...) → Postgres
       └── sync script + endpoint → images (avatar/product/company) → Storage
       ▼
  Supabase (Postgres + Storage)  →  single source the dashboard reads
       ▼
  JadeWeb remote dashboard (auth-protected)  →  READ-ONLY
```

The dashboard only reads. All inserts come from the LAN system.
No write endpoints, no write controllers, no admin edits that
write data. Any future write must be reviewed against this rule.

## Stack
- Laravel (Breeze — React + Inertia), session auth
- Supabase PostgreSQL (pgsql, pooler, SSL)
- Supabase Storage (S3) for images synced by the LAN
- pnpm, vite

## Repo / Tooling
- Git branch main (global default set)
- Remote: private GitHub repo `jadeweb` (via gh) — not yet created
- .env gitignored (holds Supabase DB password + S3 keys)

## Auth
- Dashboard admin login: TBD — Breeze auth table was dropped.
  To be rebuilt later against the synced `users` table.
- No public registration

## Database (Supabase, public schema)
Applied from docs/supabase_schema.sql (raw SQL in Supabase SQL Editor).
- users (synced staff: local_id, username, full_name, user_role, photo_url ...)
- suppliers, products, sales, sale_items, inventory_logs, audit_logs,
  company_settings, sync_log
- Breeze's original `users` table dropped via
  database/migrations/2026_08_01_024553_remove_breeze_users_table.php
  (guarded: only drops the Breeze variant that has a `password` column)
- Remaining Laravel tables: cache, cache_locks, jobs, job_batches,
  failed_jobs, password_reset_tokens, sessions
- CAUTION: never run `php artisan migrate:fresh` — it would wipe the
  synced reporting tables (they're not owned by Laravel migrations)
- LAN sync writes to `users` (no table rename needed)

## Storage — bucket "Jade_Web_Bucket" (public)
- Purpose: LAN sync uploads images here; dashboard displays them
- images/avatar | images/product | images/company
- Web reads/renders only (Storage::disk('s3')->url)
- Bucket public so `<img>` tags work without signed URLs

## Known fixes applied during setup
- @vitejs/plugin-react bumped to ^6.x (vite 8 peer compat)
- Removed dead `import './bootstrap'` from resources/js/app.jsx
- Dropped Breeze `users` table (conflicted with synced staff `users`)

## Build order
1. Finish git + create private remote
2. Reporting schema applied (docs/supabase_schema.sql — DONE)
3. Dashboard shell + admin login (rebuild around synced `users`)
4. First read-only report pages
5. Display synced images (product/company/avatar)

## Open Questions
- Which reports matter first? (sales summary, inventory levels, ...)
- Does the sync endpoint live in this Laravel app or separately?
- How should admin login work against the synced `users` table?
  (it has no password column — decide: add one, separate admins
  table, or external auth)
