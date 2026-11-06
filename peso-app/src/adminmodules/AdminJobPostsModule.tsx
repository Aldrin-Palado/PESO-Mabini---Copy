import { useState, type ComponentProps } from "react";
import AppIcon from "../components/AppIcon";
import JobPostsModule from "./JobPostsModule";
import PESOJobPostsModule from "./PESOJobPostsModule";

type Props = ComponentProps<typeof JobPostsModule>;
type JobPostView = "peso" | "all";

export default function AdminJobPostsModule(props: Props) {
  const [activeView, setActiveView] = useState<JobPostView>("peso");

  return (
    <div className="space-y-5">
      <div
        aria-label="Job posting views"
        className="flex w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
      >
        <button
          type="button"
          aria-pressed={activeView === "peso"}
          onClick={() => setActiveView("peso")}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-semibold transition sm:px-5 ${
            activeView === "peso"
              ? "bg-blue-50 text-[#0759AE]"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <AppIcon name="building" className="h-5 w-5 shrink-0" />
          <span>PESO Job Posts</span>
        </button>
        <span aria-hidden="true" className="my-1 w-px bg-slate-200" />
        <button
          type="button"
          aria-pressed={activeView === "all"}
          onClick={() => setActiveView("all")}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-semibold transition sm:px-5 ${
            activeView === "all"
              ? "bg-blue-50 text-[#0759AE]"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <AppIcon name="briefcase" className="h-5 w-5 shrink-0" />
          <span>All Job Posts</span>
        </button>
      </div>

      {activeView === "peso" ? (
        <PESOJobPostsModule />
      ) : (
        <JobPostsModule {...props} />
      )}
    </div>
  );
}
