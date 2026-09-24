import type { JobVacancy } from "../types/JobVacancy";

interface JobCardProps {
  job: JobVacancy;
}

function JobCard({ job }: JobCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg">

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