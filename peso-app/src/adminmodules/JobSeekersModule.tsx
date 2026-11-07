import React, { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import AppIcon from "../components/AppIcon";
import { downloadCsv } from "../services/csvExport";
import { openStoredResume } from "../services/resumes";
import {
  getIncompleteJobSeekerProfileSections,
  JOB_SEEKER_PROFILE_SECTION_TITLES,
} from "../services/jobSeekerProfile";

type JobSeeker = {
  id?: string;
  job_seeker_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_no?: string;
  phone?: string;
  address?: string;
  status?: string;
  is_active?: boolean;
  verification_status?: JobSeekerVerificationStatus;
  created_at?: string;
  [key: string]: any;
};

type Props = {
  jobSeekers: JobSeeker[];
  applicationCounts: Record<string, number>;
  loadError?: string;
  search: string;
  setSearch: (value: string) => void;

  loading: boolean;
  onUpdate: (
    jobSeekerId: string,
    values: JobSeekerFormValues,
  ) => Promise<void>;
  onUpdateVerificationStatus: (
    jobSeekerId: string,
    status: JobSeekerVerificationStatus,
  ) => Promise<void>;
  onDelete: (jobSeekerId: string) => Promise<void>;

  ModuleHeader: React.ComponentType<{
    title: string;
    description: string;
    onRefresh?: () => void;
  }>;

  LoadingMessage: React.ComponentType;

  EmptyMessage: React.ComponentType<{
    message: string;
  }>;
};

export type JobSeekerVerificationStatus =
  | "pending"
  | "verified"
  | "not_approved";

export type JobSeekerFormValues = {
  full_name: string;
  email: string;
  contact_no: string;
  address: string;
  birth_date: string;
};

const detailFields: {
  section: string;
  fields: { key: string; label: string }[];
}[] = [
  {
    section: "Personal Information",
    fields: [
      { key: "dateOfBirth", label: "Date of Birth" },
      { key: "sex", label: "Sex" },
      { key: "civilStatus", label: "Civil Status" },
      { key: "presentAddress", label: "Present Address" },
      { key: "permanentAddress", label: "Permanent Address" },
      { key: "fatherName", label: "Father's Name" },
      { key: "motherName", label: "Mother's Name" },
      { key: "parentsCivilStatus", label: "Parents' Civil Status" },
      { key: "governmentIdType", label: "Type of Government ID" },
      { key: "governmentIdNumber", label: "Government ID Number" },
      { key: "heightCm", label: "Height (cm)" },
      { key: "weightKg", label: "Weight (kg)" },
      { key: "disability", label: "Disability" },
    ],
  },
  {
    section: "Employment Information",
    fields: [
      { key: "employmentStatus", label: "Employment Status" },
      { key: "unemploymentDurationMonths", label: "Months Looking for Work" },
      { key: "unemploymentReason", label: "Reason for Unemployment" },
      { key: "isOfw", label: "OFW" },
      { key: "isFormerOfw", label: "Former OFW" },
      { key: "is4PsBeneficiary", label: "4Ps Beneficiary" },
      { key: "preferredOccupation", label: "Preferred Occupation" },
      { key: "companyApplyingFor", label: "Company Applying For" },
      { key: "preferredWorkLocation", label: "Preferred Work Location" },
    ],
  },
  {
    section: "Language / Dialect Proficiency",
    fields: [
      { key: "languages", label: "Languages" },
      { key: "otherLanguage", label: "Other Language / Dialect" },
    ],
  },
  {
    section: "Educational Background",
    fields: [
      { key: "educationLevel", label: "Highest Educational Attainment" },
      { key: "elementaryEducation", label: "Elementary" },
      { key: "secondaryEducation", label: "Secondary" },
      { key: "tertiaryEducation", label: "Tertiary" },
      { key: "graduateStudies", label: "Graduate Studies" },
      { key: "undergraduateLevel", label: "Undergraduate Level" },
    ],
  },
  {
    section: "Technical / Vocational and Other Training",
    fields: [
      { key: "training1", label: "Training / Course 1" },
      { key: "training2", label: "Training / Course 2" },
      { key: "training3", label: "Training / Course 3" },
    ],
  },
  {
    section: "Eligibility / Professional License",
    fields: [
      { key: "eligibility1", label: "Eligibility / License 1" },
      { key: "eligibility2", label: "Eligibility / License 2" },
    ],
  },
  {
    section: "Work Experience",
    fields: [
      { key: "noWorkExperience", label: "No Previous Work Experience" },
      { key: "workExperience1", label: "Most Recent Work Experience" },
      { key: "workExperience2", label: "Previous Work Experience 2" },
      { key: "workExperience3", label: "Previous Work Experience 3" },
    ],
  },
  {
    section: "Other Skills Acquired Without Certificate",
    fields: [{ key: "otherSkills", label: "Other Skills" }],
  },
  {
    section: "History of SPES / GIP Engagement",
    fields: [
      { key: "spesGipHistory", label: "Participated in SPES / GIP" },
      { key: "engagementPeriod", label: "Period of Engagement" },
      { key: "spesGipId", label: "SPES / GIP ID Number" },
    ],
  },
  {
    section: "Certification / Authorization",
    fields: [
      { key: "signature", label: "Signature" },
      { key: "signatureDate", label: "Date Signed" },
      { key: "privacyConsent", label: "Data Privacy Consent" },
      { key: "privacyConsentAt", label: "Consent Given At" },
    ],
  },
];

type ActionsPosition = {
  top: number;
  left: number;
};

function getRegistrationDetails(jobSeeker: JobSeeker): Record<string, any> {
  const value = jobSeeker.registration_details;

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

function getJobSeekerChecklist(jobSeeker: JobSeeker) {
  const incompleteSections = new Set(
    getIncompleteJobSeekerProfileSections(jobSeeker.registration_details),
  );
  return [
    {
      label: "Account basics",
      complete:
        getSeekerName(jobSeeker) !== "Unnamed Job Seeker" &&
        Boolean(jobSeeker.email?.trim()),
    },
    ...JOB_SEEKER_PROFILE_SECTION_TITLES.map((label) => ({
      label,
      complete: !incompleteSections.has(label),
    })),
    {
      label: "Resume upload",
      complete: Boolean(
        typeof jobSeeker.resume_url === "string" &&
        jobSeeker.resume_url.trim(),
      ),
    },
  ];
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function getSeekerName(jobSeeker: JobSeeker): string {
  return (
    jobSeeker.full_name ||
    `${jobSeeker.first_name || ""} ${jobSeeker.last_name || ""}`.trim() ||
    "Unnamed Job Seeker"
  );
}

function getVerificationStatus(
  jobSeeker: JobSeeker,
): JobSeekerVerificationStatus {
  if (
    jobSeeker.verification_status === "verified" ||
    jobSeeker.verification_status === "not_approved"
  ) {
    return jobSeeker.verification_status;
  }
  return "pending";
}

function isVerificationStatus(
  value: string,
): value is JobSeekerVerificationStatus {
  return value === "pending" || value === "verified" || value === "not_approved";
}

export default function JobSeekersModule({
  jobSeekers,
  applicationCounts,
  loadError,
  search,
  setSearch,
  loading,
  onUpdate,
  onUpdateVerificationStatus,
  onDelete,
  ModuleHeader,
  LoadingMessage,
  EmptyMessage,
}: Props) {
  const [openActionsSeekerId, setOpenActionsSeekerId] = useState<string | null>(null);
  const [actionsPosition, setActionsPosition] = useState<ActionsPosition | null>(null);
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [screeningSeeker, setScreeningSeeker] = useState<JobSeeker | null>(null);
  const [editingSeeker, setEditingSeeker] = useState<JobSeeker | null>(null);
  const [formValues, setFormValues] = useState<JobSeekerFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingVerificationId, setUpdatingVerificationId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  useEffect(() => {
    if (!openActionsSeekerId) return;

    const closeOnViewportChange = () => {
      setOpenActionsSeekerId(null);
      setActionsPosition(null);
    };

    window.addEventListener("scroll", closeOnViewportChange, true);
    window.addEventListener("resize", closeOnViewportChange);
    return () => {
      window.removeEventListener("scroll", closeOnViewportChange, true);
      window.removeEventListener("resize", closeOnViewportChange);
    };
  }, [openActionsSeekerId]);

  const visibleJobSeekers = jobSeekers.filter((jobSeeker) => {
    const registration = getRegistrationDetails(jobSeeker);
    const gender = String(registration.sex || jobSeeker.sex || "").toLowerCase();
    const activeStatus =
      jobSeeker.is_active === undefined || jobSeeker.is_active
        ? "active"
        : "inactive";
    const complete = getJobSeekerChecklist(jobSeeker).every(
      (item) => item.complete,
    );
    const verificationStatus = getVerificationStatus(jobSeeker);
    return (
      (statusFilter === "all" || activeStatus === statusFilter) &&
      (genderFilter === "all" || gender === genderFilter) &&
      (verificationFilter === "all" ||
        verificationStatus === verificationFilter) &&
      (completionFilter === "all" ||
        (completionFilter === "ready" && complete) ||
        (completionFilter === "incomplete" && !complete))
    );
  });
  const startEditing = (jobSeeker: JobSeeker) => {
    setActionError("");
    setEditingSeeker(jobSeeker);
    setFormValues({
      full_name: getSeekerName(jobSeeker) === "Unnamed Job Seeker"
        ? ""
        : getSeekerName(jobSeeker),
      email: jobSeeker.email || "",
      contact_no: jobSeeker.contact_no || jobSeeker.phone || "",
      address: jobSeeker.address || "",
      birth_date: jobSeeker.birth_date || "",
    });
  };

  const saveJobSeeker = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const jobSeekerId = editingSeeker?.job_seeker_id;
    if (!jobSeekerId || !formValues) return;

    setSaving(true);
    setActionError("");
    try {
      await onUpdate(jobSeekerId, formValues);
      setEditingSeeker(null);
      setFormValues(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update job seeker.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateVerificationStatus = async (
    jobSeeker: JobSeeker,
    status: JobSeekerVerificationStatus,
  ) => {
    const jobSeekerId = jobSeeker.job_seeker_id;
    if (!jobSeekerId) return;
    if (
      status === "verified" &&
      !getJobSeekerChecklist(jobSeeker).every((item) => item.complete)
    ) {
      setActionError(
        "Complete the job seeker account, registration form, certification, and resume before verifying this profile.",
      );
      return;
    }

    setUpdatingVerificationId(jobSeekerId);
    setActionError("");
    try {
      await onUpdateVerificationStatus(jobSeekerId, status);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update job seeker verification status.",
      );
    } finally {
      setUpdatingVerificationId(null);
    }
  };

  const deleteJobSeeker = async (jobSeeker: JobSeeker) => {
    const jobSeekerId = jobSeeker.job_seeker_id;
    if (!jobSeekerId) return;
    const confirmed = window.confirm(
      `Delete ${getSeekerName(jobSeeker)}'s profile? This permanently deletes their applications. Their sign-in account may remain active.`,
    );
    if (!confirmed) return;

    setDeletingId(jobSeekerId);
    setActionError("");
    try {
      await onDelete(jobSeekerId);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to delete job seeker.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const openResume = async (jobSeeker: JobSeeker, rowId: string) => {
    const resumePath =
      typeof jobSeeker.resume_url === "string" ? jobSeeker.resume_url : "";

    if (!resumePath) return;

    setOpeningResumeId(rowId);
    setResumeError("");

    try {
      await openStoredResume(resumePath);
    } catch (openError) {
      console.error("Resume view error:", openError);
      setResumeError(
        openError instanceof Error
          ? openError.message
          : "Unable to open this resume. Please try again.",
      );
    } finally {
      setOpeningResumeId(null);
    }
  };

  const renderActions = (jobSeeker: JobSeeker, rowId: string) => {
    const isOpen = openActionsSeekerId === rowId;
    const closeActions = () => {
      setOpenActionsSeekerId(null);
      setActionsPosition(null);
    };

    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          aria-label={`Show actions for ${getSeekerName(jobSeeker)}`}
          aria-expanded={isOpen}
          onClick={(event) => {
            if (isOpen) {
              closeActions();
              return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const menuHeight = jobSeeker.resume_url ? 168 : 126;
            const menuWidth = 144;
            const openBelow =
              window.innerHeight - rect.bottom >= menuHeight + 8;
            setActionsPosition({
              top: openBelow
                ? rect.bottom + 8
                : Math.max(8, rect.top - menuHeight - 8),
              left: Math.min(
                Math.max(8, window.innerWidth - menuWidth - 8),
                Math.max(8, rect.right - menuWidth),
              ),
            });
            setOpenActionsSeekerId(rowId);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <span
            aria-hidden="true"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {isOpen && actionsPosition && createPortal(
          <div
            className="fixed z-[200] max-h-[calc(100vh-1rem)] w-36 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            style={actionsPosition}
          >
        <button
          type="button"
          onClick={() => {
            closeActions();
            setScreeningSeeker(jobSeeker);
          }}
          className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => {
            closeActions();
            startEditing(jobSeeker);
          }}
          disabled={!jobSeeker.job_seeker_id || deletingId === jobSeeker.job_seeker_id}
          className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
        >
          Edit
        </button>
        {jobSeeker.resume_url && (
          <button
            type="button"
            onClick={() => {
              closeActions();
              void openResume(jobSeeker, rowId);
            }}
            disabled={openingResumeId === rowId}
            className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
          >
            {openingResumeId === rowId ? "Opening..." : "Resume"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            closeActions();
            void deleteJobSeeker(jobSeeker);
          }}
          disabled={!jobSeeker.job_seeker_id || deletingId === jobSeeker.job_seeker_id}
          className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          {deletingId === jobSeeker.job_seeker_id ? "Deleting..." : "Delete"}
        </button>
          </div>,
          document.body,
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">

      <ModuleHeader
        title="Job Seekers Management"
        description="View and manage registered job seekers of PESO Mabini."
      />

      {loadError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {loadError}
        </p>
      )}

      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {actionError}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">Find job seekers</h2>
          <p className="mt-1 text-xs text-slate-500">
            Search profiles and filter by account status, completion, or gender.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_170px] lg:items-end xl:grid-cols-[minmax(0,1fr)_160px_170px_160px_160px]">
          <label className="block text-xs font-semibold text-slate-600">
            Search job seekers
            <span className="relative mt-1.5 block">
              <AppIcon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, or phone..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </span>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Profile completion
            <select
              value={completionFilter}
              onChange={(event) => setCompletionFilter(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All profiles</option>
              <option value="ready">Ready for verification</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Verification status
            <select
              value={verificationFilter}
              onChange={(event) => setVerificationFilter(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="not_approved">Not approved</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Account status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Gender
            <select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="prefer not to say">Prefer not to say</option>
            </select>
          </label>
        </div>
      </section>

      {resumeError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {resumeError}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered job seekers</h2>
            <p className="mt-0.5 text-xs text-slate-500">Profiles, contact information, account status, and verification readiness</p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Showing {visibleJobSeekers.length} of {jobSeekers.length}
          </span>
        </div>
        {loading ? (
          <LoadingMessage />
        ) : jobSeekers.length === 0 ? (
          <EmptyMessage message="No job seekers found." />
        ) : visibleJobSeekers.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No job seekers match these filters.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 2xl:hidden">
              {visibleJobSeekers.map((jobSeeker, index) => {
                const name = getSeekerName(jobSeeker);
                const registration = getRegistrationDetails(jobSeeker);
                const location = registration.presentAddress || jobSeeker.address || "-";
                const isActive = jobSeeker.is_active !== false;
                const checklist = getJobSeekerChecklist(jobSeeker);
                const completedSteps = checklist.filter((item) => item.complete).length;
                const profileComplete = completedSteps === checklist.length;
                const verificationStatus = getVerificationStatus(jobSeeker);
                const rowId = String(jobSeeker.id || jobSeeker.job_seeker_id || index);

                return (
                  <article key={rowId} className="p-4 transition hover:bg-slate-50/80 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1766B4]">
                        <AppIcon name="user" className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-slate-900">{name}</h3>
                            <p className={`mt-1 text-[10px] font-semibold ${
                              profileComplete ? "text-emerald-700" : "text-amber-700"
                            }`}>
                              {profileComplete ? "Ready for verification" : "Profile incomplete"} · {completedSteps}/{checklist.length} steps
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>{isActive ? "Active" : "Inactive"}</span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <p className="flex min-w-0 items-center gap-2">
                            <AppIcon name="mail" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{jobSeeker.email || "Email not provided"}</span>
                          </p>
                          <p className="flex min-w-0 items-center gap-2">
                            <AppIcon name="phone" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{jobSeeker.contact_no || jobSeeker.phone || "Phone not provided"}</span>
                          </p>
                          <p className="flex min-w-0 items-start gap-2 sm:col-span-2">
                            <AppIcon name="mapPin" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="line-clamp-2">{location}</span>
                          </p>
                          <p className="text-slate-500 sm:col-span-2">
                            {applicationCounts[jobSeeker.job_seeker_id || ""] ?? 0} applications
                          </p>
                        </div>
                        <label className="mt-3 block text-xs font-semibold text-slate-600">
                          Verification status
                          <select
                            value={verificationStatus}
                            onChange={(event) => {
                              if (isVerificationStatus(event.target.value)) {
                                void updateVerificationStatus(jobSeeker, event.target.value);
                              }
                            }}
                            disabled={
                              !jobSeeker.job_seeker_id ||
                              updatingVerificationId === jobSeeker.job_seeker_id
                            }
                            className={`mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-60 ${
                              verificationStatus === "verified"
                                ? "bg-emerald-50 text-emerald-700"
                                : verificationStatus === "not_approved"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="verified" disabled={!profileComplete && verificationStatus !== "verified"}>
                              Verified
                            </option>
                            <option value="not_approved">Not approved</option>
                          </select>
                        </label>
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          {renderActions(jobSeeker, rowId)}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto 2xl:block">
            <table className="w-full min-w-[1040px] table-fixed">
              <thead className="bg-gradient-to-r from-[#1766B4] to-[#124A91] text-left">
                <tr>
                  {[
                    ["Job Seeker", "w-[20%]"],
                    ["Email", "w-[20%]"],
                    ["Phone", "w-[14%]"],
                    ["Location", "w-[18%]"],
                    ["Status", "w-[14%]"],
                    ["Applications", "w-[6%]"],
                    ["Actions", "w-[8%]"],
                  ].map(([label, width]) => (
                    <th key={label} className={`${width} whitespace-nowrap px-3 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleJobSeekers.map((jobSeeker, index) => {

                    const name = getSeekerName(jobSeeker);

                    const registrationDetails = getRegistrationDetails(jobSeeker);
                    const location = registrationDetails.presentAddress || jobSeeker.address || "-";
                    const isActive = jobSeeker.is_active !== false;
                    const status = isActive ? "Active" : "Inactive";
                    const checklist = getJobSeekerChecklist(jobSeeker);
                    const completedSteps = checklist.filter((item) => item.complete).length;
                    const profileComplete = completedSteps === checklist.length;
                    const verificationStatus = getVerificationStatus(jobSeeker);

                    const rowId = String(
                      jobSeeker.id ||
                        jobSeeker.job_seeker_id ||
                        index,
                    );

                    return (
                      <tr
                        key={rowId}
                        className={`align-middle transition-colors hover:bg-blue-50/70 ${
                          index % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                        }`}
                      >
                        <td className="px-3 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1766B4]">
                              <AppIcon name="user" className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-900" title={name}>{name}</p>
                              <p className={`mt-1 text-[10px] font-semibold ${
                                profileComplete ? "text-emerald-700" : "text-amber-700"
                              }`}>
                                {profileComplete ? "Ready for verification" : "Profile incomplete"} · {completedSteps}/{checklist.length}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="truncate px-3 py-3 text-xs text-slate-700" title={jobSeeker.email || ""}>
                          <span className="block truncate">{jobSeeker.email || "-"}</span>
                        </td>
                        <td className="truncate px-3 py-3 text-xs text-slate-700" title={jobSeeker.contact_no || jobSeeker.phone || ""}>
                          <span className="block truncate">{jobSeeker.contact_no || jobSeeker.phone || "-"}</span>
                        </td>
                        <td className="truncate px-3 py-3 text-xs text-slate-700" title={String(location)}>
                          <span className="block truncate">{location}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>{status}</span>
                            <select
                              aria-label={`Verification status for ${name}`}
                              value={verificationStatus}
                              onChange={(event) => {
                                if (isVerificationStatus(event.target.value)) {
                                  void updateVerificationStatus(jobSeeker, event.target.value);
                                }
                              }}
                              disabled={
                                !jobSeeker.job_seeker_id ||
                                updatingVerificationId === jobSeeker.job_seeker_id
                              }
                              className={`max-w-full rounded-full border-0 px-2 py-1 text-[10px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${
                                verificationStatus === "verified"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : verificationStatus === "not_approved"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-800"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="verified" disabled={!profileComplete && verificationStatus !== "verified"}>
                                Verified
                              </option>
                              <option value="not_approved">Not approved</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-slate-700">
                          {applicationCounts[jobSeeker.job_seeker_id || ""] ?? 0}
                        </td>
                        <td className="px-3 py-3">
                          {renderActions(jobSeeker, rowId)}
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

      </section>

      {screeningSeeker && (
        <ScreeningModal
          jobSeeker={screeningSeeker}
          openingResumeId={openingResumeId}
          onOpenResume={openResume}
          onClose={() => setScreeningSeeker(null)}
        />
      )}

      {editingSeeker && formValues && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-job-seeker-title"
            onSubmit={(event) => void saveJobSeeker(event)}
            className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div>
              <h2 id="edit-job-seeker-title" className="text-lg font-bold text-slate-900">
                Update Job Seeker
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update the job seeker’s profile information. Changing this email does not change sign-in credentials.
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Full Name
              <input
                required
                value={formValues.full_name}
                onChange={(event) => setFormValues({ ...formValues, full_name: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={formValues.email}
                onChange={(event) => setFormValues({ ...formValues, email: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Contact Number
              <input
                value={formValues.contact_no}
                onChange={(event) => setFormValues({ ...formValues, contact_no: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Address
              <textarea
                rows={2}
                value={formValues.address}
                onChange={(event) => setFormValues({ ...formValues, address: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Birth Date
              <input
                type="date"
                value={formValues.birth_date}
                onChange={(event) => setFormValues({ ...formValues, birth_date: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSeeker(null);
                  setFormValues(null);
                }}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#203F8B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

function ScreeningModal({
  jobSeeker,
  openingResumeId,
  onOpenResume,
  onClose,
}: {
  jobSeeker: JobSeeker;
  openingResumeId: string | null;
  onOpenResume: (jobSeeker: JobSeeker, rowId: string) => Promise<void>;
  onClose: () => void;
}) {
  const details = getRegistrationDetails(jobSeeker);
  const rowId = String(
    jobSeeker.id || jobSeeker.job_seeker_id || jobSeeker.email || "screening",
  );
  const hasDetails = Object.keys(details).length > 0;
  const status =
    jobSeeker.status || (jobSeeker.is_active ? "Active" : "Inactive");
  const checklist = getJobSeekerChecklist(jobSeeker);
  const completedSteps = checklist.filter((item) => item.complete).length;
  const profileComplete = completedSteps === checklist.length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Job seeker screening details"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-4xl rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#203F8B]">
              Job Seeker Screening
            </p>
            <h3 className="mt-1 truncate text-lg font-bold text-slate-900">
              {getSeekerName(jobSeeker)}
            </h3>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {jobSeeker.email || "-"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close screening details"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <section className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Profile verification readiness
              </h4>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                profileComplete
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800"
              }`}>
                {profileComplete ? "Ready for verification" : "Profile incomplete"} · {completedSteps}/{checklist.length}
              </span>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                    item.complete
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-900"
                  }`}
                >
                  <span aria-hidden="true">{item.complete ? "✓" : "•"}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </section>
          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <ScreeningField label="Contact Number" value={jobSeeker.contact_no || jobSeeker.phone} />
            <ScreeningField label="Present Address" value={jobSeeker.address || details.presentAddress} />
            <ScreeningField label="Status" value={status} />
            <ScreeningField
              label="Verification Status"
              value={getVerificationStatus(jobSeeker).replace("_", " ")}
            />
            <ScreeningField label="Registered On" value={jobSeeker.created_at ? new Date(jobSeeker.created_at).toLocaleString() : "-"} />
            <ScreeningField label="Resume" value={jobSeeker.resume_url ? "Uploaded" : "Not uploaded"} />
            <div className="flex items-end">
              {jobSeeker.resume_url && (
                <button
                  type="button"
                  onClick={() => void onOpenResume(jobSeeker, rowId)}
                  disabled={openingResumeId === rowId}
                  className="rounded-full border border-[#203F8B] px-4 py-2 text-xs font-semibold text-[#203F8B] transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {openingResumeId === rowId ? "Opening..." : "View Resume"}
                </button>
              )}
            </div>
          </div>

          {!hasDetails ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              This job seeker has no registration details on file.
            </p>
          ) : (
            detailFields.map((group) => (
              <section key={group.section} className="rounded-xl border border-slate-200">
                <h4 className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#123B70]">
                  {group.section}
                </h4>
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.fields.map((field) => (
                    <ScreeningField
                      key={field.key}
                      label={field.label}
                      value={details[field.key]}
                      image={field.key === "signature"}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `${getSeekerName(jobSeeker)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")}-details.csv`,
                  [
                    {
                      label: "Full Name",
                      value: getSeekerName(jobSeeker),
                    },
                    { label: "Email", value: jobSeeker.email },
                    {
                      label: "Contact Number",
                      value: jobSeeker.contact_no || jobSeeker.phone,
                    },
                    {
                      label: "Present Address",
                      value: jobSeeker.address || details.presentAddress,
                    },
                    { label: "Status", value: status },
                    {
                      label: "Registered On",
                      value: jobSeeker.created_at
                        ? new Date(jobSeeker.created_at).toLocaleString()
                        : "-",
                    },
                    {
                      label: "Resume",
                      value: jobSeeker.resume_url
                        ? "Uploaded"
                        : "Not uploaded",
                    },
                    ...detailFields.flatMap((group) =>
                      group.fields.map((field) => ({
                        label: `${group.section} - ${field.label}`,
                        value:
                          field.key === "signature" &&
                          typeof details[field.key] === "string" &&
                          details[field.key].startsWith("data:image/")
                            ? "E-signature captured"
                            : details[field.key],
                      })),
                    ),
                  ],
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreeningField({
  label,
  value,
  image = false,
}: {
  label: string;
  value: unknown;
  image?: boolean;
}) {
  if (
    image &&
    typeof value === "string" &&
    value.startsWith("data:image/")
  ) {
    return (
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <img
          src={value}
          alt="Job seeker e-signature"
          className="mt-1 max-h-24 max-w-full rounded border border-slate-200 bg-white object-contain p-1"
        />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-slate-700">
        {formatDetailValue(value)}
      </p>
    </div>
  );
}