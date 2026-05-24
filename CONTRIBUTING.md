# Contributing to CertGen

Guide for human contributors and AI agents working on **GDG PUP CertGen** (`cert.gdgpup.org`).

## Before you start

1. Read [AGENTS.md](AGENTS.md) for architecture rules and key files.
2. Skim [docs/README.md](docs/README.md) for product, design, and SQL docs.
3. For API work, see [docs/api/generate-cert.md](docs/api/generate-cert.md).

## Local setup

```bash
npm install
# Create .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm run dev          # http://localhost:4321
npm run test:pdf     # test/output/test-output.pdf
```

Node **>= 22.12.0** required. Database setup: [docs/sql/README.md](docs/sql/README.md).

## Development rules

- **Layering:** API routes delegate to `src/services/`; only `src/repositories/` talks to Supabase.
- **Minimal diffs:** Match surrounding code style; no unrelated refactors.
- **Secrets:** Never commit `.env`, service role keys, or unoptimized multi-MB PNGs when a JPG exists.
- **Resvg:** Keep `@resvg/resvg-js` as a Vite SSR external — do not bundle it.

## Pull request checklist

- [ ] Change scope matches the task — no drive-by refactors
- [ ] Business logic is in services, not API routes or React components
- [ ] Supabase access stays in repositories only
- [ ] Env var names match code (`SUPABASE_SERVICE_ROLE_KEY`, not `SUPABASE_KEY`)
- [ ] Certificate/template changes tested with `npm run test:pdf` when applicable
- [ ] Survey changes verified against schema in `data/survey.json` or seed SQL
- [ ] Docs updated if behavior, API, or setup changed
- [ ] No credentials or large unoptimized assets committed

## Adding a new event / survey

1. Add event card to [`data/event.json`](data/event.json).
2. Insert survey row in Supabase — see [`docs/sql/migrations/SURVEY_MIGRATION.sql`](docs/sql/migrations/SURVEY_MIGRATION.sql) and [`docs/sql/seeds/`](docs/sql/seeds/).
3. Mirror schema in [`data/survey.json`](data/survey.json).
4. Export certificate background from Canva → PNG.
5. Optimize: PNG → JPEG (~quality 90, MozJPEG) → `public/templates/{slug}-optimized.jpg`.
6. Add slug branch in [`src/services/certificateWorkflow.service.ts`](src/services/certificateWorkflow.service.ts) (`templateFilename`, `textTopOffset`, `textColor`).
7. Tune alignment: `npm run test:pdf` → inspect `test/output/test-output.pdf`.
8. Smoke-test the full flow on `/survey/{slug}` locally.

## Testing

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run test:pdf` | Offline certificate layout test |
| `node test/stress-test.mjs` | Load test against production — use carefully |

See [test/README.md](test/README.md) for details. Full QA guide: [docs/qa.md](docs/qa.md).

## Cursor rules

Project-specific agent rules live in [`.cursor/rules/`](.cursor/rules/):

| Rule | Scope |
|------|-------|
| `certgen-core.mdc` | Always applied — architecture, env, style |
| `survey-form.mdc` | SurveyForm, survey pages, `data/survey.json` |
| `certificate-pipeline.mdc` | Services, API, templates, PDF tests |
| `database.mdc` | Repositories, SQL migrations/seeds |
| `qa.mdc` | QA docs, test scripts, release checklist |
| `post-task-qa` skill | Run scoped QA after implementation tasks — `.cursor/skills/post-task-qa/` |

## Related docs

- [PRD](docs/prd.md) — product requirements
- [SDD](docs/sdd.md) — software design
- [Design](docs/design.md) — UI and certificate design system
- [QA](docs/qa.md) — test plans & release checklist
- [API: generate-cert](docs/api/generate-cert.md) — endpoint contract
