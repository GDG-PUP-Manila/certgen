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

export const getAllSurveys = async () => {
  const { data: surveys, error } = await supabaseAdmin
    .from("survey")
    .select("*");

  if (error) {
    console.error("Failed to fetch surveys:", error);
    return [];
  }

  return surveys;
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

export const createSurvey = async (surveyData: any) => {
  const { data: survey, error } = await supabaseAdmin
    .from("survey")
    .insert(surveyData)
    .select()
    .single();

  if (error) {
    console.error("Failed to create survey:", error);
    throw new Error("Failed to create survey in database.");
  }
  return survey;
};

export const updateSurvey = async (surveyId: string, surveyData: any) => {
  const { data: survey, error } = await supabaseAdmin
    .from("survey")
    .update(surveyData)
    .eq("id", surveyId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update survey:", error);
    throw new Error("Failed to update survey in database.");
  }
  return survey;
};

export const getResponsesByEventId = async (eventId: string) => {
  const { data: responses, error } = await supabaseAdmin
    .from("survey_response")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch survey responses:", error);
    return [];
  }
  return responses;
};

export const deleteResponseById = async (responseId: string) => {
  const { error } = await supabaseAdmin
    .from("survey_response")
    .delete()
    .eq("id", responseId);

  if (error) {
    console.error("Failed to delete survey response:", error);
    throw new Error("Failed to delete survey response.");
  }
};

