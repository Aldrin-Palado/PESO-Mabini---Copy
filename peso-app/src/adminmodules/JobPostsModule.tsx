import React from "react";

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

  ModuleHeader: React.ComponentType<{
    title: string;
    description: string;
    onRefresh?: () => void;
  }>;

  TableHeader: React.ComponentType<{
    children: React.ReactNode;
  }>;

  TableCell: React.ComponentType<{
    children: React.ReactNode;
    bold?: boolean;
  }>;

  StatusBadge: React.ComponentType<{
    status: string;
  }>;

  LoadingMessage: React.ComponentType;

  EmptyMessage: React.ComponentType<{
    message: string;
  }>;

  formatDate: (date?: string) => string;
};

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
  TableHeader,
  TableCell,
  StatusBadge,
  LoadingMessage,
  EmptyMessage,
  formatDate,
}: Props) {
  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Job Posts"
        description="View and monitor job vacancies posted by employers."
        onRefresh={onRefresh}
      />

      {loadError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {loadError}
        </p>
      )}

      {/* SEARCH AND FILTER */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="m16 16 4 4" strokeLinecap="round" strokeWidth="2" />
            </svg>
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search job title, employer, or keyword..."
              aria-label="Search job posts"
              className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#203F8B] focus:ring-2 focus:ring-[#203F8B]/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            aria-label="Filter job posts by status"
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#203F8B] focus:ring-2 focus:ring-[#203F8B]/10 lg:ml-auto"
          >
            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>

            <option value="Closed">
              Closed
            </option>
          </select>

        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">

        {loading ? (
          <LoadingMessage />
        ) : jobs.length === 0 ? (
          <EmptyMessage message="No job posts found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-[#F7F9FC]">

                <tr>

                  <TableHeader>
                    Job Title
                  </TableHeader>

                  <TableHeader>
                    Employer
                  </TableHeader>

                  <TableHeader>
                    Location
                  </TableHeader>

                  <TableHeader>
                    Employment Type
                  </TableHeader>

                  <TableHeader>
                    Salary Range
                  </TableHeader>

                  <TableHeader>
                    Openings
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader>
                    Date Posted
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {jobs.map((job, index) => {

                  const title =
                    job.position_title ||
                    job.title ||
                    job.job_title ||
                    job.position ||
                    "Untitled Job";

                  const employer =
                    job.company_name ||
                    job.employer_name ||
                    job.employer_id ||
                    "-";
                  const rawStatus = (job.status || "Unknown").toLowerCase();
                  const displayStatus =
                    rawStatus === "open"
                      ? "Active"
                      : rawStatus === "draft"
                        ? "Inactive"
                        : rawStatus === "closed"
                          ? "Closed"
                          : job.status || "Unknown";

                  return (
                    <tr
                      key={
                        job.id ||
                        job.job_vacancy_id ||
                        index
                      }
                      className="transition-colors hover:bg-blue-50/40"
                    >

                      <TableCell bold>
                        <div>
                          <p>{title}</p>
                          {job.description && (
                            <p className="mt-1 max-w-xs truncate text-xs font-normal text-slate-500">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {employer || job.employer_id || "-"}
                      </TableCell>

                      <TableCell>
                        {job.location || "-"}
                      </TableCell>

                      <TableCell>
                        {job.employment_type || "-"}
                      </TableCell>

                      <TableCell>
                        {job.salary_min != null || job.salary_max != null
                          ? `${job.salary_min ?? "-"} – ${job.salary_max ?? "-"}`
                          : "-"}
                      </TableCell>

                      <TableCell>
                        {job.vacancies_available ?? "-"}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={displayStatus}
                        />
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          job.date_posted || job.created_at
                        )}
                      </TableCell>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}