import React from "react";

type JobPost = {
  id?: string;
  job_vacancy_id?: string;
  title?: string;
  job_title?: string;
  position?: string;
  company_name?: string;
  employer_name?: string;
  location?: string;
  employment_type?: string;
  status?: string;
  description?: string;
  created_at?: string;
  [key: string]: any;
};

type Props = {
  jobs: JobPost[];
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

      {/* SEARCH AND FILTER */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search job posts..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
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
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {loading ? (
          <LoadingMessage />
        ) : jobs.length === 0 ? (
          <EmptyMessage message="No job posts found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

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
                    job.title ||
                    job.job_title ||
                    job.position ||
                    "Untitled Job";

                  const employer =
                    job.company_name ||
                    job.employer_name ||
                    "-";

                  return (
                    <tr
                      key={
                        job.id ||
                        job.job_vacancy_id ||
                        index
                      }
                      className="hover:bg-slate-50"
                    >

                      <TableCell bold>
                        {title}
                      </TableCell>

                      <TableCell>
                        {employer}
                      </TableCell>

                      <TableCell>
                        {job.location || "-"}
                      </TableCell>

                      <TableCell>
                        {job.employment_type || "-"}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={
                            job.status ||
                            "Unknown"
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          job.created_at
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