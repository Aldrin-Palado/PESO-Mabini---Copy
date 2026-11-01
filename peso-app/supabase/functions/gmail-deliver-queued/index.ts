import {
  adminDb,
  GMAIL,
  gmailAccessToken,
  requireConfig,
  responseJson,
} from "../_shared/gmail.ts";
import { processPesoGmailOutbox } from "../_shared/gmail-sync.ts";

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return responseJson({ error: "Method not allowed." }, 405);
  }
  const jobSecret = Deno.env.get("GMAIL_JOB_SECRET");
  if (!jobSecret || request.headers.get("x-gmail-job-secret") !== jobSecret) {
    return responseJson({ error: "Unauthorized." }, 401);
  }

  try {
    requireConfig();
    const { data: connection, error: connectionError } = await adminDb()
      .from("gmail_oauth_tokens")
      .select("scope")
      .eq("account_email", GMAIL.toLowerCase())
      .maybeSingle();
    if (connectionError) throw connectionError;
    if (
      !connection?.scope?.includes(
        "https://www.googleapis.com/auth/gmail.send",
      )
    ) {
      return responseJson({
        attempted: 0,
        delivered: 0,
        waiting_for_authorization: true,
      });
    }

    const result = await processPesoGmailOutbox(gmailAccessToken);
    return responseJson(result);
  } catch (error) {
    console.error("PESO Gmail outbox processing failed:", error);
    return responseJson({ error: "Could not process Gmail delivery queue." }, 500);
  }
});
