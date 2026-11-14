import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { supabase } from "../services/supabase";
import AppIcon from "../components/AppIcon";
import {
  RESUME_ACCEPT,
  RESUME_BUCKET,
  RESUME_FORMATS_LABEL,
  RESUME_MIME_TYPES,
  getResumeExtension,
} from "../services/resumes";
import { isJobSeekerProfileComplete } from "../services/jobSeekerProfile";
import type { OpenJobVacancyRow } from "../types/JobVacancy";

const PROFILE_SETUP_REQUIRED_MESSAGE =
  "Please complete your Profile Setup and have your account verified before applying for jobs.";
const VERIFICATION_PENDING_MESSAGE =
  "Your profile is complete, but your account is not verified yet. Please wait for your account to be verified before applying for jobs.";

type Seeker = {
  job_seeker_id: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  contact_no?: string | null;
  address?: string | null;
  resume_url?: string | null;
  verification_status?: "pending" | "verified" | "not_approved" | null;
};

type JobSeekerPage =
  | "Home"
  | "Jobs"
  | "Applications"
  | "Messages"
  | "Profile";

type Job = {
  id: string;
  title: string;
  company: string;
  employerVerified: boolean;
  companyAddress: string | null;
  companyDescription: string | null;
  companyIndustry: string | null;
  companyWebsite: string | null;
  companyLogoUrl: string | null;
  location: string;
  type: string;
  classification: "local" | "international";
  salary: string;
  description: string;
  jobQualifications: string;
  requirements: string;
  vacanciesAvailable: number;
  deadline: string | null;
  datePosted: string | null;
  imageUrl: string | null;
};

type ApplicationDetails = {
  fullName: string;
  email: string;
  contactNumber: string;
  address: string;
};

type ApplicationDocument = {
  name: string;
  path: string;
};

type Props = {
  seeker: Seeker;
  profileComplete: boolean;
  isVerified: boolean;
  initialJobId?: string;
  initialApplicationJobId?: string;
  onInitialApplicationHandled: (jobId: string) => void;
  onNavigate: (page: JobSeekerPage) => void;
};

