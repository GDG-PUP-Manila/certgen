import type { APIRoute } from "astro";
import { isRequestAuthenticated } from "../../../lib/auth";
import { createEvent } from "../../../repositories/event.repository";
import { createSurvey, updateSurvey } from "../../../repositories/survey.repository";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  if (!isRequestAuthenticated(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { event, survey } = await request.json();

    let savedEvent;
    if (event.id) {
      const { data, error } = await supabaseAdmin
        .from("event")
        .update({
          title: event.title,
          description: event.description,
          venue: event.venue,
          start_date: event.start_date,
          end_date: event.end_date,
        })
        .eq("id", event.id)
        .select()
        .single();

      if (error) throw error;
      savedEvent = data;
    } else {
      savedEvent = await createEvent({
        title: event.title,
        description: event.description,
        venue: event.venue,
        start_date: event.start_date || new Date().toISOString(),
        end_date: event.end_date || new Date().toISOString(),
      });
    }

    let savedSurvey;
    if (survey.id) {
      savedSurvey = await updateSurvey(survey.id, {
        slug: survey.slug,
        is_active: survey.is_active,
        attendance_code: survey.attendance_code,
        close_time: survey.close_time || null,
        questions_schema: survey.questions_schema || {},
        cert_config: survey.cert_config || null,
      });
    } else {
      savedSurvey = await createSurvey({
        event_id: savedEvent.id,
        slug: survey.slug,
        is_active: survey.is_active ?? true,
        attendance_code: survey.attendance_code,
        close_time: survey.close_time || null,
        questions_schema: survey.questions_schema || {},
        cert_config: survey.cert_config || null,
      });
    }

    return new Response(JSON.stringify({ success: true, event: savedEvent, survey: savedSurvey }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
