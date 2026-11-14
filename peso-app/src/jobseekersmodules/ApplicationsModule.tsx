import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { openStoredResume } from "../services/resumes";

type Seeker = {
  job_seeker_id: string;
  full_name?: string | null;
  email?: string | null;
};

type JobSeekerPage =
  | "Home"
  | "Jobs"
  | "Applications"
  | "Messages"
  | "Profile";

type ApplicationDocument = {
  name: string;
  path: string;
};

type ApplicationEmployerProfile = {
  application_id: string;
  employer_name: string | null;
  employer_logo_url: string | null;
};

type Application = {
  id: string;
  job: string;
  company: string;
  companyLogoUrl: string | null;
  date: string;
  status: string;
  applicantName: string | null;
  applicantEmail: string | null;
  contactNumber: string | null;
  address: string | null;
  resumeUrl: string | null;
  qualificationFiles: ApplicationDocument[];
};

type Props = {
  seeker: Seeker;
  onNavigate: (page: JobSeekerPage) => void;
};

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalizedStatus = status.toLowerCase();
  const styles =
    normalizedStatus === "pending"
      ? "bg-yellow-50 text-yellow-700"
      : normalizedStatus === "under_review" ||
          normalizedStatus === "interviewed"
        ? "bg-blue-50 text-blue-700"
        : normalizedStatus === "hired"
          ? "bg-green-50 text-green-700"
          : normalizedStatus === "rejected"
            ? "bg-red-50 text-red-700"
            : "bg-gray-100 text-gray-700";

  const label =
    normalizedStatus === "hired"
      ? "You're Hired"
      : normalizedStatus === "interviewed"
        ? "Interviewed"
        : status.replace(/_/g, " ");

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {label}
    </span>
  );
}

