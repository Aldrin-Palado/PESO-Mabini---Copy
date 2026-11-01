import { createClient } from "npm:@supabase/supabase-js@2";

export const URL_BASE = Deno.env.get("SUPABASE_URL")!;
export const ADMIN_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_SECRET_KEY");
export const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
export const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
export const REDIRECT = Deno.env.get("GMAIL_REDIRECT_URI")!;
export const GMAIL = Deno.env.get("GMAIL_ACCOUNT")!;

export function requireConfig() {
  if (
    ![
      URL_BASE,
      ADMIN_KEY,
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT,
      GMAIL,
      Deno.env.get("TOKEN_ENCRYPTION_KEY"),
    ].every(Boolean)
  ) {
    throw new Error("Missing required OAuth environment configuration");
  }
}

export function adminDb() {
  return createClient(URL_BASE, ADMIN_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return b64url(bytes);
}

export function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function encryptToken(token: string) {
  const encodedKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
  const raw = Uint8Array.from(atob(encodedKey), (char) => char.charCodeAt(0));
  if (raw.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  }

  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(token),
    ),
  );
  return `v1.${b64url(iv)}.${b64url(cipher)}`;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export async function decryptToken(value: string) {
  const [version, encodedIv, encodedCipher, ...extra] = value.split(".");
  if (version !== "v1" || !encodedIv || !encodedCipher || extra.length > 0) {
    throw new Error("Stored Gmail token has an unsupported format");
  }

  const encodedKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
  const raw = Uint8Array.from(atob(encodedKey), (char) => char.charCodeAt(0));
  if (raw.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  }

  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "decrypt",
  ]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64Url(encodedIv) },
    key,
    decodeBase64Url(encodedCipher),
  );
  return new TextDecoder().decode(plaintext);
}

export async function gmailAccessToken() {
  const db = adminDb();
  const { data: connection, error } = await db
    .from("gmail_oauth_tokens")
    .select("refresh_token_encrypted")
    .eq("account_email", GMAIL.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!connection) throw new Error("Gmail has not been connected yet");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: await decryptToken(connection.refresh_token_encrypted),
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    console.error("Google access-token refresh failed:", response.status);
    throw new Error("Could not refresh the Gmail access token");
  }

  const tokens = (await response.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new Error("Google did not return an access token");
  }
  return tokens.access_token;
}

type GmailMessagePart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePart[];
};

type GmailMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  } & GmailMessagePart;
};

function decodeHeader(value: string) {
  return value.replace(
    /=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g,
    (_match, charset: string, encoding: string, content: string) => {
      try {
        if (encoding.toLowerCase() === "b") {
          return new TextDecoder(charset).decode(decodeBase64Url(content));
        }
        const bytes: number[] = [];
        for (let index = 0; index < content.length; index += 1) {
          if (content[index] === "_") {
            bytes.push(0x20);
          } else if (
            content[index] === "=" &&
            /^[0-9A-F]{2}$/i.test(content.slice(index + 1, index + 3))
          ) {
            bytes.push(Number.parseInt(content.slice(index + 1, index + 3), 16));
            index += 2;
          } else {
            bytes.push(content.charCodeAt(index));
          }
        }
        return new TextDecoder(charset).decode(Uint8Array.from(bytes));
      } catch {
        return content;
      }
    },
  );
}

function collectMessageBodies(part: GmailMessagePart): {
  plain: string[];
  html: string[];
} {
  const result = { plain: [] as string[], html: [] as string[] };
  if (part.body?.data) {
    const text = new TextDecoder().decode(decodeBase64Url(part.body.data));
    if (part.mimeType === "text/plain") result.plain.push(text);
    if (part.mimeType === "text/html") result.html.push(text);
  }
  for (const child of part.parts ?? []) {
    const childBodies = collectMessageBodies(child);
    result.plain.push(...childBodies.plain);
    result.html.push(...childBodies.html);
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

function headerValue(message: GmailMessage, name: string) {
  const header = message.payload?.headers?.find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );
  return header ? decodeHeader(header.value) : "";
}

export async function storeGmailMessage(
  accessToken: string,
  messageId: string,
) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    console.error("Gmail message fetch failed:", response.status);
    throw new Error("Could not fetch a Gmail message");
  }

  const message = (await response.json()) as GmailMessage;
  const bodies = message.payload ? collectMessageBodies(message.payload) : null;
  const bodyText = bodies
    ? (bodies.plain.length > 0
      ? bodies.plain.join("\n")
      : htmlToPlainText(bodies.html.join("\n"))).slice(0, 100_000)
    : "";
  const internalDate = message.internalDate
    ? new Date(Number(message.internalDate)).toISOString()
    : new Date().toISOString();

  const { error } = await adminDb().from("gmail_messages").upsert(
    {
      gmail_message_id: message.id,
      thread_id: message.threadId ?? message.id,
      from_address: headerValue(message, "from"),
      to_address: headerValue(message, "to"),
      subject: headerValue(message, "subject") || "(no subject)",
      snippet: message.snippet ?? "",
      body_text: bodyText,
      internal_date: internalDate,
    },
    { onConflict: "gmail_message_id" },
  );
  if (error) throw error;
}

