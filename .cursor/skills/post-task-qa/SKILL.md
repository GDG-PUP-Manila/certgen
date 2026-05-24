---
name: post-task-qa
description: >-
  Runs scoped QA after CertGen implementation tasks. Classifies changed files,
  executes npm run test:qa and optional browser checks, reports pass/fail/skip
  before marking work done. Use after completing code changes, before saying a
  task is finished, or when the user asks to verify or run QA.
---

# Post-Task QA (CertGen)

After implementing a task, **run applicable QA before reporting completion**. Do not skip this unless the change is docs-only with zero code impact.

Reference: [docs/qa.md](../../docs/qa.md) · Script: [test/qa-smoke.mjs](../../test/qa-smoke.mjs)

## Workflow

1. **Classify** the change from `git diff` / files touched.
2. **Run** automated checks for that scope (below).
3. **Fix** failures when feasible; re-run until pass or report blocker.
4. **Report** a QA summary table to the user (pass / fail / skip / manual).

## Scope → checks

| If you changed… | Run |
|-----------------|-----|
| `cert-generator.tsx`, `pdf.service.ts`, `certificateWorkflow.service.ts`, `public/templates/` | `npm run test:pdf` (included in `test:qa`) |
| `generate-cert.ts`, workflow, repositories | `npm run test:qa` — start dev server first if API tests needed |
| `SurveyForm.tsx`, `survey/[slug].astro`, `data/survey.json` | Dev server + browser smoke on `/survey/{slug}` |
| `docs/**` only | Skip automated QA; spot-check links |
| New event (JSON + SQL + template + workflow) | Full [new-event checklist](../../docs/qa.md#6-new-event-launch-checklist) |
| Release / deploy | [Release regression](../../docs/qa.md#7-release-regression-checklist) |

## Automated command

```bash
npm run test:qa
# With dev server running (separate terminal: npm run dev):
npm run test:qa -- --base-url=http://localhost:4321
# Docs-only or cert-visual-only tweaks:
npm run test:qa -- --skip-api
```

**What it covers:** PDF pipeline (`test:pdf`), API negative cases (400 on missing fields / invalid event) when server is up.

**What stays manual:** full survey E2E, Supabase row verification, production origin check, closed-survey UI.

## Browser smoke (UI changes)

When `npm run dev` is available and SurveyForm or survey pages changed:

1. Open `http://localhost:4321/`
2. Navigate to an active survey slug
3. Confirm form renders (or closed state if testing lifecycle)
4. If safe (test event + code): wrong code → toast; do not spam production

Use cursor-ide-browser MCP tools when available.

## QA report template

Include this in your final message:

```markdown
## QA summary

| Check | Result | Notes |
|-------|--------|-------|
| PDF pipeline | pass/fail/skip | |
| API negative | pass/fail/skip | dev server required |
| Browser smoke | pass/fail/skip/manual | |
| Build | pass/fail/skip | `npm run build` if SSR/routes changed |

**Manual follow-up:** [list any checklist items not automated]
```

## When to escalate

- `test:qa` fails → fix before completing the task
- Dev server won't start (missing `.env`) → report skip + what user must verify
- Production-only behavior (Origin check) → mark **manual**; do not hit production without approval

## Do not

- Run `test/stress-test.mjs` unless the user explicitly requests load testing
- Mark task complete with failing automated checks in your scope
- Call Supabase from components (architecture violation — see AGENTS.md)
