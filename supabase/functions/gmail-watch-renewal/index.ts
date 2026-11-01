import {
  adminDb,
  GMAIL,
  gmailAccessToken,
  requireConfig,
  startGmailWatch,
  syncGmailHistoryWithRecovery,
} from "../_shared/gmail.ts";

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const renewalSecret = Deno.env.get("GMAIL_RENEWAL_SECRET");
  if (
    !renewalSecret ||
    request.headers.get("x-gmail-renewal-secret") !== renewalSecret
  ) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    requireConfig();
    const accessToken = await gmailAccessToken();
    const syncedCount = await syncGmailHistoryWithRecovery(accessToken);
    const watch = await startGmailWatch(accessToken);
    const { error } = await adminDb()
      .from("gmail_oauth_tokens")
      .update({
        watch_expiration: new Date(Number(watch.expiration)).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("account_email", GMAIL.toLowerCase());
    if (error) throw error;

    return Response.json({
      renewed: true,
      synced: syncedCount,
      expires_at: new Date(Number(watch.expiration)).toISOString(),
    });
  } catch (error) {
    console.error("Gmail watch renewal failed:", error);
    return Response.json({ error: "Could not renew Gmail notifications." }, {
      status: 500,
    });
  }
});
