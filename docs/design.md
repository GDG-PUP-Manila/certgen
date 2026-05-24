# Design — CertGen UI & Certificate Design System

**Product:** GDG PUP Certificate Generator  
**URL:** https://cert.gdgpup.org  
**Last updated:** May 2026

---

## 1. Design Philosophy

CertGen follows **Google Developer Groups brand language** with a modern, glassmorphic web UI and high-fidelity print-ready certificates. The web experience should feel lightweight and trustworthy; certificates should look official and event-specific.

**Principles:**
- Clean, centered layouts with generous whitespace
- Google four-color accent palette used sparingly
- Form UX that never loses user progress
- Certificates: static designed template + one dynamic text field (name)

---

## 2. Brand Colors

### Web UI (Tailwind / CSS)

| Token | Hex | Usage |
|-------|-----|-------|
| Google Blue | `#4285f4` | Primary actions, links |
| Google Red | `#ea4335` | Accent, errors |
| Google Yellow | `#fbbc04` | Accent highlights |
| Google Green | `#34a853` | Success states |
| Slate text | `#1e293b` | Body copy |
| White / glass | `rgba(255,255,255,0.8)` | Card backgrounds |

Defined in `src/styles/global.css` and used across Astro/React components.

### Certificate Text Colors

| Event | Name Color | Notes |
|-------|------------|-------|
| Default / BWAI | `#1e293b` | Dark slate, neutral |
| PM Workshop | `#073b1a` | Dark forest green — matches template titles |

Configured per slug in `certificateWorkflow.service.ts`.

---

## 3. Typography

### Web UI

| Role | Font | Source |
|------|------|--------|
| UI / headings | **Outfit** | Google Fonts via `Layout.astro` |
| Body | Outfit, system sans fallback | |

### Certificate (Dynamic Name)

| Role | Font | File |
|------|------|------|
| Participant name | **Google Sans Bold** | `public/fonts/GoogleSans-Bold.ttf` |

Satori settings (`cert-generator.tsx`):
- `fontSize: 50px` (on 1000×707 canvas)
- `fontWeight: bold` (700)
- `textAlign: center`

Static certificate copy (titles, body, signatures) is **baked into the JPG template** — designed in Canva, not rendered by code.

---

## 4. Web UI Components

### Layout Shell (`Layout.astro`)

- Fixed header with GDG logo (`/logo.png`)
- Footer with org attribution
- SEO + Open Graph meta tags
- Site URL: `https://cert.gdgpup.org`

### Landing Page (`index.astro`)

- Event card grid sourced from `data/event.json`
- Each card links to `/survey/{slug}` when survey exists in Supabase
- Glassmorphic white cards, rounded corners (`rounded-2xl` / `rounded-3xl`)

### Survey Form (`SurveyForm.tsx`)

**Visual pattern:**
- Step-by-step wizard with progress feel
- White/glass card container on subtle brand grid background
- Primary CTA buttons use Google blue
- Form fields: rounded inputs, clear labels, helper text from schema

**Step types and rendering:**

| Step Type | UI Pattern |
|-----------|------------|
| `informational` | Title + markdown-like content + privacy policy block |
| `selection` | Radio/card options (e.g. PUPian vs Non-PUPian) |
| `formGroup` | Grouped text/select/email fields |
| `feedbackGrid` | Rating grid (rows × columns) + sliders + textareas |

**Hardcoded steps:**

| Step ID | Purpose |
|---------|---------|
| `CONSENT` | Privacy acknowledgment |
| `STATUS` | PUPian branch selector |
| `PERSONAL_INFO_PUPIAN` | PUP-specific fields |
| `PERSONAL_INFO_NON_PUPIAN` | External guest fields |
| `EVALUATION` | Post-event ratings + feedback |
| `GCP_CREDITS` | Optional BWAI-specific question |
| `VERIFICATION` | Attendance code input |
| `SUCCESS` | Download confirmation |

### Toast (`Toast.tsx`)

- Triggered via `CustomEvent("show-toast")`
- Used for validation errors and API failures
- Non-blocking; user can correct and resubmit

---

## 5. Certificate Design

### Layout Spec

| Property | Value |
|----------|-------|
| Orientation | Landscape |
| Aspect ratio | ~1.414:1 (A4 landscape) |
| Satori canvas | 1000 × 707 px |
| Resvg output | 3000 px wide (3× scale) |
| PDF page | 841.89 × 595.28 pt |

### Layer Model

```
┌─────────────────────────────────────┐
│  Layer 2: Transparent PNG overlay   │  ← Satori/Resvg (name only)
├─────────────────────────────────────┤
│  Layer 1: Optimized JPG background  │  ← Canva export (full design)
└─────────────────────────────────────┘
           ↓ PDFKit
         Final PDF
```

