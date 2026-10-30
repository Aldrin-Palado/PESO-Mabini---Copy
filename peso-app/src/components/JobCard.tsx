import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import type { JobVacancy } from "../types/JobVacancy";

interface JobCardProps {
  job: JobVacancy;
  /** Position in the list, used to alternate the accent stripe. */
  index: number;
  isAuthenticated: boolean;
}

function JobCard({ job, index, isAuthenticated }: JobCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /*
   * Alternating left accent stripe: red, yellow, red, yellow...
   * Only the side edge is tinted, in a light shade, so the card keeps a
   * neutral full border and the photos/text stay calm.
   *
   * Yellow gets one shade step more than red because `yellow-200` on a white
   * card is nearly invisible, while `red-200` reads clearly — this keeps the
   * two stripes at comparable visual weight.
   */
  const isRed = index % 2 === 0;

  const accent = isRed
    ? "before:bg-red-200 group-hover:before:bg-red-400"
    : "before:bg-yellow-300 group-hover:before:bg-yellow-400";

  const postedDate = job.date_posted
    ? new Date(job.date_posted).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "Recently posted";

  const closeDetails = () => {
    setIsDetailsOpen(false);
    if (searchParams.get("job") === job.job_vacancy_id) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("job");
      setSearchParams(nextParams, { replace: true });
    }
  };

  useEffect(() => {
    if (
      isAuthenticated &&
      searchParams.get("job") === job.job_vacancy_id
    ) {
      setIsDetailsOpen(true);
    }
  }, [isAuthenticated, job.job_vacancy_id, searchParams]);

  useEffect(() => {
    if (!isDetailsOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDetails();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailsOpen, job.job_vacancy_id, searchParams, setSearchParams]);

  const viewJobDetails = async () => {
    if (isCheckingLogin) return;
    setIsCheckingLogin(true);
    setLoginError("");

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        const returnParams = new URLSearchParams(location.search);
        returnParams.set("job", job.job_vacancy_id);
        navigate("/login", {
          state: {
            returnTo: `${location.pathname}?${returnParams.toString()}`,
          },
        });
        return;
      }

      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Could not verify sign-in before opening job details:", error);
      setLoginError("Unable to verify your sign-in. Please try again.");
    } finally {
      setIsCheckingLogin(false);
    }
  };

  return (
    <>
      <div
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
            onClick={viewJobDetails}
            disabled={isCheckingLogin}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-wait disabled:opacity-70"
          >
            {isCheckingLogin ? "Checking..." : "View / Apply"}
            <AppIcon name="arrowRight" className="h-4 w-4" />
          </button>
          {loginError && (
            <p role="alert" className="text-sm text-red-700">
              {loginError}
            </p>
          )}
        </div>
      </div>

      {isDetailsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`job-title-${job.job_vacancy_id}`}
            className="my-auto max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-lg font-black text-sky-700">
                    {job.employer?.name?.charAt(0).toUpperCase() || "E"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-sky-700">
                      {job.employer?.name || "Employer"}
                    </p>
                    <p className="text-xs text-slate-500">{postedDate}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close job details"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <AppIcon name="x" className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
                <div>
                  <h2
                    id={`job-title-${job.job_vacancy_id}`}
                    className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
                  >
                    {job.position_title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {job.employer?.name || "Employer"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                    {job.job_classification && (
                      <span className="capitalize">{job.job_classification}</span>
                    )}
                    {job.job_classification && job.employment_type && (
                      <span aria-hidden="true">·</span>
                    )}
                    {job.employment_type && <span>{job.employment_type}</span>}
                    {(job.job_classification || job.employment_type) && job.location && (
                      <span aria-hidden="true">·</span>
                    )}
                    {job.location && <span>{job.location}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-700">
                    {job.salary && (
                      <span className="inline-flex items-center gap-2">
                        <AppIcon name="dollar" className="h-4 w-4 text-amber-500" />
                        {job.salary}
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center gap-2">
                        <AppIcon name="mapPin" className="h-4 w-4 text-slate-500" />
                        {job.location}
                      </span>
                    )}
                  </div>
                </div>

                {job.image_url && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={job.image_url}
                      alt={`${job.position_title} job`}
                      className="max-h-[55vh] w-full object-contain"
                    />
                  </div>
                )}

                <section aria-label="Job overview">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Job overview
                  </h3>
                  <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Location",
                      value: job.location || "Not specified",
                      icon: "mapPin" as const,
                    },
                    {
                      label: "Employment type",
                      value: job.employment_type || "Not specified",
                      icon: "briefcase" as const,
                    },
                    ...(job.job_classification
                      ? [{
                          label: "Classification",
                          value: job.job_classification,
                          icon: "building" as const,
                        }]
                      : []),
                    {
                      label: "Salary",
                      value: job.salary || "Not specified",
                      icon: "dollar" as const,
                    },
                    ...(job.vacancies_available != null
                      ? [{
                          label: "Openings",
                          value: String(job.vacancies_available),
                          icon: "users" as const,
                        }]
                      : []),
                    ...(job.deadline
                      ? [{
                          label: "Application deadline",
                          value: new Date(`${job.deadline}T00:00:00`).toLocaleDateString(),
                          icon: "clock" as const,
                        }]
                      : []),
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-start gap-3 rounded-2xl border p-4 ${
                        item.label === "Salary"
                          ? "border-sky-200 bg-gradient-to-br from-sky-50 to-white sm:col-span-2"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        item.label === "Salary"
                          ? "bg-sky-700 text-white"
                          : "bg-sky-50 text-sky-700"
                      }`}>
                        <AppIcon name={item.icon} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                          {item.label}
                        </dt>
                        <dd className={`mt-1 break-words font-bold capitalize ${
                          item.label === "Salary"
                            ? "text-lg text-sky-900"
                            : "text-sm text-slate-900"
                        }`}>
                          {item.value}
                        </dd>
                      </div>
                    </div>
                  ))}
                  </dl>
                </section>

                <div className="grid gap-4">
                  <div className="rounded-2xl border border-slate-200 border-l-4 border-l-sky-600 bg-white p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                      Job description
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {job.description || "No description provided."}
                    </p>
                  </div>
                  {job.requirements && (
                    <div className="rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-5">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                        Requirements
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {job.requirements}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Online application via portal.
                  </p>
                  <button
                    type="button"
                    onClick={closeDetails}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    Close details
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default JobCard;
import AppIcon from "./AppIcon";
