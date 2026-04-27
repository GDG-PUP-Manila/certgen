import { supabaseAdmin } from "../lib/supabase";

export interface SurveyResponsePayload {
  gdg_id: string | null;
  email: string;
  survey_id: string;
  event_id: string;
  survey_data: any;
  certificate_url: string;
}

export const getActiveSurveyByEventId = async (event_id: string) => {
  const { data: survey, error } = await supabaseAdmin
    .from("survey")
    .select("*")
    .eq("event_id", event_id)
    .single();

  if (error || !survey) {
    throw new Error("No active survey found for this event.");
  }
  return survey;
};

export const getSurveyBySlug = async (slug: string) => {
  const { data: survey, error } = await supabaseAdmin
    .from("survey")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !survey) {
    return null;
  }
  return survey;
};

export const saveSurveyResponse = async (payload: SurveyResponsePayload) => {
  // 1. Manually check for an existing record by email and event_id
  // This is because the database lacks a unique constraint on 'email' for ON CONFLICT to work.
  const { data: existing } = await supabaseAdmin
    .from("survey_response")
    .select("id")
    .eq("email", payload.email)
    .eq("event_id", payload.event_id)
    .maybeSingle();

  const finalPayload = existing ? { ...payload, id: existing.id } : payload;

  const { error } = await supabaseAdmin
    .from("survey_response")
    .upsert(finalPayload);

  if (error) {
    console.error("Survey insert error:", error);
    throw new Error(
      "We encountered an issue saving your response. Please try again.",
    );
  }
};
