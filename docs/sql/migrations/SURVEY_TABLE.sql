-- Run this in your Supabase SQL Editor to update/create the table
CREATE TABLE IF NOT EXISTS public.survey_response (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  gdg_id text REFERENCES public.gdg_members(gdg_id), -- Now optional
  email text NOT NULL,
  event_id uuid NOT NULL REFERENCES public.event(id),
  
  -- The core survey data
  survey_data jsonb NOT NULL,
  
  -- Link to the generated certificate
  certificate_url text,
  
  CONSTRAINT survey_response_pkey PRIMARY KEY (id),
  -- Changed constraint: One survey per email per event
  CONSTRAINT unique_email_event_survey UNIQUE (email, event_id)
);

-- Enable RLS
ALTER TABLE public.survey_response ENABLE ROW LEVEL SECURITY;

-- Policy: Service role (used by the API) has full access
CREATE POLICY "Service role full access" ON public.survey_response
  FOR ALL TO service_role USING (true);

-- Policy: Optional - Allow users to see their own responses if authenticated
-- CREATE POLICY "Users can see own responses" ON public.survey_response
--   FOR SELECT USING (auth.uid() IN (SELECT id FROM public.user WHERE gdg_id = survey_response.gdg_id));
