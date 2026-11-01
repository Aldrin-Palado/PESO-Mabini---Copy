import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type GmailMessage = {
  gmail_message_id: string;
  thread_id: string;
  from_address: string;
  to_address: string;
  subject: string;
  snippet: string;
  body_text: string;
  internal_date: string;
};

type GmailInboxResponse = {
  account: string;
  messages: GmailMessage[];
};

export default function GmailInboxModule() {
  const [account, setAccount] = useState("");
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadInbox = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    const { data, error: inboxError } = await supabase.functions.invoke<
      GmailInboxResponse
    >("gmail-inbox", { method: "GET" });

    if (inboxError) {
      setError(inboxError.message || "Could not load Gmail inbox.");
    } else if (data) {
      setAccount(data.account);
      setMessages(data.messages);
      setSelectedId((current) =>
        data.messages.some((message) => message.gmail_message_id === current)
          ? current
          : data.messages[0]?.gmail_message_id ?? "",
      );
      setLastUpdated(new Date());
      setError("");
    }
    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    void loadInbox(true);
    const interval = window.setInterval(() => {
      void loadInbox(false);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [loadInbox]);

  const selectedMessage =
    messages.find((message) => message.gmail_message_id === selectedId) ?? null;

  const connectGmail = async () => {
    setConnecting(true);
    setError("");
    const { data, error: connectError } = await supabase.functions.invoke<
      { authorization_url: string }
    >("gmail-oauth-start", { method: "POST" });
    if (connectError || !data?.authorization_url) {
      setError(connectError?.message || "Could not start Gmail authorization.");
      setConnecting(false);
      return;
    }
    window.location.assign(data.authorization_url);
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#123B70]">Gmail Inbox</h1>
          <p className="mt-1 text-sm text-slate-500">
            {account ? `Connected to ${account}` : "Incoming mail for PESO staff"}
            {lastUpdated
              ? ` · Updated ${lastUpdated.toLocaleTimeString()}`
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void connectGmail()}
            disabled={connecting}
            className="rounded-xl border border-[#0446A7] px-4 py-2 text-sm font-bold text-[#0446A7] transition hover:bg-blue-50 disabled:opacity-50"
          >
            {connecting ? "Connecting..." : "Connect / Reconnect"}
          </button>
          <button
            type="button"
            onClick={() => void loadInbox(true)}
            disabled={loading}
            className="rounded-xl bg-[#0446A7] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#123B70] disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      <div className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[minmax(16rem,0.4fr)_1fr]">
        <aside className="max-h-80 overflow-y-auto border-b border-slate-200 md:max-h-[38rem] md:border-b-0 md:border-r">
          {loading && messages.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Loading inbox...</p>
          ) : messages.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              No incoming messages yet. New Gmail messages will appear here.
            </p>
          ) : (
            messages.map((message) => (
              <button
                key={message.gmail_message_id}
                type="button"
                onClick={() => setSelectedId(message.gmail_message_id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition ${
                  selectedId === message.gmail_message_id
                    ? "bg-blue-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <span className="block truncate text-xs text-slate-500">
                  {message.from_address || "Unknown sender"}
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-slate-900">
                  {message.subject}
                </span>
                <span className="mt-1 block line-clamp-2 text-xs text-slate-500">
                  {message.snippet}
                </span>
                <time
                  className="mt-2 block text-[0.7rem] text-slate-400"
                  dateTime={message.internal_date}
                >
                  {new Date(message.internal_date).toLocaleString()}
                </time>
              </button>
            ))
          )}
        </aside>

        <article className="min-w-0 p-5 sm:p-7">
          {selectedMessage ? (
            <>
              <h2 className="break-words text-lg font-bold text-slate-900">
                {selectedMessage.subject}
              </h2>
              <dl className="mt-4 space-y-1 border-b border-slate-100 pb-4 text-sm">
                <div>
                  <dt className="inline font-semibold text-slate-700">From: </dt>
                  <dd className="inline break-words text-slate-600">
                    {selectedMessage.from_address}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-700">To: </dt>
                  <dd className="inline break-words text-slate-600">
                    {selectedMessage.to_address}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-700">Received: </dt>
                  <dd className="inline text-slate-600">
                    {new Date(selectedMessage.internal_date).toLocaleString()}
                  </dd>
                </div>
              </dl>
              <pre className="mt-5 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-800">
                {selectedMessage.body_text || selectedMessage.snippet || "(No message body)"}
              </pre>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">
              Select an email to read it.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
