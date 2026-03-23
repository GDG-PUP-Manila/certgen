# Roadmap: Automated PNG Certificate Generation

## 1. Overview
A public-facing workflow for GDG members to submit event feedback and download a personalized certificate using their GDG ID.

## 2. Updated Technical Flow
1. **Identification**: User provides `gdg_id` and `email`.
2. **Validation**: 
   - Verify `gdg_id` exists in `public.gdg_members` and matches the `email`.
   - Fetch `display_name` from `public.gdg_members`.
3. **Generation**: Satori + Resvg using `gdg_members.display_name` and `event.title`.
4. **Storage**: Upload PNG to Supabase Bucket `certificates/`.
5. **Persistence**: 
   - Insert into `public.survey_response` (feedback + `certificate_url` + `gdg_id`).
6. **Response**: Return the PNG buffer for download.

## 3. Implementation Phases

### Phase 1: Infrastructure & Environment
- [ ] Initialize Astro project (Vercel Adapter).
- [ ] Install dependencies: `satori`, `@resvg/resvg-js`, `@supabase/supabase-js`.
- [ ] Setup `.env` with Supabase credentials.

### Phase 2: Supabase Schema & Storage
- [ ] **Database**: Create `public.survey_response` table (linked to `gdg_members`).
- [ ] **Storage**: Create `certificates` bucket.
- [ ] **RLS**: Configure policies for anonymous survey submission.

### Phase 3: The Generation Engine
- [ ] JSX template for GDG Certificate.
- [ ] Helper to fetch `gdg_members.display_name` server-side.

### Phase 4: API Endpoint (`/api/generate-cert`)
- [ ] Logic to verify `gdg_id` -> `email` mapping.
- [ ] Transactional save: Storage Upload + Survey Insert.

### Phase 5: Frontend
- [ ] `SurveyForm.tsx`: User enters GDG ID to start the survey.
- [ ] Instant PNG download on success.

## 4. Performance Goals
- **Warm Execution**: < 1.5 seconds.
- **Cold Start**: < 3 seconds.
- **Visuals**: High-fidelity (300 DPI equivalent) PNG output.
