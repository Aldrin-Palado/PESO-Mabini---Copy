
import { useMemo, useState } from "react";

interface ApplicationRow {
  id: number | string;
  applicant_name: string;
  applicant_email?: string | null;
  position_title: string;
  status: string;
  created_at?: string | null;
  contact_number?: string | null;
}

interface ApplicationsModuleProps {
  applications: ApplicationRow[];
  onRefresh?: () => void;
}

type ApplicationStatus =
  | "All"
  | "Pending"
  | "For Review"
  | "Shortlisted"
  | "Hired"
  | "Rejected";

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    "for review": "bg-blue-100 text-blue-800",
    shortlisted: "bg-purple-100 text-purple-800",
    hired: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        styles[normalized] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-[#0446A7]">
        ✓
      </div>

      <p className="font-semibold text-slate-700">{message}</p>

      <p className="mt-1 text-sm text-slate-500">
        Applications will appear here when applicants apply to your jobs.
      </p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ApplicationsModule({
  applications,
  onRefresh,
}: ApplicationsModuleProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ApplicationStatus>("All");

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        application.applicant_name?.toLowerCase().includes(searchText) ||
        application.applicant_email?.toLowerCase().includes(searchText) ||
        application.position_title?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        application.status?.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const countStatus = (status: string) =>
    applications.filter(
      (application) =>
        application.status?.toLowerCase() === status.toLowerCase()
    ).length;

  const statuses: ApplicationStatus[] = [
    "All",
    "Pending",
    "For Review",
    "Shortlisted",
    "Hired",
    "Rejected",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#123B70] sm:text-3xl">
            Applications
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review and manage applicants for your job vacancies.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          ↻ Refresh
        </button>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Applications",
            value: applications.length,
            color: "text-[#123B70]",
          },
          {
            label: "Pending",
            value: countStatus("pending"),
            color: "text-yellow-600",
          },
          {
            label: "Shortlisted",
            value: countStatus("shortlisted"),
            color: "text-purple-600",
          },
          {
            label: "Hired",
            value: countStatus("hired"),
            color: "text-green-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500">
              {stat.label}
            </p>

            <p className={`mt-3 text-3xl font-black ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Search and Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="application-search"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Search Applicants
            </label>

            <input
              id="application-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, or position..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="application-status"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Filter by Status
            </label>

            <select
              id="application-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as ApplicationStatus
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Applications" : status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Applications Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-black text-[#123B70]">
            Applicant List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredApplications.length} of {applications.length} applications
          </p>
        </div>

        {filteredApplications.length === 0 ? (
          <EmptyState
            message={
              applications.length === 0
                ? "No applications received yet."
                : "No applications match your search."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Applicant
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Position
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Date Applied
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">
                        {application.applicant_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {application.applicant_email || "No email provided"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700">
                        {application.position_title}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(application.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={application.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