export default function JobsModule({
  seeker,
  profileComplete,
  isVerified,
  initialJobId,
  initialApplicationJobId,
  onInitialApplicationHandled,
  onNavigate,
}: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [type, setType] = useState("All");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [companyModalJob, setCompanyModalJob] = useState<Job | null>(null);
  const [applicationJob, setApplicationJob] = useState<Job | null>(null);
  const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails>({
    fullName: seeker.full_name ?? "",
    email: seeker.email ?? "",
    contactNumber: seeker.contact_no ?? "",
    address: seeker.address ?? "",
  });
  const [applicationError, setApplicationError] = useState("");
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [applicationResumeFile, setApplicationResumeFile] = useState<File | null>(null);
  const [applicationQualificationFiles, setApplicationQualificationFiles] =
    useState<File[]>([]);
  const handledInitialApplicationId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadJobs = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const pageSize = 500;
        const allRows: OpenJobVacancyRow[] = [];

        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .rpc("get_open_job_vacancies")
            .order("date_posted", { ascending: false })
            .order("job_vacancy_id", { ascending: false })
            .range(offset, offset + pageSize - 1);

          if (error) {
            throw new Error(error.message);
          }

          allRows.push(...((data ?? []) as OpenJobVacancyRow[]));

          if (!data || data.length < pageSize) {
            break;
          }
        }

        if (!active) return;

        const availableJobs: Job[] = allRows.map((row) => {
          const salaryMin =
            row.salary_min == null ? null : Number(row.salary_min);
          const salaryMax =
            row.salary_max == null ? null : Number(row.salary_max);

          let salary = "Salary not specified";
          if (salaryMin !== null && salaryMax !== null) {
            salary = `₱${salaryMin.toLocaleString()} - ₱${salaryMax.toLocaleString()}`;
          } else if (salaryMin !== null) {
            salary = `From ₱${salaryMin.toLocaleString()}`;
          } else if (salaryMax !== null) {
            salary = `Up to ₱${salaryMax.toLocaleString()}`;
          }

          return {
            id: row.job_vacancy_id,
            title: row.position_title,
            company: row.employer_name || "Company name not provided",
            employerVerified: row.employer_verified,
            companyAddress: row.employer_address,
            companyDescription: row.employer_description,
            companyIndustry: row.employer_industry,
            companyWebsite: row.employer_website,
            companyLogoUrl: row.employer_logo_url,
            location: row.location || "Location not specified",
            type: row.employment_type || "Type not specified",
            classification: row.job_classification,
            salary,
            description: row.description || "No description provided.",
            jobQualifications: row.job_qualifications || "",
            requirements: row.requirements || "",
            vacanciesAvailable: row.vacancies_available,
            deadline: row.deadline,
            datePosted: row.date_posted,
            imageUrl: row.image_url ?? null,
          };
        });

        setJobs(availableJobs);
        if (initialJobId) {
          setSelectedJob(
            availableJobs.find((job) => job.id === initialJobId) ?? null,
          );
        }
      } catch (error) {
        if (!active) return;

        console.error("Error loading jobs for job seeker:", error);
        setLoadError(
          `Unable to load jobs: ${
            error instanceof Error ? error.message : "Unexpected error."
          }`
        );
        setJobs([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadJobs();

    return () => {
      active = false;
    };
  }, [initialJobId]);

  // Load saved jobs from Supabase
  useEffect(() => {
    let active = true;

    const loadSavedJobs = async () => {
      const { data, error } = await supabase
        .from("saved_job")
        .select("job_vacancy_id")
        .eq("job_seeker_id", seeker.job_seeker_id);

      if (error) {
        console.error("Error loading saved jobs:", error);
        return;
      }

      if (active) {
        setSavedJobs(
          (data ?? []).map((row) => row.job_vacancy_id)
        );
      }
    };

    void loadSavedJobs();

    return () => {
      active = false;
    };
  }, [seeker.job_seeker_id]);

  // Handle Escape key when a profile or job dialog is open.
  useEffect(() => {
    if (!selectedJob && !companyModalJob) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (companyModalJob) {
          setCompanyModalJob(null);
        } else {
          setSelectedJob(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedJob, companyModalJob]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchMatch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        job.location.toLowerCase().includes(search.toLowerCase());

      const locationMatch =
        location === "All" ||
        job.location.toLowerCase().includes(location.toLowerCase());

      const typeMatch =
        type === "All" || job.type === type;

      return searchMatch && locationMatch && typeMatch;
    });
  }, [jobs, search, location, type]);

  const toggleSave = async (jobId: string) => {
    const isSaved = savedJobs.includes(jobId);

    if (isSaved) {
      const { error } = await supabase
        .from("saved_job")
        .delete()
        .eq("job_seeker_id", seeker.job_seeker_id)
        .eq("job_vacancy_id", jobId);

      if (error) {
        console.error("Error removing saved job:", error);
        alert(`Unable to remove saved job: ${error.message}`);
        return;
      }

      setSavedJobs((current) =>
        current.filter((id) => id !== jobId)
      );

      return;
    }

    const { error } = await supabase
      .from("saved_job")
      .insert({
        job_seeker_id: seeker.job_seeker_id,
        job_vacancy_id: jobId,
      });

    if (error) {
      console.error("Error saving job:", error);
      alert(`Unable to save job: ${error.message}`);
      return;
    }

    setSavedJobs((current) =>
      current.includes(jobId) ? current : [...current, jobId]
    );
  };

  const openApplicationForm = useCallback((job: Job) => {
    if (!profileComplete) {
      window.alert(PROFILE_SETUP_REQUIRED_MESSAGE);
      return;
    }

    if (!isVerified) {
      window.alert(VERIFICATION_PENDING_MESSAGE);
      return;
    }

    setApplicationDetails({
      fullName: seeker.full_name ?? "",
      email: seeker.email ?? "",
      contactNumber: seeker.contact_no ?? "",
      address: seeker.address ?? "",
    });
    setApplicationError("");
    setApplicationSubmitted(false);
    setApplicationResumeFile(null);
    setApplicationQualificationFiles([]);
    setApplicationJob(job);
  }, [
    isVerified,
    profileComplete,
    seeker.address,
    seeker.contact_no,
    seeker.email,
    seeker.full_name,
  ]);

  useEffect(() => {
    if (
      loading ||
      !initialApplicationJobId ||
      handledInitialApplicationId.current === initialApplicationJobId
    ) {
      return;
    }

    const job = jobs.find(({ id }) => id === initialApplicationJobId);
    handledInitialApplicationId.current = initialApplicationJobId;
    onInitialApplicationHandled(initialApplicationJobId);
    if (job) {
      openApplicationForm(job);
    } else if (!loadError) {
      window.alert("This job is no longer available for applications.");
    }
  }, [
    initialApplicationJobId,
    jobs,
    loading,
    loadError,
    onInitialApplicationHandled,
    openApplicationForm,
  ]);

  const submitApplication = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!applicationJob || applicationSubmitting) return;

    if (
      !applicationDetails.fullName.trim() ||
      !applicationDetails.email.trim() ||
      !applicationDetails.contactNumber.trim() ||
      !applicationDetails.address.trim()
    ) {
      setApplicationError("Please complete all contact details before submitting.");
      return;
    }

    const resumeExtension = applicationResumeFile
      ? getResumeExtension(applicationResumeFile.name)
      : "";
    if (
      applicationResumeFile &&
      !RESUME_MIME_TYPES[resumeExtension]
    ) {
      setApplicationError(`Please choose a ${RESUME_FORMATS_LABEL} file.`);
      return;
    }
    if (applicationResumeFile && applicationResumeFile.size > 5 * 1024 * 1024) {
      setApplicationError("Resume must not exceed 5 MB.");
      return;
    }
    if (!applicationResumeFile && !seeker.resume_url) {
      setApplicationError("Please upload a resume before submitting your application.");
      return;
    }
    if (applicationQualificationFiles.length > 10) {
      setApplicationError("You can upload up to 10 supporting documents.");
      return;
    }
    const invalidQualificationFile = applicationQualificationFiles.find((file) => {
      const extension = getResumeExtension(file.name);
      return !RESUME_MIME_TYPES[extension] || file.size > 5 * 1024 * 1024;
    });
    if (invalidQualificationFile) {
      const extension = getResumeExtension(invalidQualificationFile.name);
      setApplicationError(
        !RESUME_MIME_TYPES[extension]
          ? `Supporting documents must be ${RESUME_FORMATS_LABEL}.`
          : `Each supporting document must not exceed 5 MB.`,
      );
      return;
    }

    setApplicationSubmitting(true);
    setApplicationError("");
    const uploadedPaths: string[] = [];

    try {
      const { data: jobRow, error: jobError } = await supabase
        .from("job_vacancy")
        .select("employer_id, position_title, status")
        .eq("job_vacancy_id", applicationJob.id)
        .maybeSingle();

      if (jobError) {
        throw new Error(`Unable to verify this job: ${jobError.message}`);
      }
      if (!jobRow || jobRow.status !== "open") {
        throw new Error("This job is no longer accepting applications.");
      }

      const { data: currentSeeker, error: seekerStatusError } = await supabase
        .from("job_seeker")
        .select("verification_status, registration_details, resume_url")
        .eq("job_seeker_id", seeker.job_seeker_id)
        .maybeSingle();

      if (seekerStatusError) {
        throw new Error(
          `Unable to verify your account status: ${seekerStatusError.message}`,
        );
      }
      if (!currentSeeker) {
        throw new Error("Unable to find your job-seeker profile.");
      }
      if (
        !isJobSeekerProfileComplete(
          currentSeeker.registration_details,
          currentSeeker.resume_url,
        )
      ) {
        throw new Error(PROFILE_SETUP_REQUIRED_MESSAGE);
      }
      if (currentSeeker?.verification_status !== "verified") {
        throw new Error(VERIFICATION_PENDING_MESSAGE);
      }

      const { data: existingApplication, error: existingError } = await supabase
        .from("application")
        .select("application_id")
        .eq("employer_id", jobRow.employer_id)
        .eq("job_seeker_id", seeker.job_seeker_id)
        .eq("position_title", jobRow.position_title)
        .maybeSingle();

      if (existingError) {
        throw new Error(`Unable to check prior applications: ${existingError.message}`);
      }
      if (existingApplication) {
        throw new Error("You have already applied for this position.");
      }

      let applicantResumeUrl = seeker.resume_url || null;
      if (applicationResumeFile) {
        const resumePath = `${seeker.user_id}/applications/${applicationJob.id}/${Date.now()}.${resumeExtension}`;
        const { error: uploadError } = await supabase.storage
          .from(RESUME_BUCKET)
          .upload(resumePath, applicationResumeFile, {
            upsert: false,
            contentType: RESUME_MIME_TYPES[resumeExtension],
          });
        if (uploadError) {
          throw new Error(`Unable to upload your resume: ${uploadError.message}`);
        }
        uploadedPaths.push(resumePath);
        applicantResumeUrl = resumePath;
      }

      const qualificationFiles: ApplicationDocument[] = [];
      for (const [index, file] of applicationQualificationFiles.entries()) {
        const extension = getResumeExtension(file.name);
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const documentPath =
          `${seeker.user_id}/applications/${applicationJob.id}/` +
          `${Date.now()}-${index}-${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from(RESUME_BUCKET)
          .upload(documentPath, file, {
            upsert: false,
            contentType: RESUME_MIME_TYPES[extension],
          });
        if (uploadError) {
          throw new Error(
            `Unable to upload ${file.name}: ${uploadError.message}`,
          );
        }
        uploadedPaths.push(documentPath);
        qualificationFiles.push({ name: file.name, path: documentPath });
      }

      const { error: insertError } = await supabase.from("application").insert({
        employer_id: jobRow.employer_id,
        job_vacancy_id: applicationJob.id,
        job_seeker_id: seeker.job_seeker_id,
        position_title: jobRow.position_title,
        applicant_name: applicationDetails.fullName.trim(),
        applicant_email: applicationDetails.email.trim(),
        applicant_contact_no: applicationDetails.contactNumber.trim(),
        applicant_address: applicationDetails.address.trim(),
        applicant_resume_url: applicantResumeUrl,
        applicant_qualification_files: qualificationFiles,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("You have already applied for this position.");
        }
        throw new Error(`Unable to submit your application: ${insertError.message}`);
      }

      uploadedPaths.length = 0;
      setApplicationSubmitted(true);
    } catch (error) {
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from(RESUME_BUCKET)
          .remove(uploadedPaths);
        if (cleanupError) {
          console.error("Could not remove unlinked application documents:", cleanupError);
        }
      }
      console.error("Error submitting job application:", error);
      setApplicationError(
        error instanceof Error
          ? error.message
          : "Unable to submit your application. Please try again.",
      );
    } finally {
      setApplicationSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Find Jobs
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Search for employment opportunities that match your skills.
        </p>

        {seeker.full_name && (
          <p className="mt-2 text-sm text-blue-700">
            Welcome, {seeker.full_name}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row">

          <div className="relative flex-1">

            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <AppIcon name="search" />
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job title, company, or location..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />

          </div>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All Locations</option>
            <option value="Batangas">Batangas</option>
            <option value="Mabini">Mabini</option>
            <option value="Lipa">Lipa City</option>
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
          </select>

        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">

        <div className="flex items-center justify-between">

          <h2 className="font-semibold text-gray-900">
            Available Jobs
          </h2>

          <span className="text-sm text-gray-500">
            Showing {filteredJobs.length} of {jobs.length} open job(s)
          </span>

        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Loading available jobs...
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            {loadError}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <h3 className="font-semibold text-gray-900">
              No open jobs available
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no open job posts in the database right now.
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">

            <div className="text-4xl">
              <AppIcon name="search" className="mx-auto h-10 w-10 text-slate-400" />
            </div>

            <h3 className="mt-3 font-semibold text-gray-900">
              No jobs found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>

          </div>

        ) : (

          filteredJobs.map((job) => {

            const isSaved = savedJobs.includes(job.id);
            const postedDate = job.datePosted
              ? new Date(job.datePosted).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })
              : "Recently posted";

            return (
              <div
                key={job.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="px-5 pb-5 pt-5 sm:px-7">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setCompanyModalJob(job)}
                      aria-label={`View ${job.company} company profile`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0759AE] text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {job.companyLogoUrl ? (
                        <img
                          src={job.companyLogoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        job.company.charAt(0).toUpperCase()
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-slate-400">{postedDate}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <button
                          type="button"
                          onClick={() => setCompanyModalJob(job)}
                          className="truncate text-left hover:text-blue-700 hover:underline focus:outline-none focus:underline"
                        >
                          {job.company}
                        </button>
                        {job.employerVerified && (
                          <span
                            title="Verified employer"
                            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
                          >
                            <AppIcon name="check" className="h-3 w-3" />
                          </span>
                        )}
                      </p>
                      <h3 className="mt-2 text-lg font-black leading-snug text-slate-950 sm:text-xl">
                        {job.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span className="capitalize">{job.classification}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.type}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <AppIcon name="dollar" className="h-3.5 w-3.5 text-amber-500" />
                          {job.salary}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <AppIcon name="mapPin" className="h-3.5 w-3.5 text-slate-500" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {job.imageUrl && (
                  <div className="overflow-hidden border-y border-slate-100 bg-slate-50">
                    <img
                      src={job.imageUrl}
                      alt={`${job.title} job posting`}
                      className="h-56 w-full object-contain sm:h-72"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <p className="text-xs text-slate-500">
                    Online application via portal.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => openApplicationForm(job)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91]"
                    >
                      Apply
                      <AppIcon name="arrowRight" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleSave(job.id)}
                      aria-pressed={isSaved}
                      className={`inline-flex items-center justify-center gap-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                        isSaved
                          ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <AppIcon
                        name="star"
                        className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`}
                      />
                      {isSaved ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

      </div>

      {selectedJob && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedJob(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`job-title-${selectedJob.id}`}
            className="my-auto max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCompanyModalJob(selectedJob)}
                    aria-label={`View ${selectedJob.company} company profile`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-lg font-black text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {selectedJob.companyLogoUrl ? (
                      <img
                        src={selectedJob.companyLogoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      selectedJob.company.charAt(0).toUpperCase()
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-bold text-blue-700">
                      <button
                        type="button"
                        onClick={() => setCompanyModalJob(selectedJob)}
                        className="truncate text-left hover:underline focus:outline-none focus:underline"
                      >
                        {selectedJob.company}
                      </button>
                      {selectedJob.employerVerified && (
                        <span
                          title="Verified employer"
                          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
                        >
                          <AppIcon name="check" className="h-3 w-3" />
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedJob.datePosted
                        ? new Date(selectedJob.datePosted).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })
                        : "Recently posted"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  aria-label="Close job details"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <AppIcon name="x" className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
                <div>
                  <h2
                    id={`job-title-${selectedJob.id}`}
                    className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
                  >
                    {selectedJob.title}
                  </h2>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <button
                      type="button"
                      onClick={() => setCompanyModalJob(selectedJob)}
                      className="text-left hover:text-blue-700 hover:underline focus:outline-none focus:underline"
                    >
                      {selectedJob.company}
                    </button>
                    {selectedJob.employerVerified && (
                      <span
                        title="Verified employer"
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
                      >
                        <AppIcon name="check" className="h-3 w-3" />
                      </span>
                    )}
                  </p>
                </div>

                {selectedJob.imageUrl && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={selectedJob.imageUrl}
                      alt={`${selectedJob.title} job`}
                      className="max-h-[55vh] w-full object-contain"
                    />
                  </div>
                )}

                <section aria-label="Job overview">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Job overview
                  </h3>
                  <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Location",
                      value: selectedJob.location,
                      icon: "mapPin" as const,
                    },
                    {
                      label: "Employment type",
                      value: selectedJob.type,
                      icon: "briefcase" as const,
                    },
                    {
                      label: "Classification",
                      value: selectedJob.classification,
                      icon: "building" as const,
                    },
                    {
                      label: "Salary",
                      value: selectedJob.salary,
                      icon: "dollar" as const,
                    },
                    {
                      label: "Available openings",
                      value: String(selectedJob.vacanciesAvailable),
                      icon: "users" as const,
                    },
                    ...(selectedJob.deadline
                      ? [{
                          label: "Application deadline",
                          value: new Date(`${selectedJob.deadline}T00:00:00`).toLocaleDateString(),
                          icon: "clock" as const,
                        }]
                      : []),
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-start gap-3 rounded-2xl border p-4 ${
                        item.label === "Salary"
                          ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white sm:col-span-2"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        item.label === "Salary"
                          ? "bg-blue-700 text-white"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        <AppIcon name={item.icon} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                          {item.label}
                        </dt>
                        <dd className={`mt-1 break-words font-bold capitalize ${
                          item.label === "Salary"
                            ? "text-lg text-blue-900"
                            : "text-sm text-slate-900"
                        }`}>
                          {item.value}
                        </dd>
                      </div>
                    </div>
                  ))}
                  </dl>
                </section>

                <div className="grid gap-4">
                  <div className="rounded-2xl border border-slate-200 border-l-4 border-l-blue-600 bg-white p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                      Job description
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {selectedJob.description}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                      Requirements
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {selectedJob.requirements || "No specific requirements provided."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                      Job Qualifications
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {selectedJob.jobQualifications || "No specific qualifications provided."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Online application via portal.
                  </p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(null)}
                      className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Close details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const job = selectedJob;
                        setSelectedJob(null);
                        openApplicationForm(job);
                      }}
                      className="rounded-xl bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {companyModalJob && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCompanyModalJob(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`company-name-${companyModalJob.id}`}
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="relative">
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#064A91] via-[#0759AE] to-sky-400 sm:h-44">
                <div className="absolute -right-8 -top-20 h-56 w-56 rounded-full border-[24px] border-white/10" />
                <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/10" />
                <button
                  type="button"
                  onClick={() => setCompanyModalJob(null)}
                  aria-label="Close company profile"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white transition hover:bg-black/35 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <AppIcon name="x" className="h-5 w-5" />
                </button>
              </div>
              <div className="relative px-6 pb-5 sm:px-8">
                <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-blue-50 text-3xl font-black text-blue-700 shadow-lg">
                  {companyModalJob.companyLogoUrl ? (
                    <img
                      src={companyModalJob.companyLogoUrl}
                      alt={`${companyModalJob.company} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    companyModalJob.company.charAt(0).toUpperCase()
                  )}
                </div>
                <h2
                  id={`company-name-${companyModalJob.id}`}
                  className="mt-4 flex flex-wrap items-center gap-2 text-xl font-black text-slate-950 sm:text-2xl"
                >
                  {companyModalJob.company}
                  {companyModalJob.employerVerified && (
                    <span
                      title="Verified employer"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"
                    >
                      <AppIcon name="check" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {companyModalJob.companyIndustry || "Company profile"}
                </p>
              </div>
            </div>

            <div className="space-y-6 border-t border-slate-100 p-6 sm:p-8">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Company background
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {companyModalJob.companyDescription ||
                    "This company has not added a background description yet."}
                </p>
              </section>

              <dl className="grid gap-4 sm:grid-cols-2">
                {companyModalJob.companyAddress && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Address
                    </dt>
                    <dd className="mt-1 text-sm text-slate-800">
                      {companyModalJob.companyAddress}
                    </dd>
                  </div>
                )}
                {companyModalJob.companyWebsite && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Website
                    </dt>
                    <dd className="mt-1 break-all text-sm">
                      <a
                        href={companyModalJob.companyWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {companyModalJob.companyWebsite}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        </div>
      )}

      {applicationJob && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !applicationSubmitting
            ) {
              setApplicationJob(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-form-title"
            className="my-auto max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            {!applicationSubmitted && applicationJob.imageUrl && (
              <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src={applicationJob.imageUrl}
                  alt={`${applicationJob.title} job poster`}
                  className="max-h-64 w-full object-contain"
                />
              </div>
            )}
            {applicationSubmitted ? (
              <div className="py-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
                  ✓
                </div>
                <h2
                  id="application-form-title"
                  className="mt-4 text-xl font-black text-slate-900"
                >
                  Application submitted
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Your application for {applicationJob.title} was sent to{" "}
                  {applicationJob.company}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setApplicationJob(null);
                    onNavigate("Applications");
                  }}
                  className="mt-6 rounded-xl bg-[#0759AE] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064A91]"
                >
                  View My Applications
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700">
                      {applicationJob.company}
                      {applicationJob.employerVerified && (
                        <span
                          title="Verified employer"
                          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
                        >
                          <AppIcon name="check" className="h-3 w-3" />
                        </span>
                      )}
                    </p>
                    <h2
                      id="application-form-title"
                      className="mt-1 text-xl font-black text-slate-900"
                    >
                      Apply for {applicationJob.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Confirm your contact details and resume before submitting.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApplicationJob(null)}
                    disabled={applicationSubmitting}
                    aria-label="Close application form"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    <AppIcon name="x" className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={submitApplication} className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Full name
                    </span>
                    <input
                      required
                      autoComplete="name"
                      value={applicationDetails.fullName}
                      onChange={(event) =>
                        setApplicationDetails((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Email
                    </span>
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={applicationDetails.email}
                      onChange={(event) =>
                        setApplicationDetails((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Contact number
                    </span>
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      value={applicationDetails.contactNumber}
                      onChange={(event) =>
                        setApplicationDetails((current) => ({
                          ...current,
                          contactNumber: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Address
                    </span>
                    <textarea
                      required
                      autoComplete="street-address"
                      rows={3}
                      value={applicationDetails.address}
                      onChange={(event) =>
                        setApplicationDetails((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Resume
                    </span>
                    <input
                      type="file"
                      accept={RESUME_ACCEPT}
                      disabled={applicationSubmitting}
                      onChange={(event) => {
                        setApplicationResumeFile(event.target.files?.[0] ?? null);
                        event.target.value = "";
                      }}
                      className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-60"
                    />
                    <span className="mt-1.5 block text-xs text-slate-500">
                      {applicationResumeFile
                        ? `Selected: ${applicationResumeFile.name}`
                        : seeker.resume_url
                          ? `Your profile resume will be attached if you do not choose another. Upload a ${RESUME_FORMATS_LABEL} file up to 5 MB to use a different resume.`
                          : `Upload a ${RESUME_FORMATS_LABEL} file up to 5 MB.`}
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Qualifications and requirements documents
                      <span className="ml-1 font-normal text-slate-500">
                        (optional)
                      </span>
                    </span>
                    <input
                      type="file"
                      multiple
                      accept={RESUME_ACCEPT}
                      disabled={applicationSubmitting}
                      onChange={(event) => {
                        setApplicationQualificationFiles(
                          Array.from(event.target.files ?? []),
                        );
                        event.target.value = "";
                      }}
                      className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-60"
                    />
                    <span className="mt-1.5 block text-xs text-slate-500">
                      Upload up to 10 files ({RESUME_FORMATS_LABEL}), maximum 5 MB each.
                    </span>
                    {applicationQualificationFiles.length > 0 && (
                      <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
                        {applicationQualificationFiles.map((file, index) => (
                          <li key={`${file.name}-${index}`}>{file.name}</li>
                        ))}
                      </ul>
                    )}
                  </label>

                  {applicationError && (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {applicationError}
                    </p>
                  )}

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setApplicationJob(null)}
                      disabled={applicationSubmitting}
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={applicationSubmitting}
                      className="rounded-xl bg-[#0759AE] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {applicationSubmitting ? "Submitting..." : "Submit Application"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}

    </div>
  );
}
