-- Migration/Seed: Populate cert_config for existing surveys to enable fully dynamic layouts
-- Run this in your Supabase SQL editor

UPDATE public.survey
SET cert_config = '{"template_url": "/templates/base-template-optimized.jpg", "text_top_offset": "290px", "text_color": "#1e293b"}'::jsonb
WHERE slug = 'cosmos-2026';

UPDATE public.survey
SET cert_config = '{"template_url": "/templates/bwai-template-optimized.jpg", "text_top_offset": "310px", "text_color": "#1e293b"}'::jsonb
WHERE slug = 'bwai2026-day1';

UPDATE public.survey
SET cert_config = '{"template_url": "/templates/bwai2026-day2-optimized.jpg", "text_top_offset": "310px", "text_color": "#1e293b"}'::jsonb
WHERE slug = 'bwai2026-day2';

UPDATE public.survey
SET cert_config = '{"template_url": "/templates/pm-workshop-optimized.jpg", "text_top_offset": "290px", "text_color": "#073b1a"}'::jsonb
WHERE slug = 'pm-workshop';
