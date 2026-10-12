import { supabase } from "./supabase";

type AIAction = "chat" | "job-matches" | "resume-screening";

export async function invokePesoAI<T>(
  action: AIAction,
  payload: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("peso-ai", {
    body: { action, ...payload },
  });

  if (error) {
    console.error(`PESO AI ${action} request failed:`, error);
    let detail = "";
    let status = "";
    if (error.context instanceof Response) {
      status = `HTTP ${error.context.status}${error.context.statusText ? ` ${error.context.statusText}` : ""}`;
      try {
        const responseText = await error.context.clone().text();
        if (responseText) {
          try {
            const responseBody: unknown = JSON.parse(responseText);
            if (responseBody && typeof responseBody === "object") {
              if ("error" in responseBody && typeof responseBody.error === "string") {
                detail = responseBody.error;
              } else if (
                "message" in responseBody &&
                typeof responseBody.message === "string"
              ) {
                detail = responseBody.message;
              } else {
                detail = JSON.stringify(responseBody);
              }
            } else {
              detail = String(responseBody);
            }
          } catch {
            detail = responseText.slice(0, 500);
          }
        }
      } catch {
        // Keep the HTTP status and SDK message when the response body is unavailable.
      }
    }
    const diagnostic = [status, detail || error.message].filter(Boolean).join(": ");
    throw new Error(
      `AI request failed${diagnostic ? ` (${diagnostic})` : ""}. Check the Supabase Edge Function logs for additional details.`,
    );
  }

  if (!data || typeof data !== "object") {
    throw new Error("The AI service returned an invalid response.");
  }

  if ("error" in data && typeof data.error === "string") {
    throw new Error(data.error);
  }

  return data as T;
}
