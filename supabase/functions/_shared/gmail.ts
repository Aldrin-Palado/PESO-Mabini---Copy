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
  return b64url(crypto.getRandomValues(new Uint8Array(32)));
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
