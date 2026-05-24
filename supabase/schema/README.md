# Schema Snapshot

The full platform schema snapshot lives in [`docs/sql/schema/full-schema.sql`](../../docs/sql/schema/full-schema.sql).

Keep this folder in sync when exporting from Supabase:

```bash
# Example: copy after updating schema.sql here
cp supabase/schema/schema.sql docs/sql/schema/full-schema.sql
```

See [docs/sql/README.md](../../docs/sql/README.md) for migrations and seeds.
