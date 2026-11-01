import {
  adminDb,
  GMAIL,
  startGmailWatch,
} from "./gmail.ts";

type GmailHeader = { name: string; value: string };
type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};
type GmailMessage = {
  id: string;
  threadId?: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailPart & { headers?: GmailHeader[] };
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function encodeBase64Url(value: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function headerValue(message: GmailMessage, name: string) {
  const header = message.payload?.headers?.find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );
  return header?.value ?? "";
}

function extractEmailAddresses(value: string) {
  return [
    ...value.matchAll(
      /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    ),
  ].map((match) => match[0].toLowerCase());
}

function extractMessageIds(value: string) {
  return [...value.matchAll(/<[^<>\s]+>/g)].map((match) => match[0]);
}

function collectText(part: GmailPart): { plain: string[]; html: string[] } {
  const result = { plain: [] as string[], html: [] as string[] };
  if (part.body?.data) {
    const text = new TextDecoder().decode(decodeBase64Url(part.body.data));
    if (part.mimeType === "text/plain") result.plain.push(text);
    if (part.mimeType === "text/html") result.html.push(text);
  }
  for (const child of part.parts ?? []) {
    const nested = collectText(child);
    result.plain.push(...nested.plain);
    result.html.push(...nested.html);
  }
  return result;
}

function htmlToPlainText(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function gmailRequest(
  accessToken: string,
  path: string,
  init?: RequestInit,
) {
  return await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

async function findOrCreateConversation(
  senderId: string,
  recipientId: string,
  senderEmail: string,
  recipientEmail: string,
) {
  const senderIsLow = senderId < recipientId;
  const lowId = senderIsLow ? senderId : recipientId;
  const highId = senderIsLow ? recipientId : senderId;
  const lowEmail = senderIsLow ? senderEmail : recipientEmail;
  const highEmail = senderIsLow ? recipientEmail : senderEmail;
  const db = adminDb();
  const existing = await db
    .from("peso_gmail_conversations")
    .select("*")
    .eq("participant_low", lowId)
    .eq("participant_high", highId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    if (
      existing.data.participant_low_email !== lowEmail ||
      existing.data.participant_high_email !== highEmail
    ) {
      const { error } = await db
        .from("peso_gmail_conversations")
        .update({
          participant_low_email: lowEmail,
          participant_high_email: highEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("conversation_id", existing.data.conversation_id);
      if (error) throw error;
      existing.data.participant_low_email = lowEmail;
      existing.data.participant_high_email = highEmail;
    }
    return existing.data;
  }

  const conversationId = crypto.randomUUID();
  const { error: insertError } = await db
    .from("peso_gmail_conversations")
    .insert({
      conversation_id: conversationId,
      participant_low: lowId,
      participant_high: highId,
      participant_low_email: lowEmail,
      participant_high_email: highEmail,
      subject: `PESO-Hub [${conversationId}]`,
    });
  if (insertError && insertError.code !== "23505") throw insertError;

  const created = await db
    .from("peso_gmail_conversations")
    .select("*")
    .eq("participant_low", lowId)
    .eq("participant_high", highId)
    .single();
  if (created.error) throw created.error;
  return created.data;
}

async function verifiedParticipantAddress(userId: string) {
  const { data, error } = await adminDb().rpc("get_peso_message_address", {
    candidate_user_id: userId,
  });
  if (error) throw error;
  if (typeof data !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
    throw new Error("A PESO message participant needs a verified email address");
  }
  return data;
}

async function findPreviouslySentMessage(
  accessToken: string,
  rfc822MessageId: string,
) {
  const search = new URLSearchParams({
    q: `in:sent rfc822msgid:${rfc822MessageId.slice(1, -1)}`,
    maxResults: "1",
  });
  const response = await gmailRequest(accessToken, `messages?${search}`);
  if (!response.ok) {
    console.error("Gmail sent-message lookup failed:", response.status);
    throw new Error("Could not check for a previous Gmail delivery attempt");
  }
  const result = await response.json() as {
    messages?: Array<{ id: string; threadId?: string }>;
  };
  return result.messages?.[0] ?? null;
}

async function sendOrRecoverGmailMessage(
  accessToken: string,
  recipientEmail: string,
  subject: string,
  body: string,
  rfc822MessageId: string,
  threadId: string | null,
  referencesId?: string | null,
) {
  const previous = await findPreviouslySentMessage(accessToken, rfc822MessageId);
  if (previous?.id && previous.threadId) return previous;

  const headers = [
    `From: ${GMAIL}`,
    `To: ${recipientEmail}`,
    `Subject: ${subject}`,
    `Message-ID: ${rfc822MessageId}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];
  if (referencesId) {
    headers.push(`In-Reply-To: ${referencesId}`, `References: ${referencesId}`);
  }
  const raw = [
    ...headers,
    "",
    wrapBase64(btoa(String.fromCharCode(...new TextEncoder().encode(body)))),
  ].join("\r\n");
  const response = await gmailRequest(accessToken, "messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw: encodeBase64Url(raw),
      ...(threadId ? { threadId } : {}),
    }),
  });
  if (!response.ok) {
    console.error("Gmail message delivery failed:", response.status);
    throw new Error(`Gmail delivery returned HTTP ${response.status}`);
  }
  const sent = await response.json() as {
    id?: string;
    threadId?: string;
  };
  if (!sent.id || !sent.threadId) {
    throw new Error("Gmail returned an incomplete sent-message response");
  }
  return { id: sent.id, threadId: sent.threadId };
}

export async function deliverPesoMessage(
  accessToken: string,
  outboxId: string,
  messageId: string,
) {
  const db = adminDb();
  const { data: message, error: messageError } = await db
    .from("peso_messages")
    .select("message_id, sender_user_id, recipient_user_id, body")
    .eq("message_id", messageId)
    .single();
  if (messageError) throw messageError;

  const [senderEmail, recipientEmail] = await Promise.all([
    verifiedParticipantAddress(message.sender_user_id),
    verifiedParticipantAddress(message.recipient_user_id),
  ]);
  const conversation = await findOrCreateConversation(
    message.sender_user_id,
    message.recipient_user_id,
    senderEmail,
    recipientEmail,
  );
  const latest = await db
    .from("peso_gmail_message_links")
    .select("rfc822_message_id")
    .eq("conversation_id", conversation.conversation_id)
    .not("rfc822_message_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest.error) throw latest.error;

  const rfc822MessageId = `<peso-${outboxId}@peso-hub.invalid>`;
  const sent = await sendOrRecoverGmailMessage(
    accessToken,
    recipientEmail,
    conversation.subject,
    message.body,
    rfc822MessageId,
    conversation.gmail_thread_id,
    latest.data?.rfc822_message_id,
  );

  const { error: conversationError } = await db
    .from("peso_gmail_conversations")
    .update({
      gmail_thread_id: sent.threadId,
      updated_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversation.conversation_id);
  if (conversationError) throw conversationError;

  const { error: linkError } = await db.from("peso_gmail_message_links").upsert(
    {
      gmail_message_id: sent.id,
      conversation_id: conversation.conversation_id,
      peso_message_id: message.message_id,
      direction: "outbound",
      rfc822_message_id: rfc822MessageId,
    },
    { onConflict: "gmail_message_id" },
  );
  if (linkError) throw linkError;

  const { error: messageUpdateError } = await db
    .from("peso_messages")
    .update({
      gmail_message_id: sent.id,
      gmail_thread_id: sent.threadId,
      rfc822_message_id: rfc822MessageId,
    })
    .eq("message_id", message.message_id);
  if (messageUpdateError) throw messageUpdateError;
}

export async function processPesoGmailOutbox(
  getAccessToken: () => Promise<string>,
) {
  const db = adminDb();
  const { data: jobs, error: claimError } = await db.rpc(
    "claim_peso_gmail_outbox",
    { batch_size: 10 },
  );
  if (claimError) throw claimError;

  let delivered = 0;
  let accessTokenPromise: Promise<string> | null = null;
  for (const job of (jobs ?? []) as Array<{
    outbox_id: string;
    message_id: string;
    attempt_count: number;
  }>) {
    let deliveryError: string | null = null;
    try {
      accessTokenPromise ??= getAccessToken();
      const accessToken = await accessTokenPromise;
      await deliverPesoMessage(accessToken, job.outbox_id, job.message_id);
      delivered += 1;
    } catch (error) {
      deliveryError = error instanceof Error ? error.message : String(error);
      console.error("PESO Gmail outbox delivery failed:", {
        outboxId: job.outbox_id,
        error: deliveryError,
      });
    }

    const successful = deliveryError === null;
    const terminal = !successful && job.attempt_count >= 10;
    const delaySeconds = Math.min(21600, 15 * (2 ** Math.min(job.attempt_count - 1, 10)));
    const { error: logError } = await db
      .from("peso_gmail_delivery_logs")
      .insert({
        outbox_id: job.outbox_id,
        success: successful,
        error: deliveryError,
      });
    if (logError) throw logError;

    const { error: updateError } = await db
      .from("peso_gmail_outbox")
      .update({
        status: successful ? "sent" : terminal ? "failed" : "pending",
        available_at: successful
          ? new Date().toISOString()
          : new Date(Date.now() + delaySeconds * 1000).toISOString(),
        locked_until: null,
        last_error: deliveryError,
        updated_at: new Date().toISOString(),
      })
      .eq("outbox_id", job.outbox_id);
    if (updateError) throw updateError;
  }
  return { attempted: jobs?.length ?? 0, delivered };
}

export async function logGmailSyncFailure(
  source: "pubsub" | "watch_renewal",
  error: unknown,
) {
  const detail = error instanceof Error ? error.message : String(error);
  const { error: logError } = await adminDb()
    .from("peso_gmail_sync_logs")
    .insert({ source, error: detail.slice(0, 4000) });
  if (logError) throw logError;
}

async function importMappedMessage(
  accessToken: string,
  messageId: string,
  threadId?: string,
) {
  if (!threadId) {
    const metadataResponse = await gmailRequest(
      accessToken,
      `messages/${encodeURIComponent(messageId)}?format=metadata`,
    );
    if (!metadataResponse.ok) {
      console.error("Gmail message metadata fetch failed:", metadataResponse.status);
      throw new Error("Could not read Gmail message metadata");
    }
    const metadata = await metadataResponse.json() as GmailMessage;
    threadId = metadata.threadId;
  }
  if (!threadId) return false;

  const db = adminDb();
  const { data: conversation, error: conversationError } = await db
    .from("peso_gmail_conversations")
    .select(
      "conversation_id, participant_low, participant_high, participant_low_email, participant_high_email, gmail_thread_id",
    )
    .eq("gmail_thread_id", threadId)
    .maybeSingle();
  if (conversationError) throw conversationError;
  if (!conversation || conversation.gmail_thread_id !== threadId) return false;

  const response = await gmailRequest(
    accessToken,
    `messages/${encodeURIComponent(messageId)}?format=full`,
  );
  if (!response.ok) {
    console.error("Mapped Gmail message fetch failed:", response.status);
    throw new Error("Could not fetch a mapped PESO Gmail reply");
  }
  const message = await response.json() as GmailMessage;
  const bodies = message.payload ? collectText(message.payload) : null;
  const body = bodies
    ? (bodies.plain.length
      ? bodies.plain.join("\n")
      : htmlToPlainText(bodies.html.join("\n"))).trim().slice(0, 5000)
    : "";
  if (!body) return false;

  const from = extractEmailAddresses(headerValue(message, "from"))[0];
  const recipients = [
    ...extractEmailAddresses(headerValue(message, "to")),
    ...extractEmailAddresses(headerValue(message, "cc")),
    ...extractEmailAddresses(headerValue(message, "delivered-to")),
  ];
  const fromLow = from === conversation.participant_low_email;
  const fromHigh = from === conversation.participant_high_email;
  if (
    (!fromLow && !fromHigh) ||
    from === GMAIL.toLowerCase() ||
    !recipients.includes(GMAIL.toLowerCase())
  ) {
    return false;
  }

  const references = [
    ...extractMessageIds(headerValue(message, "in-reply-to")),
    ...extractMessageIds(headerValue(message, "references")),
  ];
  const outboundLinks = await db
    .from("peso_gmail_message_links")
    .select("rfc822_message_id")
    .eq("conversation_id", conversation.conversation_id)
    .eq("direction", "outbound")
    .not("rfc822_message_id", "is", null);
  if (outboundLinks.error) throw outboundLinks.error;
  const linkedReply = (outboundLinks.data ?? []).some((link) =>
    link.rfc822_message_id && references.includes(link.rfc822_message_id)
  );
  if (
    !headerValue(message, "subject").includes(
      `[${conversation.conversation_id}]`,
    ) &&
    !linkedReply
  ) {
    return false;
  }

  const senderUserId = fromLow
    ? conversation.participant_low
    : conversation.participant_high;
  const recipientUserId = fromLow
    ? conversation.participant_high
    : conversation.participant_low;
  const rfc822MessageId = extractMessageIds(
    headerValue(message, "message-id"),
  )[0] ?? null;
  const createdAt = message.internalDate
    ? new Date(Number(message.internalDate)).toISOString()
    : new Date().toISOString();
  const inserted = await db
    .from("peso_messages")
    .insert({
      sender_user_id: senderUserId,
      recipient_user_id: recipientUserId,
      body,
      created_at: createdAt,
      message_origin: "gmail",
      gmail_message_id: message.id,
      gmail_thread_id: threadId,
      rfc822_message_id: rfc822MessageId,
    })
    .select("message_id")
    .maybeSingle();
  if (inserted.error?.code === "23505") {
    const existing = await db
      .from("peso_messages")
      .select("message_id, sender_user_id, recipient_user_id")
      .eq("gmail_message_id", message.id)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (
      existing.data &&
      existing.data.sender_user_id === senderUserId &&
      existing.data.recipient_user_id === recipientUserId
    ) {
      const { error: repairError } = await db
        .from("peso_gmail_message_links")
        .upsert(
          {
            gmail_message_id: message.id,
            conversation_id: conversation.conversation_id,
            peso_message_id: existing.data.message_id,
            direction: "inbound",
            rfc822_message_id: rfc822MessageId,
          },
          { onConflict: "gmail_message_id" },
        );
      if (repairError) throw repairError;
    }
    return false;
  }
  if (inserted.error) throw inserted.error;
  if (!inserted.data) return false;

  const { error: linkError } = await db
    .from("peso_gmail_message_links")
    .upsert(
      {
        gmail_message_id: message.id,
        conversation_id: conversation.conversation_id,
        peso_message_id: inserted.data.message_id,
        direction: "inbound",
        rfc822_message_id: rfc822MessageId,
      },
      { onConflict: "gmail_message_id" },
    );
  if (linkError) throw linkError;
  const { error: updateError } = await db
    .from("peso_gmail_conversations")
    .update({ updated_at: createdAt })
    .eq("conversation_id", conversation.conversation_id);
  if (updateError) throw updateError;
  return true;
}

async function syncMappedThreads(accessToken: string) {
  const { data: conversations, error } = await adminDb()
    .from("peso_gmail_conversations")
    .select("gmail_thread_id")
    .not("gmail_thread_id", "is", null)
    .limit(500);
  if (error) throw error;
  let synced = 0;
  for (const { gmail_thread_id: threadId } of conversations ?? []) {
    if (!threadId) continue;
    const response = await gmailRequest(
      accessToken,
      `threads/${encodeURIComponent(threadId)}?format=full`,
    );
    if (!response.ok) {
      console.error("Mapped Gmail thread recovery failed:", response.status);
      throw new Error("Could not recover a mapped PESO Gmail conversation");
    }
    const thread = await response.json() as {
      messages?: Array<{ id?: string; threadId?: string }>;
    };
    for (const message of thread.messages ?? []) {
      if (
        message.id &&
        await importMappedMessage(accessToken, message.id, message.threadId)
      ) {
        synced += 1;
      }
    }
  }
  return synced;
}

export async function syncMappedGmailHistory(accessToken: string) {
  const db = adminDb();
  const { data: connection, error: connectionError } = await db
    .from("gmail_oauth_tokens")
    .select("history_id")
    .eq("account_email", GMAIL.toLowerCase())
    .maybeSingle();
  if (connectionError) throw connectionError;
  if (!connection?.history_id) throw new Error("Gmail history cursor is missing");

  try {
    let pageToken: string | undefined;
    let latestHistoryId = connection.history_id as string;
    const messages = new Map<string, string | undefined>();
    let pages = 0;
    do {
      const parameters = new URLSearchParams({
        startHistoryId: connection.history_id,
        historyTypes: "messageAdded",
        maxResults: "500",
      });
      if (pageToken) parameters.set("pageToken", pageToken);
      const response = await gmailRequest(
        accessToken,
        `history?${parameters}`,
      );
      if (!response.ok) {
        const error = new Error("Could not read Gmail history");
        Object.assign(error, { status: response.status });
        throw error;
      }
      const result = await response.json() as {
        historyId?: string;
        nextPageToken?: string;
        history?: Array<{
          messagesAdded?: Array<{
            message?: { id?: string; threadId?: string };
          }>;
        }>;
      };
      latestHistoryId = result.historyId ?? latestHistoryId;
      for (const entry of result.history ?? []) {
        for (const added of entry.messagesAdded ?? []) {
          if (added.message?.id) {
            messages.set(added.message.id, added.message.threadId);
          }
        }
      }
      pageToken = result.nextPageToken;
      pages += 1;
    } while (pageToken && pages < 10);
    if (pageToken) throw new Error("Gmail history exceeded its safe page limit");

    let synced = 0;
    for (const [messageId, threadId] of messages) {
      if (await importMappedMessage(accessToken, messageId, threadId)) {
        synced += 1;
      }
    }
    const { error: updateError } = await db
      .from("gmail_oauth_tokens")
      .update({ history_id: latestHistoryId, updated_at: new Date().toISOString() })
      .eq("account_email", GMAIL.toLowerCase());
    if (updateError) throw updateError;
    return synced;
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("status" in error) ||
      error.status !== 404
    ) {
      throw error;
    }

    console.warn("Gmail history expired; rebuilding only mapped PESO conversations.");
    const synced = await syncMappedThreads(accessToken);
    const watch = await startGmailWatch(accessToken);
    const { error: updateError } = await db
      .from("gmail_oauth_tokens")
      .update({
        history_id: watch.historyId,
        watch_expiration: new Date(Number(watch.expiration)).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("account_email", GMAIL.toLowerCase());
    if (updateError) throw updateError;
    return synced;
  }
}