export async function syncGmailHistory(accessToken: string) {
  const db = adminDb();
  const { data: connection, error: connectionError } = await db
    .from("gmail_oauth_tokens")
    .select("history_id")
    .eq("account_email", GMAIL.toLowerCase())
    .maybeSingle();
  if (connectionError) throw connectionError;
  if (!connection?.history_id) {
    throw new Error("Gmail history cursor is missing; reconnect Gmail");
  }

  const messageIds = new Set<string>();
  let pageToken: string | undefined;
  let latestHistoryId = connection.history_id as string;
  let pages = 0;

  do {
    const parameters = new URLSearchParams({
      startHistoryId: connection.history_id,
      historyTypes: "messageAdded",
      maxResults: "500",
    });
    if (pageToken) parameters.set("pageToken", pageToken);

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?${parameters}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) {
      console.error("Gmail history sync failed:", response.status);
      const historyError = new Error(
        "Could not read Gmail history; check the Gmail connection",
      );
      Object.assign(historyError, { status: response.status });
      throw historyError;
    }

    const result = (await response.json()) as {
      historyId?: string;
      nextPageToken?: string;
      history?: Array<{
        messagesAdded?: Array<{ message?: { id?: string } }>;
      }>;
    };
    latestHistoryId = result.historyId ?? latestHistoryId;
    for (const record of result.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        if (added.message?.id) messageIds.add(added.message.id);
      }
    }
    pageToken = result.nextPageToken;
    pages += 1;
  } while (pageToken && pages < 10);

  if (pageToken) {
    throw new Error("Gmail history sync exceeded its safe page limit");
  }
  for (const messageId of messageIds) {
    await storeGmailMessage(accessToken, messageId);
  }

  const { error: updateError } = await db
    .from("gmail_oauth_tokens")
    .update({ history_id: latestHistoryId, updated_at: new Date().toISOString() })
    .eq("account_email", GMAIL.toLowerCase());
  if (updateError) throw updateError;

  return messageIds.size;
}

export async function syncGmailHistoryWithRecovery(accessToken: string) {
  try {
    return await syncGmailHistory(accessToken);
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("status" in error) ||
      error.status !== 404
    ) {
      throw error;
    }

    console.warn("Gmail history expired; rebuilding the recent inbox cursor.");
    const watch = await startGmailWatch(accessToken);
    const parameters = new URLSearchParams({
      q: "in:inbox newer_than:30d",
      maxResults: "50",
    });
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${parameters}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) {
      console.error("Gmail inbox recovery failed:", response.status);
      throw new Error("Could not rebuild the recent Gmail inbox");
    }

    const result = (await response.json()) as {
      messages?: Array<{ id: string }>;
    };
    for (const message of result.messages ?? []) {
      await storeGmailMessage(accessToken, message.id);
    }

    const { error: updateError } = await adminDb()
      .from("gmail_oauth_tokens")
      .update({
        history_id: watch.historyId,
        watch_expiration: new Date(Number(watch.expiration)).toISOString(),
        initial_sync_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq("account_email", GMAIL.toLowerCase());
    if (updateError) throw updateError;

    return result.messages?.length ?? 0;
  }
}

