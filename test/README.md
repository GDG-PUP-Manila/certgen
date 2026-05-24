# Local test scripts

| Script | Command | Description |
|--------|---------|-------------|
| Certificate PDF | `npm run test:pdf` | Generates `test/output/test-output.pdf` |
| Post-task QA smoke | `npm run test:qa` | PDF pipeline + API negative tests (see skill below) |
| API stress test | `node test/stress-test.mjs` | Load test against production (use carefully) |

Edit `test/test-pdf.ts` to change template, name, offset, or color before running.

**Agents:** after code tasks, use [.cursor/skills/post-task-qa/SKILL.md](../.cursor/skills/post-task-qa/SKILL.md) and run `npm run test:qa`.

Full manual test cases and release checklist: [docs/qa.md](../docs/qa.md).
