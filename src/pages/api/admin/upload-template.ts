import type { APIRoute } from "astro";
import { isRequestAuthenticated } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  if (!isRequestAuthenticated(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;

    if (!file || !slug) {
      return new Response(JSON.stringify({ error: "Missing file or slug" }), { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `templates/${slug}-${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("public")
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("public")
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({ success: true, publicUrl }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
