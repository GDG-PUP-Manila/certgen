# CertGen - Operational State

**Milestone:** Operate  
**Live URL:** https://cert.gdgpup.org  
**Owner:** GDG PUP Technology (incoming CTO)  
**Handover:** Outgoing CTO Carlos Jerico Dela Torre, 2026-09-02  

This document describes how CertGen runs in production today. Prefer it over older product docs when they conflict; then patch those docs.

---

## What is live

- Attendees open the landing page, complete a survey at `/survey/{slug}`, and download a PDF certificate via `POST /api/generate-cert`.
- Organizers use the **Admin UI** at `/admin` (password-gated) to create events, edit surveys, tune certificate layout, and review responses.
- Events and surveys are loaded from **Supabase**, not from `data/*.json` (that path no longer exists in the repo).

---

## Environment variables

Set these in local `.env` and in the Vercel project:

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side only; bypasses RLS |
| `ADMIN_PASSWORD` | Yes (prod) | Admin login; cookie session is SHA-256 of this value. Defaults to `admin` if unset (dev only). |

Code reads Supabase vars via `import.meta.env` in `src/lib/supabase.ts`. Admin auth uses `process.env.ADMIN_PASSWORD` in `src/lib/auth.ts` and `src/pages/api/admin/login.ts`.

---

## `cert_config` model

Certificate layout is stored on `survey.cert_config` (JSONB), not as slug `if` branches in code.

Typical shape:

```json
{
  "template_url": "/templates/base-template-optimized.jpg",
  "text_top_offset": "290px",
  "text_color": "#1e293b",
  "text_font_size": "50px"
}
```

| Key | Fallback in workflow |
|-----|----------------------|
| `template_url` (or legacy `templateFilename`) | `base-template-optimized.jpg` |
| `text_top_offset` | `290px` |
| `text_color` | `#1e293b` |
| `text_font_size` | `50px` |

Resolved in `src/services/certificateWorkflow.service.ts`. Tune via Admin Visual Designer at `/admin/events/{event_id}/survey`.

DDL: `docs/sql/migrations/ADD_CERT_CONFIG.sql`. Seed examples: `docs/sql/seeds/DYNAMIC_SEED.sql`.

---

## Admin UI

| Route | Purpose |
|-------|---------|
| `/admin/login` | Password login (`ADMIN_PASSWORD`) |
| `/admin` | Event list |
| `/admin/events/new` | Create event + survey |
| `/admin/events/{id}/survey` | Survey schema + certificate Visual Designer |
| `/admin/events/{id}/responses` | Response list / management |

Admin APIs under `src/pages/api/admin/` (login, logout, save-survey, upload-template, delete-response). Some admin handlers call `supabaseAdmin` directly rather than only through repositories; that is current reality.

---

## Data sources

| Concern | Source |
|---------|--------|
| Landing event cards | Supabase `event` via `getAllEvents()` |
| Survey routing | Supabase `survey.slug` → `/survey/{slug}` |
| Certificate layout | `survey.cert_config` |
| Templates on disk / storage | `public/templates/` and/or Supabase Storage uploads from admin |

Do not reintroduce `data/event.json` or `data/survey.json`.

---

## SQL apply order (CertGen)

1. Ensure platform `event` (and related) tables exist in the shared Supabase project.
2. `docs/sql/migrations/SURVEY_MIGRATION.sql` - `survey` + `survey_response`.
3. `docs/sql/migrations/ADD_CERT_CONFIG.sql` - adds `survey.cert_config`.
4. Optional seeds: `SURVEY_SEED.sql`, `BWAI_D1_SEED.sql`, then `DYNAMIC_SEED.sql` to backfill `cert_config`.

`docs/sql/schema/full-schema.sql` is a **stale / non-authoritative** platform snapshot. Do not treat it as the CertGen source of truth.

Details: [sql/README.md](sql/README.md).

---

## Ops notes

- Production origin guard on generate-cert expects `Origin` to include `"gdg"`.
- In-memory rate limiting in `generate-cert.ts` remains commented out.
- Prefer Admin UI for new events; SQL seeds are for bootstrap or bulk backfill.

---

## Related docs

- [Docs index](README.md)
- [AGENTS.md](../AGENTS.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [PRD](prd.md) · [SDD](sdd.md) · [QA](qa.md) · [Design](design.md)
