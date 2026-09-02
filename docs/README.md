# CertGen Documentation

Documentation for the GDG PUP Certificate Generator (`cert.gdgpup.org`).

**Status:** Operate - see [state.md](state.md) for live ops, env vars, admin UI, and handover.

## Start here

| Document | Description |
|----------|-------------|
| [**Operational state**](state.md) | Milestone, live URL, env vars, `cert_config`, admin UI, SQL order, ownership handover |
| [README (repo)](../README.md) | Project overview and local getting started |

## Product & Design

| Document | Description |
|----------|-------------|
| [PRD](prd.md) | Product requirements - users, goals, user stories, acceptance criteria |
| [SDD](sdd.md) | Software design - architecture, API, services, data model, deployment |
| [Design](design.md) | UI and certificate design system - colors, typography, templates |
| [QA](qa.md) | Manual test cases, release checklist, new-event launch QA |

## API

| Document | Description |
|----------|-------------|
| [API: generate-cert](api/generate-cert.md) | Request/response contract for certificate generation |

## Database (SQL)

SQL scripts live under [`sql/`](sql/README.md):

| Folder | Purpose |
|--------|---------|
| [`sql/migrations/`](sql/migrations/) | DDL - create and alter tables (`SURVEY_MIGRATION`, `ADD_CERT_CONFIG`) |
| [`sql/seeds/`](sql/seeds/) | Seed data for events and surveys (`DYNAMIC_SEED` for `cert_config`) |
| [`sql/schema/`](sql/schema/) | Full database schema snapshots (**stale / non-authoritative** for CertGen) |

**Quick start:** Run migrations first (including `ADD_CERT_CONFIG.sql`), then seeds. See [sql/README.md](sql/README.md).

## Agent & Contributor Guides

| Document | Description |
|----------|-------------|
| [AGENTS.md](../AGENTS.md) | Conventions for AI agents and developers working on this repo |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | PR checklist, local setup, new-event workflow |
| [`.cursor/rules/`](../.cursor/rules/) | Cursor agent rules (auto-loaded by file scope) |

## Related Repo Files

| Path | Purpose |
|------|---------|
| [`test/README.md`](../test/README.md) | Local test scripts |

## Known stale areas

Prefer [state.md](state.md) and code when unsure. Remaining drift to watch:

- [`sql/schema/full-schema.sql`](sql/schema/full-schema.sql) may lag the live Supabase project and does not define CertGen `cert_config`.
- Older narrative in product docs may still mention May 2026 event catalogs; treat live Supabase + Admin UI as authoritative for which events are active.
