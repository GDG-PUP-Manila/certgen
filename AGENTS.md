# AGENTS.md — CertGen Agent Guide

Guidance for AI agents and contributors working on **GDG PUP CertGen** (`cert.gdgpup.org`).

## Project Summary

CertGen is a serverless Astro app that lets event attendees complete a post-event survey and instantly download a personalized PDF certificate. No user authentication is required for attendees.

**Stack:** Astro 6 (SSR) · React 19 · Tailwind 4 · Supabase · Satori · Resvg · PDFKit · Vercel serverless Node

## Architecture Rules

```
pages/api/generate-cert.ts   →  certificateWorkflow.service.ts
                                      ├── repositories/*  (Supabase)
                                      ├── cert-generator.tsx  (Satori → PNG overlay)
                                      └── pdf.service.ts  (PDFKit → PDF)
```

- **API routes** validate and delegate — keep business logic in `src/services/`.
- **Repositories** are the only layer that talks to Supabase.
- **Do not** call Supabase from React components or Astro pages directly.
- **Do not** bundle `@resvg/resvg-js` — it must stay a Vite SSR external (`astro.config.mjs`).

## Key Files

| Path | Purpose |
|------|---------|
| `src/services/certificateWorkflow.service.ts` | End-to-end cert workflow; template/offset/color per survey slug |
| `src/services/cert-generator.tsx` | Satori text overlay → transparent PNG |
| `src/services/pdf.service.ts` | Background JPG + overlay → PDF |
| `src/components/SurveyForm.tsx` | Multi-step schema-driven form engine |
| `src/pages/survey/[slug].astro` | Dynamic survey page |
| `data/event.json` | Static event cards for landing page |
| `data/survey.json` | Survey schema reference / seed data |
| `public/templates/` | Optimized JPG certificate backgrounds |
| `public/fonts/GoogleSans-Bold.ttf` | Certificate name font (Satori) |
| `docs/sql/migrations/SURVEY_MIGRATION.sql` | Canonical DB migration for survey tables |

## Adding a New Event / Survey

1. Add event card to `data/event.json`.
2. Insert survey row in Supabase (`survey` table) — see `docs/sql/migrations/SURVEY_MIGRATION.sql` or `docs/sql/seeds/`.
3. Mirror schema in `data/survey.json` for local reference.
4. Export certificate background from Canva → PNG.
5. Optimize template: PNG → JPEG (~quality 90, MozJPEG) → save as `public/templates/{slug}-optimized.jpg`.
6. Add slug branch in `certificateWorkflow.service.ts` (`templateFilename`, `textTopOffset`, `textColor`).
7. Tune alignment with `npm run test:pdf` → inspect `test/output/test-output.pdf`.

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
- Form state lives in React — resubmit on failure is safe.

## Certificate Generation

- Satori canvas: **1000 × 707** (A4 landscape ratio).
- Resvg output: **3000px** wide, transparent background.
- PDFKit page: A4 landscape (**841.89 × 595.28 pt**).
- Only the **participant name** is rendered dynamically; everything else is baked into the JPG template.

Per-slug overrides live in `certificateWorkflow.service.ts`:

| Slug | Template | topOffset | textColor |
|------|----------|-----------|-----------|
| default | `base-template-optimized.jpg` | `290px` | `#1e293b` |
| `bwai2026-day1` | `bwai-template-optimized.jpg` | `310px` | `#1e293b` |
| `bwai2026-day2` | `bwai2026-day2-optimized.jpg` | `310px` | `#1e293b` |
| `pm-workshop` | `pm-workshop-optimized.jpg` | `290px` | `#073b1a` |

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side only; bypasses RLS |

> README mentions `SUPABASE_KEY` — **code uses `SUPABASE_SERVICE_ROLE_KEY`**.

## Security Notes

- Origin check in production: `Origin` header must include `"gdg"`.
- Rate limiting exists in `generate-cert.ts` but is **commented out** (in-memory, per-instance).
- Names truncated to 40 characters before rendering.
- Attendance code validated client-side and server-side.

## Testing

```bash
npm run dev                          # local dev at :4321
npm run test:pdf                     # generate test/output/test-output.pdf
node test/stress-test.mjs            # load test (hits production)
```

## Code Style

- TypeScript strict mode; match existing patterns in surrounding files.
- Minimal diffs — do not refactor unrelated code.
- No new abstractions for one-off helpers.
- Comments only for non-obvious business logic.
- Do not commit `.env`, credentials, or unoptimized multi-MB PNGs if a JPG exists.

## Known Doc / Code Drift

When updating docs, prefer **code over older README sections**:

- Output is **PDF**, not PNG (older docs say PNG).
- Templates live in `public/templates/`, not `public/cert-template/`.
- Font is `GoogleSans-Bold.ttf`, not Roboto.
- `survey` table + `survey_id` column expected by code; verify against live Supabase schema.

## Related Docs

- [Docs index](docs/README.md)
- [PRD](docs/prd.md) — product requirements
- [SDD](docs/sdd.md) — software design
- [Design](docs/design.md) — UI and certificate design system
- [SQL scripts](docs/sql/README.md) — migrations, seeds, schema
