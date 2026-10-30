import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

const IDLE_TIMEOUT_MS = 5 * 60 * 60 * 1000;
const STORAGE_KEY_PREFIX = "peso:last-activity:";
const STORAGE_WRITE_INTERVAL_MS = 15 * 1000;

function SessionTimeout() {
  const navigate = useNavigate();

  useEffect(() => {
    let userId: string | null = null;
    let lastActivityAt = 0;
    let lastStorageWriteAt = 0;
    let expirationTimer: number | undefined;
    let expiring = false;
    let disposed = false;

    const getStorageKey = (id: string) => `${STORAGE_KEY_PREFIX}${id}`;

    const clearTimer = () => {
      if (expirationTimer !== undefined) {
        window.clearTimeout(expirationTimer);
        expirationTimer = undefined;
      }
    };

    const expireSession = async () => {
      if (!userId || expiring) return;

      if (Date.now() - lastActivityAt < IDLE_TIMEOUT_MS) {
        scheduleExpiration();
        return;
      }

      expiring = true;
      clearTimer();

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Could not sign out expired session:", error);
      }

      if (!disposed) {
        navigate("/login", {
          replace: true,
          state: { sessionExpired: true },
        });
      }
    };

    const scheduleExpiration = () => {
      clearTimer();
      if (!userId || expiring) return;

      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivityAt);
      if (remaining <= 0) {
        void expireSession();
        return;
      }

      expirationTimer = window.setTimeout(
        () => void expireSession(),
        remaining,
      );
    };

    const writeLastActivity = (timestamp: number) => {
      if (!userId) return;

      try {
        const key = getStorageKey(userId);
        const storedTimestamp = Number(localStorage.getItem(key));
        const latestTimestamp =
          Number.isFinite(storedTimestamp) &&
          storedTimestamp > 0 &&
          storedTimestamp <= Date.now()
            ? Math.max(timestamp, storedTimestamp)
            : timestamp;
        localStorage.setItem(key, String(latestTimestamp));
        lastStorageWriteAt = latestTimestamp;
      } catch (error) {
        console.error("Could not persist session activity:", error);
      }
    };

    const activateSession = (id: string, resetActivity: boolean) => {
      if (!resetActivity && userId === id) return;

      userId = id;
      expiring = false;

      if (resetActivity) {
        lastActivityAt = Date.now();
        writeLastActivity(lastActivityAt);
        scheduleExpiration();
        return;
      }

      let storedActivity: string | null = null;
      try {
        storedActivity = localStorage.getItem(getStorageKey(id));
      } catch (error) {
        console.error("Could not read persisted session activity:", error);
      }

      const parsedActivity = storedActivity
        ? Number(storedActivity)
        : Number.NaN;
      const now = Date.now();

      if (Number.isFinite(parsedActivity) && parsedActivity > 0) {
        lastActivityAt = Math.min(parsedActivity, now);
        if (parsedActivity > now) {
          writeLastActivity(lastActivityAt);
        }
      } else {
        lastActivityAt = now;
        writeLastActivity(lastActivityAt);
      }

      lastStorageWriteAt = lastActivityAt;
      scheduleExpiration();
    };

    const clearSession = () => {
      clearTimer();
      if (userId) {
        try {
          localStorage.removeItem(getStorageKey(userId));
        } catch (error) {
          console.error("Could not clear persisted session activity:", error);
        }
      }
      userId = null;
      lastActivityAt = 0;
      lastStorageWriteAt = 0;
      expiring = false;
    };

    const recordActivity = () => {
      if (!userId || expiring) return;

      lastActivityAt = Date.now();
      if (lastActivityAt - lastStorageWriteAt >= STORAGE_WRITE_INTERVAL_MS) {
        writeLastActivity(lastActivityAt);
        scheduleExpiration();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (!userId || event.key !== getStorageKey(userId) || !event.newValue) {
        return;
      }

      const timestamp = Number(event.newValue);
      if (!Number.isFinite(timestamp) || timestamp <= lastActivityAt) return;

      lastActivityAt = Math.min(timestamp, Date.now());
      lastStorageWriteAt = lastActivityAt;
      scheduleExpiration();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleExpiration();
      }
    };

    const handlePageHide = () => {
      if (userId && !expiring) {
        writeLastActivity(lastActivityAt);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          clearSession();
        } else if (session?.user) {
          activateSession(session.user.id, event === "SIGNED_IN");
        }
      },
    );

    void supabase.auth.getSession().then(({ data, error }) => {
      if (disposed) return;
      if (error) {
        console.error("Could not check the current login session:", error);
        return;
      }
      if (data.session?.user) {
        activateSession(data.session.user.id, false);
      }
    });

    document.addEventListener("pointerdown", recordActivity);
    document.addEventListener("pointermove", recordActivity);
    document.addEventListener("keydown", recordActivity);
    document.addEventListener("touchstart", recordActivity);
    document.addEventListener("scroll", recordActivity, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("storage", handleStorage);

    return () => {
      disposed = true;
      clearTimer();
      authListener.subscription.unsubscribe();
      document.removeEventListener("pointerdown", recordActivity);
      document.removeEventListener("pointermove", recordActivity);
      document.removeEventListener("keydown", recordActivity);
      document.removeEventListener("touchstart", recordActivity);
      document.removeEventListener("scroll", recordActivity, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("storage", handleStorage);
    };
  }, [navigate]);

  return null;
}

export default SessionTimeout;
