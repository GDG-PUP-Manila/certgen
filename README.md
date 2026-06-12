# GDG PUP Manila - Certificate Generator (CertGen)

CertGen is a hyper-fast, dynamically-scalable Serverless application built for Google Developer Groups (GDG) PUP Manila. It serves as a unified platform for attendees to submit their post-event evaluations (Surveys) and instantaneously generate high-fidelity, personalized PDF Certificates of Participation.

**Live:** https://cert.gdgpup.org

---

## Documentation

| Document | Description |
|----------|-------------|
| [**Docs index**](docs/README.md) | Start here — links to all project docs |
| [PRD](docs/prd.md) | Product requirements |
| [SDD](docs/sdd.md) | Software design & architecture |
| [Design](docs/design.md) | UI & certificate design system |
| [AGENTS.md](AGENTS.md) | Guide for AI agents & contributors |
| [CONTRIBUTING.md](CONTRIBUTING.md) | PR checklist, setup, new-event workflow |
| [API: generate-cert](docs/api/generate-cert.md) | Certificate endpoint contract |
| [QA](docs/qa.md) | Test plans, release checklist, new-event launch QA |
| [SQL scripts](docs/sql/README.md) | Database migrations, seeds, schema |

---

## The Architecture

This project uses a **Serverless Node Architecture** on Vercel (not Edge — Resvg requires native bindings).

- **Framework:** [Astro](https://astro.build/) (Server-Side Rendering via Vercel)
- **Frontend / UI:** [React](https://react.dev/) + Tailwind CSS
- **Database / Storage:** [Supabase](https://supabase.com/) (PostgREST + Storage bucket)
- **Generation Engine:**
  - `satori` — renders participant name as SVG
  - `@resvg/resvg-js` — rasterizes to transparent PNG
  - `pdfkit` — composites background JPG + name overlay into PDF

---

## Core Features

### 1. Dynamic React Form Engine
`SurveyForm.tsx` builds the survey from a JSON schema fetched dynamically from the database (`survey.questions_schema`).
- **Conditional paths** for PUPian vs Non-PUPian attendees
- **Fail-safe resilience** — form state stays in React memory for retry on failure
- **Attendance code** required before certificate generation

### 2. Instant PDF Generation
`POST /api/generate-cert` runs the full workflow in ~1–2 seconds:
1. Validates attendance code and survey status
2. Renders name overlay via Satori/Resvg
3. Composites onto optimized JPG template via PDFKit
4. Uploads PDF to Supabase Storage and returns download

### 3. Security
- Origin verification (CSRF guard) in production
- Name truncation to 40 characters
- Optional GDG ID + email cross-validation

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v22.12.0+ (see `package.json`)
- Supabase project with survey tables — see [`docs/sql/`](docs/sql/README.md)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the project root:
```env
SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

### 3. Run the Dev Server
```bash
npm run dev
```
Open http://localhost:4321

### 4. Test Certificate Generation
```bash
npm run test:pdf
```
Outputs `test/output/test-output.pdf`. See [`test/README.md`](test/README.md).

---

## 🌐 Deploying to Vercel

CertGen uses `@astrojs/vercel` (serverless Node) because `@resvg/resvg-js` cannot run on Edge functions.

1. Push this repository to **GitHub**
2. Import into **Vercel Dashboard**
3. Set environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

---

## 📁 Repository Structure

```text
certgen/
├── AGENTS.md                    # Agent & contributor guide
├── CONTRIBUTING.md              # PR checklist & new-event workflow
├── .cursor/rules/               # Cursor agent rules (auto-loaded)
├── docs/
│   ├── README.md                # Documentation index
│   ├── api/generate-cert.md     # API contract
│   ├── qa.md                    # QA test plans & release checklist
│   ├── prd.md · sdd.md · design.md
│   └── sql/
│       ├── migrations/          # DDL (survey tables)
│       ├── seeds/               # Event/survey seed data
│       └── schema/              # Full schema snapshots
├── public/
│   ├── templates/               # Optimized JPG certificate backgrounds
│   └── fonts/                   # GoogleSans-Bold.ttf for Satori
├── src/
│   ├── components/SurveyForm.tsx
│   ├── pages/api/generate-cert.ts
│   ├── repositories/            # Supabase data access
│   └── services/                # Cert workflow, Satori, PDFKit
└── test/                        # Local test scripts & output
```

---

## Support

Maintained by **Gerald S. Berongoy** for [GDG PUP Manila](https://gdgpup.org).

- GitHub: [geraldsberongoy](https://github.com/geraldsberongoy)
- LinkedIn: [in/geraldberongoy](https://linkedin.com/in/geraldberongoy)
