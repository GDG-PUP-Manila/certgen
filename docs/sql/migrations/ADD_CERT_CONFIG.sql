-- Migration: Add cert_config JSONB column to survey table
ALTER TABLE public.survey 
ADD COLUMN IF NOT EXISTS cert_config JSONB DEFAULT NULL;
