# 🎓 GDG PUP Manila - Certificate Generator (CertGen)

CertGen is a hyper-fast, dynamically-scalable Serverless application built for Google Developer Groups (GDG) PUP Manila. It serves as a unified platform for attendees to submit their post-event evaluations (Surveys) and instantaneously generate high-fidelity, personalized PDF Certificates of Participation.

---

## 🚀 The Architecture

This project abandons heavy legacy full-stack frameworks in favor of a **Serverless-Edge Architecture** built for zero-downtime horizontal scaling.

- **Framework:** [Astro](https://astro.build/) (Configured strictly for Server-Side Rendering via Vercel).
- **Frontend / UI:** Native [React](https://react.dev/) utilizing Tailwind CSS for beautiful glassmorphic designs inspired by Google's modern design philosophy (`dp-blast`).
- **Database / API:** [Supabase](https://supabase.com/). Handling lightning-fast HTTP PostgREST row inserts and scalable bucket storage for generated PDFs.
- **Generation Engine:** 
  - `satori` (Vercel's engine for converting raw HTML/CSS/Tailwind into SVG vectors).
  - `@resvg/resvg-js` (WASM/C-Binding utility for rasterizing SVGs into exact PNGs).
  - `pdfkit` (Compiles the rasterized high-quality PNGs directly into downloadable PDF documents).

---

## 💡 Core Features

### 1. The Dynamic React Form Engine
The core of the frontend is `SurveyForm.tsx`. It acts as a powerful State Machine that dynamically builds the survey based on a JSON schema (`data/survey.json`).
- **Conditional Paths:** Branching logic seamlessly splits "PUPian" and "Non-PUPian" users into entirely different questioning paths without refreshing the browser.
- **Fail-safe Resilience:** Because the state lives purely in React's client memory, even if a user loses connection or the server times out at the end, their answers are never lost. They can simply click "Submit" again!
- **Code Guards:** Users can only generate a certificate if they input the secretive "Attendance Code" locked dynamically per-event by the event managers.

### 2. Instant In-Memory Generation 
When a user finishes the survey, the `generate-cert.ts` proxy takes over.
Instead of dealing with sluggish headless browsers (like Puppeteer), the Vercel function:
1. Loads the blank `base-template.png` and custom `.ttf` Roboto fonts.
2. Injects the verified user's `Name` deeply into a dynamic HTML div.
3. Rasterizes it instantly into a raw binary PDF buffer within ~0.5 seconds.
4. Directly streams the PDF packet back to the Browser as a forced download blob while simultaneously backing it up to Supabase Storage.

### 3. Fortified Application Security
- **Anti-Bot Rate Limiting:** An explicit memory-map rate limiter forcefully drops spam pings from identical IP addresses avoiding excessive Supabase write attacks.
- **Origin Verification (CSRF Guard):** Hardcoded checks actively reject rogue POST/API requests made outside of the native domain context.
- **Text Sanitization:** Super long, malicious names are automatically aggressively truncated to `40 characters` before generation to prevent XSS payloads or text-overflows destroying the certificate canvas.

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Your Supabase Project (SQL structure available in `docs/SURVEY_SEED.sql`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the exact root of your directory with your Supabase credentials.
```env
SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
SUPABASE_KEY="YOUR_SUPABASE_ANON_KEY"
```

### 3. Run the Astro Dev Server
```bash
npm run dev
```
Open `http://localhost:4321` in your browser. All code changes automatically hot-reload!

---

## 🌐 Deploying to Vercel

CertGen uses the explicit `@astrojs/vercel/serverless` adaptor because the `resvg-js` library requires standard Node functionality (it cannot run on highly-restrictive Edge functions due to C-bindings).

1. Push this repository to **GitHub**.
2. Import the project into your **Vercel Dashboard**.
3. Under Environment Variables, inject your `SUPABASE_URL` and `SUPABASE_KEY`.
4. Click **Deploy**. Vercel will automatically build the React tree and properly provision the Node Lambdas!

---

## 📁 Repository Structure

```text
gdg-certgen/
├── data/
│   ├── event.json               # Defines active event cards on the Landing Page
│   └── survey.json              # The literal Schema controlling the React Form Questions
├── docs/
│   └── SURVEY_SEED.sql          # DB seed files to configure Supabase instances
├── public/
│   ├── cert-template/           # Holds the blank PNG certificate background template
│   ├── fonts/                   # The literal .ttf files Satori requires for text injection
│   └── logo.png                 # GDG Favicon / Brand logo
├── src/
│   ├── components/
│   │   ├── SurveyForm.tsx       # The massive Client-Side React Engine
│   │   └── Toast.tsx            # Floating error/notification popups
│   ├── layouts/
│   │   └── Layout.astro         # The HTML Shell enforcing SEO, Open Graph & Fonts
│   ├── pages/
│   │   ├── api/
│   │   │   └── generate-cert.ts # The highly secure Vercel Serverless generator route
│   │   ├── survey/
│   │   │   └── [slug].astro     # Dynamic Page builder for individual survey links
│   │   └── index.astro          # Landing Page
│   └── services/
│       └── pdf.service.ts       # Orchestrator for wrapping PNGs into downloadable PDFs
```

## 🔐 Support & Architecture Maintainer

Maintained closely by the **GDG PUP Manila Web Development Team**. 
