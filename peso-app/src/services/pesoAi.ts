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
    throw new Error(
      `AI request failed: ${error.message}. Confirm the Supabase Edge Function is deployed and GEMINI_API_KEY is configured.`,
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
