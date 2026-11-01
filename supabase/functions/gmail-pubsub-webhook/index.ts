import {
  GMAIL,
  gmailAccessToken,
  requireConfig,
  syncGmailHistoryWithRecovery,
  verifyPubSubIdentity,
} from "../_shared/gmail.ts";

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    requireConfig();

    const subscription = Deno.env.get("GMAIL_PUBSUB_SUBSCRIPTION");
    const authorization = request.headers.get("Authorization");
    const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!subscription || !bearer) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
    await verifyPubSubIdentity(bearer);

    const body = await request.json() as {
      subscription?: string;
      message?: { data?: string };
    };
    if (body.subscription !== subscription) {
      return Response.json({ error: "Unexpected Pub/Sub subscription." }, {
        status: 403,
      });
    }
    if (!body.message?.data) {
      return Response.json({ error: "Missing Pub/Sub message data." }, {
        status: 400,
      });
    }

    const payload = JSON.parse(
      atob(body.message.data.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { emailAddress?: string; historyId?: string };
    if (
      !payload.emailAddress ||
      payload.emailAddress.toLowerCase() !== GMAIL.toLowerCase() ||
      !payload.historyId
    ) {
      console.error("Gmail Pub/Sub notification did not match the configured inbox.");
      return Response.json({ error: "Unexpected Gmail notification." }, {
        status: 400,
      });
    }

    const syncedCount = await syncGmailHistoryWithRecovery(
      await gmailAccessToken(),
    );

    return Response.json({ received: true, synced: syncedCount });
  } catch (error) {
    console.error("Gmail Pub/Sub processing failed:", error);
    return Response.json({ error: "Gmail notification processing failed." }, {
      status: 500,
    });
  }
});
