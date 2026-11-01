import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppIcon from "./AppIcon";
import { supabase } from "../services/supabase";
import type { JobVacancy } from "../types/JobVacancy";

interface JobCardProps {
  job: JobVacancy;
  /** Position in the list, used to alternate the accent stripe. */
  index: number;
  isAuthenticated: boolean;
}

function JobCard({ job, index, isAuthenticated }: JobCardProps) {
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  const accent =
    index % 2 === 0
      ? "before:bg-red-200 group-hover:before:bg-red-400"
      : "before:bg-yellow-300 group-hover:before:bg-yellow-400";

  const postedDate = job.date_posted
    ? new Date(job.date_posted).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "Recently posted";

  useEffect(() => {
    if (!isLoginPromptOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLoginPromptOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoginPromptOpen]);

  const openJobInPortal = async () => {
    if (isCheckingLogin) return;
    setIsCheckingLogin(true);
    setLoginError("");

    try {
      if (!isAuthenticated) {
        setIsLoginPromptOpen(true);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        setIsLoginPromptOpen(true);
        return;
      }

      const { data: seeker, error: seekerError } = await supabase
        .from("job_seeker")
        .select("job_seeker_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (seekerError) throw seekerError;

      if (!seeker) {
        setLoginError("Sign in with a Job Seeker account to view job details.");
        return;
      }

      navigate("/jobseeker", {
        state: {
          page: "Jobs",
          jobId: job.job_vacancy_id,
        },
      });
    } catch (error) {
      console.error("Could not verify Job Seeker sign-in:", error);
      setLoginError("Unable to verify your sign-in. Please try again.");
    } finally {
      setIsCheckingLogin(false);
    }
  };

  const goToLogin = () => {
    const returnTo = `/jobseeker?job=${encodeURIComponent(job.job_vacancy_id)}`;
    navigate("/login", { state: { returnTo } });
  };

  return (
    <>
      <article
        className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-1.5 before:content-[''] before:transition-colors motion-reduce:before:transition-none hover:-translate-y-1 hover:shadow-lg ${accent}`}
      >
        <div className="px-6 pb-5 pt-5 sm:px-7">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0759AE] text-sm font-black text-white shadow-sm">
              {job.employer?.name?.charAt(0).toUpperCase() || "E"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-400">{postedDate}</p>
              <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
                {job.employer?.name || "Employer"}
              </p>
              <h3 className="mt-2 text-lg font-black leading-snug text-slate-950 transition-colors group-hover:text-sky-700 sm:text-xl">
                {job.position_title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                {job.job_classification && (
                  <span className="capitalize">{job.job_classification}</span>
                )}
                {job.employment_type && (
                  <>
                    {job.job_classification && <span aria-hidden="true">·</span>}
                    <span>{job.employment_type}</span>
                  </>
                )}
                {job.location && (
                  <>
                    {(job.job_classification || job.employment_type) && (
                      <span aria-hidden="true">·</span>
                    )}
                    <span>{job.location}</span>
                  </>
                )}
              </div>
              {(job.salary || job.location) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-600">
                  {job.salary && (
                    <span className="inline-flex items-center gap-1.5">
                      <AppIcon name="dollar" className="h-3.5 w-3.5 text-amber-500" />
                      {job.salary}
                    </span>
                  )}
                  {job.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <AppIcon name="mapPin" className="h-3.5 w-3.5 text-slate-500" />
                      {job.location}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {job.image_url && (
          <div className="overflow-hidden border-y border-slate-100 bg-slate-50">
            <img
              src={job.image_url}
              alt={`${job.position_title} job posting`}
              className="h-56 w-full object-contain sm:h-64"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex flex-col gap-3 bg-slate-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-slate-500">
            Sign in to view full details and application information.
          </p>
          <button
            type="button"
            onClick={() => void openJobInPortal()}
            disabled={isCheckingLogin}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-wait disabled:opacity-70"
          >
            {isCheckingLogin ? "Checking..." : "View Details"}
            <AppIcon name="arrowRight" className="h-4 w-4" />
          </button>
          {loginError && (
            <p role="alert" className="text-sm text-red-700">
              {loginError}
            </p>
          )}
        </div>
      </article>

      {isLoginPromptOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsLoginPromptOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`job-login-title-${job.job_vacancy_id}`}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-sky-700">
                  Job Seeker Portal
                </p>
                <h2
                  id={`job-login-title-${job.job_vacancy_id}`}
                  className="mt-2 text-xl font-black text-slate-950"
                >
                  Sign in to view job details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginPromptOpen(false)}
                aria-label="Close sign-in prompt"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <AppIcon name="x" className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Log in to your Job Seeker account. After signing in, this job will
              open in your portal.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsLoginPromptOpen(false)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={goToLogin}
                className="rounded-xl bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91]"
              >
                Log in
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default JobCard;
