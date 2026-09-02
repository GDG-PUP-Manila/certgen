# SQL Scripts

Database scripts for CertGen on Supabase (PostgreSQL).

## Folder Structure

```
docs/sql/
├── migrations/     # Schema DDL - run once per environment
├── seeds/          # Event/survey seed data - run after migrations
└── schema/         # Full schema snapshots (reference only; stale for CertGen)
```

## Recommended Order

1. **Ensure `event` table exists** - part of the broader GDG PUP platform schema. `schema/full-schema.sql` is a historical snapshot only; confirm against the live project.
2. **Run CertGen migrations (in order):**
   1. `migrations/SURVEY_MIGRATION.sql` - creates `survey` and `survey_response`
   2. `migrations/ADD_CERT_CONFIG.sql` - adds `survey.cert_config` JSONB
3. **Run seeds** - insert or update survey rows; use `DYNAMIC_SEED.sql` to backfill `cert_config` on existing surveys.

Live ops notes: [docs/state.md](../state.md).

## Migrations

| File | Description |
|------|-------------|
| [`SURVEY_MIGRATION.sql`](migrations/SURVEY_MIGRATION.sql) | **Primary.** Creates `survey` and `survey_response` tables with RLS policies |
| [`ADD_CERT_CONFIG.sql`](migrations/ADD_CERT_CONFIG.sql) | **Required after survey table exists.** Adds `cert_config JSONB` for Admin Visual Designer / workflow |
| [`SURVEY_TABLE.sql`](migrations/SURVEY_TABLE.sql) | Legacy alternate - `survey_response` only, no `survey` table |

> Prefer `SURVEY_MIGRATION.sql` then `ADD_CERT_CONFIG.sql` for new setups. Application code expects both `survey` and `survey_response` with a `survey_id` column, plus `cert_config` for dynamic templates.

## Seeds

| File | Purpose |
|------|---------|
| [`SURVEY_SEED.sql`](seeds/SURVEY_SEED.sql) | COSMOS 2026 (`cosmos-2026`) |
| [`BWAI_D1_SEED.sql`](seeds/BWAI_D1_SEED.sql) | Build with AI Day 1 (`bwai2026-day1`) |
| [`DYNAMIC_SEED.sql`](seeds/DYNAMIC_SEED.sql) | Backfills `cert_config` for known slugs (cosmos, bwai day1/day2, pm-workshop) |

Before running seeds:

- Confirm `event_id` UUIDs match your live `event` table (Admin UI or Supabase).
- Update `attendance_code` and `close_time` as needed.

Prefer creating new events via the **Admin UI** (`/admin/events/new`) so `questions_schema` and `cert_config` are written together. Seeds remain useful for bootstrap and bulk backfill.

## Schema Snapshots

| File | Description |
|------|-------------|
| [`full-schema.sql`](schema/full-schema.sql) | **Stale / non-authoritative for CertGen.** Historical GDG PUP platform schema snapshot (copied from `supabase/schema/`). Does not define CertGen `cert_config` as the live source of truth. |

Use snapshots for rough platform context only. Do **not** run the full file against production, and do not treat it as the CertGen migration path.

## Environment

CertGen uses these env vars (server-side):

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
ADMIN_PASSWORD="your-admin-password"
```

Run all SQL in the **Supabase SQL Editor** or via the Supabase CLI.
