import { supabaseAdmin } from "../lib/supabase";

export const getEventById = async (event_id: string) => {
  const { data: event, error } = await supabaseAdmin
    .from("event")
    .select("*")
    .eq("id", event_id)
    .single();

  if (error || !event)
    throw new Error("This event could not be found or is no longer active.");

  return event;
};

export const getAllEvents = async () => {
  const { data: events, error } = await supabaseAdmin
    .from("event")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
  return events;
};

export const createEvent = async (eventData: any) => {
  const { data: event, error } = await supabaseAdmin
    .from("event")
    .insert(eventData)
    .select()
    .single();

  if (error) {
    console.error("Failed to create event:", error);
    throw new Error("Failed to create event in database.");
  }
  return event;
};
