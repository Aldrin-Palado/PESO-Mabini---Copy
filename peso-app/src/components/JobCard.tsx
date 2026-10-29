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
          className="mb-5 h-44 w-full rounded-xl object-cover"
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
            <span>📍</span>
            <span>{job.location}</span>
          </div>
        )}

        {job.employment_type && (
          <div className="flex items-center gap-3">
            <span>💼</span>
            <span>{job.employment_type}</span>
          </div>
        )}

        {job.salary && (
          <div className="flex items-center gap-3">
            <span>💰</span>
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
            className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-sky-700">
                  {job.employer?.name || "Employer"}
                </p>
                <h2
                  id={`job-title-${job.job_vacancy_id}`}
                  className="mt-1 text-2xl font-bold text-slate-900"
                >
                  {job.position_title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                aria-label="Close job details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            {job.image_url && (
              <img
                src={job.image_url}
                alt={`${job.position_title} job`}
                className="mt-6 max-h-80 w-full rounded-xl object-cover"
              />
            )}

            <dl className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">Location</dt>
                <dd className="mt-1 text-slate-900">{job.location || "Not specified"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Employment type</dt>
                <dd className="mt-1 text-slate-900">{job.employment_type || "Not specified"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Salary</dt>
                <dd className="mt-1 text-slate-900">{job.salary || "Not specified"}</dd>
              </div>
              {job.vacancies_available != null && (
                <div>
                  <dt className="font-semibold text-slate-500">Openings</dt>
                  <dd className="mt-1 text-slate-900">{job.vacancies_available}</dd>
                </div>
              )}
              {job.deadline && (
                <div>
                  <dt className="font-semibold text-slate-500">Application deadline</dt>
                  <dd className="mt-1 text-slate-900">
                    {new Date(`${job.deadline}T00:00:00`).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {job.date_posted && (
                <div>
                  <dt className="font-semibold text-slate-500">Date posted</dt>
                  <dd className="mt-1 text-slate-900">
                    {new Date(job.date_posted).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="font-bold text-slate-900">Job description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {job.description || "No description provided."}
                </p>
              </div>
              {job.requirements && (
                <div>
                  <h3 className="font-bold text-slate-900">Requirements</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {job.requirements}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default JobCard;