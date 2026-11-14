import {
  ADMIN_KEY,
  adminDb,
  GMAIL,
  gmailAccessToken,
  requireConfig,
  responseJson,
} from "../_shared/gmail.ts";

const recipient = "pesomabini901@gmail.com";
const maxRequestBytes = 10_000;

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function encodeBase64Url(bytes: Uint8Array) {
  return encodeBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function response(data: unknown, status: number, origin: string | null) {
  return responseJson(data, status, origin ?? undefined);
}

async function rateLimitKey(clientIp: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ADMIN_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(clientIp),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  if (request.method !== "POST") {
    return response({ error: "Method not allowed." }, 405, origin);
  }

  try {
    requireConfig();

    const contentLength = Number(request.headers.get("Content-Length") ?? 0);
    if (contentLength > maxRequestBytes) {
      return response({ error: "The message is too large." }, 413, origin);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > maxRequestBytes) {
      return response({ error: "The message is too large." }, 413, origin);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return response({ error: "Invalid request." }, 400, origin);
    }

    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload)
    ) {
      return response({ error: "Invalid request." }, 400, origin);
    }

    if (typeof payload.website === "string" && payload.website.trim()) {
      return response({ success: true }, 200, origin);
    }

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";

    if (
      name.length < 1 ||
      name.length > 120 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      /[\r\n]/.test(email) ||
      subject.length < 1 ||
      subject.length > 160 ||
      message.length < 1 ||
      message.length > 5000
    ) {
      return response({ error: "Check the form fields and try again." }, 400, origin);
    }

    const clientIp =
      request.headers.get("cf-connecting-ip")?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (!clientIp || clientIp.length > 128) {
      return response({ error: "Could not verify the request. Please try again." }, 400, origin);
    }

    const { data: allowed, error: rateLimitError } = await adminDb().rpc(
      "consume_peso_contact_submission",
      { candidate_key: await rateLimitKey(clientIp) },
    );
    if (rateLimitError) throw rateLimitError;
    if (allowed !== true) {
      return response(
        { error: "Please wait a minute before sending another message." },
        429,
        origin,
      );
    }

    const { data: connection, error: connectionError } = await adminDb()
      .from("gmail_oauth_tokens")
      .select("scope")
      .eq("account_email", GMAIL.toLowerCase())
      .maybeSingle();
    if (connectionError) throw connectionError;
    if (!connection?.scope?.includes("https://www.googleapis.com/auth/gmail.send")) {
      return response(
        { error: "PESO email delivery is not currently available." },
        503,
        origin,
      );
    }

    const subjectText = `PESO Mabini inquiry: ${subject}`;
    const bodyText = [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      message,
    ].join("\n");
    const subjectHeader = `=?UTF-8?B?${encodeBase64(new TextEncoder().encode(subjectText))}?=`;
    const rawMessage = [
      `From: ${GMAIL}`,
      `To: ${recipient}`,
      `Reply-To: ${email}`,
      `Subject: ${subjectHeader}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodeBase64(new TextEncoder().encode(bodyText)).match(/.{1,76}/g)?.join("\r\n") ?? "",
    ].join("\r\n");

    const delivery = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await gmailAccessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encodeBase64Url(new TextEncoder().encode(rawMessage)) }),
      },
    );
    if (!delivery.ok) {
      console.error("PESO contact email delivery failed:", delivery.status);
      return response({ error: "Could not send your message right now." }, 502, origin);
    }

    return response({ success: true }, 200, origin);
  } catch (error) {
    console.error("PESO contact message submission failed:", error);
    return response({ error: "Could not send your message right now." }, 500, origin);
  }
});
