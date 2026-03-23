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

export const saveSurveyResponse = async (payload: SurveyResponsePayload) => {
  const { error } = await supabaseAdmin.from("survey_response").upsert(payload);
  
  if (error) {
    if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
      throw new Error("It looks like you have already submitted an evaluation using this email address.");
    }
    console.error("Survey insert error:", error);
    throw new Error("We encountered an issue saving your response. Please try again.");
  }
};
