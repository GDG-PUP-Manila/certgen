-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.article (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  published_at timestamp with time zone,
  is_published boolean NOT NULL DEFAULT false,
  author_id uuid,
  title text NOT NULL,
  body text,
  related_event_id uuid,
  CONSTRAINT article_pkey PRIMARY KEY (id),
  CONSTRAINT article_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.user(id),
  CONSTRAINT article_related_event_id_fkey FOREIGN KEY (related_event_id) REFERENCES public.event(id)
);
CREATE TABLE public.article_comment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid,
  user_id uuid,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT article_comment_pkey PRIMARY KEY (id),
  CONSTRAINT article_comment_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.article(id),
  CONSTRAINT article_comment_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.dp_download_analytics (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_slug text NOT NULL,
  frame_id text NOT NULL,
  source_path text,
  user_agent text,
  downloaded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dp_download_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  creator_id uuid,
  title text NOT NULL,
  description text,
  category text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  venue text,
  attendance_points bigint NOT NULL DEFAULT '0'::bigint,
  attendees_count bigint NOT NULL DEFAULT '0'::bigint,
  gdg_event_id bigint UNIQUE,
  CONSTRAINT event_pkey PRIMARY KEY (id),
  CONSTRAINT events_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.user(id),
  CONSTRAINT event_gdg_event_id_fkey FOREIGN KEY (gdg_event_id) REFERENCES public.scraped_gdg_events(gdg_id)
);
CREATE TABLE public.event_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  is_present boolean NOT NULL DEFAULT false,
  checkin_method text NOT NULL,
  CONSTRAINT event_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id),
  CONSTRAINT event_attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id)
);
CREATE TABLE public.event_highlight (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  image_url text,
  author_id uuid NOT NULL,
  event_id uuid NOT NULL,
  CONSTRAINT event_highlight_pkey PRIMARY KEY (id),
  CONSTRAINT event_highlight_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id),
  CONSTRAINT event_highlight_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.user(id)
);
CREATE TABLE public.external_resource (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  resource_url text NOT NULL,
  uploader_id uuid NOT NULL,
  CONSTRAINT external_resource_pkey PRIMARY KEY (id),
  CONSTRAINT resource_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.user(id)
);
CREATE TABLE public.file_record (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  file_name text,
  file_description text,
  file_path text,
  preview_url text,
  storage_ref text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  file_type text NOT NULL DEFAULT ''::text,
  folder_id uuid,
  CONSTRAINT file_record_pkey PRIMARY KEY (id),
  CONSTRAINT file_record_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.filesystem_folder(id)
);
CREATE TABLE public.filesystem_folder (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  parent_id uuid,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT filesystem_folder_pkey PRIMARY KEY (id),
  CONSTRAINT filesystem_folder_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.filesystem_folder(id)
);
CREATE TABLE public.gdg_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gdg_id text NOT NULL UNIQUE,
  email USER-DEFINED NOT NULL,
  program text,
  department text,
  display_name text,
  first_name text,
  last_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  suffix text,
  CONSTRAINT gdg_members_pkey PRIMARY KEY (id)
);
CREATE TABLE public.gdg_merch (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  image_url text,
  points_cost bigint,
  stock text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  CONSTRAINT gdg_merch_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nfc_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gdg_id text NOT NULL UNIQUE,
  owner_user_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'issued'::nfc_card_status,
  activated_at timestamp with time zone,
  suspended_at timestamp with time zone,
  revoked_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nfc_cards_pkey PRIMARY KEY (id),
  CONSTRAINT nfc_cards_gdg_id_fkey FOREIGN KEY (gdg_id) REFERENCES public.gdg_members(gdg_id),
  CONSTRAINT nfc_cards_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.user(id)
);
CREATE TABLE public.resource_tag (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tag_name text NOT NULL,
  CONSTRAINT resource_tag_pkey PRIMARY KEY (id)
);
CREATE TABLE public.resource_tag_junction (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL,
  resource_tag_id uuid NOT NULL,
  CONSTRAINT resource_tag_junction_pkey PRIMARY KEY (id),
  CONSTRAINT resource_tag_junction_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.external_resource(id),
  CONSTRAINT resource_tag_junction_resource_tag_id_fkey FOREIGN KEY (resource_tag_id) REFERENCES public.resource_tag(id)
);
CREATE TABLE public.reward (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  value bigint NOT NULL,
  is_claimed boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL,
  CONSTRAINT reward_pkey PRIMARY KEY (id),
  CONSTRAINT reward_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.scraped_gdg_events (
  gdg_id bigint NOT NULL,
  title text NOT NULL,
  description_short text,
  url text NOT NULL UNIQUE,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  location text,
  cover_image_url text,
  status text,
  event_type text,
  last_scraped_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  description text,
  tags ARRAY,
  total_attendees integer,
  total_capacity integer,
  attendee_virtual_venue_link text,
  event_type_slug text,
  video_url text,
  is_virtual_event boolean,
  CONSTRAINT scraped_gdg_events_pkey PRIMARY KEY (gdg_id)
);
CREATE TABLE public.sparkmates_metric_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gdg_id text NOT NULL,
  source USER-DEFINED NOT NULL DEFAULT 'direct_link'::sparkmates_source,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sparkmates_metric_events_pkey PRIMARY KEY (id),
  CONSTRAINT sparkmates_metric_events_gdg_id_fkey FOREIGN KEY (gdg_id) REFERENCES public.gdg_members(gdg_id)
);
CREATE TABLE public.study_jam (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  recording_url text,
  summary text NOT NULL,
  creator_id text,
  CONSTRAINT study_jam_pkey PRIMARY KEY (id)
);
CREATE TABLE public.survey_response (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  gdg_id text,
  email USER-DEFINED NOT NULL UNIQUE,
  event_id uuid NOT NULL,
  survey_data jsonb NOT NULL,
  certificate_url text,
  CONSTRAINT survey_response_pkey PRIMARY KEY (id),
  CONSTRAINT survey_response_gdg_id_fkey FOREIGN KEY (gdg_id) REFERENCES public.gdg_members(gdg_id),
  CONSTRAINT survey_response_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id)
);
CREATE TABLE public.task (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text,
  description text,
  points_on_completion bigint,
  is_completed boolean,
  completed_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  CONSTRAINT task_pkey PRIMARY KEY (id),
  CONSTRAINT task_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.team (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  responsibilities text,
  parent_team_id uuid,
  CONSTRAINT team_pkey PRIMARY KEY (id),
  CONSTRAINT team_parent_team_id_fkey FOREIGN KEY (parent_team_id) REFERENCES public.team(id)
);
CREATE TABLE public.team_member (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL,
  user_id uuid NOT NULL,
  team_id uuid NOT NULL,
  CONSTRAINT team_member_pkey PRIMARY KEY (id),
  CONSTRAINT team_member_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id),
  CONSTRAINT team_member_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(id)
);
CREATE TABLE public.team_resource (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  resource_link text NOT NULL,
  resource_type text NOT NULL,
  thumbnail_storage_reference text NOT NULL,
  thumbnail_public_url text NOT NULL,
  team_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT team_resource_pkey PRIMARY KEY (id)
);
CREATE TABLE public.test (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  CONSTRAINT test_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gdg_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  email text NOT NULL,
  display_name text NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  status text NOT NULL DEFAULT 'active'::text,
  CONSTRAINT user_pkey PRIMARY KEY (id),
  CONSTRAINT user_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT user_gdg_id_fkey FOREIGN KEY (gdg_id) REFERENCES public.gdg_members(gdg_id)
);
CREATE TABLE public.user_achievement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  achieved_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievement_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievement_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.user_certificate (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  CONSTRAINT user_certificate_pkey PRIMARY KEY (id),
  CONSTRAINT user_certificate_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.user_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  bio text,
  program text,
  year_level smallint,
  skills_summary text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  is_public boolean NOT NULL DEFAULT true,
  membership_type text,
  department text,
  other_links ARRAY DEFAULT '{}'::text[],
  technical_skills ARRAY DEFAULT '{}'::text[],
  learning_interests ARRAY DEFAULT '{}'::text[],
  tools_and_technologies ARRAY DEFAULT '{}'::text[],
  first_name text,
  middle_name text,
  last_name text,
  nickname text,
  profile_image text,
  CONSTRAINT user_profile_pkey PRIMARY KEY (id),
  CONSTRAINT user_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.user_project (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  tech_stack text,
  repo_url text,
  demo_url text,
  CONSTRAINT user_project_pkey PRIMARY KEY (id),
  CONSTRAINT user_project_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.user_role (
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT user_role_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_role_junction (
  role_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT user_role_junction_pkey PRIMARY KEY (role_id, user_id),
  CONSTRAINT user_role_junction_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_role(id),
  CONSTRAINT user_role_junction_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.user_role_permission (
  role_id uuid NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  CONSTRAINT user_role_permission_pkey PRIMARY KEY (role_id, resource, action),
  CONSTRAINT user_role_permission_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_role(id)
);
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  color_theme boolean NOT NULL,
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.wallet (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  balance bigint NOT NULL,
  webdev_points bigint,
  spark_points bigint NOT NULL DEFAULT '0'::bigint,
  CONSTRAINT wallet_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.wallet_transaction (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  source_type text NOT NULL,
  source_id text NOT NULL,
  amount bigint NOT NULL DEFAULT '0'::bigint,
  user_id uuid NOT NULL,
  point_type text,
  CONSTRAINT wallet_transaction_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transaction_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);