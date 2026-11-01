import { createClient } from "npm:@supabase/supabase-js@2";
import {
  adminDb,
  CLIENT_ID,
  REDIRECT,
  requireConfig,
  responseJson,
  sha256,
  randomState,
} from "../_shared/gmail.ts";

const corsHeaders = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const headers = corsHeaders(origin);
  const respond = (data: unknown, status = 200) =>
    responseJson(data, status, origin ?? undefined);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  try {
    requireConfig();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publicKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const authorization = request.headers.get("Authorization");
    if (!publicKey || !authorization?.startsWith("Bearer ")) {
      return respond({ error: "Authentication is required." }, 401);
    }

    const userDb = createClient(supabaseUrl, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userResult, error: userError } = await userDb.auth.getUser();
    if (userError || !userResult.user) {
      return respond({ error: "The session is invalid or expired." }, 401);
    }

    const { data: isAdmin, error: roleError } = await userDb.rpc("is_admin");
    if (roleError) {
      console.error("Gmail OAuth role check failed:", roleError);
      return respond({ error: "Unable to verify access." }, 500);
    }
    if (isAdmin !== true) {
      return respond({ error: "PESO Head/Admin access is required." }, 403);
    }

    const { data: existingConnection, error: connectionError } = await adminDb()
      .from("gmail_oauth_tokens")
      .select("account_email, scope")
      .eq("account_email", Deno.env.get("GMAIL_ACCOUNT")!.toLowerCase())
      .maybeSingle();
    if (connectionError) {
      console.error("Gmail connection status check failed:", connectionError);
      return respond({ error: "Unable to check Gmail authorization status." }, 500);
    }
    if (
      existingConnection?.scope?.includes(
        "https://www.googleapis.com/auth/gmail.readonly",
      ) &&
      existingConnection.scope.includes(
        "https://www.googleapis.com/auth/gmail.send",
      )
    ) {
      return respond({ error: "The official Gmail account is already authorized." }, 409);
    }

    const db = adminDb();
    const { error: expiredStateError } = await db
      .from("gmail_oauth_states")
      .delete()
      .lt("expires_at", new Date().toISOString());
    if (expiredStateError) {
      console.error("Expired Gmail OAuth state cleanup failed:", expiredStateError);
      return respond({ error: "Unable to start Gmail authorization." }, 500);
    }

    const state = randomState();
    const { error: stateError } = await db
      .from("gmail_oauth_states")
      .insert({
        state_hash: await sha256(state),
        created_by: userResult.user.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
    if (stateError) {
      console.error("Gmail OAuth state creation failed:", stateError);
      return respond({ error: "Unable to start Gmail authorization." }, 500);
    }

    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizationUrl.search = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT,
      response_type: "code",
      scope:
        "openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send",
      access_type: "offline",
      prompt: "consent",
      state,
    }).toString();

    return new Response(
      JSON.stringify({ authorization_url: authorizationUrl.toString() }),
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Gmail OAuth start failed:", error);
    return respond({ error: "Unable to start Gmail authorization." }, 500);
  }
});
