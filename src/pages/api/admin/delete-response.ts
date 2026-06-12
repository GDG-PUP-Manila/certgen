import type { APIRoute } from "astro";
import { isRequestAuthenticated } from "../../../lib/auth";
import { deleteResponseById } from "../../../repositories/survey.repository";

export const POST: APIRoute = async ({ request }) => {
  if (!isRequestAuthenticated(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { responseId } = await request.json();
    if (!responseId) {
      return new Response(JSON.stringify({ error: "Missing responseId" }), { status: 400 });
    }

    await deleteResponseById(responseId);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
