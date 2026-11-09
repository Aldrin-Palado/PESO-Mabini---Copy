import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "../services/supabase";
import { decideApplication } from "../services/applicationDecisions";

export type MessageMode = "admin" | "staff" | "employer" | "job_seeker";

type MessageContact = {
  user_id: string;
  display_name: string;
  role: string;
};

type MessageParticipant = Pick<
  PesoMessage,
  "sender_user_id" | "recipient_user_id"
>;

type PesoMessage = {
  message_id: string;
  employer_id: string | null;
  sender_user_id: string;
  recipient_user_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type ApplicantApplication = {
  application_id: string;
  position_title: string | null;
  status: string;
  date_applied: string;
};

type Props = {
  mode: MessageMode;
  canDecideApplications?: boolean;
  initialContactId?: string;
};

const roleLabels: Record<MessageMode, string> = {
  admin: "Admin",
  staff: "Staff",
  employer: "Employer",
  job_seeker: "Job Seeker",
};

const hiringMessage =
  "Congratulations! You Are Hired! 🎉\n\nDear Applicant,\n\nWe are pleased to inform you that you have been successfully hired for the position you applied for!\n\nAfter reviewing your application and qualifications, the company has decided to welcome you to the team.\n\nCongratulations on your new journey! We look forward to working with you and wish you success in your new role.\n\nBest regards,\nPESO Recruitment Team";

const rejectionMessage =
  "Dear Applicant,\n\nThank you for your interest in our company. We regret to inform you that your application was not selected. We appreciate your time and effort and wish you success in your future opportunities.\n\nBest regards,\nPESO Recruitment Team";

export default function DirectMessages({
  mode,
  canDecideApplications = mode === "admin",
  initialContactId,
}: Props) {
  const [userId, setUserId] = useState("");
  const [mailboxUserId, setMailboxUserId] = useState("");
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [pendingContact, setPendingContact] = useState<MessageContact | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [messages, setMessages] = useState<PesoMessage[]>([]);
  const [applicantApplications, setApplicantApplications] = useState<
    ApplicantApplication[]
  >([]);
  const [decisionLoadingId, setDecisionLoadingId] = useState<string | null>(null);
  const [decisionNotice, setDecisionNotice] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [resolvingRecipient, setResolvingRecipient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [realtimeUnavailable, setRealtimeUnavailable] = useState(false);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [hasScrolledMessages, setHasScrolledMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedContact =
    contacts.find((contact) => contact.user_id === selectedUserId) ??
    (pendingContact?.user_id === selectedUserId ? pendingContact : null);
  const recipientUserId = selectedContact?.user_id;
  const conversationOwnerId = mode === "staff" ? mailboxUserId : userId;

  const refreshConversationContacts = useCallback(
    async (ownerId: string): Promise<MessageContact[]> => {
      const isAdminInbox = mode === "admin" || mode === "staff";
      const { data: contactData, error: contactsError } = await supabase.rpc(
        isAdminInbox
          ? "get_peso_admin_inbox_contacts"
          : "get_peso_message_contacts",
      );
      if (contactsError) throw contactsError;

      if (isAdminInbox) return (contactData ?? []) as MessageContact[];

      const { data: participantRows, error: participantsError } =
        await supabase
          .from("peso_messages")
          .select("sender_user_id, recipient_user_id")
          .or(
            `sender_user_id.eq.${ownerId},recipient_user_id.eq.${ownerId}`,
          );
      if (participantsError) throw participantsError;

      const conversationUserIds = new Set(
        ((participantRows ?? []) as MessageParticipant[]).map((message) =>
          message.sender_user_id === ownerId
            ? message.recipient_user_id
            : message.sender_user_id,
        ),
      );
      return ((contactData ?? []) as MessageContact[]).filter((contact) => {
        if (contact.user_id === ownerId) return false;
        if (mode === "job_seeker" && contact.role === "Job Seeker") return false;
        if (mode === "employer" && contact.role === "Employer") return false;
        return conversationUserIds.has(contact.user_id);
      });
    },
    [mode],
  );

  useEffect(() => {
    let cancelled = false;
    setApplicantApplications([]);
    setDecisionNotice("");
    setDecisionError("");

    if (
      mode !== "admin" ||
      !canDecideApplications ||
      selectedContact?.role !== "Job Seeker" ||
      !selectedUserId
    ) {
      return () => {
        cancelled = true;
      };
    }

    setApplicationsLoading(true);
    const loadApplicantApplications = async () => {
      const { data: seeker, error: seekerError } = await supabase
        .from("job_seeker")
        .select("job_seeker_id")
        .eq("user_id", selectedUserId)
        .maybeSingle();
      if (seekerError) throw seekerError;
      if (!seeker) return;

      const { data, error: applicationError } = await supabase
        .from("application")
        .select("application_id, position_title, status, date_applied")
        .eq("job_seeker_id", seeker.job_seeker_id)
        .order("date_applied", { ascending: false });
      if (applicationError) throw applicationError;
      if (!cancelled) {
        setApplicantApplications((data ?? []) as ApplicantApplication[]);
      }
    };

    void loadApplicantApplications()
      .catch((loadError: unknown) => {
        console.error("Could not load applicant applications in Messages:", loadError);
        if (!cancelled) {
          setDecisionError("Could not load applications for this job seeker.");
        }
      })
      .finally(() => {
        if (!cancelled) setApplicationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canDecideApplications, mode, selectedContact?.role, selectedUserId]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      setError("");
      setSessionMissing(false);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (!cancelled) {
          const missingSession = Boolean(
            !user ||
            authError?.name === "AuthSessionMissingError" ||
            authError?.message.toLowerCase().includes("auth session missing"),
          );
          setSessionMissing(missingSession);
          setError(
            missingSession
              ? "Your sign-in session has expired. Sign in again to use Messages."
              : authError?.message || "Please sign in to use messages.",
          );
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setUserId(user.id);

      let inboxOwnerId = user.id;
      if (mode === "admin" || mode === "staff") {
        const { data: adminInboxUserId, error: inboxError } = await supabase.rpc(
          "get_peso_admin_inbox_user",
        );
        if (inboxError || !adminInboxUserId) {
          if (!cancelled) {
            setError(
              inboxError
                ? `Could not access the shared Admin inbox: ${inboxError.message}`
                : "You do not have permission to access the shared Admin inbox.",
            );
            setLoading(false);
          }
          return;
        }
        inboxOwnerId = adminInboxUserId as string;
        if (!cancelled) setMailboxUserId(inboxOwnerId);
      }

      if (cancelled) return;
      const availableContacts =
        await refreshConversationContacts(inboxOwnerId);
      if (cancelled) return;
      setContacts(availableContacts);
      setSelectedUserId((current) =>
        availableContacts.some(
          (contact) => contact.user_id === initialContactId,
        )
          ? initialContactId ?? ""
          : availableContacts.some((contact) => contact.user_id === current)
            ? current
            : availableContacts[0]?.user_id ?? "",
      );

      if (!cancelled) setLoading(false);
    };

    void initialize().catch((initializeError: unknown) => {
      console.error("Could not load message conversations:", initializeError);
      if (!cancelled) {
        setError(
          initializeError instanceof Error
            ? `Could not load conversations: ${initializeError.message}`
            : "Could not load conversations.",
        );
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialContactId, mode, refreshConversationContacts]);

  useEffect(() => {
    if (!conversationOwnerId) return;

    let active = true;
    let fallbackPoll: ReturnType<typeof setInterval> | null = null;
    const refreshContacts = () => {
      void refreshConversationContacts(conversationOwnerId)
        .then((nextContacts) => {
          if (active) setContacts(nextContacts);
        })
        .catch((refreshError: unknown) => {
          console.error("Could not refresh message conversations:", refreshError);
          if (active) {
            setError(
              refreshError instanceof Error
                ? `Could not refresh conversations: ${refreshError.message}`
                : "Could not refresh conversations.",
            );
          }
        });
    };
    const channel = supabase
      .channel(`peso-conversations-${conversationOwnerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "peso_messages" },
        (payload) => {
          const message = payload.new as PesoMessage;
          if (
            message.sender_user_id === conversationOwnerId ||
            message.recipient_user_id === conversationOwnerId
          ) {
            refreshContacts();
          }
        },
      )
      .subscribe((status, subscriptionError) => {
        if (status === "SUBSCRIBED") {
          if (fallbackPoll) {
            clearInterval(fallbackPoll);
            fallbackPoll = null;
          }
          refreshContacts();
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.error("Message conversation subscription failed:", {
            status,
            error: subscriptionError,
          });
          if (!fallbackPoll) {
            fallbackPoll = setInterval(refreshContacts, 5000);
          }
        }
      });
    const consistencyPoll = setInterval(refreshContacts, 10000);

    return () => {
      active = false;
      clearInterval(consistencyPoll);
      if (fallbackPoll) clearInterval(fallbackPoll);
      void supabase.removeChannel(channel);
    };
  }, [conversationOwnerId, refreshConversationContacts]);

  const startConversationByEmail = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const email = recipientEmail.trim().toLowerCase();
    if (!email || resolvingRecipient) return;

    setResolvingRecipient(true);
    setError("");
    try {
      const { data, error: recipientError } = await supabase.rpc(
        "get_peso_message_contact_by_email",
        { candidate_email: email },
      );

      if (recipientError) {
        setError(`Could not find that PESO account: ${recipientError.message}`);
      } else {
        const contact = (data?.[0] ?? null) as MessageContact | null;
        if (!contact) {
          setError("No registered PESO account was found for that email.");
        } else {
          setPendingContact(contact);
          setSelectedUserId(contact.user_id);
          setRecipientEmail("");
        }
      }
    } catch (recipientError) {
      console.error("Could not resolve message recipient:", recipientError);
      setError("Could not look up that PESO account. Please try again.");
    } finally {
      setResolvingRecipient(false);
    }
  };

  const loadMessages = useCallback(
    async (showLoading: boolean) => {
      if (!selectedUserId || !conversationOwnerId) {
        setMessages([]);
        return;
      }

      if (showLoading) setLoading(true);
      const isAdminInbox = mode === "admin" || mode === "staff";
      const { data, error: messageError } = isAdminInbox
        ? await supabase.rpc("get_peso_admin_inbox_messages", {
            candidate_contact_id: selectedUserId,
          })
        : await supabase
            .from("peso_messages")
            .select(
              "message_id, employer_id, sender_user_id, recipient_user_id, body, created_at, read_at",
            )
            .or(
              `and(sender_user_id.eq.${conversationOwnerId},recipient_user_id.eq.${selectedUserId}),and(sender_user_id.eq.${selectedUserId},recipient_user_id.eq.${conversationOwnerId})`,
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
        .filter((message) =>
          message.recipient_user_id === conversationOwnerId && !message.read_at,
        )
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
    [conversationOwnerId, mode, selectedUserId],
  );

  useEffect(() => {
    if (!selectedUserId || !conversationOwnerId || !recipientUserId) {
      setMessages([]);
      return;
    }

    let fallbackPoll: ReturnType<typeof setInterval> | null = null;
    const channel = supabase
      .channel(`peso-messages-${conversationOwnerId}-${selectedUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "peso_messages" },
        (payload) => {
          const message = payload.new as PesoMessage;
          if (
            (message.sender_user_id === conversationOwnerId &&
              message.recipient_user_id === selectedUserId) ||
            (message.sender_user_id === selectedUserId &&
              message.recipient_user_id === conversationOwnerId)
          ) {
            void loadMessages(false);
          }
        },
      )
      .subscribe((status, subscriptionError) => {
        if (status === "SUBSCRIBED") {
          if (fallbackPoll) {
            clearInterval(fallbackPoll);
            fallbackPoll = null;
          }
          setRealtimeUnavailable(false);
          void loadMessages(false);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Message realtime subscription failed:", {
            status,
            error: subscriptionError,
          });
          setRealtimeUnavailable(true);
          if (!fallbackPoll) {
            fallbackPoll = setInterval(() => {
              void loadMessages(false);
            }, 5000);
          }
        }
      });

    const consistencyPoll =
      mode === "admin" || mode === "staff"
        ? setInterval(() => {
            void loadMessages(false);
          }, 5000)
        : null;
    void loadMessages(true);

    return () => {
      if (consistencyPoll) clearInterval(consistencyPoll);
      if (fallbackPoll) clearInterval(fallbackPoll);
      void supabase.removeChannel(channel);
    };
  }, [conversationOwnerId, loadMessages, mode, recipientUserId, selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();

    if (!body || !selectedUserId || !recipientUserId || sending) return;

    setSending(true);
    setError("");

    const { error: sendError } = mode === "staff"
      ? await supabase.rpc("send_peso_admin_inbox_reply", {
          candidate_recipient_id: recipientUserId,
          candidate_body: body,
        })
      : await supabase.from("peso_messages").insert({
          sender_user_id: userId,
          recipient_user_id: recipientUserId,
          body,
        });

    if (sendError) {
      setError(`Message could not be sent: ${sendError.message}`);
    } else {
      setDraft("");
      if (selectedContact) {
        setContacts((current) =>
          current.some((contact) => contact.user_id === selectedContact.user_id)
            ? current
            : [...current, selectedContact],
        );
        setPendingContact(null);
      }
      await loadMessages(false);
      if (conversationOwnerId) {
        try {
          const nextContacts =
            await refreshConversationContacts(conversationOwnerId);
          setContacts(nextContacts);
        } catch (refreshError) {
          console.error(
            "Message sent, but the conversation list could not be refreshed:",
            refreshError,
          );
          setError("Message sent, but the conversation list could not be refreshed.");
        }
      }
    }

    setSending(false);
  };

  const handleApplicationDecision = async (
    application: ApplicantApplication,
    action: "pending" | "under_review" | "approved" | "rejected",
  ) => {
    const finalDecision = action === "approved" || action === "rejected";
    const approved = action === "approved";
    if (
      finalDecision &&
      !window.confirm(
        approved
          ? `Approve ${application.position_title || "this application"} and send the hiring message?`
          : `Reject ${application.position_title || "this application"} and send the rejection message?`,
      )
    ) {
      return;
    }

    setDecisionLoadingId(application.application_id);
    setError("");
    setDecisionNotice("");
    try {
      if (finalDecision) {
        const result = await decideApplication(application.application_id, approved);
        setApplicantApplications((current) =>
          current.map((item) =>
            item.application_id === application.application_id
              ? { ...item, status: result.status }
              : item,
          ),
        );
        setDecisionNotice(
          result.message_sent
            ? approved
              ? "Approved. The hiring message was sent in PESO-Hub and queued for email delivery."
              : "Rejected. The rejection message was sent in PESO-Hub and queued for email delivery."
            : approved
            ? "This application is already approved. No duplicate message was sent."
            : "This application is already rejected. No duplicate message was sent.",
        );
        await loadMessages(false);
      } else {
        const { data, error: updateError } = await supabase
          .from("application")
          .update({ status: action })
          .eq("application_id", application.application_id)
          .select("application_id")
          .maybeSingle();
        if (updateError) throw updateError;
        if (!data) throw new Error("This application no longer exists.");
        setApplicantApplications((current) =>
          current.map((item) =>
            item.application_id === application.application_id
              ? { ...item, status: action }
              : item,
          ),
        );
        setDecisionNotice(
          action === "pending"
            ? "Application status set to Pending."
            : "Application status set to Under Review.",
        );
      }
    } catch (decisionError) {
      console.error("Could not decide applicant application:", decisionError);
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Could not update application decision.",
      );
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const sendContactDecisionMessage = async (
    decision: "hired" | "rejected",
  ) => {
    if (mode !== "admin" || !canDecideApplications || !userId || !selectedUserId) {
      setDecisionError("Only an Admin can send an application decision message.");
      return;
    }

    const confirmed = window.confirm(
      decision === "hired"
        ? "Send the hiring congratulations message to this Job Seeker? This will not change an application status."
        : "Send the rejection message to this Job Seeker? This will not change an application status.",
    );
    if (!confirmed) return;

    setDecisionLoadingId(`contact-${decision}`);
    setDecisionError("");
    setDecisionNotice("");
    const { error: sendError } = await supabase.from("peso_messages").insert({
      sender_user_id: userId,
      recipient_user_id: selectedUserId,
      body: decision === "hired" ? hiringMessage : rejectionMessage,
    });

    if (sendError) {
      console.error("Could not send application decision message:", sendError);
      setDecisionError(`Could not send the message: ${sendError.message}`);
    } else {
      setDecisionNotice(
        decision === "hired"
          ? "Hiring message sent in PESO-Hub and queued for Gmail. No application status was changed."
          : "Rejection message sent in PESO-Hub and queued for Gmail. No application status was changed.",
      );
      await loadMessages(false);
    }
    setDecisionLoadingId(null);
  };

  return (
    <section className="space-y-5">
      {realtimeUnavailable && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          Live updates are reconnecting. This conversation will refresh automatically.
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          {sessionMissing && (
            <a
              href="/login"
              className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-2 text-center text-xs font-bold text-red-700 hover:bg-red-100"
            >
              Sign in again
            </a>
          )}
        </div>
      )}

      <div className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[min(72vh,48rem)] md:grid-cols-[minmax(14rem,0.35fr)_1fr]">
        <aside className="border-b border-slate-200 md:border-b-0 md:border-r">
            <h2 className="border-b border-slate-100 px-4 py-4 font-bold text-slate-800">
              Contacts
            </h2>
            {(mode === "admin" ||
              mode === "staff" ||
              mode === "employer" ||
              mode === "job_seeker") && (
              <form
                onSubmit={(event) => void startConversationByEmail(event)}
                className="space-y-2 border-b border-slate-100 p-3"
              >
                <label
                  htmlFor="new-message-recipient-email"
                  className="block text-xs font-semibold text-slate-600"
                >
                  Message a registered PESO account
                </label>
                <input
                  id="new-message-recipient-email"
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={resolvingRecipient || !recipientEmail.trim()}
                  className="w-full rounded-lg bg-[#0446A7] px-3 py-2 text-xs font-bold text-white hover:bg-[#123B70] disabled:opacity-50"
                >
                  {resolvingRecipient ? "Finding account..." : "Start conversation"}
                </button>
              </form>
            )}
            <div className="max-h-72 overflow-y-auto md:max-h-[32rem]">
              {contacts.length === 0 && !loading && !error ? (
                <p className="p-4 text-sm text-slate-500">
                  {pendingContact
                    ? "No conversations yet. Send a message to start this one."
                    : "No conversations yet."}
                </p>
              ) : contacts.length === 0 && loading ? (
                <p className="p-4 text-sm text-slate-500">Loading contacts...</p>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.user_id}
                    type="button"
                    onClick={() => {
                      setPendingContact(null);
                      setSelectedUserId(contact.user_id);
                    }}
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

        <div className="flex min-h-[32rem] min-w-0 flex-col md:h-full md:min-h-0">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              {mode === "staff"
                ? selectedContact?.display_name || "Admin shared inbox"
                : selectedContact?.display_name || "Select a contact"}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "staff"
                ? selectedContact
                  ? `${selectedContact.role} · Replying as PESO Admin`
                  : "Replying as PESO Admin"
                : selectedContact?.role || roleLabels[mode]}
            </p>
          </header>

          {mode === "admin" &&
            canDecideApplications &&
            selectedContact?.role === "Job Seeker" && (
            <section className="space-y-3 border-b border-slate-100 bg-white px-4 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Applicant decisions
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Approved and Reject send the matching decision message in PESO-Hub and queue it for Gmail.
                </p>
              </div>
              {applicationsLoading ? (
                <p className="text-xs text-slate-500">Loading applications...</p>
              ) : decisionError ? (
                <p role="alert" className="text-xs text-red-700">
                  {decisionError}
                </p>
              ) : applicantApplications.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    No application is linked to this Job Seeker. These buttons send a message only; they do not change an application status.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={decisionLoadingId !== null}
                      onClick={() => void sendContactDecisionMessage("hired")}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {decisionLoadingId === "contact-hired" ? "Sending..." : "Hired"}
                    </button>
                    <button
                      type="button"
                      disabled={decisionLoadingId !== null}
                      onClick={() => void sendContactDecisionMessage("rejected")}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {decisionLoadingId === "contact-rejected" ? "Sending..." : "Rejection"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {applicantApplications.map((application) => {
                    const status = application.status.toLowerCase();
                    const finalStatus = ["hired", "rejected", "withdrawn"].includes(status);
                    return (
                      <article
                        key={application.application_id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {application.position_title || "Position not specified"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Status: {status === "hired" ? "You're Hired" : status.replace(/_/g, " ")}
                          </p>
                        </div>
                        {finalStatus ? (
                          <span className="text-xs font-semibold text-slate-500">
                            {status === "hired" ? "You're Hired" : "Decision recorded"}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                decisionLoadingId === application.application_id ||
                                status === "pending"
                              }
                              onClick={() =>
                                void handleApplicationDecision(application, "pending")
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                              Pending
                            </button>
                            <button
                              type="button"
                              disabled={
                                decisionLoadingId === application.application_id ||
                                status === "under_review"
                              }
                              onClick={() =>
                                void handleApplicationDecision(application, "under_review")
                              }
                              className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            >
                              Under Review
                            </button>
                            <button
                              type="button"
                              disabled={decisionLoadingId === application.application_id}
                              onClick={() =>
                                void handleApplicationDecision(application, "approved")
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Approved
                            </button>
                            <button
                              type="button"
                              disabled={decisionLoadingId === application.application_id}
                              onClick={() =>
                                void handleApplicationDecision(application, "rejected")
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
              {decisionNotice && (
                <p role="status" className="text-xs text-emerald-800">
                  {decisionNotice}
                </p>
              )}
            </section>
          )}

          <div className="relative flex min-h-0 flex-1">
            <div
              aria-live="polite"
              onScroll={(event) =>
                setHasScrolledMessages(event.currentTarget.scrollTop > 0)
              }
              className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4 sm:p-6"
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
                  const isAdminInbox = mode === "admin" || mode === "staff";
                  const ownMessage = isAdminInbox
                    ? message.sender_user_id !== selectedUserId
                    : message.sender_user_id === conversationOwnerId;
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
            {hasScrolledMessages && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-100 to-transparent"
              />
            )}
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
