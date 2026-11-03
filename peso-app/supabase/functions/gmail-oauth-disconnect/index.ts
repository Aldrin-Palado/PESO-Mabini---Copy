import { createClient } from "npm:@supabase/supabase-js@2";
import {
  adminDb,
  decryptToken,
  GMAIL,
  responseJson,
} from "../_shared/gmail.ts";

const corsHeaders = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const respond = (data: unknown, status = 200) =>
    responseJson(data, status, origin ?? undefined);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }
  if (request.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const publicKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const authorization = request.headers.get("Authorization");
    if (!publicKey || !authorization?.startsWith("Bearer ")) {
      return respond({ error: "Authentication is required." }, 401);
    }

    const userDb = createClient(url, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userResult, error: userError } = await userDb.auth.getUser();
    if (userError || !userResult.user) {
      return respond({ error: "The session is invalid or expired." }, 401);
    }

    const { data: isAdmin, error: roleError } = await userDb.rpc("is_admin");
    if (roleError) {
      console.error("Gmail disconnect role check failed:", roleError);
      return respond({ error: "Unable to verify admin access." }, 500);
    }
    if (isAdmin !== true) {
      return respond({ error: "PESO Head/Admin access is required." }, 403);
    }
    if (!GMAIL) {
      return respond({ error: "The official Gmail account is not configured." }, 500);
    }

    const db = adminDb();
    const accountEmail = GMAIL.toLowerCase();
    const { data: connection, error: connectionError } = await db
      .from("gmail_oauth_tokens")
      .select("refresh_token_encrypted")
      .eq("account_email", accountEmail)
      .maybeSingle();
    if (connectionError) {
      console.error("Gmail disconnect lookup failed:", connectionError);
      return respond({ error: "Unable to load the Gmail connection." }, 500);
    }

    const { error: deleteError } = await db
      .from("gmail_oauth_tokens")
      .delete()
      .eq("account_email", accountEmail);
    if (deleteError) {
      console.error("Gmail disconnect storage cleanup failed:", deleteError);
      return respond({ error: "Unable to disconnect the Gmail account." }, 500);
    }

    const { error: stateError } = await db
      .from("gmail_oauth_states")
      .delete()
      .eq("created_by", userResult.user.id);
    let warning: string | undefined;
    if (stateError) {
      console.error("Gmail disconnect OAuth-state cleanup failed:", stateError);
      warning =
        "The Gmail connection was removed, but a pending login state could not be cleared.";
    }

    let googleRevoked = !connection;
    if (connection?.refresh_token_encrypted) {
      try {
        const refreshToken = await decryptToken(connection.refresh_token_encrypted);
        const revokeResponse = await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: refreshToken }),
        });
        googleRevoked = revokeResponse.ok;
        if (!googleRevoked) {
          console.error("Google OAuth token revocation failed:", revokeResponse.status);
          warning =
            "Gmail was disconnected from PESO-Hub, but Google did not confirm revoking the authorization. You can also remove PESO-Hub in your Google Account security settings.";
        }
      } catch (revokeError) {
        console.error("Google OAuth token revocation failed:", revokeError);
        warning =
          "Gmail was disconnected from PESO-Hub, but Google authorization could not be revoked. You can also remove PESO-Hub in your Google Account security settings.";
      }
    }

    return respond({
      disconnected: true,
      google_revoked: googleRevoked,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error("Gmail disconnect failed:", error);
    return respond({ error: "Unable to disconnect the Gmail account." }, 500);
  }
});
