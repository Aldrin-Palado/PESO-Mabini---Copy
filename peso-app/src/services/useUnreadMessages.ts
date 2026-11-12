import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useUnreadMessages(userId?: string | null): boolean {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    if (!userId) {
      setHasUnreadMessages(false);
      return;
    }

    let active = true;
    let refreshVersion = 0;
    const refreshUnreadStatus = async () => {
      const version = ++refreshVersion;
      const { count, error } = await supabase
        .from("peso_messages")
        .select("message_id", { count: "exact", head: true })
        .eq("recipient_user_id", userId)
        .is("read_at", null);

      if (error) {
        console.error("Could not check for unread messages:", error);
        return;
      }

      if (active && version === refreshVersion) {
        setHasUnreadMessages((count ?? 0) > 0);
      }
    };

    void refreshUnreadStatus();

    const channel = supabase
      .channel(`unread-message-indicator-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peso_messages",
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => void refreshUnreadStatus(),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Unread message subscription failed: ${status}`);
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return hasUnreadMessages;
}
