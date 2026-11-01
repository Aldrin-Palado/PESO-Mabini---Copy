import {
  adminDb,
  GMAIL,
  gmailAccessToken,
  requireConfig,
  startGmailWatch,
} from "../_shared/gmail.ts";
import {
  logGmailSyncFailure,
  syncMappedGmailHistory,
} from "../_shared/gmail-sync.ts";

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const renewalSecret = Deno.env.get("GMAIL_JOB_SECRET");
  if (
    !renewalSecret ||
    request.headers.get("x-gmail-job-secret") !== renewalSecret
  ) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    requireConfig();
    const { data: connection, error: connectionError } = await adminDb()
      .from("gmail_oauth_tokens")
      .select("account_email")
      .eq("account_email", GMAIL.toLowerCase())
      .maybeSingle();
    if (connectionError) throw connectionError;
    if (!connection) {
      return Response.json({ renewed: false, connected: false });
    }

    const accessToken = await gmailAccessToken();
    const syncedCount = await syncMappedGmailHistory(accessToken);
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
    try {
      await logGmailSyncFailure("watch_renewal", error);
    } catch (logError) {
      console.error("Could not persist Gmail sync failure:", logError);
    }
    return Response.json({ error: "Could not renew Gmail notifications." }, {
      status: 500,
    });
  }
});
