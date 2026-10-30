import React, { useState } from "react";
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
  loadError?: string;
  search: string;
  setSearch: (value: string) => void;

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
  loadError,
  search,
  setSearch,
  loading,
  onRefresh,
  ModuleHeader,
  TableHeader,
  TableCell,
  StatusBadge,
  LoadingMessage,
  EmptyMessage,
}: Props) {
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [screeningSeeker, setScreeningSeeker] = useState<JobSeeker | null>(null);

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
    <div className="space-y-6">

      <ModuleHeader
        title="Job Seekers"
        description="Review the information each job seeker submitted at registration and open their uploaded resumes to assess their qualifications."
        onRefresh={onRefresh}
      />

      {loadError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {loadError}
        </p>
      )}

      {/* SEARCH */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search job seekers..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        />

      </div>

      {resumeError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {resumeError}
        </p>
      )}

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {loading ? (
          <LoadingMessage />
        ) : jobSeekers.length === 0 ? (
          <EmptyMessage message="No job seekers found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <TableHeader>
                    Name
                  </TableHeader>

                  <TableHeader>
                    Email
                  </TableHeader>

                  <TableHeader>
                    Contact
                  </TableHeader>

                  <TableHeader>
                    Address
                  </TableHeader>

                  <TableHeader>
                    Birth Date
                  </TableHeader>

                  <TableHeader>
                    Resume
                  </TableHeader>

                  <TableHeader>
                    Screening
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {jobSeekers.map(
                  (jobSeeker, index) => {

                    const name = getSeekerName(jobSeeker);

                    const status =
                      jobSeeker.status ||
                      (jobSeeker.is_active === undefined
                        ? "Registered"
                        : jobSeeker.is_active
                          ? "Active"
                          : "Inactive");

                    const rowId = String(
                      jobSeeker.id ||
                        jobSeeker.job_seeker_id ||
                        index,
                    );

                    return (
                      <tr
                        key={rowId}
                        className="hover:bg-slate-50"
                      >

                        <TableCell bold>
                          {name}
                        </TableCell>

                        <TableCell>
                          {jobSeeker.email || "-"}
                        </TableCell>

                        <TableCell>
                          {jobSeeker.contact_no ||
                            jobSeeker.phone ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          {jobSeeker.address || "-"}
                        </TableCell>

                        <TableCell>
                          {jobSeeker.birth_date || "-"}
                        </TableCell>

                        <TableCell>
                          {jobSeeker.resume_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                void openResume(
                                  jobSeeker,
                                  rowId,
                                )
                              }
                              disabled={
                                openingResumeId === rowId
                              }
                              className="rounded-full border border-[#203F8B] px-3 py-1.5 text-xs font-semibold text-[#203F8B] transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                            >
                              {openingResumeId === rowId
                                ? "Opening..."
                                : "View Resume"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Not uploaded
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <button
                            type="button"
                            onClick={() =>
                              setScreeningSeeker(jobSeeker)
                            }
                            className="rounded-full bg-[#203F8B] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#193474]"
                          >
                            View Details
                          </button>
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={status}
                          />
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

      {screeningSeeker && (
        <ScreeningModal
          jobSeeker={screeningSeeker}
          openingResumeId={openingResumeId}
          onOpenResume={openResume}
          onClose={() => setScreeningSeeker(null)}
        />
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