import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { invokePesoAI } from "../services/pesoAi";
import { supabase } from "../services/supabase";

const maxResumeBytes = 500_000;

function isResumeFileTypeValid(file: File, bytes: Uint8Array) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    return new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  }
  if (extension === "doc") {
    return bytes.subarray(0, 8).join(",") === "208,207,17,224,161,177,26,225";
  }
  return extension === "docx" && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

type ChatJob = {
  id: string;
  title: string;
  employer: string;
  location: string;
  type: string;
  salary: string;
};

type ChatMessage = {
  role: "user" | "model";
  content: string;
  jobs?: ChatJob[];
  attachmentName?: string;
};

type AIChatbotModuleProps = {
  floating?: boolean;
};

export default function AIChatbotModule({
  floating = false,
}: AIChatbotModuleProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeAuthorized, setResumeAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(!floating);
  const conversationRef = useRef<HTMLDivElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const typedContent = input.trim();
    if ((!typedContent && !resumeFile) || loading) return;
    if (resumeFile && !resumeAuthorized) {
      setError("Authorize sending the resume to Gemini before continuing.");
      return;
    }

    let resume: { fileName: string; data: string } | undefined;
    if (resumeFile) {
      if (resumeFile.size > maxResumeBytes) {
        setError("Resume files must be 500 KB or smaller.");
        return;
      }
      const extension = resumeFile.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "doc", "docx"].includes(extension ?? "")) {
        setError("Choose a PDF, DOC, or DOCX resume.");
        return;
      }

      try {
        const bytes = new Uint8Array(await resumeFile.arrayBuffer());
        if (!isResumeFileTypeValid(resumeFile, bytes)) {
          setError("The file contents do not match a valid PDF, DOC, or DOCX resume.");
          return;
        }
        let binary = "";
        const chunkSize = 0x8000;
        for (let index = 0; index < bytes.length; index += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
        }
        resume = { fileName: resumeFile.name, data: btoa(binary) };
      } catch (requestError) {
        console.error("Could not read the selected resume:", requestError);
        setError("Could not read the selected resume. Please choose the file again.");
        return;
      }
    }

    const content = typedContent || "Please find open jobs that match my attached resume.";
    const nextMessages = [
      ...messages,
      {
        role: "user" as const,
        content,
        ...(resumeFile ? { attachmentName: resumeFile.name } : {}),
      },
    ];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const result = await invokePesoAI<{ reply: string; jobs?: ChatJob[] }>("chat", {
        messages: nextMessages.slice(-6),
        ...(resume ? { resume } : {}),
      });
      setMessages((current) => [
        ...current,
        { role: "model", content: result.reply, jobs: result.jobs },
      ]);
      setResumeFile(null);
      setResumeAuthorized(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
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

  const openJob = async (jobId: string) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const returnTo = `/jobseeker?job=${encodeURIComponent(jobId)}`;
      if (session) {
        navigate(returnTo);
      } else {
        navigate("/login", { state: { returnTo } });
      }
    } catch (requestError) {
      console.error("Could not verify sign-in before opening job:", requestError);
      setError("Could not verify your sign-in. Please try again.");
    }
  };

  if (floating && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open PESO MABINI AI chat assistant"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full bg-[#0759AE] px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-[#064A91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0759AE]"
      >
        <AppIcon name="sparkles" className="h-5 w-5" />
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
            PESO MABINI AI Assistant
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
            aria-label="Close PESO MABINI AI chat assistant"
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
              <li>What services does PESO Mabini offer?</li>
              <li>How do I apply for a job?</li>
              <li>What should I include in my resume?</li>
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
            <div className="max-w-[92%] space-y-3">
              <p
                className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-[#0759AE] text-white"
                    : "border border-slate-200 bg-white text-slate-700 shadow-sm"
                }`}
              >
                {message.content}
              </p>
              {message.attachmentName && (
                <p className="px-2 text-xs text-slate-500">
                  Resume attached: {message.attachmentName}
                </p>
              )}
              {message.role === "model" && message.jobs?.length ? (
                <div className="space-y-3">
                  {message.jobs.map((job) => (
                    <article
                      key={job.id}
                      className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm"
                    >
                      <h3 className="font-bold text-[#123B70]">{job.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{job.employer}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {job.location} · {job.type} · {job.salary}
                      </p>
                      <button
                        type="button"
                        onClick={() => void openJob(job.id)}
                        className="mt-3 inline-flex items-center rounded-lg bg-[#0759AE] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#064A91]"
                      >
                        View / Apply
                      </button>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
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
          Message the PESO MABINI AI assistant
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
            disabled={
              loading ||
              (!input.trim() && !resumeFile) ||
              (Boolean(resumeFile) && !resumeAuthorized)
            }
            className="rounded-xl bg-[#0759AE] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={resumeInputRef}
            id="peso-ai-resume"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={loading}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setResumeFile(file);
              setResumeAuthorized(false);
              setError("");
            }}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => resumeInputRef.current?.click()}
            disabled={loading}
            aria-label="Attach resume"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.4 11.1-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.7 3.7 0 0 1 5.2 5.2l-9.2 9.2a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5" />
            </svg>
            Attach resume
          </button>
          {resumeFile && (
            <button
              type="button"
              onClick={() => {
                setResumeFile(null);
                setResumeAuthorized(false);
                if (resumeInputRef.current) resumeInputRef.current.value = "";
              }}
              disabled={loading}
              className="max-w-full truncate text-xs text-slate-600 underline"
            >
              {resumeFile.name} — remove
            </button>
          )}
        </div>
        {resumeFile && (
          <label className="mt-3 flex items-start gap-2.5 text-xs leading-5 text-slate-600">
            <input
              type="checkbox"
              checked={resumeAuthorized}
              onChange={(event) => setResumeAuthorized(event.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#0759AE]"
            />
            <span>
              I authorize sending this resume to Google Gemini to find matching open jobs.
              The file is not stored by PESO-Hub.
            </span>
          </label>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Upload PDF, DOC, or DOCX resumes up to 500 KB. Do not share passwords, codes, or
          sensitive personal information.
        </p>
      </form>
    </div>
  );
}
import AppIcon from "../components/AppIcon";