export default function ApplicationsModule({
  seeker,
  onNavigate,
}: Props) {
  const [filter, setFilter] = useState("All");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [openingResume, setOpeningResume] = useState(false);
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    let active = true;

    const loadApplications = async () => {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("application")
        .select(`
          application_id,
          position_title,
          status,
          date_applied,
          applicant_name,
          applicant_email,
          applicant_contact_no,
          applicant_address,
          applicant_resume_url,
          applicant_qualification_files
        `)
        .eq("job_seeker_id", seeker.job_seeker_id)
        .order("date_applied", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Error loading job seeker applications:", error);
        setLoadError(`Unable to load applications: ${error.message}`);
        setApplications([]);
        setLoading(false);
        return;
      }

      const { data: employerProfileData, error: employerProfilesError } =
        await supabase.rpc("get_my_application_employer_profiles");

      if (!active) return;

      if (employerProfilesError) {
        console.error(
          "Error loading employer profiles for applications:",
          employerProfilesError,
        );
        setLoadError(
          `Unable to load employer profiles: ${employerProfilesError.message}`,
        );
        setApplications([]);
        setLoading(false);
        return;
      }

      const employerProfiles =
        employerProfileData as ApplicationEmployerProfile[] | null;
      const employerProfilesByApplicationId = new Map<
        string,
        ApplicationEmployerProfile
      >();
      for (const profile of employerProfiles ?? []) {
        employerProfilesByApplicationId.set(profile.application_id, profile);
      }

      setApplications(
        (data ?? []).map((row) => {
          const employerProfile = employerProfilesByApplicationId.get(
            row.application_id,
          );

          return {
            id: row.application_id,
            job: row.position_title || "Position not specified",
            company: employerProfile?.employer_name || "Employer",
            companyLogoUrl: employerProfile?.employer_logo_url ?? null,
            date: new Date(row.date_applied).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            status: row.status,
            applicantName: row.applicant_name,
            applicantEmail: row.applicant_email,
            contactNumber: row.applicant_contact_no,
            address: row.applicant_address,
            resumeUrl: row.applicant_resume_url,
            qualificationFiles: Array.isArray(row.applicant_qualification_files)
              ? row.applicant_qualification_files.filter(
                  (document): document is ApplicationDocument =>
                    typeof document === "object" &&
                    document !== null &&
                    "name" in document &&
                    typeof document.name === "string" &&
                    "path" in document &&
                    typeof document.path === "string",
                )
              : [],
          };
        })
      );
      setLoading(false);
    };

    void loadApplications();

    return () => {
      active = false;
    };
  }, [seeker.job_seeker_id]);

  const handleOpenResume = async () => {
    if (!selectedApplication?.resumeUrl || openingResume) return;

    setOpeningResume(true);
    setResumeError("");
    try {
      await openStoredResume(selectedApplication.resumeUrl);
    } catch (error) {
      console.error("Could not open application resume:", error);
      setResumeError(
        error instanceof Error ? error.message : "Unable to open the uploaded resume.",
      );
    } finally {
      setOpeningResume(false);
    }
  };

  const handleOpenQualificationFile = async (document: ApplicationDocument) => {
    if (openingResume) return;

    setOpeningResume(true);
    setResumeError("");
    try {
      await openStoredResume(document.path);
    } catch (error) {
      console.error("Could not open application document:", error);
      setResumeError(
        error instanceof Error
          ? error.message
          : "Unable to open the uploaded document.",
      );
    } finally {
      setOpeningResume(false);
    }
  };

  const filtered = useMemo(
    () =>
      applications.filter(
        (application) =>
          filter === "All" ||
          application.status.toLowerCase() === filter.toLowerCase()
      ),
    [applications, filter]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          My Applications
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Track the status of your job applications.
        </p>

        {seeker.full_name && (
          <p className="mt-2 text-sm text-blue-700">
            Applications of {seeker.full_name}
          </p>
        )}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          "All",
          "pending",
          "under_review",
          "shortlisted",
          "qualified",
          "interviewed",
          "withdrawn",
          "hired",
          "rejected",
        ].map((item) => (          <button            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === item
                ? "bg-blue-700 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-blue-50"
            }`}
          >
            {item === "All"
              ? item
                : item
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (letter) => letter.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Applications */}
      <div className="space-y-4">

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm text-sm text-gray-500">
            Loading your applications...
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            {loadError}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              <AppIcon name="file" className="h-7 w-7 text-blue-700" />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No applications found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              There are no applications under the selected status.
            </p>

            <button
              type="button"
              onClick={() => onNavigate("Jobs")}
              className="mt-4 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Explore Jobs
            </button>

          </div>
        ) : (
          filtered.map((application) => (
            <div
              key={application.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                {/* Company Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-100 font-bold text-blue-700">
                  {application.companyLogoUrl ? (
                    <img
                      src={application.companyLogoUrl}
                      alt={`${application.company} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    application.company.charAt(0)
                  )}
                </div>

                {/* Application Information */}
                <div className="flex-1">

                  <h3 className="font-bold text-gray-900">
                    {application.job}
                  </h3>

                  <p className="text-sm font-medium text-blue-700">
                    {application.company}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">

                    <span>
                      Applied: {application.date}
                    </span>

                  </div>

                </div>

                {/* Status + View */}
                <div className="flex items-center gap-3">

                  <StatusBadge
                    status={application.status}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setResumeError("");
                      setSelectedApplication(application);
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                  >
                    View
                  </button>

                </div>

              </div>
            </div>
          ))
        )}

      </div>

      {selectedApplication && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !openingResume) {
              setSelectedApplication(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-seeker-application-details-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="job-seeker-application-details-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Application details
                </h2>
                <p className="mt-1 text-sm text-blue-700">
                  {selectedApplication.job}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                disabled={openingResume}
                aria-label="Close application details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                ×
              </button>
            </header>

            <dl className="mt-5 grid gap-4 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Employer
                </dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {selectedApplication.company}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Application date
                </dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {selectedApplication.date}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={selectedApplication.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name submitted
                </dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {selectedApplication.applicantName || seeker.full_name || "Not available"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email submitted
                </dt>
                <dd className="mt-1 break-all font-medium text-gray-900">
                  {selectedApplication.applicantEmail || seeker.email || "Not available"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Contact number
                </dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {selectedApplication.contactNumber || "Not available"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Address
                </dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium text-gray-900">
                  {selectedApplication.address || "Not available"}
                </dd>
              </div>
            </dl>

            {resumeError && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {resumeError}
              </p>
            )}

            {selectedApplication.qualificationFiles.length > 0 && (
              <section className="mt-5">
                <h3 className="text-sm font-semibold text-gray-800">
                  Qualifications and requirements documents
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedApplication.qualificationFiles.map((document) => (
                    <button
                      key={document.path}
                      type="button"
                      onClick={() => void handleOpenQualificationFile(document)}
                      disabled={openingResume}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60"
                    >
                      {openingResume ? "Opening..." : `View ${document.name}`}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <footer className="mt-5 flex flex-wrap justify-end gap-3">
              {selectedApplication.resumeUrl && (
                <button
                  type="button"
                  onClick={() => void handleOpenResume()}
                  disabled={openingResume}
                  className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {openingResume ? "Opening resume..." : "View submitted resume"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                disabled={openingResume}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Find More Jobs */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h3 className="font-semibold text-blue-900">
              Looking for more opportunities?
            </h3>

            <p className="mt-1 text-sm text-blue-700">
              Explore available job vacancies and find another opportunity
              that matches your skills.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("Jobs")}
            className="shrink-0 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Explore Jobs
          </button>

        </div>

      </div>

    </div>
  );
}
import AppIcon from "../components/AppIcon";
