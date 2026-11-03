import { supabase } from "./supabase";

export type ApplicationDecisionResult = {
  status: "hired" | "rejected";
  message_sent: boolean;
};

export async function decideApplication(
  applicationId: string,
  approved: boolean,
): Promise<ApplicationDecisionResult> {
  const { data, error } = await supabase.rpc("admin_decide_application", {
    p_application_id: applicationId,
    p_approved: approved,
  });
  if (error) {
    console.error("Application decision failed:", error);
    throw new Error(`Could not update application decision: ${error.message}`);
  }
  if (
    !data ||
    typeof data !== "object" ||
    !("status" in data) ||
    (data.status !== "hired" && data.status !== "rejected") ||
    !("message_sent" in data) ||
    typeof data.message_sent !== "boolean"
  ) {
    throw new Error("The server returned an invalid application decision.");
  }
  return {
    status: data.status,
    message_sent: data.message_sent,
  };
}
