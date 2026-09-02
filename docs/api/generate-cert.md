# API - `POST /api/generate-cert`

Generates a personalized PDF certificate, uploads it to Supabase Storage, saves the survey response, and returns the PDF to the client.

**Handler:** [`src/pages/api/generate-cert.ts`](../../src/pages/api/generate-cert.ts)  
**Workflow:** [`src/services/certificateWorkflow.service.ts`](../../src/services/certificateWorkflow.service.ts)

---

## Request

```
POST /api/generate-cert
Content-Type: application/json
Origin: https://cert.gdgpup.org  (enforced in production)
```

### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | **Yes** | Attendee email |
| `event_id` | `string` (UUID) | **Yes** | Event identifier |
| `attendanceCode` | `string` | Yes* | Must match `survey.attendance_code` (case-insensitive) |
| `gdg_id` | `string` | No | GDG member ID; cross-validated against email when provided |
| `survey_data` | `object` | Yes* | Structured form payload (see below) |

\*Required by workflow logic; missing values surface as 400 errors during processing.

### `survey_data` shape

As sent by [`SurveyForm.tsx`](../../src/components/SurveyForm.tsx):

```json
{
  "isPUPian": true,
  "personalInfo": {
    "name": "Juan Dela Cruz"
  },
  "evaluation": {
    "ratings": {},
    "overallSatisfaction": 5
  }
}
```

- **Display name** is read from `survey_data.personalInfo.name`.
- If `gdg_id` is provided and name is empty, name falls back to `gdg_members.display_name`.
- Additional keys in `personalInfo` / `evaluation` depend on the survey schema.

### Example

```json
{
  "gdg_id": "",
  "email": "juan@example.com",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "attendanceCode": "BWAI2026",
  "survey_data": {
    "isPUPian": true,
    "personalInfo": { "name": "Juan Dela Cruz" },
    "evaluation": { "overallSatisfaction": 5, "ratings": {} }
  }
}
```

---

## Response - Success (200)

| Header | Value |
|--------|-------|
| `Content-Type` | `application/pdf` |
| `Content-Disposition` | `attachment; filename="GDG-Certificate-{safeIdentifier}.pdf"` |
| `X-Certificate-URL` | Public Supabase Storage URL for the uploaded PDF |

**Body:** raw PDF bytes (not JSON).

`safeIdentifier` is `gdg_id` when provided, otherwise a sanitized email string.

---

## Response - Error

All error responses are JSON:

```json
{ "error": "Human-readable message" }
```

| Status | When |
|--------|------|
| **400** | Missing `email` or `event_id`; invalid attendance code; survey closed/expired; GDG ID/email mismatch; missing name; event/survey not found; save failure |
| **403** | Production origin check failed (`Origin` present and does not contain `"gdg"`) |
| **429** | Rate limit exceeded (currently **disabled** - code commented out) |
| **500** | Unexpected server errors |

### Known error messages (400)

| Message | Source |
|---------|--------|
| `Missing email or event_id` | API input validation |
| `This event could not be found or is no longer active.` | Event lookup |
| `No active survey found for this event.` | Survey lookup |
| `This survey is currently closed.` | `survey.is_active === false` |
| `This survey has expired and is no longer accepting responses.` | Past `survey.close_time` |
| `The attendance code you entered is invalid. Please check with the organizers.` | Code mismatch |
| `The provided GDG ID does not match the email address.` | Member email check |
| `Please provide your full name for the certificate.` | Missing display name |
| `We encountered an issue saving your response. Please try again.` | DB upsert failure |

Client-side (before fetch): invalid attendance code shows a toast - `"Invalid Attendance Code. Please check with the organizers."`

---

## Guards & middleware

1. **Origin check** (production only): rejects if `Origin` header is present and does not include `"gdg"`. Localhost is allowed in dev.
2. **Rate limit** (disabled): in-memory 5 req/min per IP - commented out in handler.
3. **Input validation:** `email` and `event_id` required at API layer.

---

## Workflow steps

Executed by `processCertificateWorkflow()`:

1. Fetch event by `event_id`
2. Fetch active survey for event
3. Validate `is_active` and `close_time`
4. Validate `attendanceCode` against `survey.attendance_code`
5. Resolve display name (form → member fallback)
6. Validate GDG ID email match (if provided)
7. Truncate name to 40 characters
8. Resolve template config from `survey.cert_config` (JSONB)
9. Generate name overlay PNG (Satori → Resvg)
10. Composite onto JPG template → PDF (PDFKit)
11. Upload to Supabase Storage (`certificates/{event_id}/{identifier}.pdf`)
12. Upsert `survey_response` row
13. Return `{ pdfBuffer, publicUrl, safeIdentifier }`

---

## Client usage

From [`SurveyForm.tsx`](../../src/components/SurveyForm.tsx):

```typescript
const response = await fetch("/api/generate-cert", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ gdg_id, email, event_id, attendanceCode, survey_data }),
});

const publicUrl = response.headers.get("X-Certificate-URL");
const blob = await response.blob();
// trigger download via object URL
```

On failure: parse `response.json()` and read `error` field.

---

## Related

- [SDD § API](../sdd.md) - broader system design
- [AGENTS.md](../../AGENTS.md) - certificate dimensions and `cert_config`
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - PR checklist and new-event workflow
- [Operational state](../state.md) - Operate milestone
