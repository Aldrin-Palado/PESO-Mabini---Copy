import React, { useMemo, useState } from "react";
import { openStoredResume } from "../services/resumes";
import type { ApplicationDecisionResult } from "../services/applicationDecisions";
import ApplicationScopeToggle from "../components/ApplicationScopeToggle";
import ModuleScoreboard from "./ModuleScoreboard";

type Application = {
  id?: string;
  application_id?: string;
  job_seeker_id?: string;
  employer_id?: string;
  is_peso_application?: boolean;
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
  can_update_status?: boolean;
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
  canDecideApplications: boolean;
  canDeleteApplications?: boolean;
  onUpdateStatus: (applicationId: string, status: string) => Promise<void>;
  onDecideApplication: (
    applicationId: string,
    approved: boolean,
  ) => Promise<ApplicationDecisionResult>;
  onDelete: (applicationId: string) => Promise<void>;
  LoadingMessage: React.ComponentType;
  EmptyMessage: React.ComponentType<{ message: string }>;
  formatDate: (date?: string) => string;
};

const STATUSES = [
  { value: "pending", label: "Pending", color: "bg-slate-100 text-slate-600" },
  { value: "under_review", label: "Under Review", color: "bg-blue-100 text-blue-700" },
  { value: "shortlisted", label: "Shortlisted", color: "bg-indigo-100 text-indigo-700" },
  { value: "qualified", label: "Qualified", color: "bg-violet-100 text-violet-700" },
  { value: "interviewed", label: "Interviewed", color: "bg-amber-100 text-amber-700" },
  { value: "hired", label: "You're Hired", color: "bg-emerald-100 text-emerald-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
];

function normalizeApplicationStatus(value: string): string {
  const normalized = String(value ?? "pending")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (normalized === "interview" || normalized === "interviewed") {
    return "interviewed";
  }

  if (normalized === "your_hired" || normalized === "youre_hired" || normalized === "you're_hired") {
    return "hired";
  }

  return normalized;
}

function getApplicationStatus(application: Application): string {
  return normalizeApplicationStatus(
    application.status || application.application_status || "pending",
  );
}

function getStatusLabel(value: string): string {
  const normalizedValue = normalizeApplicationStatus(value);

  return (
    STATUSES.find((status) => status.value === normalizedValue)?.label ||
    ({
      interview: "Interviewed",
      interviewed: "Interviewed",
      your_hired: "You're Hired",
      youre_hired: "You're Hired",
      "you're_hired": "You're Hired",
    } as Record<string, string>)[normalizedValue] ||
    normalizedValue.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function getRowId(application: Application, index: number): string {
  return String(application.application_id || application.id || index);
}

function getApplicantKey(application: Application): string {
  if (application.job_seeker_id) return `account:${application.job_seeker_id}`;
  if (application.applicant_email) {
    return `email:${application.applicant_email.trim().toLowerCase()}`;
  }
  if (application.applicant_name) {
    return `name:${application.applicant_name.trim().toLowerCase()}`;
  }
  return `application:${application.application_id || application.id || "unknown"}`;
}

export default function ApplicationsModule({
  applications,
  loadError,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  loading,
  canDecideApplications,
  canDeleteApplications = true,
  onUpdateStatus,
  onDecideApplication,
  onDelete,
  LoadingMessage,
  EmptyMessage,
  formatDate,
}: Props) {
  const [applicationScope, setApplicationScope] = useState<"peso" | "overall">(
    "peso",
  );
  const [employerFilter, setEmployerFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [decisionNotice, setDecisionNotice] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [expandedApplicants, setExpandedApplicants] = useState<Set<string>>(
    () => new Set(),
  );
  const [actionError, setActionError] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);

  const scopedApplications = useMemo(
    () =>
      applicationScope === "peso"
        ? applications.filter((application) => application.is_peso_application)
        : applications,
    [applicationScope, applications],
  );

  const employers = useMemo(() => {
    const options = new Map<string, string>();
    for (const application of scopedApplications) {
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
  }, [scopedApplications]);

  const jobs = useMemo(
    () =>
      [...new Set(
        scopedApplications
          .map((application) => application.position_title?.trim())
          .filter((title): title is string => Boolean(title)),
      )].sort((first, second) => first.localeCompare(second)),
    [scopedApplications],
  );

  const visibleApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return scopedApplications.filter((application) => {
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
        (employerFilter === "all" ||
          application.employer_id === employerFilter) &&
        (jobFilter === "all" ||
          application.position_title === jobFilter) &&
        (!dateFrom || (appliedDay && appliedDay >= dateFrom)) &&
        (!dateTo || (appliedDay && appliedDay <= dateTo))
      );
    });
  }, [
    scopedApplications,
    dateFrom,
    dateTo,
    employerFilter,
    jobFilter,
    search,
    statusFilter,
  ]);

  const applicationGroups = useMemo(() => {
    const groups = new Map<string, Application[]>();
    for (const application of visibleApplications) {
      const key = getApplicantKey(application);
      const group = groups.get(key);
      if (group) {
        group.push(application);
      } else {
        groups.set(key, [application]);
      }
    }

    return [...groups.entries()]
      .map(([key, groupApplications]) => ({
        key,
        name: groupApplications[0].applicant_name || "Applicant",
        email:
          groupApplications[0].applicant_email ||
          groupApplications[0].job_seeker_id ||
          "Email unavailable",
        applications: [...groupApplications].sort((first, second) => {
          const firstDate = new Date(
            first.date_applied || first.created_at || 0,
          ).getTime();
          const secondDate = new Date(
            second.date_applied || second.created_at || 0,
          ).getTime();
          return firstDate - secondDate;
        }),
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [visibleApplications]);

  const handleProgressUpdate = async (
    applicationId: string,
    status:
      | "pending"
      | "under_review"
      | "shortlisted"
      | "qualified"
      | "interviewed"
      | "hired"
      | "rejected",
  ) => {
    if (applicationScope !== "peso") {
      setActionError("Overall applications are view-only.");
      return;
    }

    setUpdatingId(applicationId);
    setActionError("");
    setDecisionNotice("");
    try {
      await onUpdateStatus(applicationId, status);
      setDecisionNotice(`Application status set to ${getStatusLabel(status)}.`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update application status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDecision = async (
    application: Application,
    rowId: string,
    approved: boolean,
  ) => {
    if (!application.application_id) return;
    if (applicationScope !== "peso" || !application.can_update_status) {
      setActionError("Only PESO applications can be updated here.");
      return;
    }
    const applicant = application.applicant_name || "this applicant";
    const position = application.position_title || "this position";
    const confirmed = window.confirm(
      approved
        ? `Approve ${applicant} for ${position} and send the hiring message?`
        : `Reject ${applicant}'s application for ${position} and send the rejection message?`,
    );
    if (!confirmed) return;

    setUpdatingId(rowId);
    setActionError("");
    setDecisionNotice("");
    try {
      const result = await onDecideApplication(application.application_id, approved);
      setDecisionNotice(
        result.message_sent
          ? approved
            ? "Application approved. The hiring message was sent in PESO-Hub and queued for email delivery."
            : "Application rejected. The rejection message was sent in PESO-Hub and queued for email delivery."
          : approved
          ? "This application is already approved. No duplicate message was sent."
          : "This application is already rejected. No duplicate message was sent.",
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to decide this application.",
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
      <ApplicationScopeToggle
        value={applicationScope}
        pesoCount={applications.filter(
          (application) => application.is_peso_application,
        ).length}
        overallCount={applications.length}
        onChange={setApplicationScope}
      />
      <ModuleScoreboard
        title="Applications"
        metrics={[
          { label: "Total applications", value: scopedApplications.length },
          ...STATUSES.map((status) => ({
            label: status.label,
            value: scopedApplications.filter(
              (application) => getApplicationStatus(application) === status.value,
            ).length,
          })),
        ]}
      />
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
      {decisionNotice && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {decisionNotice}
        </p>
      )}
      {resumeError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {resumeError}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
          <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2 xl:col-span-3">
            Search (Applicant / Job / Employer)
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, job, or company..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-[11px] font-semibold text-slate-600 xl:col-span-2">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"
            >
              <option value="All">All</option>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-slate-600 xl:col-span-2">
            Employer
            <select
              value={employerFilter}
              onChange={(event) => setEmployerFilter(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"
            >
              <option value="all">All</option>
              {employers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-slate-600 xl:col-span-2">
            Job
            <select
              value={jobFilter}
              onChange={(event) => setJobFilter(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"
            >
              <option value="all">All</option>
              {jobs.map((job) => <option key={job} value={job}>{job}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 xl:col-span-3">
            <label className="text-[11px] font-semibold text-slate-600">
              Date from
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="mt-1.5 w-full min-w-0 rounded-lg border border-slate-300 px-2.5 py-2.5 text-sm"
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Date to
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="mt-1.5 w-full min-w-0 rounded-lg border border-slate-300 px-2.5 py-2.5 text-sm"
              />
            </label>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            Results update automatically as you change the filters.
          </p>
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
        ) : scopedApplications.length === 0 ? (
          <EmptyMessage
            message={
              applicationScope === "peso"
                ? "No applications have been received for PESO job posts."
                : "No applications found."
            }
          />
        ) : visibleApplications.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500">
            No applications match these filters.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {applicationGroups.map((group) => (
              <section key={group.key} aria-label={`Applications for ${group.name}`}>
                <header className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2.5 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0759AE] text-[10px] font-bold text-white">
                      {group.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-slate-800">
                        {group.name}
                      </p>
                      <p className="truncate text-[9px] text-slate-400">{group.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-expanded={expandedApplicants.has(group.key)}
                    aria-controls={
                      expandedApplicants.has(group.key)
                        ? `applications-${encodeURIComponent(group.key)}`
                        : undefined
                    }
                    aria-label={`${expandedApplicants.has(group.key) ? "Hide" : "Show"} applications for ${group.name} (${group.applications.length})`}
                    onClick={() =>
                      setExpandedApplicants((current) => {
                        const next = new Set(current);
                        if (next.has(group.key)) {
                          next.delete(group.key);
                        } else {
                          next.add(group.key);
                        }
                        return next;
                      })
                    }
                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-white hover:text-[#0759AE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  >
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] text-slate-500 ring-1 ring-slate-200">
                      {group.applications.length}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`text-sm leading-none transition-transform ${
                        expandedApplicants.has(group.key) ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                </header>
                {expandedApplicants.has(group.key) && (
                  <div
                    id={`applications-${encodeURIComponent(group.key)}`}
                    className="divide-y divide-slate-100"
                  >
                    {group.applications.map((application, index) => {
              const rowId = getRowId(application, index);
              const status = getApplicationStatus(application);
              const statusStyle =
                STATUSES.find((item) => item.value === status)?.color ||
                "bg-slate-100 text-slate-600";
              return (
                <article key={rowId} className="flex flex-col gap-3 px-3 py-3 pl-5 hover:bg-slate-50 sm:flex-row sm:items-center sm:pl-8 sm:pr-4">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#0759AE]">
                        Application no. {index + 1}
                      </p>
                      <p className="mt-1 truncate text-[10px] font-semibold text-slate-800">
                        {application.position_title || "Position not specified"}
                      </p>
                      <p className="truncate text-[9px] text-slate-500">
                        {application.employer_name || "Employer unavailable"}
                        {application.job_location ? ` · ${application.job_location}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    {applicationScope === "peso" &&
                    application.can_update_status &&
                    !["hired", "rejected"].includes(status) &&
                    application.application_id ? (
                      <label className="sr-only" htmlFor={`application-status-${rowId}`}>
                        Update application status
                      </label>
                    ) : null}
                    {applicationScope === "peso" &&
                    application.can_update_status &&
                    !["hired", "rejected"].includes(status) &&
                    application.application_id ? (
                      <select
                        id={`application-status-${rowId}`}
                        value={status}
                        disabled={updatingId === rowId}
                        onChange={(event) => {
                          const nextStatus = event.target.value;
                          if (
                            nextStatus === "pending" ||
                            nextStatus === "under_review" ||
                            nextStatus === "shortlisted" ||
                            nextStatus === "qualified" ||
                            nextStatus === "interviewed" ||
                            nextStatus === "hired" ||
                            (nextStatus === "rejected" && !canDecideApplications)
                          ) {
                            void handleProgressUpdate(
                              application.application_id!,
                              nextStatus as
                                | "pending"
                                | "under_review"
                                | "shortlisted"
                                | "qualified"
                                | "interviewed"
                                | "hired"
                                | "rejected",
                            );
                          } else if (nextStatus === "approved") {
                            void handleDecision(application, rowId, true);
                          } else if (nextStatus === "rejected") {
                            void handleDecision(application, rowId, false);
                          }
                        }}
                        className={`max-w-full rounded-lg border px-3 py-2 text-[10px] font-bold outline-none transition focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-60 ${statusStyle}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="qualified">Qualified</option>
                        <option value="interviewed">Interviewed</option>
                        {applicationScope === "peso" &&
                        canDecideApplications &&
                        application.can_update_status && (
                          <>
                            <option value="approved">Approved</option>
                            <option value="rejected">Reject</option>
                          </>
                        )}
                        {applicationScope === "peso" &&
                        !canDecideApplications &&
                        application.can_update_status && (
                          <>
                            <option value="hired">You're Hired</option>
                            <option value="rejected">Rejected</option>
                          </>
                        )}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1.5 text-[9px] font-bold ${statusStyle}`}>
                          {getStatusLabel(status)}
                        </span>
                        {(applicationScope === "overall" ||
                          !application.can_update_status) && (
                          <span className="text-[9px] font-semibold text-slate-400">
                            View only
                          </span>
                        )}
                      </div>
                    )}
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
                    {applicationScope === "peso" && canDeleteApplications && (
                      <button
                        type="button"
                        disabled={!application.application_id || deletingId === rowId}
                        onClick={() => void handleDelete(application, rowId)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === rowId ? "Deleting..." : "Delete"}
                      </button>
                    )}
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
                ))}
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
