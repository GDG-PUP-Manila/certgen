# AGENTS.md - CertGen Agent Guide

Guidance for AI agents and contributors working on **GDG PUP CertGen** (`cert.gdgpup.org`).

**Ops / handover:** [docs/state.md](docs/state.md) (Operate milestone). Owner: GDG PUP Technology (incoming CTO). Handover from outgoing CTO Carlos Jerico Dela Torre, 2026-09-02.

## Project Summary

CertGen is a serverless Astro app that lets event attendees complete a post-event survey and instantly download a personalized PDF certificate. No user authentication is required for attendees. Organizers use a password-gated Admin UI.

**Stack:** Astro 6 (SSR) · React 19 · Tailwind 4 · Supabase · Satori · Resvg · PDFKit · Vercel serverless Node

## Architecture Rules

```
pages/api/generate-cert.ts   →  certificateWorkflow.service.ts
                                      ├── repositories/*  (Supabase)
                                      ├── cert-generator.tsx  (Satori → PNG overlay)
                                      └── pdf.service.ts  (PDFKit → PDF)
```

- **API routes** validate and delegate - keep business logic in `src/services/`.
- **Repositories** are the preferred layer that talks to Supabase for attendee flows.
- **Do not** call Supabase from React components directly.
- Astro pages should use repositories (landing, survey, admin pages already do).
- **Admin API exception:** some handlers under `src/pages/api/admin/` call `supabaseAdmin` directly (e.g. event update in `save-survey.ts`, storage in `upload-template.ts`). Prefer repositories for new work; do not "fix" existing admin direct calls unless asked.
- **Do not** bundle `@resvg/resvg-js` - it must stay a Vite SSR external (`astro.config.mjs`).

## Key Files

| Path | Purpose |
|------|---------|
| `src/services/certificateWorkflow.service.ts` | End-to-end cert workflow; reads `survey.cert_config` |
| `src/services/cert-generator.tsx` | Satori text overlay → transparent PNG |
| `src/services/pdf.service.ts` | Background JPG + overlay → PDF |
| `src/components/SurveyForm.tsx` | Multi-step schema-driven form engine |
| `src/pages/survey/[slug].astro` | Dynamic survey page |
| `src/pages/admin/**` | Admin UI (events, Visual Designer, responses) |
| `src/lib/auth.ts` | Admin session token from `ADMIN_PASSWORD` |
| `public/templates/` | Optimized JPG certificate backgrounds |
| `public/fonts/GoogleSans-Bold.ttf` | Certificate name font (Satori) |
| `docs/sql/migrations/SURVEY_MIGRATION.sql` | Canonical DB migration for survey tables |
| `docs/sql/migrations/ADD_CERT_CONFIG.sql` | Adds `survey.cert_config` JSONB |

## Adding a New Event / Survey

1. Export certificate background from Canva → PNG.
2. Optimize template: PNG → JPEG (~quality 90, MozJPEG) → save as `public/templates/{slug}-optimized.jpg`.
3. Create and configure the event via the Admin Panel UI at `/admin/events/new`.
4. Upload and configure the certificate parameters (template URL, alignment offset, text color) inside the Visual Designer at `/admin/events/{event_id}/survey` (persists `cert_config`).
5. Tune alignment with `npm run test:pdf` → inspect `test/output/test-output.pdf`.

Do **not** add slug `if` branches in `certificateWorkflow.service.ts`.

### Template optimization (Sharp)

```bash
node -e "const sharp=require('sharp'); sharp('public/templates/my-cert.png').jpeg({ quality: 90, mozjpeg: true }).toFile('public/templates/my-event-optimized.jpg').then(console.log);"
```

## SurveyForm Conventions

Schema-driven steps from `questions_schema.steps`. Hardcoded step IDs:

- `CONSENT` · `STATUS` · `PERSONAL_INFO_PUPIAN` · `PERSONAL_INFO_NON_PUPIAN` · `EVALUATION` · `GCP_CREDITS` (optional) · `VERIFICATION` · `SUCCESS`

- PUPian branch: first option in `STATUS` step.
- Email is always required (injected if missing from schema).
- Errors: `window.dispatchEvent(new CustomEvent("show-toast", { detail: message }))`.
- Form state lives in React - resubmit on failure is safe.

## Certificate Generation

- Satori canvas: **1000 × 707** (A4 landscape ratio).
- Resvg output: **3000px** wide, transparent background.
- PDFKit page: A4 landscape (**841.89 × 595.28 pt**).
- Only the **participant name** is rendered dynamically; everything else is baked into the JPG template.

Certificate properties (template, text offset, color, font size) are resolved from the `cert_config` JSONB column of the `survey` table. Fallbacks if empty:

| Parameter | Database Key | Default |
|-----------|--------------|---------|
| Template Image | `template_url` (or `templateFilename`) | `base-template-optimized.jpg` |
| Vertical Offset | `text_top_offset` | `290px` |
| Text Color | `text_color` | `#1e293b` |
| Font Size | `text_font_size` | `50px` |

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side only; bypasses RLS |
| `ADMIN_PASSWORD` | Yes (prod) | Admin UI login; defaults to `admin` if unset |

## Security Notes

- Origin check in production: `Origin` header must include `"gdg"`.
- Rate limiting exists in `generate-cert.ts` but is **commented out** (in-memory, per-instance).
- Names truncated to 40 characters before rendering.
- Attendance code validated client-side and server-side.
- Admin session cookie `admin_session` = SHA-256 hex of `ADMIN_PASSWORD`.

## Testing

```bash
npm run dev                          # local dev at :4321
npm run test:pdf                     # generate test/output/test-output.pdf
node test/stress-test.mjs            # load test (hits production)
```

Full QA checklists: [docs/qa.md](docs/qa.md).

## Code Style

- TypeScript strict mode; match existing patterns in surrounding files.
- Minimal diffs - do not refactor unrelated code.
- No new abstractions for one-off helpers.
- Comments only for non-obvious business logic.
- Do not commit `.env`, credentials, or unoptimized multi-MB PNGs if a JPG exists.

## Known Doc / Code Drift

When updating docs, prefer **code and [docs/state.md](docs/state.md)** over older narrative:

- Output is **PDF**, not PNG (very old docs).
- Templates live in `public/templates/`, not `public/cert-template/`.
- Font is `GoogleSans-Bold.ttf`, not Roboto.
- `docs/sql/schema/full-schema.sql` is a **stale platform snapshot** and is not authoritative for CertGen (missing / outdated vs live schema including `cert_config`).
- Attendee path expects `survey` + `survey_response` with `survey_id`; verify against live Supabase if unsure.

## Related Docs

- [Operational state](docs/state.md)
- [Docs index](docs/README.md)
- [CONTRIBUTING.md](CONTRIBUTING.md) - PR checklist, new-event workflow
- [API: generate-cert](docs/api/generate-cert.md) - endpoint contract
- [QA](docs/qa.md) - test plans & release checklist
- [PRD](docs/prd.md) - product requirements
- [SDD](docs/sdd.md) - software design
- [Design](docs/design.md) - UI and certificate design system
- [SQL scripts](docs/sql/README.md) - migrations, seeds, schema
- [`.cursor/rules/`](.cursor/rules/) - Cursor agent rules (core, survey, cert pipeline, database, qa)
