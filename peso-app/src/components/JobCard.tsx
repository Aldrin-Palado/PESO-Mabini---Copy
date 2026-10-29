import { useEffect, useState } from "react";
import type { JobVacancy } from "../types/JobVacancy";

interface JobCardProps {
  job: JobVacancy;
  /** Position in the list, used to alternate the accent stripe. */
  index: number;
}

function JobCard({ job, index }: JobCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  useEffect(() => {
    if (!isDetailsOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDetailsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailsOpen]);

  return (
    <>
      <div
        className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:content-[''] before:transition-colors motion-reduce:before:transition-none hover:-translate-y-1 hover:shadow-lg ${accent}`}
      >

      {job.image_url && (
        <img
          src={job.image_url}
          alt={`${job.position_title} job`}
          className="mb-5 h-56 w-full rounded-xl bg-slate-50 object-contain sm:h-64"
          loading="lazy"
        />
      )}

      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 font-bold text-sky-600">
          {job.employer?.name?.charAt(0).toUpperCase() || "E"}
        </div>

        <div>
          <p className="text-sm font-semibold text-sky-600">
            {job.employer?.name || "Employer"}
          </p>

          <p className="text-xs text-slate-400">
            Job Vacancy
          </p>
        </div>
      </div>

      <h3 className="text-xl font-black text-slate-900 transition-colors group-hover:text-sky-600">
        {job.position_title}
      </h3>

      <div className="mt-5 space-y-3 text-sm text-slate-600">
        {job.location && (
          <div className="flex items-center gap-3">
            <AppIcon name="mapPin" className="h-4 w-4 text-sky-700" />
            <span>{job.location}</span>
          </div>
        )}

        {job.employment_type && (
          <div className="flex items-center gap-3">
            <AppIcon name="briefcase" className="h-4 w-4 text-sky-700" />
            <span>{job.employment_type}</span>
          </div>
        )}

        {job.salary && (
          <div className="flex items-center gap-3">
            <AppIcon name="dollar" className="h-4 w-4 text-sky-700" />
            <span>{job.salary}</span>
          </div>
        )}
      </div>

      {job.description && (
        <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-500">
          {job.description}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
        <div>
          <p className="text-xs text-slate-400">
            Posted
          </p>

          <p className="text-sm font-semibold text-slate-700">
            {job.date_posted
              ? new Date(job.date_posted).toLocaleDateString()
              : "Recently"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDetailsOpen(true)}
          className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700"
        >
          View Job
        </button>
      </div>
      </div>

      {isDetailsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsDetailsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`job-title-${job.job_vacancy_id}`}
            className="my-auto max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
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
                    <p className="text-xs text-slate-500">Job opportunity</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  aria-label="Close job details"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <AppIcon name="x" className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Open position
                    </span>
                    {job.date_posted && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        <AppIcon name="clock" className="h-3.5 w-3.5" />
                        Posted {new Date(job.date_posted).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h2
                    id={`job-title-${job.job_vacancy_id}`}
                    className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
                  >
                    {job.position_title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {job.employer?.name || "Employer"}
                  </p>
                </div>

                {job.image_url && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={job.image_url}
                      alt={`${job.position_title} job`}
                      className="max-h-[55vh] w-full rounded-xl object-contain"
                    />
                  </div>
                )}

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
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <AppIcon name={item.icon} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {item.label}
                        </dt>
                        <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                          {item.value}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-900">Job description</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {job.description || "No description provided."}
                    </p>
                  </div>
                  {job.requirements && (
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <h3 className="font-bold text-slate-900">Requirements</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {job.requirements}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setIsDetailsOpen(false)}
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
