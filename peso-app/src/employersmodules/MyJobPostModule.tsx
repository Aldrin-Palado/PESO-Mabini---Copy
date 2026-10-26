
import { useMemo, useState } from "react";

interface JobPost {
  job_vacancy_id: number;
  position_title: string;
  status: string;
  created_at?: string;
  salary?: number | string | null;
  employment_type?: string | null;
  location?: string | null;
  description?: string | null;
  application_deadline?: string | null;
}

interface MyJobPostModuleProps {
  jobs: JobPost[];
  onRefresh?: () => void;
}

type JobStatus = "All" | "Active" | "Closed" | "Pending";

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();

  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    open: "bg-green-100 text-green-700",
    closed: "bg-slate-100 text-slate-600",
    pending: "bg-yellow-100 text-yellow-800",
    inactive: "bg-slate-100 text-slate-600",
    rejected: "bg-red-100 text-red-700",
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
        ▤
      </div>

      <p className="font-semibold text-slate-700">{message}</p>

      <p className="mt-1 text-sm text-slate-500">
        Your job posts will appear here.
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

function formatSalary(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "Salary not specified";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export default function MyJobPostModule({
  jobs,
  onRefresh,
}: MyJobPostModuleProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus>("All");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        job.position_title?.toLowerCase().includes(searchText) ||
        job.location?.toLowerCase().includes(searchText) ||
        job.employment_type?.toLowerCase().includes(searchText);

      const status = job.status?.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" &&
          ["active", "open"].includes(status)) ||
        (statusFilter === "Closed" && status === "closed") ||
        (statusFilter === "Pending" && status === "pending");

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const activeCount = jobs.filter((job) =>
    ["active", "open"].includes(job.status?.toLowerCase())
  ).length;

  const closedCount = jobs.filter(
    (job) => job.status?.toLowerCase() === "closed"
  ).length;

  const pendingCount = jobs.filter(
    (job) => job.status?.toLowerCase() === "pending"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#123B70] sm:text-3xl">
            My Job Posts
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage and monitor your company's job vacancies.
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total Job Posts
          </p>

          <p className="mt-3 text-3xl font-black text-[#123B70]">
            {jobs.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Active
          </p>

          <p className="mt-3 text-3xl font-black text-green-600">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Pending
          </p>

          <p className="mt-3 text-3xl font-black text-yellow-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Closed
          </p>

          <p className="mt-3 text-3xl font-black text-slate-600">
            {closedCount}
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="job-search"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Search Job Posts
            </label>

            <input
              id="job-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search position, location, or employment type..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="job-status-filter"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Filter by Status
            </label>

            <select
              id="job-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as JobStatus)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Job Posts</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </section>

      {/* Job Posts */}
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#123B70]">
              Job Vacancies
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredJobs.length} of {jobs.length} job posts
            </p>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <EmptyState
            message={
              jobs.length === 0
                ? "You have not posted any job vacancies yet."
                : "No job posts match your search."
            }
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredJobs.map((job) => (
              <article
                key={job.job_vacancy_id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {/* Job Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-lg font-black text-[#123B70]">
                      {job.position_title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Job ID: {job.job_vacancy_id}
                    </p>
                  </div>

                  <StatusBadge status={job.status} />
                </div>

                {/* Job Details */}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Salary
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {formatSalary(job.salary)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Employment Type
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {job.employment_type || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {job.location || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Posted Date
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {job.description && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Description
                    </p>

                    <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                      {job.description.length > 250
                        ? `${job.description.slice(0, 250)}...`
                        : job.description}
                    </p>
                  </div>
                )}

                {/* Deadline */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Application Deadline
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {formatDate(job.application_deadline)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
