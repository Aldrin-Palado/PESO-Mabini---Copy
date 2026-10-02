import type { JobVacancy } from "../types/JobVacancy";

interface JobCardProps {
  job: JobVacancy;
  /** Position in the list, used to alternate the accent stripe. */
  index: number;
}

function JobCard({ job, index }: JobCardProps) {
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

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:content-[''] before:transition-colors motion-reduce:before:transition-none hover:-translate-y-1 hover:shadow-lg ${accent}`}
    >

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
          className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700"
        >
          View Job
        </button>
      </div>

    </div>
  );
}

export default JobCard;