export async function backfillRecentGmailMessages() {
  const db = adminDb();
  const { data: connection, error } = await db
    .from("gmail_oauth_tokens")
    .select("initial_sync_complete")
    .eq("account_email", GMAIL.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!connection || connection.initial_sync_complete) return;

  const accessToken = await gmailAccessToken();
  const parameters = new URLSearchParams({
    q: "in:inbox newer_than:30d",
    maxResults: "20",
  });
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${parameters}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    console.error("Initial Gmail inbox sync failed:", response.status);
    throw new Error("Could not load recent Gmail messages");
  }

  const result = (await response.json()) as {
    messages?: Array<{ id: string }>;
  };
  for (const message of result.messages ?? []) {
    await storeGmailMessage(accessToken, message.id);
  }

  const { error: updateError } = await db
    .from("gmail_oauth_tokens")
    .update({
      initial_sync_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq("account_email", GMAIL.toLowerCase());
  if (updateError) throw updateError;
}

export async function startGmailWatch(accessToken: string) {
  const topic = Deno.env.get("GMAIL_PUBSUB_TOPIC");
  if (!topic || !/^projects\/[^/]+\/topics\/[^/]+$/.test(topic)) {
    throw new Error("GMAIL_PUBSUB_TOPIC must be a fully qualified Pub/Sub topic");
  }

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/watch",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicName: topic,
        labelIds: ["INBOX"],
        labelFilterAction: "include",
      }),
    },
  );
  if (!response.ok) {
    console.error("Gmail watch registration failed:", response.status);
    throw new Error("Could not register Gmail push notifications");
  }

  const result = (await response.json()) as {
    historyId?: string;
    expiration?: string;
  };
  if (!result.historyId || !result.expiration) {
    throw new Error("Gmail returned an incomplete watch registration");
  }
  return { historyId: result.historyId, expiration: result.expiration };
}

type GoogleJwk = JsonWebKey & { kid?: string; alg?: string };
let cachedPubSubKeys: GoogleJwk[] = [];
let pubSubKeysExpireAt = 0;

async function pubSubKeys() {
  if (Date.now() < pubSubKeysExpireAt && cachedPubSubKeys.length > 0) {
    return cachedPubSubKeys;
  }
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) throw new Error("Could not load Google's public signing keys");
  const result = (await response.json()) as { keys?: GoogleJwk[] };
  if (!result.keys?.length) throw new Error("Google returned no public signing keys");

  const cacheControl = response.headers.get("Cache-Control") ?? "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/i)?.[1] ?? 300);
  cachedPubSubKeys = result.keys;
  pubSubKeysExpireAt = Date.now() + maxAge * 1000;
  return cachedPubSubKeys;
}

export async function verifyPubSubIdentity(token: string) {
  const [encodedHeader, encodedPayload, encodedSignature, ...extra] =
    token.split(".");
  if (
    !encodedHeader ||
    !encodedPayload ||
    !encodedSignature ||
    extra.length > 0
  ) {
    throw new Error("Invalid Pub/Sub identity token");
  }

  const decodeJson = (value: string) =>
    JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as Record<
      string,
      unknown
    >;
  const header = decodeJson(encodedHeader);
  const claims = decodeJson(encodedPayload);
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new Error("Unsupported Pub/Sub identity token");
  }

  const jwk = (await pubSubKeys()).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("Unknown Pub/Sub identity signing key");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );
  if (!validSignature) throw new Error("Invalid Pub/Sub identity signature");

  const now = Math.floor(Date.now() / 1000);
  const audience = Deno.env.get("PUBSUB_OIDC_AUDIENCE");
  const serviceAccount = Deno.env.get("PUBSUB_PUSH_SERVICE_ACCOUNT");
  const audiences = Array.isArray(claims.aud)
    ? claims.aud
    : [claims.aud];
  if (
    !audience ||
    !serviceAccount ||
    !audiences.includes(audience) ||
    !["https://accounts.google.com", "accounts.google.com"].includes(
      String(claims.iss),
    ) ||
    claims.email !== serviceAccount ||
    claims.email_verified !== true ||
    typeof claims.exp !== "number" ||
    claims.exp <= now ||
    typeof claims.iat !== "number" ||
    claims.iat > now + 60 ||
    claims.iat < now - 3600
  ) {
    throw new Error("Pub/Sub identity does not match the configured publisher");
  }
}

export function responseJson(
  data: unknown,
  status = 200,
  origin?: string,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(origin
        ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
        : {}),
    },
  });
}
