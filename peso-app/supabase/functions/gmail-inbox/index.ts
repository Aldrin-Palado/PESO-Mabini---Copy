import { createClient } from "npm:@supabase/supabase-js@2";
import {
  adminDb,
  backfillRecentGmailMessages,
  GMAIL,
  requireConfig,
} from "../_shared/gmail.ts";

const corsHeaders = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
});

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const headers = corsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "GET") {
    return Response.json(
      { error: "Method not allowed." },
      { status: 405, headers },
    );
  }

  try {
    requireConfig();
    const url = Deno.env.get("SUPABASE_URL")!;
    const publicKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const authorization = request.headers.get("Authorization");
    if (!publicKey || !authorization?.startsWith("Bearer ")) {
      return Response.json({ error: "Authentication is required." }, {
        status: 401,
        headers,
      });
    }

    const userDb = createClient(url, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userResult, error: userError } = await userDb.auth.getUser();
    if (userError || !userResult.user) {
      return Response.json({ error: "The session is invalid or expired." }, {
        status: 401,
        headers,
      });
    }
    const { data: isStaffOrAdmin, error: roleError } =
      await userDb.rpc("is_staff_or_admin");
    if (roleError) {
      console.error("Gmail inbox role check failed:", roleError);
      return Response.json({ error: "Unable to verify inbox access." }, {
        status: 500,
        headers,
      });
    }
    if (isStaffOrAdmin !== true) {
      return Response.json({ error: "Admin or staff access is required." }, {
        status: 403,
        headers,
      });
    }

    await backfillRecentGmailMessages();
    const requestedLimit = Number(new URL(request.url).searchParams.get("limit"));
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 25;
    const { data: messages, error: messagesError } = await adminDb()
      .from("gmail_messages")
      .select(
        "gmail_message_id, thread_id, from_address, to_address, subject, snippet, body_text, internal_date",
      )
      .order("internal_date", { ascending: false })
      .limit(limit);
    if (messagesError) {
      console.error("Gmail inbox query failed:", messagesError);
      return Response.json({ error: "Unable to load Gmail messages." }, {
        status: 500,
        headers,
      });
    }

    return Response.json(
      { account: GMAIL, messages: messages ?? [] },
      { headers: { ...headers, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Gmail inbox request failed:", error);
    return Response.json({ error: "Unable to load Gmail inbox." }, {
      status: 500,
      headers,
    });
  }
});
