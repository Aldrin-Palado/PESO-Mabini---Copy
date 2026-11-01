import {
  adminDb,
  CLIENT_ID,
  CLIENT_SECRET,
  encryptToken,
  startGmailWatch,
  GMAIL,
  REDIRECT,
  requireConfig,
  responseJson,
  sha256,
} from "../_shared/gmail.ts";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
};

Deno.serve(async (request: Request) => {
  if (request.method !== "GET") {
    return responseJson({ error: "Method not allowed." }, 405);
  }

  const url = new URL(request.url);
  if (url.searchParams.has("error")) {
    return responseJson({ error: "Google authorization was not completed." }, 400);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return responseJson({ error: "Missing authorization code or state." }, 400);
  }

  try {
    requireConfig();

    const { data: stateRecord, error: stateError } = await adminDb()
      .from("gmail_oauth_states")
      .delete()
      .eq("state_hash", await sha256(state))
      .gt("expires_at", new Date().toISOString())
      .select("created_by")
      .maybeSingle();
    if (stateError) {
      console.error("Gmail OAuth state validation failed:", stateError);
      return responseJson({ error: "Unable to validate authorization state." }, 500);
    }
    if (!stateRecord) {
      return responseJson(
        { error: "Authorization state is invalid, expired, or already used." },
        400,
      );
    }

    const { data: existingConnection, error: connectionError } = await adminDb()
      .from("gmail_oauth_tokens")
      .select("account_email, scope")
      .eq("account_email", GMAIL.toLowerCase())
      .maybeSingle();
    if (connectionError) {
      console.error("Gmail connection status check failed:", connectionError);
      return responseJson({ error: "Unable to check Gmail authorization status." }, 500);
    }
    if (
      existingConnection?.scope?.includes(
        "https://www.googleapis.com/auth/gmail.readonly",
      ) &&
      existingConnection.scope.includes(
        "https://www.googleapis.com/auth/gmail.send",
      )
    ) {
      return responseJson({ error: "The official Gmail account is already authorized." }, 409);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) {
      console.error("Google OAuth token exchange failed:", tokenResponse.status);
      return responseJson({ error: "Google authorization could not be completed." }, 502);
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokens.access_token || !tokens.refresh_token) {
      return responseJson(
        { error: "Google did not return the required offline access token." },
        502,
      );
    }
    if (
      !tokens.scope?.includes("https://www.googleapis.com/auth/gmail.readonly") ||
      !tokens.scope.includes("https://www.googleapis.com/auth/gmail.send")
    ) {
      return responseJson(
        { error: "Google did not grant Gmail read and send access." },
        403,
      );
    }

    const profileResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (!profileResponse.ok) {
      console.error("Google account lookup failed:", profileResponse.status);
      return responseJson({ error: "Unable to verify the authorized Gmail account." }, 502);
    }

    const profile = (await profileResponse.json()) as GoogleUserInfo;
    if (
      profile.email_verified !== true ||
      !profile.email ||
      profile.email.toLowerCase() !== GMAIL.toLowerCase()
    ) {
      return responseJson(
        { error: "The authorized account does not match the configured Gmail account." },
        403,
      );
    }

    const watch = await startGmailWatch(tokens.access_token);
    const refreshTokenEncrypted = await encryptToken(tokens.refresh_token);
    const { error: saveError } = await adminDb()
      .from("gmail_oauth_tokens")
      .upsert(
        {
          account_email: GMAIL.toLowerCase(),
          refresh_token_encrypted: refreshTokenEncrypted,
          scope: tokens.scope ?? null,
          connected_by: stateRecord.created_by,
          history_id: watch.historyId,
          watch_expiration: new Date(Number(watch.expiration)).toISOString(),
          initial_sync_complete: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "account_email" },
      );
    if (saveError) {
      console.error("Gmail OAuth token storage failed:", saveError);
      return responseJson({ error: "Unable to save the Gmail connection." }, 500);
    }

    return responseJson({ connected: true, account: GMAIL });
  } catch (error) {
    console.error("Gmail OAuth callback failed:", error);
    return responseJson({ error: "Unable to complete Gmail authorization." }, 500);
  }
});
