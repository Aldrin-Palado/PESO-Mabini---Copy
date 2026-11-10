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
  const [isCompanyProfileOpen, setIsCompanyProfileOpen] = useState(false);
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
    if (!isLoginPromptOpen && !isCompanyProfileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCompanyProfileOpen(false);
        setIsLoginPromptOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoginPromptOpen, isCompanyProfileOpen]);

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
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setIsCompanyProfileOpen(true)}
                aria-label={`View ${job.employer?.name || "employer"} company profile`}
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0759AE] text-sm font-black text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {job.employer?.logoUrl ? (
                  <img
                    src={job.employer.logoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  job.employer?.name?.charAt(0).toUpperCase() || "E"
                )}
              </button>
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0759AE] text-sm font-black text-white shadow-sm">
                {job.employer?.logoUrl ? (
                  <img
                    src={job.employer.logoUrl}
                    alt={`${job.employer.name || "Company"} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  job.employer?.name?.charAt(0).toUpperCase() || "E"
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-400">{postedDate}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-medium text-slate-700">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => setIsCompanyProfileOpen(true)}
                    className="truncate text-left hover:text-blue-700 hover:underline focus:outline-none focus:underline"
                  >
                    {job.employer?.name || "Employer"}
                  </button>
                ) : (
                  job.employer?.name || "Employer"
                )}
                {job.employer?.verified && (
                  <span
                    title="Verified employer"
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
                  >
                    <AppIcon name="check" className="h-3 w-3" />
                  </span>
                )}
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
              {job.description && (
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {job.description}
                </p>
              )}
              {job.job_qualifications && (
                <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-slate-700">Qualifications: </span>
                  {job.job_qualifications}
                </p>
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

      {isCompanyProfileOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCompanyProfileOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`company-name-${job.job_vacancy_id}`}
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="relative">
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#064A91] via-[#0759AE] to-sky-400 sm:h-44">
                <div className="absolute -right-8 -top-20 h-56 w-56 rounded-full border-[24px] border-white/10" />
                <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/10" />
                <button
                  type="button"
                  onClick={() => setIsCompanyProfileOpen(false)}
                  aria-label="Close company profile"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white transition hover:bg-black/35 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <AppIcon name="x" className="h-5 w-5" />
                </button>
              </div>
              <div className="relative px-6 pb-5 sm:px-8">
                <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-blue-50 text-3xl font-black text-blue-700 shadow-lg">
                  {job.employer?.logoUrl ? (
                    <img
                      src={job.employer.logoUrl}
                      alt={`${job.employer.name || "Company"} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    job.employer?.name?.charAt(0).toUpperCase() || "E"
                  )}
                </div>
                <h2
                  id={`company-name-${job.job_vacancy_id}`}
                  className="mt-4 flex flex-wrap items-center gap-2 text-xl font-black text-slate-950 sm:text-2xl"
                >
                  {job.employer?.name || "Employer"}
                  {job.employer?.verified && (
                    <span
                      title="Verified employer"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"
                    >
                      <AppIcon name="check" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {job.employer?.industry || "Company profile"}
                </p>
              </div>
            </div>
            <div className="space-y-6 border-t border-slate-100 p-6 sm:p-8">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Company background
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {job.employer?.description ||
                    "This company has not added a background description yet."}
                </p>
              </section>
              <dl className="grid gap-4 sm:grid-cols-2">
                {job.employer?.address && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Address
                    </dt>
                    <dd className="mt-1 text-sm text-slate-800">
                      {job.employer.address}
                    </dd>
                  </div>
                )}
                {job.employer?.website && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Website
                    </dt>
                    <dd className="mt-1 break-all text-sm">
                      <a
                        href={job.employer.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {job.employer.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        </div>
      )}

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
