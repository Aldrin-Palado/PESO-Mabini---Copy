import React from "react";

type Application = {
  id?: string;
  application_id?: string;
  job_seeker_id?: string;
  employer_id?: string;
  job_vacancy_id?: string;
  status?: string;
  application_status?: string;
  created_at?: string;
  [key: string]: any;
};

type Props = {
  applications: Application[];

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

export default function ApplicationsModule({
  applications,
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
        title="Applications"
        description="View and monitor submitted job applications."
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
            placeholder="Search applications..."
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

            <option value="Pending">
              Pending
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Rejected">
              Rejected
            </option>

            <option value="Hired">
              Hired
            </option>

          </select>

        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {loading ? (
          <LoadingMessage />
        ) : applications.length === 0 ? (
          <EmptyMessage message="No applications found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <TableHeader>
                    Application ID
                  </TableHeader>

                  <TableHeader>
                    Job Seeker ID
                  </TableHeader>

                  <TableHeader>
                    Job Vacancy ID
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader>
                    Date Applied
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {applications.map(
                  (
                    application,
                    index
                  ) => {

                    const status =
                      application.status ||
                      application.application_status ||
                      "Unknown";

                    return (
                      <tr
                        key={
                          application.id ||
                          application.application_id ||
                          index
                        }
                        className="hover:bg-slate-50"
                      >

                        <TableCell bold>
                          {application.application_id ||
                            application.id ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          {application.job_seeker_id ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          {application.job_vacancy_id ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={status}
                          />
                        </TableCell>

                        <TableCell>
                          {formatDate(
                            application.created_at
                          )}
                        </TableCell>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}