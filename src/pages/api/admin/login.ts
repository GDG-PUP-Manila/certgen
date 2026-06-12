import type { APIRoute } from "astro";
import { getAdminToken } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password } = await request.json();
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin";
    if (password !== expectedPassword) {
      return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
    }

    cookies.set("admin_session", getAdminToken(), {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
