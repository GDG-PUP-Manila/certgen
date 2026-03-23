import { supabaseAdmin } from "../lib/supabase";

export const getEventById = async (event_id: string) => {
  const { data: event, error } = await supabaseAdmin
    .from("event")
    .select("title")
    .eq("id", event_id)
    .single();
    
  if (error || !event) throw new Error("This event could not be found or is no longer active.");
  
  return event;
};
