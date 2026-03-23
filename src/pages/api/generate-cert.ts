import type { APIRoute } from "astro";
import { processCertificateWorkflow } from "../../services/certificateWorkflow.service";

// Simple in-memory rate limiter per Serverless instance
// const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Basic CSRF protection (Origin tracking)
    // Ensures requests are only coming from our own frontend
    const origin = request.headers.get("origin");
    const isLocalhost = origin?.includes("localhost") || origin?.includes("127.0.0.1");
    // Only strictly enforce in production to prevent local dev friction
    if (import.meta.env.PROD && origin && !origin.includes("gdg")) {
      return new Response(JSON.stringify({ error: "Unauthorized cross-origin request detected." }), { status: 403 });
    }

    // 2. IP Rate Limiting
    // const ip = request.headers.get("x-forwarded-for") || "unknown";
    // if (ip !== "unknown") {
    //   const now = Date.now();
    //   const userLimit = rateLimitMap.get(ip);
    //   if (userLimit && userLimit.resetTime > now) {
    //     if (userLimit.count >= 5) {
    //       return new Response(JSON.stringify({ error: "Too many requests. Please try again in a minute." }), { status: 429 });
    //     }
    //     userLimit.count++;
    //   } else {
    //     rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // strict 60s cooldown block
    //   }
    // }

    const body = await request.json();
    const { gdg_id, email, event_id, attendanceCode, survey_data } = body;

    // 3. Basic Input Validation
    if (!email || !event_id) {
      return new Response(JSON.stringify({ error: "Missing email or event_id" }), { status: 400 });
    }

    // Process through service layer
    const result = await processCertificateWorkflow({
      gdg_id,
      email,
      event_id,
      attendanceCode,
      survey_data
    });

    // Return PDF + URL for Frontend
    return new Response(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="GDG-Certificate-${result.safeIdentifier}.pdf"`,
        'X-Certificate-URL': result.publicUrl, 
      },
    });

  } catch (err: any) {
    console.error("API Error:", err);
    // Determine if error is user-facing or internal
    const isClientError = err.message.includes("not found") || 
      err.message.includes("Invalid") || 
      err.message.includes("mismatch") || 
      err.message.includes("required");
      
    const status = isClientError ? 400 : 500;
    
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
};
