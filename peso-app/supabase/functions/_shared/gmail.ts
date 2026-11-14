import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const environmentValue = (...names: string[]) => {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim();
    if (value) return value;
  }
  return "";
};

export const URL_BASE = environmentValue("SUPABASE_URL");
export const ADMIN_KEY =
  environmentValue("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
export const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")?.trim() ?? "";
export const CLIENT_SECRET =
  Deno.env.get("GOOGLE_CLIENT_SECRET")?.trim() ?? "";
export const REDIRECT = Deno.env.get("GMAIL_REDIRECT_URI")?.trim() ?? "";
export const GMAIL = environmentValue("GMAIL_ACCOUNT");
export const PUBSUB_OIDC_AUDIENCE = environmentValue(
  "PUBSUB_OIDC_AUDIENCE",
  "GOOGLE_PUBSUB_AUDIENCE",
);
export const PUBSUB_PUSH_SERVICE_ACCOUNT = environmentValue(
  "PUBSUB_PUSH_SERVICE_ACCOUNT",
  "GOOGLE_PUBSUB_SERVICE_ACCOUNT",
);

export function gmailConfigurationStatus() {
  const expectedCallback = `${URL_BASE.replace(/\/+$/, "")}/functions/v1/gmail-oauth-callback`;
  return {
    client_id_configured: Boolean(CLIENT_ID),
    client_id_format_valid: CLIENT_ID.endsWith(".apps.googleusercontent.com"),
    callback_uri_configured: Boolean(REDIRECT),
    callback_uri_matches_project: REDIRECT === expectedCallback,
    pubsub_topic_configured: Boolean(environmentValue("GMAIL_PUBSUB_TOPIC")),
    pubsub_subscription_configured: Boolean(
      environmentValue("GMAIL_PUBSUB_SUBSCRIPTION"),
    ),
    pubsub_identity_configured: Boolean(
      PUBSUB_OIDC_AUDIENCE && PUBSUB_PUSH_SERVICE_ACCOUNT,
    ),
    delivery_job_secret_configured: Boolean(
      environmentValue("GMAIL_JOB_SECRET"),
    ),
  };
}

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

export function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export function randomState() {
  return b64url(crypto.getRandomValues(new Uint8Array(32)));
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

function tokenEncryptionKey() {
  const encoded = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
  const raw = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  if (raw.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return raw;
}

export async function encryptToken(token: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    tokenEncryptionKey(),
    "AES-GCM",
    false,
    ["encrypt"],
  );
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

export async function decryptToken(value: string) {
  const [version, encodedIv, encodedCipher, ...extra] = value.split(".");
  if (version !== "v1" || !encodedIv || !encodedCipher || extra.length > 0) {
    throw new Error("Stored Gmail token has an unsupported format");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    tokenEncryptionKey(),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64Url(encodedIv) },
    key,
    decodeBase64Url(encodedCipher),
  );
  return new TextDecoder().decode(plaintext);
}

export async function gmailAccessToken() {
  const { data: connection, error } = await adminDb()
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
  const tokens = await response.json() as { access_token?: string };
  if (!tokens.access_token) {
    throw new Error("Google did not return an access token");
  }
  return tokens.access_token;
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
  const result = await response.json() as {
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
  if (!response.ok) {
    throw new Error("Could not load Google's public signing keys");
  }
  const result = await response.json() as { keys?: GoogleJwk[] };
  if (!result.keys?.length) {
    throw new Error("Google returned no public signing keys");
  }
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
  const audience = PUBSUB_OIDC_AUDIENCE;
  const serviceAccount = PUBSUB_PUSH_SERVICE_ACCOUNT;
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  console.error("Pub/Sub identity diagnostics:", {
    audienceConfigured: Boolean(audience),
    serviceAccountConfigured: Boolean(serviceAccount),
    audienceMatches: audiences.includes(audience),
    issuerValid: [
      "https://accounts.google.com",
      "accounts.google.com",
    ].includes(String(claims.iss)),
    serviceAccountMatches: claims.email === serviceAccount,
    emailVerified: claims.email_verified === true,
    expirationValid:
      typeof claims.exp === "number" && claims.exp > now,
    issuedAtValid:
      typeof claims.iat === "number" &&
      claims.iat <= now + 60 &&
      claims.iat >= now - 3600,
  });
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
