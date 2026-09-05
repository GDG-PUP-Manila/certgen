# GDG PUP Manila - Certificate Generator (CertGen)

CertGen is a hyper-fast, dynamically-scalable Serverless application built for Google Developer Groups (GDG) PUP Manila. It serves as a unified platform for attendees to submit their post-event evaluations (Surveys) and instantaneously generate high-fidelity, personalized PDF Certificates of Participation.

**Live:** https://cert.gdgpup.org

## Table of Contents

- [About](#about)
- [Core Features](#core-features)
- [Quick start](#quick-start)
- [The Architecture](#the-architecture)
- [Deploying to Vercel](#deploying-to-vercel)
- [Repository Structure](#repository-structure)
- [Documentation](#documentation)
- [Contributors](#contributors)
- [Support](#support)

## About

CertGen is the GDG PUP Manila certificate and survey platform. Event attendees complete a post-event evaluation and receive a personalized PDF certificate. Operators manage events and templates through the admin UI.

**Live:** https://cert.gdgpup.org

## Core Features

### 1. Dynamic React Form Engine
`SurveyForm.tsx` builds the survey from a JSON schema fetched dynamically from the database (`survey.questions_schema`).
- **Conditional paths** for PUPian vs Non-PUPian attendees
- **Fail-safe resilience** - form state stays in React memory for retry on failure
- **Attendance code** required before certificate generation

### 2. Instant PDF Generation
`POST /api/generate-cert` runs the full workflow in ~1-2 seconds:
1. Validates attendance code and survey status
2. Renders name overlay via Satori/Resvg
3. Composites onto optimized JPG template via PDFKit
4. Uploads PDF to Supabase Storage and returns download

### 3. Security
- Origin verification (CSRF guard) in production
- Name truncation to 40 characters
- Optional GDG ID + email cross-validation

## Quick start

### Prerequisites
- [Node.js](https://nodejs.org/) v22.12.0+ (see `package.json`)
- Supabase project with survey tables - see [`docs/sql/`](docs/sql/README.md)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the project root:
```env
SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"
```

Secrets and ops detail: [FLAGS.md](FLAGS.md) and [docs/state.md](docs/state.md).

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

## The Architecture

This project uses a **Serverless Node Architecture** on Vercel (not Edge - Resvg requires native bindings).

- **Framework:** [Astro](https://astro.build/) (Server-Side Rendering via Vercel)
- **Frontend / UI:** [React](https://react.dev/) + Tailwind CSS
- **Database / Storage:** [Supabase](https://supabase.com/) (PostgREST + Storage bucket)
- **Generation Engine:**
  - `satori` - renders participant name as SVG
  - `@resvg/resvg-js` - rasterizes to transparent PNG
  - `pdfkit` - composites background JPG + name overlay into PDF

## Deploying to Vercel

CertGen uses `@astrojs/vercel` (serverless Node) because `@resvg/resvg-js` cannot run on Edge functions.

1. Push this repository to **GitHub**
2. Import into **Vercel Dashboard**
3. Set environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`
4. Deploy

## Repository Structure

```text
certgen/
├── AGENTS.md                    # Agent & contributor guide
├── CONTRIBUTING.md              # PR checklist & new-event workflow
├── .cursor/rules/               # Cursor agent rules (auto-loaded)
├── docs/
│   ├── README.md                # Documentation index
│   ├── state.md                 # Operate milestone & handover
│   ├── api/generate-cert.md     # API contract
│   ├── qa.md                    # QA test plans & release checklist
│   ├── prd.md · sdd.md · design.md
│   └── sql/
│       ├── migrations/          # DDL (survey tables + cert_config)
│       ├── seeds/               # Event/survey seed data
│       └── schema/              # Full schema snapshots (stale)
├── public/
│   ├── templates/               # Optimized JPG certificate backgrounds
│   └── fonts/                   # GoogleSans-Bold.ttf for Satori
├── src/
│   ├── components/SurveyForm.tsx
│   ├── pages/api/generate-cert.ts
│   ├── pages/admin/             # Admin UI
│   ├── repositories/            # Supabase data access
│   └── services/                # Cert workflow, Satori, PDFKit
└── test/                        # Local test scripts & output
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [State](docs/state.md) | Operate milestone - live URL, env vars, admin UI, handover |
| [Index](docs/index.md) | Inventory of docs that exist (also [docs/README.md](docs/README.md)) |
| [FLAGS](FLAGS.md) | Open improvement register (docs handover) |
| [AGENTS](AGENTS.md) | Guide for AI agents and contributors |
| [PRD](docs/prd.md) | Product requirements |
| [SDD](docs/sdd.md) | Software design and architecture |
| [Design](docs/design.md) | UI and certificate design system |
| [CONTRIBUTING.md](CONTRIBUTING.md) | PR checklist, setup, new-event workflow |
| [API: generate-cert](docs/api/generate-cert.md) | Certificate endpoint contract |
| [QA](docs/qa.md) | Test plans, release checklist, new-event launch QA |
| [SQL scripts](docs/sql/README.md) | Database migrations, seeds, schema |

## Contributors

This project is made possible by the GDG PUP community:

| Role | Name |
| --- | --- |
| 💻 **Development** | [Gerald Berongoy](https://www.linkedin.com/in/geraldberongoy) - Senior Backend Developer |
| 🚀 **CTO** | [Carlos Jerico Dela Torre](https://www.linkedin.com/in/delatorrecj/) - Chief Technology Officer (2025-2026) |

## Support

**Owner:** GDG PUP Technology (incoming CTO).  
**Handover:** 2026-09-02. See [docs/state.md](docs/state.md) and [FLAGS.md](FLAGS.md).
