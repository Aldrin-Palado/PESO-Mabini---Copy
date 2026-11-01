import { useState } from "react";
import DirectMessages from "../components/DirectMessages";
import type { MessageMode } from "../components/DirectMessages";
import GmailInboxModule from "./GmailInboxModule";

type Props = {
  mode?: MessageMode;
};

export default function MessagesModule({ mode = "admin" }: Props) {
  const [view, setView] = useState<"peso" | "gmail">("peso");
  const canAccessGmail = mode === "admin" || mode === "staff";

  return (
    <div className="space-y-5">
      {canAccessGmail && (
        <nav
          aria-label="Message inbox"
          className="flex gap-2 border-b border-slate-200"
        >
          <button
            type="button"
            onClick={() => setView("peso")}
            aria-current={view === "peso" ? "page" : undefined}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              view === "peso"
                ? "border-[#0446A7] text-[#0446A7]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            PESO Messages
          </button>
          <button
            type="button"
            onClick={() => setView("gmail")}
            aria-current={view === "gmail" ? "page" : undefined}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              view === "gmail"
                ? "border-[#0446A7] text-[#0446A7]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Gmail Inbox
          </button>
        </nav>
      )}
      {view === "gmail" && canAccessGmail
        ? <GmailInboxModule />
        : <DirectMessages mode={mode} />}
    </div>
  );
}