#!/usr/bin/env node
/**
 * CertGen post-task QA smoke runner.
 * Used by agents after implementation tasks — see .cursor/skills/post-task-qa/SKILL.md
 *
 * Usage:
 *   node test/qa-smoke.mjs
 *   node test/qa-smoke.mjs --base-url=http://localhost:4321
 *   node test/qa-smoke.mjs --skip-pdf
 *   node test/qa-smoke.mjs --skip-api
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const args = process.argv.slice(2);
const skipPdf = args.includes("--skip-pdf");
const skipApi = args.includes("--skip-api");
const baseUrlArg = args.find((a) => a.startsWith("--base-url="));
const baseUrl = baseUrlArg ? baseUrlArg.slice("--base-url=".length) : "http://localhost:4321";

/** @type {{ name: string; status: 'pass' | 'fail' | 'skip'; detail?: string }[]} */
const results = [];

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  const icon = status === "pass" ? "PASS" : status === "fail" ? "FAIL" : "SKIP";
  console.log(`[${icon}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function runPdfTest() {
  try {
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    await execFileAsync(npmCmd, ["run", "test:pdf"], { cwd: rootDir, shell: true });
    const pdfPath = path.join(rootDir, "test", "output", "test-output.pdf");
    const stat = await fs.stat(pdfPath);
    if (stat.size > 1000) {
      record("PDF pipeline (test:pdf)", "pass", `${stat.size} bytes`);
    } else {
      record("PDF pipeline (test:pdf)", "fail", "PDF file too small");
    }
  } catch (err) {
    record("PDF pipeline (test:pdf)", "fail", err instanceof Error ? err.message : String(err));
  }
}

async function isServerUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function runApiNegativeTests() {
  if (!(await isServerUp(baseUrl))) {
    record("API negative tests", "skip", `dev server not running at ${baseUrl}`);
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/generate-cert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const body = await res.json();
    if (res.status === 400 && body.error?.includes("Missing email or event_id")) {
      record("API: missing fields → 400", "pass");
    } else {
      record("API: missing fields → 400", "fail", `status ${res.status}: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    record("API: missing fields → 400", "fail", err instanceof Error ? err.message : String(err));
  }

  try {
    const res = await fetch(`${baseUrl}/api/generate-cert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "qa-agent@example.com",
        event_id: "00000000-0000-0000-0000-000000000000",
        attendanceCode: "INVALID",
        survey_data: { personalInfo: { name: "QA Agent Test" } },
      }),
    });
    const body = await res.json();
    if (res.status === 400 && body.error) {
      record("API: invalid event/code → 400", "pass", body.error.slice(0, 80));
    } else {
      record("API: invalid event/code → 400", "fail", `status ${res.status}`);
    }
  } catch (err) {
    record("API: invalid event/code → 400", "fail", err instanceof Error ? err.message : String(err));
  }
}

async function main() {
  console.log("CertGen QA smoke\n");

  if (!skipPdf) await runPdfTest();
  if (!skipApi) await runApiNegativeTests();

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;

  console.log(`\nSummary: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
