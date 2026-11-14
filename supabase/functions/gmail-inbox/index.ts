import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  adminDb,
  GMAIL,
  gmailConfigurationStatus,
  responseJson,
} from "../_shared/gmail.ts";

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin") ?? undefined;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }
  if (request.method !== "GET") {
    return responseJson({ error: "Method not allowed." }, 405, origin);
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const publicKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const authorization = request.headers.get("Authorization");
    if (!publicKey || !authorization?.startsWith("Bearer ")) {
      return responseJson({ error: "Authentication is required." }, 401, origin);
    }

    const userDb = createClient(url, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userResult, error: userError } = await userDb.auth.getUser();
    if (userError || !userResult.user) {
      return responseJson({ error: "The session is invalid or expired." }, 401, origin);
    }
    const { data: isAdmin, error: roleError } = await userDb.rpc("is_admin");
    if (roleError) {
      console.error("Gmail setup role check failed:", roleError);
      return responseJson({ error: "Unable to verify admin access." }, 500, origin);
    }
    if (isAdmin !== true) {
      return responseJson({ error: "PESO Head/Admin access is required." }, 403, origin);
    }

    let connection = null;
    if (GMAIL) {
      const { data, error: connectionError } = await adminDb()
        .from("gmail_oauth_tokens")
        .select("account_email, watch_expiration, scope")
        .eq("account_email", GMAIL.toLowerCase())
        .maybeSingle();
      if (connectionError) {
        console.error("Gmail setup status query failed:", connectionError);
        return responseJson({ error: "Unable to load Gmail setup status." }, 500, origin);
      }
      connection = data;
    }

    return responseJson(
      {
        connected: Boolean(
          connection?.scope?.includes(
            "https://www.googleapis.com/auth/gmail.readonly",
          ) &&
            connection.scope.includes(
              "https://www.googleapis.com/auth/gmail.send",
            ),
        ),
        previously_authorized: Boolean(connection),
        account: connection?.account_email ?? null,
        watch_expires_at: connection?.watch_expiration ?? null,
        configuration: gmailConfigurationStatus(),
      },
      200,
      origin,
    );
  } catch (error) {
    console.error("Gmail setup status failed:", error);
    return responseJson({ error: "Unable to load Gmail setup status." }, 500, origin);
  }
});
