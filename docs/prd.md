# PRD — CertGen Product Requirements Document

**Product:** GDG PUP Certificate Generator (CertGen)  
**URL:** https://cert.gdgpup.org  
**Maintainer:** Gerald S. Berongoy ([GitHub](https://github.com/geraldsberongoy) · [LinkedIn](https://linkedin.com/in/geraldberongoy))
**Last updated:** May 2026

---

## 1. Problem Statement

After GDG PUP events, organizers need attendees to:

1. Submit structured post-event feedback for quality improvement
2. Receive a personalized certificate of participation as immediate recognition

Manual certificate distribution is slow, error-prone, and does not scale across hundreds of attendees. CertGen automates both survey collection and certificate delivery in a single flow.

---

## 2. Goals

| Goal | Success Metric |
|------|----------------|
| Instant certificate delivery | PDF generated and downloaded within ~2 seconds of survey submit |
| High-quality certificates | Name rendered sharply on official event template |
| Structured feedback | 100% of certificates tied to a saved survey response |
| Low operational overhead | New events added via JSON + Supabase seed, no code deploy for copy changes |
| Abuse resistance | Invalid attendance codes rejected; origin-restricted API in production |

---

## 3. Users & Personas

### Attendee (Primary)
- PUP student, alumnus, or external guest
- Has event attendance code from organizers
- Wants certificate immediately after the event
- May or may not have a GDG member ID

### GDG Member (Optional)
- Has `gdg_id` linked to email in `gdg_members`
- Can auto-fill display name from profile if form name is empty
- Email must match database record

### Organizer / Admin (Secondary)
- Configures surveys in Supabase (`survey` table)
- Sets attendance codes and close times per event
- Adds event cards to landing page (`data/event.json`)
- Uploads certificate templates to `public/templates/`

---

## 4. User Stories

### Survey Flow
- **US-01:** As an attendee, I can browse active events on the landing page and open the survey for my event.
- **US-02:** As an attendee, I must accept the data privacy policy before continuing.
- **US-03:** As a PUPian, I answer college/campus/program/year questions; as a non-PUPian, I answer school/organization instead.
- **US-04:** As an attendee, I rate the event (schedule, speakers, flow) and provide open-text feedback.
- **US-05:** As an attendee, I enter the secret attendance code to unlock certificate generation.
- **US-06:** As an attendee, if submission fails (network/server), I can retry without losing my answers.

### Certificate Flow
- **US-07:** As an attendee, I receive a PDF certificate with my name overlaid on the official template.
- **US-08:** As an attendee, the PDF downloads automatically on successful submission.
- **US-09:** As an attendee, I can resubmit and still receive my certificate (idempotent by email + event).

### Member Integration
- **US-10:** As a GDG member, I can optionally provide my GDG ID; the system validates it matches my email.

### Admin / Ops
- **US-11:** As an organizer, I can close a survey by setting `is_active = false` or a past `close_time`.
- **US-12:** As an organizer, I can configure a unique attendance code per survey.
- **US-13:** As an organizer, I can add event-specific certificate templates and name styling.

---

## 5. Functional Requirements

### FR-01: Event Discovery
- Landing page lists events from `data/event.json`.
- Survey links resolved via Supabase `survey.slug` → `/survey/{slug}`.

### FR-02: Dynamic Survey Engine
- Form rendered from `questions_schema` JSON (no hardcoded questions per event).
- Supported step types: `informational`, `selection`, `formGroup`, `feedbackGrid`.
- Supported field types: `text`, `select`, `email`, `rating_grid`, `slider`, `textarea`.
- Branching: PUPian vs Non-PUPian paths after `STATUS` step.

### FR-03: Attendance Verification
- Client validates code before API call (UX).
- Server validates against `survey.attendance_code` (authoritative).

### FR-04: Certificate Generation
- Output format: **PDF** (A4 landscape).
- Dynamic field: participant full name only.
- Template, text position, and color configured per survey slug.

### FR-05: Persistence
- Survey response saved to `survey_response` with `certificate_url`.
- PDF uploaded to Supabase Storage: `certificates/{event_id}/{identifier}.pdf`.

### FR-06: Survey Lifecycle
- Inactive or expired surveys show "Survey is Closed" — no form, no generation.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Certificate generation < 2s on warm serverless instance |
| Availability | Serverless auto-scaling via Vercel |
| Security | Service role key server-side only; CSRF origin check in prod |
| Privacy | Survey data confidential; DPA consent required |
| Accessibility | Readable forms, toast error feedback |
| Maintainability | Schema-driven surveys minimize per-event code changes |

---

## 7. Out of Scope (Current Version)

- User login / attendee accounts
- Admin dashboard for survey management (Supabase console used instead)
- Email delivery of certificates (download only)
- Certificate verification / QR public lookup
- Multi-language surveys
- Batch/regenerate certificates from CSV

---

## 8. Current Events (May 2026)

| Event | Survey Slug | Attendance Code |
|-------|-------------|-----------------|
| COSMOS 2026 | `cosmos-2026` | `SparkAtCosmos` |
| Build with AI Day 1 | `bwai2026-day1` | `BWAID1` |
| Build with AI Day 2 | *(event in catalog; survey seed TBD)* | — |
| PM Workshop 2026 | `pm-workshop` | `PMonTop` |

---

## 9. Acceptance Criteria (Release)

- [ ] Attendee completes full survey and downloads PDF with correct name
- [ ] Invalid attendance code blocked with clear error toast
- [ ] Closed survey shows closed state on page and rejects API calls
- [ ] Survey response persisted with certificate URL
- [ ] GDG ID + email mismatch rejected
- [ ] Name > 40 chars truncated safely
- [ ] Production API rejects cross-origin requests without `gdg` in Origin

---

## 10. Documentation

- [Docs index](README.md)
- [SDD](sdd.md) · [Design](design.md) · [QA](qa.md) · [SQL scripts](sql/README.md)

---

## 11. Future Considerations

- Re-enable IP rate limiting (Redis/KV for multi-instance consistency)
- Admin UI for survey CRUD
- Email certificate link via Resend/SendGrid
- Certificate verification endpoint
- Automated template optimization script in `package.json`