### Template Anatomy (Standard GDG Certificate)

1. **Outer background** — branded gradient/pattern (dark theme per event)
2. **Header badge** — GDG PUP logo + org name
3. **Title block** — "CERTIFICATE" + "OF PARTICIPATION"
4. **Certification line** — "THIS IS TO CERTIFY THAT"
5. **Name line** — blank underline (name overlaid here by code)
6. **Event description** — italic context line + bold event title
7. **Body paragraph** — event value statement
8. **Date line** — issuance date (static in template)
9. **Signatures** — officer names/titles (static in template)
10. **Footer graphic** — event-specific icon/emblem

Only **#5 (participant name)** is dynamic.

### Name Placement

| Parameter | Description |
|-----------|-------------|
| `topOffset` | CSS `top` on 1000×707 canvas; positions name above underline |
| `textColor` | Hex color for name text |
| `displayName` | User's full name, max 40 chars |

**Current offsets:**

| Template | topOffset |
|----------|-----------|
| Base / PM Workshop | `290px` |
| BWAI Day 1 & 2 | `310px` |

Tune with `npm run test:pdf` → inspect `test/output/test-output.pdf`.

---

## 6. Template Asset Guidelines

### Export from Canva

- Size: **2000 × 1415 px** minimum (or 3250 × 2299 for higher DPI)
- Format: PNG for design archive
- Leave a clear blank underline for the name
- Keep name zone free of background noise

### Optimization for Production

Convert PNG → JPEG before committing:

```bash
node -e "const sharp=require('sharp'); sharp('public/templates/my-cert.png').jpeg({ quality: 90, mozjpeg: true }).toFile('public/templates/my-event-optimized.jpg').then(console.log);"
```

| Guideline | Target |
|-----------|--------|
| Format | JPEG (MozJPEG) |
| Quality | ~88–90 |
| Filename | `{event-slug}-optimized.jpg` |
| File size | ~300–500 KB (vs 1–3 MB PNG) |

### Per-Event Templates

| File | Event |
|------|-------|
| `base-template-optimized.jpg` | Default / Cosmos |
| `bwai-template-optimized.jpg` | Build with AI Day 1 |
| `bwai2026-day2-optimized.jpg` | Build with AI Day 2 |
| `pm-workshop-optimized.jpg` | PM Workshop 2026 |

Source PNGs (e.g. `pm-cert.png`) are design archives; production uses optimized JPGs.

---

## 7. Survey Schema Design

Surveys are defined in JSON (`questions_schema`) — no code changes needed for copy updates.

### Schema Structure

```json
{
  "version": "1.0",
  "steps": [
    {
      "id": "CONSENT",
      "type": "informational",
      "title": "...",
      "content": "...",
      "policy": "..."
    },
    {
      "id": "STATUS",
      "type": "selection",
      "title": "...",
      "options": ["Yes, I am a PUPian", "No, I am a Non-PUPian"]
    }
  ]
}
```

### Field Design Conventions

- Name format hint: `FirstName MI. LastName`
- PUP college list: full official names, no abbreviations
- Evaluation grid rows: Schedule, Duration, Subject, Speakers, Program Flow
- Rating columns: Poor → Excellent
- Open text: suggestions, speaker questions, appreciation messages

### Branching Logic

```
STATUS option[0] (PUPian)     → PERSONAL_INFO_PUPIAN
STATUS option[1] (Non-PUPian) → PERSONAL_INFO_NON_PUPIAN
```

---

## 8. Responsive Behavior

- Mobile-first form layout
- Touch-friendly option cards and sliders
- Logo scales: `h-10 w-10` mobile → `h-12 w-12` desktop
- Certificate PDF is fixed A4 landscape (not responsive — print/download format)

---

## 9. Accessibility & UX

- Clear step titles and field labels from schema
- Error messages via toast (visible, dismissible)
- Attendance code validation with specific error text
- Survey closed state: dedicated message, no broken form
- Form state preserved on network failure — user can resubmit

---

## 10. Design Checklist (New Event)

- [ ] Canva certificate designed with name underline zone
- [ ] PNG exported and optimized to JPG
- [ ] JPG added to `public/templates/`
- [ ] `topOffset` tuned — name centered on underline
- [ ] `textColor` matches template palette
- [ ] Event card added to `data/event.json`
- [ ] Survey schema written with consent + evaluation steps
- [ ] Test PDF generated and visually reviewed

---

## 11. Related Documents

- [Docs index](README.md)
- [PRD](prd.md)
- [SDD](sdd.md)
- [SQL scripts](sql/README.md)
- [Agent Guide](../AGENTS.md)
