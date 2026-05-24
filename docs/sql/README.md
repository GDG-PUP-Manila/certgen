# SQL Scripts

Database scripts for CertGen on Supabase (PostgreSQL).

## Folder Structure

```
docs/sql/
├── migrations/     # Schema DDL — run once per environment
├── seeds/          # Event/survey seed data — run after migrations
└── schema/         # Full schema snapshots (reference only)
```

## Recommended Order

1. **Ensure `event` table exists** — part of the broader GDG PUP platform schema. See `schema/full-schema.sql` for context.
2. **Run migrations** — `migrations/SURVEY_MIGRATION.sql` is the canonical migration for CertGen survey tables.
3. **Run seeds** — insert survey rows for each event you need active.

## Migrations

| File | Description |
|------|-------------|
| [`SURVEY_MIGRATION.sql`](migrations/SURVEY_MIGRATION.sql) | **Primary.** Creates `survey` and `survey_response` tables with RLS policies |
| [`SURVEY_TABLE.sql`](migrations/SURVEY_TABLE.sql) | Legacy alternate — `survey_response` only, no `survey` table |

> Prefer `SURVEY_MIGRATION.sql` for new setups. Application code expects both `survey` and `survey_response` with a `survey_id` column.

## Seeds

| File | Event | Slug |
|------|-------|------|
| [`SURVEY_SEED.sql`](seeds/SURVEY_SEED.sql) | COSMOS 2026 | `cosmos-2026` |
| [`BWAI_D1_SEED.sql`](seeds/BWAI_D1_SEED.sql) | Build with AI Day 1 | `bwai2026-day1` |

Before running seeds:

- Confirm `event_id` UUIDs match your `event` table (see [`data/event.json`](../../data/event.json)).
- Update `attendance_code` and `close_time` as needed.

Additional survey schemas are maintained in [`data/survey.json`](../../data/survey.json) for reference (e.g. `pm-workshop`).

## Schema Snapshots

| File | Description |
|------|-------------|
| [`full-schema.sql`](schema/full-schema.sql) | Full GDG PUP platform schema snapshot (reference). Copied from `supabase/schema/schema.sql`. |

Use snapshots for context — do not run the full file against production unless you know what you are doing.

## Environment

CertGen uses these Supabase env vars (server-side):

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Run all SQL in the **Supabase SQL Editor** or via the Supabase CLI.
