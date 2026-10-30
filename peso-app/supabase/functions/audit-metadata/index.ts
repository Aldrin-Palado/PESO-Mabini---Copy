import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentication is required." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    console.error("Audit metadata function is missing Supabase configuration.");
    return jsonResponse({ error: "Audit metadata is not configured." }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) {
    return jsonResponse({ error: "The session is invalid or expired." }, 401);
  }

  const { data: isStaffOrAdmin, error: roleError } =
    await supabase.rpc("is_staff_or_admin");
  if (roleError) {
    console.error("Audit metadata role check failed:", roleError);
    return jsonResponse({ error: "Unable to verify audit access." }, 500);
  }
  if (isStaffOrAdmin !== true) {
    return jsonResponse({ error: "Admin or staff access is required." }, 403);
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    forwardedFor?.split(",")[0]?.trim() ??
    null;

  return jsonResponse({
    ip_address: ipAddress,
    user_agent: request.headers.get("user-agent"),
  });
});
