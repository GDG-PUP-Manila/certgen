# QA — CertGen Quality Assurance Guide

**Product:** GDG PUP Certificate Generator  
**URL:** https://cert.gdgpup.org  
**Last updated:** May 2026

Manual and scripted test plans for releases, new events, and regression. Maps to [PRD acceptance criteria](prd.md#9-acceptance-criteria-release) and [API contract](api/generate-cert.md).

---

## 1. Scope

| In scope | Out of scope (current version) |
|----------|--------------------------------|
| Landing page & survey routing | User login / accounts |
| Multi-step survey (PUPian / non-PUPian) | Admin dashboard |
| Attendance code validation | Email delivery of certificates |
| PDF generation & download | Certificate QR / public verification |
| Supabase persistence | Multi-language surveys |
| Closed-survey behavior | Batch CSV regeneration |

---

## 2. Environments

| Environment | URL | Notes |
|-------------|-----|-------|
| Local | `http://localhost:4321` | Requires `.env` with Supabase credentials |
| Production | `https://cert.gdgpup.org` | Origin check enforced on API |

**Before testing:** confirm the target survey is `is_active = true` and `close_time` is in the future (or null).

---

## 3. Quick smoke test (~5 min)

Use after any deploy or cert-pipeline change.

- [ ] Landing page loads; event cards visible
- [ ] Open `/survey/{slug}` for an active event — form renders
- [ ] Complete survey with valid attendance code → PDF downloads
- [ ] PDF shows correct participant name on correct template
- [ ] Wrong attendance code → toast error, no download
- [ ] Closed survey slug → "Survey is Closed" UI, no form

---

## 4. Manual test cases

### 4.1 Event discovery (FR-01)

| ID | Steps | Expected |
|----|-------|----------|
| QA-01 | Open `/` | Events from `data/event.json` listed with title, description, link |
| QA-02 | Click event survey link | Navigates to `/survey/{slug}` |
| QA-03 | Visit `/survey/invalid-slug-xyz` | 404 (event not found) |

### 4.2 Survey flow — happy path (US-01 – US-06)

| ID | Steps | Expected |
|----|-------|----------|
| QA-10 | Start survey → accept consent | Advances to STATUS step |
| QA-11 | Select PUPian (first STATUS option) | Shows `PERSONAL_INFO_PUPIAN` fields |
| QA-12 | Select non-PUPian | Shows `PERSONAL_INFO_NON_PUPIAN` fields |
| QA-13 | Fill required fields including email | Can advance through EVALUATION |
| QA-14 | Use Back button mid-flow | Previous step shown; entered data retained |
| QA-15 | Enter valid attendance code on VERIFICATION | Submit enabled |
| QA-16 | Submit with valid code | Loading state → PDF auto-download → SUCCESS step |
| QA-17 | Simulate network failure (dev tools offline) then retry | Form data retained; resubmit succeeds |

### 4.3 Attendance code (FR-03)

| ID | Steps | Expected |
|----|-------|----------|
| QA-20 | Enter wrong code (case-insensitive test: `bwaid1` vs `BWAID1`) | Toast: invalid attendance code; no API call on client block |
| QA-21 | Submit wrong code via API directly | 400: `"The attendance code you entered is invalid..."` |
| QA-22 | Submit with code < 3 chars | Submit button disabled on VERIFICATION step |

### 4.4 Certificate output (US-07, US-08, FR-04)

| ID | Steps | Expected |
|----|-------|----------|
| QA-30 | Download PDF after success | File named `GDG-Certificate-{id}.pdf`; opens as A4 landscape |
| QA-31 | Inspect name placement | Name centered at slug-specific offset; color matches config |
| QA-32 | Name exactly 40 characters | Renders fully (no truncation) |
| QA-33 | Name > 40 characters | Truncated to 37 chars + `...` on certificate |
| QA-34 | Special characters in name (é, ñ, hyphen) | Renders without layout break |
| QA-35 | Response header `X-Certificate-URL` | Valid Supabase public URL; PDF accessible |

### 4.5 GDG member integration (US-10)

| ID | Steps | Expected |
|----|-------|----------|
| QA-40 | Valid `gdg_id` + matching email | Certificate generated; name from form or member profile |
| QA-41 | Valid `gdg_id` + **mismatched** email | 400: `"The provided GDG ID does not match the email address."` |
| QA-42 | Empty name + valid `gdg_id` | Name falls back to `gdg_members.display_name` |

### 4.6 Survey lifecycle (US-09, US-11, FR-06)

| ID | Steps | Expected |
|----|-------|----------|
| QA-50 | Set `is_active = false` in Supabase | Page shows "Survey is Closed"; no form |
| QA-51 | Set `close_time` in the past | Same closed UI |
| QA-52 | POST to API while survey closed | 400: closed or expired message |
| QA-53 | Same email submits twice for same event | Second submit succeeds (upsert); same or updated cert URL |

### 4.7 Persistence (FR-05)

| ID | Steps | Expected |
|----|-------|----------|
| QA-60 | After successful submit | Row in `survey_response` with `email`, `event_id`, `survey_id`, `survey_data`, `certificate_url` |
| QA-61 | Check Supabase Storage | PDF at `certificates/{event_id}/{identifier}.pdf` |

### 4.8 Security (NFR)

| ID | Steps | Expected |
|----|-------|----------|
| QA-70 | POST from non-`gdg` Origin in **production** | 403: unauthorized cross-origin |
| QA-71 | POST from localhost in dev | Allowed |
| QA-72 | Missing `email` or `event_id` in body | 400: `"Missing email or event_id"` |
| QA-73 | Invalid `event_id` UUID | 400: event not found |

---

## 5. Certificate visual QA (per new event)

Run after adding or changing a template. Edit `test/test-pdf.ts` for offline tuning, then verify in-browser.

```bash
npm run test:pdf   # → test/output/test-output.pdf
```

| Check | Pass criteria |
|-------|---------------|
| Template file | `{slug}-optimized.jpg` exists in `public/templates/` |
| Resolution | Background sharp at 100% zoom; no visible JPEG artifacts |
| Name position | Horizontally centered; vertical offset matches design |
| Name color | Matches slug config in `certificateWorkflow.service.ts` |
| Long name | 40+ char name does not overflow template bounds |
| Short name | Single-word name still centered |
| PDF page size | A4 landscape (841.89 × 595.28 pt) |

**Slug reference:**

| Slug | Template | topOffset | textColor |
|------|----------|-----------|-----------|
| default | `base-template-optimized.jpg` | `290px` | `#1e293b` |
| `bwai2026-day1` | `bwai-template-optimized.jpg` | `310px` | `#1e293b` |
| `bwai2026-day2` | `bwai2026-day2-optimized.jpg` | `310px` | `#1e293b` |
| `pm-workshop` | `pm-workshop-optimized.jpg` | `290px` | `#073b1a` |

---

## 6. New event launch checklist

Complete before announcing a new survey.

- [ ] Event card added to `data/event.json`
- [ ] Survey row seeded in Supabase (`docs/sql/seeds/`)
- [ ] `attendance_code` and `close_time` set correctly
- [ ] Schema mirrored in `data/survey.json`
- [ ] Template optimized JPG uploaded to `public/templates/`
- [ ] Slug branch added in `certificateWorkflow.service.ts`
- [ ] `npm run test:pdf` — visual pass
- [ ] Full manual flow on `/survey/{slug}` (PUPian + non-PUPian paths)
- [ ] Supabase row + Storage object verified after test submit
- [ ] Production smoke test on live URL

---

## 7. Release regression checklist

Maps to [PRD §9 Acceptance Criteria](prd.md#9-acceptance-criteria-release).

- [ ] Attendee completes full survey and downloads PDF with correct name
- [ ] Invalid attendance code blocked with clear error toast
- [ ] Closed survey shows closed state on page and rejects API calls
- [ ] Survey response persisted with certificate URL
- [ ] GDG ID + email mismatch rejected
- [ ] Name > 40 chars truncated safely
- [ ] Production API rejects cross-origin requests without `gdg` in Origin

---

## 8. Automated / scripted tests

| Script | Command | Purpose |
|--------|---------|---------|
| PDF pipeline | `npm run test:pdf` | Offline Satori → Resvg → PDFKit without Supabase |
| Post-task smoke | `npm run test:qa` | PDF + API negative tests (API needs `npm run dev`) |
| Stress test | `node test/stress-test.mjs` | Concurrent API load against production — **use carefully** |

See [test/README.md](../test/README.md).

### API curl examples (local)

**Valid request** (replace placeholders):

```bash
curl -X POST http://localhost:4321/api/generate-cert \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","event_id":"EVENT_UUID","attendanceCode":"CODE","survey_data":{"isPUPian":true,"personalInfo":{"name":"Test User"},"evaluation":{"overallSatisfaction":5,"ratings":{}}}}' \
  --output cert-test.pdf -D headers.txt
```

**Missing fields:**

```bash
curl -X POST http://localhost:4321/api/generate-cert \
  -H "Content-Type: application/json" \
  -d '{}' 
# Expected: 400 {"error":"Missing email or event_id"}
```

Full error catalog: [api/generate-cert.md](api/generate-cert.md).

---

## 9. Performance (NFR)

| Metric | Target | How to verify |
|--------|--------|---------------|
| Certificate generation | < 2s (warm instance) | Browser Network tab: POST `/api/generate-cert` duration |
| Concurrent load | No widespread 5xx | `node test/stress-test.mjs` (production only with organizer approval) |

---

## 10. Bug report template

```markdown
**Environment:** local / production
**Survey slug:** 
**Steps to reproduce:**
1. 
2. 
**Expected:**
**Actual:**
**Browser / device:**
**Screenshot or PDF attached:**
**Supabase survey_response row (if applicable):**
```

---

## Related docs

- [PRD](prd.md) — user stories & acceptance criteria
- [API: generate-cert](api/generate-cert.md) — endpoint contract & errors
- [CONTRIBUTING.md](../CONTRIBUTING.md) — dev setup & PR checklist
- [AGENTS.md](../AGENTS.md) — architecture for agents
- [Design](design.md) — visual specs for certificate QA
