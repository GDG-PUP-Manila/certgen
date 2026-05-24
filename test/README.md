# Local test scripts

| Script | Command | Description |
|--------|---------|-------------|
| Certificate PDF | `npm run test:pdf` | Generates `test/output/test-output.pdf` |
| API stress test | `node test/stress-test.mjs` | Load test against production (use carefully) |

Edit `test/test-pdf.ts` to change template, name, offset, or color before running.
