import { useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { openStoredResume } from "../services/resumes";

type ApplicationDocument = {
  name: string;
  path: string;
};

type ApplicationRow = {
  application_id: string;
  employer_id: string;
  job_seeker_id: string;
  job_vacancy_id?: string | null;
  position_title: string | null;
  status: string;
  date_applied: string;
  applicant_name?: string | null;
  applicant_email?: string | null;
  contact_number?: string | null;
  applicant_address?: string | null;
  applicant_qualification_files?: ApplicationDocument[] | null;
};

type Props = {
  applications: ApplicationRow[];
  onRefresh: () => Promise<void> | void;
};

const STATUSES = [
  { value: "pending", label: "Pending", color: "bg-slate-100 text-slate-600" },
  { value: "under_review", label: "Under Review", color: "bg-blue-100 text-blue-700" },
  { value: "shortlisted", label: "Shortlisted", color: "bg-indigo-100 text-indigo-700" },
  { value: "qualified", label: "Qualified", color: "bg-violet-100 text-violet-700" },
  { value: "interviewed", label: "Interviewed", color: "bg-amber-100 text-amber-700" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-gray-100 text-gray-600" },
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

function getApplicationStatus(application: ApplicationRow): string {
  return normalizeApplicationStatus(application.status || "pending");
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

function getApplicantKey(application: ApplicationRow): string {
  if (application.job_seeker_id) return `account:${application.job_seeker_id}`;
  if (application.applicant_email) {
    return `email:${application.applicant_email.trim().toLowerCase()}`;
  }
  return `name:${(application.applicant_name || "Job Seeker").trim().toLowerCase()}`;
}

function formatDate(date?: string) {
  if (!date) return "Not specified";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Not specified";
  return parsedDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ApplicationsModule({
  applications,
  onRefresh,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [jobPostFilter, setJobPostFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [openingDocumentPath, setOpeningDocumentPath] = useState<string | null>(null);
  const [downloadingDocumentPath, setDownloadingDocumentPath] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationRow | null>(null);
  const [expandedApplicants, setExpandedApplicants] = useState<Set<string>>(
    () => new Set(),
  );

  const jobPostOptions = useMemo(
    () =>
      [
        ...new Set(
          applications.map(
            (application) =>
              application.position_title?.trim() || "Position not specified",
          ),
        ),
      ].sort((first, second) => first.localeCompare(second)),
    [applications],
  );

  const visibleApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return applications.filter((application) => {
      const appliedDay = application.date_applied?.slice(0, 10) || "";
      return (
        (statusFilter === "All" ||
          getApplicationStatus(application) === statusFilter) &&
        (!jobPostFilter ||
          (application.position_title?.trim() || "Position not specified") ===
            jobPostFilter) &&
        (!normalizedSearch ||
          [
            application.applicant_name,
            application.applicant_email,
            application.contact_number,
            application.applicant_address,
            application.position_title,
          ].some((value) =>
            String(value || "").toLowerCase().includes(normalizedSearch),
          )) &&
        (!dateFrom || (appliedDay && appliedDay >= dateFrom)) &&
        (!dateTo || (appliedDay && appliedDay <= dateTo))
      );
    });
  }, [applications, dateFrom, dateTo, jobPostFilter, search, statusFilter]);

  const applicationGroups = useMemo(() => {
    const groups = new Map<string, ApplicationRow[]>();
    for (const application of visibleApplications) {
      const key = getApplicantKey(application);
      const group = groups.get(key);
      if (group) group.push(application);
      else groups.set(key, [application]);
    }

    return [...groups.entries()]
      .map(([key, groupApplications]) => ({
        key,
        name: groupApplications[0].applicant_name || "Job Seeker",
        email: groupApplications[0].applicant_email || "Email unavailable",
        applications: [...groupApplications].sort(
          (first, second) =>
            new Date(first.date_applied || 0).getTime() -
            new Date(second.date_applied || 0).getTime(),
        ),
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [visibleApplications]);

  const handleStatusChange = async (
    application: ApplicationRow,
    newStatus: string,
  ) => {
    setUpdatingId(application.application_id);
    setActionError("");
    setNotice("");

    try {
      const { error } = await supabase
        .from("application")
        .update({ status: newStatus })
        .eq("application_id", application.application_id)
        .eq("employer_id", application.employer_id);

      if (error) throw error;

      await onRefresh();
      setNotice(`Application status set to ${getStatusLabel(newStatus)}.`);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update the application status. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenDocument = async (document: ApplicationDocument) => {
    setOpeningDocumentPath(document.path);
    setActionError("");
    try {
      await openStoredResume(document.path);
    } catch (error) {
      console.error("Could not open applicant document:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to open the applicant document.",
      );
    } finally {
      setOpeningDocumentPath(null);
    }
  };

  const handleDownloadDocument = async (document: ApplicationDocument) => {
    setDownloadingDocumentPath(document.path);
    setActionError("");
    try {
      const { data, error } = await supabase.storage
        .from("Resume Files")
        .createSignedUrl(document.path, 60, { download: document.name });

      if (error) throw error;

      const link = window.document.createElement("a");
      link.href = data.signedUrl;
      link.download = document.name;
      link.rel = "noopener noreferrer";
      link.click();
    } catch (error) {
      console.error("Could not download applicant document:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to download the applicant document.",
      );
    } finally {
      setDownloadingDocumentPath(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="shrink-0">
          <h3 className="text-lg font-bold text-slate-900">Applications</h3>
          <p className="mt-1 text-sm text-slate-500">
            Review applicants and update their progress for your job postings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            aria-pressed={statusFilter === "All"}
            className={`rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition ${
              statusFilter === "All" ? "ring-2 ring-blue-500 ring-offset-1" : ""
            }`}
          >
            All
          </button>
          {STATUSES.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === status.value ? "All" : status.value)
              }
              aria-pressed={statusFilter === status.value}
              className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition ${status.color} ${
                statusFilter === status.value ? "ring-2 ring-blue-500 ring-offset-1" : ""
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {actionError}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
          <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2 xl:col-span-6">
            Search (Applicant / Job)
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, or job..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-[11px] font-semibold text-slate-600 xl:col-span-2">
            Job post
            <select
              value={jobPostFilter}
              onChange={(event) => setJobPostFilter(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"
            >
              <option value="">All job posts</option>
              {jobPostOptions.map((jobPost) => (
                <option key={jobPost} value={jobPost}>
                  {jobPost}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 xl:col-span-4">
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
        {applications.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500">
            No applications found. Applications will appear here after job seekers apply to your jobs.
          </p>
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
                      <p className="truncate text-[9px] text-slate-400">
                        {group.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-expanded={expandedApplicants.has(group.key)}
                    aria-controls={
                      expandedApplicants.has(group.key)
                        ? `employer-applications-${encodeURIComponent(group.key)}`
                        : undefined
                    }
                    aria-label={`${expandedApplicants.has(group.key) ? "Hide" : "Show"} applications for ${group.name} (${group.applications.length})`}
                    onClick={() =>
                      setExpandedApplicants((current) => {
                        const next = new Set(current);
                        if (next.has(group.key)) next.delete(group.key);
                        else next.add(group.key);
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
                    id={`employer-applications-${encodeURIComponent(group.key)}`}
                    className="divide-y divide-slate-100"
                  >
                    {group.applications.map((application, index) => {
                      const status = getApplicationStatus(application);
                      const statusStyle =
                        STATUSES.find((item) => item.value === status)?.color ||
                        "bg-slate-100 text-slate-600";
                      return (
                        <article
                          key={application.application_id}
                          className="flex flex-col gap-3 px-3 py-3 pl-5 hover:bg-slate-50 sm:flex-row sm:items-center sm:pl-8 sm:pr-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-[#0759AE]">
                              Application no. {index + 1}
                            </p>
                            <p className="mt-1 truncate text-[10px] font-semibold text-slate-800">
                              {application.position_title || "Position not specified"}
                            </p>
                            <p className="truncate text-[9px] text-slate-500">
                              Applied {formatDate(application.date_applied)}
                              {application.contact_number
                                ? ` · ${application.contact_number}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setActionError("");
                                setSelectedApplication(application);
                              }}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-800 transition hover:bg-blue-100"
                            >
                              Details
                            </button>
                            <label
                              className="sr-only"
                              htmlFor={`employer-application-status-${application.application_id}`}
                            >
                              Update application status
                            </label>
                            <select
                              id={`employer-application-status-${application.application_id}`}
                              value={status}
                              disabled={updatingId === application.application_id}
                              onChange={(event) => {
                                const newStatus = event.currentTarget.value;
                                const confirmed = window.confirm(
                                  `Are you sure you want to change ${application.applicant_name || "this applicant"}'s application status from ${getStatusLabel(status)} to ${getStatusLabel(newStatus)}?`,
                                );

                                if (!confirmed) {
                                  event.currentTarget.value = status;
                                  return;
                                }

                                void handleStatusChange(application, newStatus);
                              }}
                              className={`max-w-full rounded-lg border px-3 py-2 text-[10px] font-bold outline-none transition focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-60 ${statusStyle}`}
                            >
                              {STATUSES.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedApplication(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Application details
                </p>
                <h2
                  id="application-details-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {selectedApplication.applicant_name || "Job Seeker"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedApplication.position_title || "Position not specified"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close application details"
                onClick={() => setSelectedApplication(null)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                Close
              </button>
            </header>

            <div className="space-y-6 p-5 sm:p-6">
              {actionError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  {actionError}
                </p>
              )}
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Email", selectedApplication.applicant_email],
                  ["Contact number", selectedApplication.contact_number],
                  ["Address", selectedApplication.applicant_address],
                  ["Date applied", formatDate(selectedApplication.date_applied)],
                  ["Application status", getStatusLabel(selectedApplication.status)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-1 break-words text-sm text-slate-800">
                      {value || "Not provided"}
                    </dd>
                  </div>
                ))}
              </dl>

              <section>
                <h3 className="text-sm font-bold text-slate-900">
                  Attached requirements
                </h3>
                {(selectedApplication.applicant_qualification_files ?? []).length ===
                0 ? (
                  <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    No requirement documents were attached to this application.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {selectedApplication.applicant_qualification_files?.map(
                      (document) => (
                        <li
                          key={document.path}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="min-w-0 break-all text-sm font-medium text-slate-700">
                            {document.name}
                          </span>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              disabled={openingDocumentPath === document.path}
                              onClick={() => void handleOpenDocument(document)}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60"
                            >
                              {openingDocumentPath === document.path
                                ? "Opening..."
                                : "View"}
                            </button>
                            <button
                              type="button"
                              disabled={downloadingDocumentPath === document.path}
                              onClick={() => void handleDownloadDocument(document)}
                              className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
                            >
                              {downloadingDocumentPath === document.path
                                ? "Downloading..."
                                : "Download"}
                            </button>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </section>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
