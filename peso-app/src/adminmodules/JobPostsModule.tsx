import type { ComponentType } from "react";
import AppIcon from "../components/AppIcon";

type JobPost = {
  id?: string;
  job_vacancy_id?: string;
  title?: string;
  job_title?: string;
  position?: string;
  position_title?: string;
  company_name?: string;
  employer_name?: string;
  employer_id?: string;
  employer_logo_url?: string | null;
  location?: string;
  employment_type?: string;
  salary_min?: number | string | null;
  salary_max?: number | string | null;
  vacancies_available?: number;
  status?: string;
  description?: string;
  created_at?: string;
  date_posted?: string;
  [key: string]: any;
};

type Props = {
  jobs: JobPost[];
  loadError?: string;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  loading: boolean;
  onRefresh: () => void;
  ModuleHeader: ComponentType<{
    title: string;
    description: string;
    onRefresh?: () => void;
  }>;
  StatusBadge: ComponentType<{
    status: string;
  }>;
  LoadingMessage: ComponentType;
  EmptyMessage: ComponentType<{
    message: string;
  }>;
  formatDate: (date?: string) => string;
};

function getJobTitle(job: JobPost): string {
  return (
    job.position_title ||
    job.title ||
    job.job_title ||
    job.position ||
    "Untitled Job"
  );
}

function getEmployerName(job: JobPost): string {
  return job.company_name || job.employer_name || job.employer_id || "-";
}

function getDisplayStatus(job: JobPost): string {
  const rawStatus = (job.status || "Unknown").toLowerCase();
  if (rawStatus === "open") return "Active";
  if (rawStatus === "draft") return "Inactive";
  if (rawStatus === "closed") return "Closed";
  return job.status || "Unknown";
}

function getSalaryRange(job: JobPost): string {
  if (job.salary_min == null && job.salary_max == null) return "Not specified";
  return `${job.salary_min ?? "-"} – ${job.salary_max ?? "-"}`;
}

export default function JobPostsModule({
  jobs,
  loadError,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  loading,
  onRefresh,
  ModuleHeader,
  StatusBadge,
  LoadingMessage,
  EmptyMessage,
  formatDate,
}: Props) {
  const visibleJobs = jobs.filter((job) => {
    const searchText =
      `${getJobTitle(job)} ${getEmployerName(job)} ${job.location || ""}`.toLowerCase();
    const status = getDisplayStatus(job).toLowerCase();
    return (
      searchText.includes(search.toLowerCase()) &&
      (statusFilter === "All" || status === statusFilter.toLowerCase())
    );
  });

  return (
    <div className="space-y-5">
      <ModuleHeader
        title="Job Posts"
        description="View and monitor job vacancies posted by employers and PESO staff/admin."
        onRefresh={onRefresh}
      />

      {loadError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {loadError}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">Find job posts</h2>
          <p className="mt-1 text-xs text-slate-500">
            Search vacancies or filter by posting status.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <label className="block text-xs font-semibold text-slate-600">
            Search job posts
            <span className="relative mt-1.5 block">
              <AppIcon
                name="search"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, employer, or keyword..."
                aria-label="Search job posts"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </span>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Posting status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter job posts by status"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Closed">Closed</option>
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Registered job posts
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Vacancy details and employer information
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Showing {visibleJobs.length} of {jobs.length}
          </span>
        </div>

        {loading ? (
          <LoadingMessage />
        ) : jobs.length === 0 ? (
          <EmptyMessage message="No job posts found." />
        ) : visibleJobs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No job posts match these filters.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 2xl:hidden">
              {visibleJobs.map((job, index) => {
                const title = getJobTitle(job);
                const status = getDisplayStatus(job);
                const key = job.id || job.job_vacancy_id || index;

                return (
                  <article
                    key={key}
                    className="p-4 transition hover:bg-slate-50/80 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-bold text-[#1766B4]">
                        {job.employer_logo_url ? (
                          <img
                            src={job.employer_logo_url}
                            alt={`${getEmployerName(job)} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getEmployerName(job).charAt(0).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-slate-900">
                              {title}
                            </h3>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {getEmployerName(job)}
                            </p>
                          </div>
                          <StatusBadge status={status} />
                        </div>
                        {job.description && (
                          <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                            {job.description}
                          </p>
                        )}
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <p className="flex min-w-0 items-center gap-2">
                            <AppIcon
                              name="mapPin"
                              className="h-3.5 w-3.5 shrink-0 text-slate-400"
                            />
                            <span className="truncate">
                              {job.location || "Location not provided"}
                            </span>
                          </p>
                          <p className="flex min-w-0 items-center gap-2">
                            <AppIcon
                              name="clock"
                              className="h-3.5 w-3.5 shrink-0 text-slate-400"
                            />
                            <span className="truncate">
                              {job.employment_type || "Employment type not provided"}
                            </span>
                          </p>
                          <p>
                            Salary: {getSalaryRange(job)}
                          </p>
                          <p>
                            Openings: {job.vacancies_available ?? "-"}
                          </p>
                          <p className="text-slate-500 sm:col-span-2">
                            Posted {formatDate(job.date_posted || job.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto 2xl:block">
              <table className="w-full min-w-[1100px] table-fixed">
                <thead className="bg-gradient-to-r from-[#1766B4] to-[#124A91] text-left">
                  <tr>
                    {[
                      ["Job Title", "w-[19%]"],
                      ["Employer", "w-[16%]"],
                      ["Location", "w-[14%]"],
                      ["Employment Type", "w-[13%]"],
                      ["Salary Range", "w-[12%]"],
                      ["Openings", "w-[8%]"],
                      ["Status", "w-[9%]"],
                      ["Date Posted", "w-[11%]"],
                    ].map(([label, width]) => (
                      <th
                        key={label}
                        className={`${width} px-3 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleJobs.map((job, index) => (
                    <tr
                      key={job.id || job.job_vacancy_id || index}
                      className={`transition-colors hover:bg-blue-50/70 ${
                        index % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1766B4]">
                            <AppIcon name="briefcase" className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900">
                              {getJobTitle(job)}
                            </p>
                            {job.description && (
                              <p className="mt-0.5 truncate text-[10px] text-slate-500">
                                {job.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-700">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-bold text-[#1766B4]">
                            {job.employer_logo_url ? (
                              <img
                                src={job.employer_logo_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getEmployerName(job).charAt(0).toUpperCase()
                            )}
                          </span>
                          <span className="truncate">{getEmployerName(job)}</span>
                        </div>
                      </td>
                      <td className="truncate px-3 py-3 text-xs text-slate-700">
                        {job.location || "-"}
                      </td>
                      <td className="truncate px-3 py-3 text-xs text-slate-700">
                        {job.employment_type || "-"}
                      </td>
                      <td className="truncate px-3 py-3 text-xs text-slate-700">
                        {getSalaryRange(job)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-slate-700">
                        {job.vacancies_available ?? "-"}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={getDisplayStatus(job)} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                        {formatDate(job.date_posted || job.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
