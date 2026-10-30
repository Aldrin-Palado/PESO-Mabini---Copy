import React, { useMemo, useState } from "react";
import { openStoredResume } from "../services/resumes";

type Application = {
  id?: string;
  application_id?: string;
  job_seeker_id?: string;
  employer_id?: string;
  job_vacancy_id?: string | null;
  status?: string;
  application_status?: string;
  created_at?: string;
  updated_at?: string;
  date_applied?: string;
  position_title?: string | null;
  employer_name?: string | null;
  job_location?: string | null;
  job_requirements?: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  contact_number?: string | null;
  applicant_address?: string | null;
  resume_url?: string | null;
  [key: string]: any;
};

type Props = {
  applications: Application[];
  loadError?: string;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (applicationId: string, status: string) => Promise<void>;
  onDelete: (applicationId: string) => Promise<void>;
  ModuleHeader: React.ComponentType<{
    title: string;
    description: string;
    onRefresh?: () => void;
  }>;
  LoadingMessage: React.ComponentType;
  EmptyMessage: React.ComponentType<{ message: string }>;
  formatDate: (date?: string) => string;
};

const STATUSES = [
  { value: "pending", label: "Submitted", color: "bg-slate-100 text-slate-600" },
  { value: "under_review", label: "Under Review", color: "bg-blue-100 text-blue-700" },
  { value: "shortlisted", label: "Shortlisted", color: "bg-indigo-100 text-indigo-700" },
  { value: "interview", label: "Interview", color: "bg-amber-100 text-amber-700" },
  { value: "hired", label: "Hired", color: "bg-emerald-100 text-emerald-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-gray-100 text-gray-600" },
];

function getApplicationStatus(application: Application): string {
  return String(
    application.status || application.application_status || "pending",
  ).toLowerCase().replace(/\s+/g, "_");
}

