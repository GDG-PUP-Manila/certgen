# SDD - CertGen Software Design Document

**System:** GDG PUP Certificate Generator  
**Version:** 0.0.1  
**Last updated:** 2026-09-02

---

## 1. System Overview

CertGen is a server-side rendered Astro application deployed on Vercel. The certificate pipeline runs entirely in a Node.js serverless function - no headless browser, no client-side PDF generation.

```
┌─────────────┐     POST /api/generate-cert      ┌──────────────────────────┐
│  Browser    │ ───────────────────────────────► │  Vercel Serverless (Node) │
│ SurveyForm  │ ◄─────────────────────────────── │  generate-cert.ts         │
└─────────────┘     PDF binary + X-Cert-URL     └───────────┬──────────────┘
                                                              │
                    ┌─────────────────────────────────────────┼─────────────────────────┐
                    ▼                     ▼                   ▼                         ▼
              Supabase DB          Supabase Storage    Satori/Resvg              PDFKit
           (survey, members)      (certificates/)      (text PNG)            (PDF assembly)
```

---

## 2. Technology Stack

| Component | Package / Service | Notes |
|-----------|-------------------|-------|
| Framework | Astro 6 | `output: "server"` |
| UI | React 19 + Tailwind 4 | React islands in Astro pages |
| Adapter | `@astrojs/vercel` | Serverless Node (not Edge) |
| Database | Supabase PostgREST | Service role client |
| Storage | Supabase Storage | Bucket: `public` |
| SVG layout | `satori` 0.26 | HTML/CSS → SVG |
| Rasterization | `@resvg/resvg-js` 2.6 | SVG → PNG (WASM/C bindings) |
| PDF | `pdfkit` 0.18 | JPG + PNG → PDF |
| Node | >= 22.12.0 | Per `package.json` engines |

### Why Serverless Node (Not Edge)

`@resvg/resvg-js` requires native bindings. Configured as Vite SSR external in `astro.config.mjs`:

```js
ssr: { external: ["@resvg/resvg-js", "@resvg/resvg-js-win32-x64-msvc"] }
```

---

## 3. Directory Structure

```
src/
├── components/
│   ├── SurveyForm.tsx       # Client-side step machine
│   └── Toast.tsx            # Global error toast
├── layouts/
│   └── Layout.astro         # HTML shell, SEO, fonts
├── lib/
│   ├── supabase.ts          # Service-role Supabase client
│   └── auth.ts              # Admin session (ADMIN_PASSWORD hash)
├── pages/
│   ├── index.astro          # Landing page (events from Supabase)
│   ├── survey/[slug].astro  # Survey route
│   ├── admin/
│   │   ├── login.astro
│   │   ├── index.astro
│   │   └── events/
│   │       ├── new.astro
│   │       └── [id]/
│   │           ├── survey.astro    # Visual Designer + cert_config
│   │           └── responses.astro
│   └── api/
│       ├── generate-cert.ts
│       └── admin/
│           ├── login.ts
│           ├── logout.ts
│           ├── save-survey.ts
│           ├── upload-template.ts
│           └── delete-response.ts
├── repositories/
│   ├── event.repository.ts
│   ├── survey.repository.ts
│   ├── member.repository.ts
│   └── storage.repository.ts
└── services/
    ├── certificateWorkflow.service.ts
    ├── cert-generator.tsx
    └── pdf.service.ts
public/
├── templates/               # Optimized JPG backgrounds
└── fonts/                   # GoogleSans-Bold.ttf

docs/                        # Project documentation + SQL migrations
```

---

## 4. API Specification

### `POST /api/generate-cert`

> **Canonical contract:** [docs/api/generate-cert.md](api/generate-cert.md) - request/response shapes, error messages, workflow steps.

**Handler:** `src/pages/api/generate-cert.ts`

#### Request

