import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "../services/supabase";

export type MessageMode = "admin" | "staff" | "employer" | "job_seeker";

type MessageContact = {
  user_id: string;
  display_name: string;
  role: string;
};

type PesoMessage = {
  message_id: string;
  employer_id: string | null;
  sender_user_id: string;
  recipient_user_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type Props = {
  mode: MessageMode;
};

const roleLabels: Record<MessageMode, string> = {
  admin: "Admin",
  staff: "Staff",
  employer: "Employer",
  job_seeker: "Job Seeker",
};

export default function DirectMessages({ mode }: Props) {
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [messages, setMessages] = useState<PesoMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedContact =
    contacts.find((contact) => contact.user_id === selectedUserId) ?? null;
  const recipientUserId = selectedContact?.user_id;

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (!cancelled) {
          setError(authError?.message || "Please sign in to use messages.");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setUserId(user.id);

      const { data, error: contactsError } = await supabase.rpc(
        "get_peso_message_contacts",
      );

      if (cancelled) return;
      if (contactsError) {
        setError(`Could not load contacts: ${contactsError.message}`);
      } else {
        const availableContacts = (data ?? []) as MessageContact[];
        setContacts(availableContacts);
        setSelectedUserId((current) =>
          availableContacts.some((contact) => contact.user_id === current)
            ? current
            : availableContacts[0]?.user_id ?? "",
        );
      }

      if (!cancelled) setLoading(false);
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const loadMessages = useCallback(
    async (showLoading: boolean) => {
      if (!selectedUserId || !userId) {
        setMessages([]);
        return;
      }

      if (showLoading) setLoading(true);
      const { data, error: messageError } = await supabase
        .from("peso_messages")
        .select(
          "message_id, employer_id, sender_user_id, recipient_user_id, body, created_at, read_at",
        )
        .or(
          `and(sender_user_id.eq.${userId},recipient_user_id.eq.${selectedUserId}),and(sender_user_id.eq.${selectedUserId},recipient_user_id.eq.${userId})`,
        )
        .order("created_at", { ascending: true });

      if (messageError) {
        setError(`Could not load messages: ${messageError.message}`);
        if (showLoading) setLoading(false);
        return;
      }

      const thread = (data ?? []) as PesoMessage[];
      setMessages(thread);
      setError("");

      const unreadIds = thread
        .filter((message) => message.recipient_user_id === userId && !message.read_at)
        .map((message) => message.message_id);

      if (unreadIds.length > 0) {
        const readAt = new Date().toISOString();
        const { error: readError } = await supabase
          .from("peso_messages")
          .update({ read_at: readAt })
          .in("message_id", unreadIds);

        if (readError) {
          console.error("Could not mark messages as read:", readError);
        } else {
          setMessages((current) =>
            current.map((message) =>
              unreadIds.includes(message.message_id)
                ? { ...message, read_at: readAt }
                : message,
            ),
          );
        }
      }

      if (showLoading) setLoading(false);
    },
    [selectedUserId, userId],
  );

  useEffect(() => {
    if (!selectedUserId || !userId || !recipientUserId) {
      setMessages([]);
      return;
    }

    void loadMessages(true);
    const interval = window.setInterval(() => {
      void loadMessages(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadMessages, recipientUserId, selectedUserId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();

    if (!body || !selectedUserId || !recipientUserId || sending) return;

    setSending(true);
    setError("");

    const { error: sendError } = await supabase.from("peso_messages").insert({
      sender_user_id: userId,
      recipient_user_id: recipientUserId,
      body,
    });

    if (sendError) {
      setError(`Message could not be sent: ${sendError.message}`);
    } else {
      setDraft("");
      await loadMessages(false);
    }

    setSending(false);
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-black text-[#123B70]">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">
          Contact admins, staff, employers, and job seekers.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[minmax(14rem,0.35fr)_1fr]">
        <aside className="border-b border-slate-200 md:border-b-0 md:border-r">
            <h2 className="border-b border-slate-100 px-4 py-4 font-bold text-slate-800">
              Contacts
            </h2>
            <div className="max-h-72 overflow-y-auto md:max-h-[32rem]">
              {contacts.length === 0 && !loading ? (
                <p className="p-4 text-sm text-slate-500">No other PESO users found.</p>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.user_id}
                    type="button"
                    onClick={() => setSelectedUserId(contact.user_id)}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition ${
                      selectedUserId === contact.user_id
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {contact.display_name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {contact.role}
                    </span>
                  </button>
                ))
              )}
            </div>
        </aside>

        <div className="flex min-h-[32rem] min-w-0 flex-col">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              {selectedContact?.display_name || "Select a contact"}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedContact?.role || roleLabels[mode]}
            </p>
          </header>

          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4 sm:p-6"
          >
            {loading ? (
              <p className="py-12 text-center text-sm text-slate-500">Loading conversation...</p>
            ) : !selectedUserId || !recipientUserId ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Select a contact to start a conversation.
              </p>
            ) : messages.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                No messages yet. Send a message to start the conversation.
              </p>
            ) : (
              messages.map((message) => {
                const ownMessage = message.sender_user_id === userId;
                return (
                  <div
                    key={message.message_id}
                    className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}
                  >
                    <article
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        ownMessage
                          ? "rounded-br-md bg-[#0446A7] text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                      <time
                        className={`mt-2 block text-right text-[0.7rem] ${
                          ownMessage ? "text-blue-100" : "text-slate-400"
                        }`}
                        dateTime={message.created_at}
                      >
                        {new Date(message.created_at).toLocaleString()}
                      </time>
                    </article>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-3 border-t border-slate-100 p-4">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message..."
              aria-label="Message"
              maxLength={5000}
              rows={2}
              disabled={!recipientUserId || sending}
              className="min-h-12 flex-1 resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!draft.trim() || !recipientUserId || sending}
              className="self-end rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123B70] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
