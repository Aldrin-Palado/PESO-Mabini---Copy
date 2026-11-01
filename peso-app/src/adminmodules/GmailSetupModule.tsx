import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type GmailSetupStatus = {
  connected: boolean;
  previously_authorized: boolean;
  account: string | null;
  watch_expires_at: string | null;
};

export default function GmailSetupModule() {
  const [status, setStatus] = useState<GmailSetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const { data, error: statusError } = await supabase.functions.invoke<
      GmailSetupStatus
    >("gmail-inbox", { method: "GET" });
    if (statusError) {
      setError(statusError.message || "Could not load Gmail authorization status.");
      setStatus(null);
    } else if (data) {
      setStatus(data);
      setError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const authorize = async () => {
    setAuthorizing(true);
    setError("");
    const { data, error: startError } = await supabase.functions.invoke<
      { authorization_url: string }
    >("gmail-oauth-start", { method: "POST" });
    if (startError || !data?.authorization_url) {
      setError(startError?.message || "Could not begin Gmail authorization.");
      setAuthorizing(false);
      return;
    }
    window.location.assign(data.authorization_url);
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-black text-[#123B70]">
          Official Gmail Setup
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          One-time authorization for the PESO Head/Admin. Gmail credentials and
          tokens remain on the server.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Checking authorization...</p>
        ) : !status ? (
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Check setup status again
          </button>
        ) : status?.connected ? (
          <div className="space-y-2">
            <p className="font-bold text-emerald-800">
              Official Gmail account authorized
            </p>
            <p className="text-sm text-slate-700">{status.account}</p>
            <p className="text-sm text-slate-500">
              Background synchronization is active.
              {status.watch_expires_at
                ? ` Notifications renew automatically; next watch expiration is ${new Date(status.watch_expires_at).toLocaleString()}.`
                : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              {status?.previously_authorized
                ? `The official account (${status.account}) has read-only authorization. Complete the one-time authorization upgrade to enable sending and conversation synchronization.`
                : "Authorize the configured official PESO Gmail account once. The account will then send PESO-Hub messages and synchronize replies only for established PESO conversations."}
            </p>
            <button
              type="button"
              onClick={() => void authorize()}
              disabled={authorizing}
              className="rounded-xl bg-[#0446A7] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#123B70] disabled:opacity-50"
            >
              {authorizing
                ? "Opening Google..."
                : status?.previously_authorized
                ? "Complete Gmail authorization"
                : "Authorize official Gmail account"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