```json
{
  "gdg_id": "optional-string",
  "email": "user@example.com",
  "event_id": "uuid",
  "attendanceCode": "SECRET",
  "survey_data": {
    "isPUPian": true,
    "personalInfo": { "name": "Juan Dela Cruz", "...": "..." },
    "evaluation": { "...": "..." }
  }
}
```

#### Response - Success (200)

| Header | Value |
|--------|-------|
| `Content-Type` | `application/pdf` |
| `Content-Disposition` | `attachment; filename="GDG-Certificate-{id}.pdf"` |
| `X-Certificate-URL` | Public Supabase Storage URL |

Body: raw PDF bytes.

#### Response - Error (400 / 403 / 500)

```json
{ "error": "Human-readable message" }
```

#### Middleware / Guards

1. **Origin check** (prod only): reject if `Origin` present and does not contain `"gdg"`.
2. **Rate limit** (disabled): in-memory 5 req/min/IP - commented out.
3. **Input validation:** `email` and `event_id` required.

---

## 5. Service Layer

### `processCertificateWorkflow(input)`

**File:** `src/services/certificateWorkflow.service.ts`

| Step | Action |
|------|--------|
| 1 | `getEventById(event_id)` |
| 2 | `getActiveSurveyByEventId(event_id)` |
| 3 | Validate `is_active`, `close_time` |
| 4 | Validate `attendanceCode` vs `survey.attendance_code` |
| 5 | Resolve `displayName` from form or `gdg_members` |
| 6 | Validate GDG ID email match (if provided) |
| 7 | Truncate name to 40 chars |
| 8 | Resolve template config from `survey.cert_config` (JSONB) |
| 9 | `generateCertificate()` → PNG buffer |
| 10 | `convertPngToPdf()` → PDF buffer |
| 11 | `uploadCertificate()` → public URL |
| 12 | `saveSurveyResponse()` → upsert |
| 13 | Return `{ pdfBuffer, publicUrl, safeIdentifier }` |

### `generateCertificate({ displayName, topOffset?, textColor? })`

**File:** `src/services/cert-generator.tsx`

- Loads `public/fonts/GoogleSans-Bold.ttf`
- Satori renders centered name on 1000×707 transparent canvas
- Resvg rasterizes at 3000px width, transparent background
- Returns PNG `Buffer`

### `convertPngToPdf(textBuffer, templateFilename)`

**File:** `src/services/pdf.service.ts`

- Reads `public/templates/{templateFilename}`
- PDFKit A4 landscape page
- Layer 1: background JPG (full bleed)
- Layer 2: text PNG overlay (same dimensions)
- Returns PDF `Buffer`

---

## 6. Data Model

### Supabase Tables (Application)

#### `event`
Referenced by `event.repository.ts`. Fields used: `id`, `title`, etc.

#### `survey`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `event_id` | UUID | FK → event |
| `slug` | TEXT | UNIQUE, URL path segment |
| `is_active` | BOOLEAN | |
| `attendance_code` | TEXT | Secret code |
| `close_time` | TIMESTAMPTZ | Optional expiry |
| `questions_schema` | JSONB | Form definition |
| `cert_config` | JSONB | Template URL, text offset, color, font size |

See `docs/sql/migrations/SURVEY_MIGRATION.sql` and `ADD_CERT_CONFIG.sql` for DDL.

#### `survey_response`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `survey_id` | UUID | FK → survey |
| `event_id` | UUID | FK → event |
| `email` | TEXT | |
| `gdg_id` | TEXT | Nullable |
| `survey_data` | JSONB | Full form payload |
| `certificate_url` | TEXT | Storage public URL |

Upsert key: email + event_id (repository logic).

#### `gdg_members`

| Column | Type | Notes |
|--------|------|-------|
| `gdg_id` | TEXT | Member identifier |
| `display_name` | TEXT | Certificate fallback name |
| `email` | TEXT | Must match form email |



### Storage

```
Bucket: public
Path:   certificates/{event_id}/{safeIdentifier}.pdf
```

