-- Migration: Create Survey and Survey Response Tables from Scratch

-- 1. Create `survey` table
-- This stores the configuration for a specific event's survey.
CREATE TABLE IF NOT EXISTS public.survey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.event(id) ON DELETE CASCADE,
    slug VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    attendance_code VARCHAR(50),      -- The code attendees must enter (e.g. "SparkAtCosmos")
    close_time TIMESTAMPTZ,           -- Optional: time when the survey automatically stops accepting responses
    questions_schema JSONB,           -- Optional: JSON describing custom survey questions/layout
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups by event_id
CREATE INDEX IF NOT EXISTS idx_survey_event_id ON public.survey(event_id);

-- 2. Create `survey_response` table
-- This stores individual submissions from attendees.
CREATE TABLE IF NOT EXISTS public.survey_response (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES public.survey(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.event(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    gdg_id VARCHAR(100),              -- Not enforced as a strict foreign key so non-members can submit
    survey_data JSONB NOT NULL,       -- Stores the multi-step form data
    certificate_url TEXT,             -- Stores the public URL of the generated PDF
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure an email can only submit one response per survey (Idempotency)
    UNIQUE(survey_id, email)
);

-- Index for querying responses by event or email
CREATE INDEX IF NOT EXISTS idx_response_survey_id ON public.survey_response(survey_id);
CREATE INDEX IF NOT EXISTS idx_response_email ON public.survey_response(email);

-- 3. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.survey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_response ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active surveys so the frontend can check status
CREATE POLICY "Allow public read access to surveys" 
ON public.survey FOR SELECT 
TO PUBLIC
USING (true);

-- (Optional) Add your RLS Insert/Select policies for survey_responses here depending on your backend auth flow.
