import { useEffect, useRef, useState, type FormEvent } from "react";
import { invokePesoAI } from "../services/pesoAi";

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

type AIChatbotModuleProps = {
  floating?: boolean;
};

export default function AIChatbotModule({
  floating = false,
}: AIChatbotModuleProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(!floating);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const result = await invokePesoAI<{ reply: string }>("chat", {
        messages: nextMessages.slice(-12),
      });
      setMessages((current) => [
        ...current,
        { role: "model", content: result.reply },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to get an answer right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (floating && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open PESO-Hub AI chat assistant"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full bg-[#0759AE] px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-[#064A91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0759AE]"
      >
        <span aria-hidden="true" className="text-lg">✦</span>
        Ask PESO AI
      </button>
    );
  }

  return (
    <div
      className={
        floating
          ? "fixed bottom-5 right-5 z-50 flex h-[min(38rem,calc(100dvh-2rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25"
          : "mx-auto flex h-[min(76vh,52rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      }
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-[#123B70] px-5 py-4 text-white sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
            PESO-Hub AI Assistant
          </p>
          <h2 className="mt-1 text-lg font-bold">
            {floating ? "How can I help?" : "How can I help with your job search?"}
          </h2>
          <p className="mt-1 text-sm text-blue-100">
            Ask about jobs, applications, or employment preparation.
          </p>
        </div>
        {floating && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close PESO-Hub AI chat assistant"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-blue-100 transition hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        )}
      </header>

      <div
        ref={conversationRef}
        aria-live="polite"
        className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-6"
      >
        {messages.length === 0 && (
          <div className="mx-auto mt-8 max-w-lg rounded-xl border border-blue-100 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
            <p className="font-semibold text-[#123B70]">Try asking:</p>
            <ul className="mt-2 list-inside list-disc">
              <li>What jobs are currently open?</li>
              <li>What should I include in my resume?</li>
              <li>How do I use PESO-Hub?</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Messages are sent to Google Gemini. Don&apos;t share passwords or sensitive
              personal information. Confirm official requirements with PESO Mabini staff.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-[#0759AE] text-white"
                  : "border border-slate-200 bg-white text-slate-700 shadow-sm"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}

        {loading && (
          <p className="text-sm text-slate-500" role="status">
            Preparing an answer...
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-4 sm:p-5">
        <label htmlFor="peso-ai-message" className="sr-only">
          Message the PESO-Hub AI assistant
        </label>
        <div className="flex gap-2">
          <input
            id="peso-ai-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={1000}
            placeholder="Type your question..."
            disabled={loading}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0759AE] focus:ring-2 focus:ring-[#0759AE]/15 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-[#0759AE] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Do not share passwords, codes, or sensitive personal information.
        </p>
      </form>
    </div>
  );
}
