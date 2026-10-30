import React, { useState, type FormEvent } from "react";
import { openStoredResume } from "../services/resumes";

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
  onRefresh: () => void;
  onUpdate: (
    jobSeekerId: string,
    values: JobSeekerFormValues,
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

export default function JobSeekersModule({
  jobSeekers,
  applicationCounts,
  loadError,
  search,
  setSearch,
  loading,
  onRefresh,
  onUpdate,
  onDelete,
  ModuleHeader,
  LoadingMessage,
  EmptyMessage,
}: Props) {
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [screeningSeeker, setScreeningSeeker] = useState<JobSeeker | null>(null);
  const [editingSeeker, setEditingSeeker] = useState<JobSeeker | null>(null);
  const [formValues, setFormValues] = useState<JobSeekerFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");
  const [appliedGenderFilter, setAppliedGenderFilter] = useState("all");

  const visibleJobSeekers = jobSeekers.filter((jobSeeker) => {
    const registration = getRegistrationDetails(jobSeeker);
    const gender = String(registration.sex || jobSeeker.sex || "").toLowerCase();
    const activeStatus =
      jobSeeker.is_active === undefined || jobSeeker.is_active
        ? "active"
        : "inactive";
    return (
      (appliedStatusFilter === "all" || activeStatus === appliedStatusFilter) &&
      (appliedGenderFilter === "all" || gender === appliedGenderFilter)
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

  return (
    <div className="space-y-4">

      <ModuleHeader
        title="Job Seekers Management"
        description="View and manage registered job seekers of PESO Mabini."
        onRefresh={onRefresh}
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

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_auto] lg:items-end">
        <label className="block text-[11px] font-semibold text-slate-600">
          Search (Name / Email / Phone)
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="e.g. name, phone, or email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="block text-[11px] font-semibold text-slate-600">
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-normal text-slate-800"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="block text-[11px] font-semibold text-slate-600">
          Gender
          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-normal text-slate-800"
          >
            <option value="all">All</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="prefer not to say">Prefer not to say</option>
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setGenderFilter("all");
              setAppliedStatusFilter("all");
              setAppliedGenderFilter("all");
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              setAppliedStatusFilter(statusFilter);
              setAppliedGenderFilter(genderFilter);
            }}
            className="rounded-md border border-blue-200 px-3 py-2 text-xs font-semibold text-[#0759AE] hover:bg-blue-50"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md bg-[#0759AE] px-3 py-2 text-xs font-bold text-white hover:bg-[#064A91]"
          >
            Refresh
          </button>
        </div>
      </div>

      {resumeError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {resumeError}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800">Job Seekers</h2>
          <span className="text-[11px] text-slate-400">
            {visibleJobSeekers.length} record{visibleJobSeekers.length === 1 ? "" : "s"}
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] table-fixed">
              <thead className="bg-slate-50 text-left">
                <tr>
                  {[
                    ["Name", "w-[15%]"],
                    ["Email", "w-[15%]"],
                    ["Phone", "w-[10%]"],
                    ["Gender", "w-[7%]"],
                    ["Education", "w-[10%]"],
                    ["Location", "w-[10%]"],
                    ["Status", "w-[7%]"],
                    ["Applications", "w-[7%]"],
                    ["Created", "w-[8%]"],
                    ["Actions", "w-[11%]"],
                  ].map(([label, width]) => (
                    <th key={label} className={`${width} px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleJobSeekers.map((jobSeeker, index) => {

                    const name = getSeekerName(jobSeeker);

                    const registrationDetails = getRegistrationDetails(jobSeeker);
                    const gender = registrationDetails.sex || jobSeeker.sex || "-";
                    const education =
                      registrationDetails.educationLevel ||
                      jobSeeker.education_level ||
                      "-";
                    const location =
                      registrationDetails.presentAddress ||
                      jobSeeker.address ||
                      "-";
                    const isActive = jobSeeker.is_active !== false;
                    const status = isActive ? "Active" : "Inactive";

                    const rowId = String(
                      jobSeeker.id ||
                        jobSeeker.job_seeker_id ||
                        index,
                    );

                    return (
                      <tr
                        key={rowId}
                        className="align-middle hover:bg-slate-50"
                      >
                        <td className="truncate px-2.5 py-2.5 text-[10px] font-semibold text-slate-800" title={name}>
                          {name}
                        </td>
                        <td className="truncate px-2.5 py-2.5 text-[10px] text-slate-600" title={jobSeeker.email || ""}>
                          {jobSeeker.email || "-"}
                        </td>
                        <td className="truncate px-2.5 py-2.5 text-[10px] text-slate-600">
                          {jobSeeker.contact_no || jobSeeker.phone || "-"}
                        </td>
                        <td className="truncate px-2.5 py-2.5 text-[10px] text-slate-600">{gender}</td>
                        <td className="truncate px-2.5 py-2.5 text-[10px] text-slate-600" title={String(education)}>{education}</td>
                        <td className="truncate px-2.5 py-2.5 text-[10px] text-slate-600" title={String(location)}>{location}</td>
                        <td className="px-2.5 py-2.5">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                            isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>{status}</span>
                        </td>
                        <td className="px-2.5 py-2.5 text-center text-[10px] text-slate-600">
                          {applicationCounts[jobSeeker.job_seeker_id || ""] ?? 0}
                        </td>
                        <td className="px-2.5 py-2.5 text-[10px] text-slate-500">
                          {jobSeeker.created_at
                            ? new Date(jobSeeker.created_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-2.5 py-2.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setScreeningSeeker(jobSeeker)}
                              title="View screening details"
                              className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                startEditing(jobSeeker);
                              }}
                              title="Edit job seeker"
                              disabled={!jobSeeker.job_seeker_id || deletingId === jobSeeker.job_seeker_id}
                              className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {jobSeeker.resume_url && (
                              <button
                                type="button"
                                onClick={() => void openResume(jobSeeker, rowId)}
                                disabled={openingResumeId === rowId}
                                title="View resume"
                                className="rounded-md border border-blue-200 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                              >
                                {openingResumeId === rowId ? "..." : "Resume"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void deleteJobSeeker(jobSeeker)}
                              disabled={!jobSeeker.job_seeker_id || deletingId === jobSeeker.job_seeker_id}
                              className="rounded-md border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === jobSeeker.job_seeker_id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

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

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <ScreeningField label="Contact Number" value={jobSeeker.contact_no || jobSeeker.phone} />
            <ScreeningField label="Present Address" value={jobSeeker.address || details.presentAddress} />
            <ScreeningField label="Status" value={status} />
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
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ScreeningField({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
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