function getStatusLabel(value: string): string {
  return (
    STATUSES.find((status) => status.value === value)?.label ||
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function getRowId(application: Application, index: number): string {
  return String(application.application_id || application.id || index);
}

export default function ApplicationsModule({
  applications,
  loadError,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  loading,
  onRefresh,
  onUpdateStatus,
  onDelete,
  ModuleHeader,
  LoadingMessage,
  EmptyMessage,
  formatDate,
}: Props) {
  const [employerFilter, setEmployerFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedEmployerFilter, setAppliedEmployerFilter] = useState("all");
  const [appliedJobFilter, setAppliedJobFilter] = useState("all");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [actionError, setActionError] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);

  const employers = useMemo(() => {
    const options = new Map<string, string>();
    for (const application of applications) {
      if (application.employer_id) {
        options.set(
          application.employer_id,
          application.employer_name || application.employer_id,
        );
      }
    }
    return [...options.entries()].sort((first, second) =>
      first[1].localeCompare(second[1]),
    );
  }, [applications]);

  const jobs = useMemo(
    () =>
      [...new Set(
        applications
          .map((application) => application.position_title?.trim())
          .filter((title): title is string => Boolean(title)),
      )].sort((first, second) => first.localeCompare(second)),
    [applications],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const application of applications) {
      const status = getApplicationStatus(application);
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }, [applications]);

  const visibleApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return applications.filter((application) => {
      const status = getApplicationStatus(application);
      const appliedDate = application.date_applied || application.created_at;
      const appliedDay = appliedDate ? appliedDate.slice(0, 10) : "";

      return (
        (statusFilter === "All" || status === statusFilter) &&
        (!normalizedSearch ||
          [
            application.applicant_name,
            application.applicant_email,
            application.contact_number,
            application.position_title,
            application.employer_name,
            application.job_seeker_id,
            application.employer_id,
          ]
            .some((value) => String(value || "").toLowerCase().includes(normalizedSearch))) &&
        (appliedEmployerFilter === "all" ||
          application.employer_id === appliedEmployerFilter) &&
        (appliedJobFilter === "all" ||
          application.position_title === appliedJobFilter) &&
        (!appliedDateFrom || (appliedDay && appliedDay >= appliedDateFrom)) &&
        (!appliedDateTo || (appliedDay && appliedDay <= appliedDateTo))
      );
    });
  }, [
    applications,
    appliedDateFrom,
    appliedDateTo,
    appliedEmployerFilter,
    appliedJobFilter,
    search,
    statusFilter,
  ]);

  const applyFilters = () => {
    setAppliedEmployerFilter(employerFilter);
    setAppliedJobFilter(jobFilter);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setEmployerFilter("all");
    setJobFilter("all");
    setDateFrom("");
    setDateTo("");
    setAppliedEmployerFilter("all");
    setAppliedJobFilter("all");
    setAppliedDateFrom("");
    setAppliedDateTo("");
  };

  const handleStatusUpdate = async (applicationId: string) => {
    const status = pendingStatuses[applicationId];
    if (!status) return;
    setUpdatingId(applicationId);
    setActionError("");
    try {
      await onUpdateStatus(applicationId, status);
      setPendingStatuses((current) => {
        const next = { ...current };
        delete next[applicationId];
        return next;
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update application status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (application: Application, rowId: string) => {
    if (!application.application_id) return;
    const confirmed = window.confirm(
      `Delete the application from ${application.applicant_name || "this applicant"} for ${application.position_title || "this job"}? This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeletingId(rowId);
    setActionError("");
    try {
      await onDelete(application.application_id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to delete application.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const openResume = async (resumeValue: string | null | undefined, rowId: string) => {
    if (!resumeValue) return;
    setOpeningResumeId(rowId);
    setResumeError("");
    try {
      await openStoredResume(resumeValue);
    } catch (error) {
      console.error("Resume view error:", error);
      setResumeError(
        error instanceof Error ? error.message : "Unable to open this resume.",
      );
    } finally {
      setOpeningResumeId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ModuleHeader
          title="Applications"
          description="Review job applications and update their progress."
          onRefresh={onRefresh}
        />
        <div className="flex flex-wrap gap-1.5 lg:justify-end">
          {STATUSES.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === status.value ? "All" : status.value)
              }
              aria-pressed={statusFilter === status.value}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.color} ${
                statusFilter === status.value ? "ring-2 ring-blue-500 ring-offset-1" : ""
              }`}
            >
              {status.label}: {statusCounts[status.value] || 0}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {loadError}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {actionError}
        </p>
      )}
      {resumeError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {resumeError}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(190px,1.4fr)_minmax(120px,0.8fr)_minmax(140px,0.9fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)]">
          <label className="text-[10px] font-semibold text-slate-600">
            Search (Applicant / Job / Employer)
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, job, or company..."
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal outline-none focus:border-blue-500"
            />
          </label>
          <label className="text-[10px] font-semibold text-slate-600">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal"
            >
              <option value="All">All</option>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-semibold text-slate-600">
            Employer
            <select
              value={employerFilter}
              onChange={(event) => setEmployerFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal"
            >
              <option value="all">All</option>
              {employers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-semibold text-slate-600">
            Job
            <select
              value={jobFilter}
              onChange={(event) => setJobFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal"
            >
              <option value="all">All</option>
              {jobs.map((job) => <option key={job} value={job}>{job}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-semibold text-slate-600">
              Date from
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="mt-1 w-full min-w-0 rounded-md border border-slate-300 px-2 py-2 text-xs"
              />
            </label>
            <label className="text-[10px] font-semibold text-slate-600">
              Date to
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="mt-1 w-full min-w-0 rounded-md border border-slate-300 px-2 py-2 text-xs"
              />
            </label>
          </div>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-md bg-[#0759AE] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#064A91]"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <h2 className="text-xs font-bold text-slate-700">Applications</h2>
          <span className="text-[10px] text-slate-400">
            {visibleApplications.length} record{visibleApplications.length === 1 ? "" : "s"}
          </span>
        </header>
        {loading ? (
          <LoadingMessage />
        ) : applications.length === 0 ? (
          <EmptyMessage message="No applications found. Applications appear here after job seekers apply to a job." />
        ) : visibleApplications.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500">
            No applications match these filters.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleApplications.map((application, index) => {
              const rowId = getRowId(application, index);
              const status = getApplicationStatus(application);
              const selectedStatus = pendingStatuses[rowId] || status;
              const statusStyle =
                STATUSES.find((item) => item.value === status)?.color ||
                "bg-slate-100 text-slate-600";
              return (
                <article key={rowId} className="flex flex-col gap-3 px-3 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:px-4">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0759AE] text-[10px] font-bold text-white">
                      {(application.applicant_name || "A").trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-slate-800">
                        {application.applicant_name || "Applicant"}
                      </p>
                      <p className="truncate text-[9px] text-slate-400">
                        {application.applicant_email || application.job_seeker_id || "Email unavailable"}
                      </p>
                      <p className="mt-1 truncate text-[10px] font-semibold text-slate-700">
                        {application.position_title || "Position not specified"}
                      </p>
                      <p className="truncate text-[9px] text-slate-500">
                        {application.employer_name || "Employer unavailable"}
                        {application.job_location ? ` · ${application.job_location}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusStyle}`}>
                      {getStatusLabel(status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedApplication(application)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      View details / requirements
                    </button>
                    {application.resume_url && (
                      <button
                        type="button"
                        disabled={openingResumeId === rowId}
                        onClick={() => void openResume(application.resume_url, rowId)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-600 disabled:opacity-50"
                      >
                        {openingResumeId === rowId ? "Opening..." : "Resume"}
                      </button>
                    )}
                    <select
                      aria-label={`Set status for ${application.applicant_name || "application"}`}
                      value={selectedStatus}
                      disabled={updatingId === rowId}
                      onChange={(event) =>
                        setPendingStatuses((current) => ({
                          ...current,
                          [rowId]: event.target.value,
                        }))
                      }
                      className="max-w-[118px] rounded-md border border-slate-300 px-2 py-1 text-[9px]"
                    >
                      {STATUSES.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                      {!STATUSES.some((item) => item.value === status) && (
                        <option value={status}>{getStatusLabel(status)}</option>
                      )}
                    </select>
                    <button
                      type="button"
                      disabled={!pendingStatuses[rowId] || updatingId === rowId}
                      onClick={() => void handleStatusUpdate(rowId)}
                      className="rounded-md bg-[#0759AE] px-2 py-1 text-[9px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {updatingId === rowId ? "Saving..." : "Update"}
                    </button>
                    <button
                      type="button"
                      disabled={!application.application_id || deletingId === rowId}
                      onClick={() => void handleDelete(application, rowId)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      {deletingId === rowId ? "Deleting..." : "Delete"}
                    </button>
                  </div>

                  <div className="flex shrink-0 justify-between gap-3 text-[8px] text-slate-400 sm:block sm:text-right">
                    <span>Created: {formatDate(application.date_applied || application.created_at)}</span>
                    <span className="sm:block">Updated: {formatDate(application.updated_at)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedApplication(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-details-title"
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="application-details-title" className="text-base font-bold text-slate-800">
                  Application details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedApplication.applicant_name || "Applicant"} · {selectedApplication.position_title || "Position not specified"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                aria-label="Close application details"
                className="rounded-md px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-500">Employer</dt><dd className="mt-1 text-slate-800">{selectedApplication.employer_name || "Not available"}</dd></div>
              <div><dt className="font-semibold text-slate-500">Location</dt><dd className="mt-1 text-slate-800">{selectedApplication.job_location || "Not available"}</dd></div>
              <div><dt className="font-semibold text-slate-500">Applicant email</dt><dd className="mt-1 break-all text-slate-800">{selectedApplication.applicant_email || "Not available"}</dd></div>
              <div><dt className="font-semibold text-slate-500">Contact number</dt><dd className="mt-1 text-slate-800">{selectedApplication.contact_number || "Not available"}</dd></div>
              <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Address</dt><dd className="mt-1 text-slate-800">{selectedApplication.applicant_address || "Not available"}</dd></div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-500">Job requirements</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-800">
                  {selectedApplication.job_requirements || "No requirements provided."}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