`safeIdentifier` = `gdg_id` if provided, else sanitized email.

---

## 7. Client Architecture

### SurveyForm Step Machine

**File:** `src/components/SurveyForm.tsx`

```
CONSENT → STATUS → [PUPian | Non-PUPian personal info] → EVALUATION → [GCP_CREDITS] → VERIFICATION → SUCCESS
```

- Steps driven by `questions_schema.steps[]`
- State: React `useState` (survives failed submit for retry)
- Submit: `fetch("/api/generate-cert", { method: "POST", ... })`
- Success: create blob URL → trigger `<a download>`

### Survey Page

**File:** `src/pages/survey/[slug].astro`

- Loads survey by slug from Supabase
- Checks `is_active` and `close_time` at render time
- Passes `questions_schema` + metadata to `SurveyForm`

---

## 8. Certificate Template Configuration

Layout comes from `survey.cert_config` (JSONB), set in the Admin Visual Designer (`/admin/events/{event_id}/survey`). The workflow reads it in `certificateWorkflow.service.ts`:

```typescript
const certConfig =
  survey.cert_config && typeof survey.cert_config === "object"
    ? (survey.cert_config as Record<string, string>)
    : {};

const templateFilename =
  certConfig.template_url ||
  certConfig.templateFilename ||
  "base-template-optimized.jpg";
const textTopOffset = certConfig.text_top_offset || "290px";
const textColor = certConfig.text_color || "#1e293b";
const textFontSize = certConfig.text_font_size || "50px";
```

Do not add per-slug `if` branches for template selection.

### Template Asset Pipeline

1. Design in Canva → export PNG
2. Optimize: `sharp().jpeg({ quality: 90, mozjpeg: true })`
3. Place JPG in `public/templates/` (or upload via Admin)
4. Set `cert_config` in Admin Visual Designer
5. Tune offsets via `npm run test:pdf`

---

## 9. Security Design

| Control | Implementation | Status |
|---------|----------------|--------|
| CSRF / Origin | `Origin.includes("gdg")` in prod | Active |
| Rate limiting | In-memory Map, 5/min/IP | Disabled |
| Input validation | Required fields, attendance code | Active |
| Name length cap | 40 chars max | Active |
| GDG ID verification | Email match in DB | Active |
| Auth | None for attendees | By design |
| DB access | Service role (server only) | Active |

---

## 10. Deployment

### Vercel

1. Connect GitHub repo
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
3. Deploy - Astro build + serverless functions auto-provisioned

### Local Development

```bash
npm install
# Create .env with Supabase vars
npm run dev    # http://localhost:4321
```

### Local PDF Test

```bash
npm run test:pdf   # writes test/output/test-output.pdf
```

---

## 11. Error Handling

| Layer | Strategy |
|-------|----------|
| API route | try/catch → JSON `{ error }` with 400 or 500 |
| Workflow service | throw `Error` with user-facing message |
| Client | Toast via `show-toast` CustomEvent |
| Client submit | Keeps form state for retry |

User-facing errors (400): not found, invalid code, email mismatch, missing name, survey closed.

---

## 12. Dependencies & Constraints

- `@resvg/resvg-js` platform-specific binaries - must not be bundled
- In-memory rate limiter ineffective across multiple serverless instances
- PDFKit embeds JPG as-is - use pre-optimized templates for file size
- Satori only supports subset of CSS - keep cert overlay layout minimal
- `GoogleSans-Bold.ttf` must exist in `public/fonts/` for generation to work

---

## 13. Related Documents

- [Operational state](state.md)
- [PRD](prd.md)
- [Design System](design.md)
- [Agent Guide](../AGENTS.md)
- [SQL scripts](sql/README.md)
- [Survey Migration SQL](sql/migrations/SURVEY_MIGRATION.sql)
- [ADD_CERT_CONFIG.sql](sql/migrations/ADD_CERT_CONFIG.sql)
