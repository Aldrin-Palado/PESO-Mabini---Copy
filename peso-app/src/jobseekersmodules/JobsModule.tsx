import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import AppIcon from "../components/AppIcon";
import type { OpenJobVacancyRow } from "../types/JobVacancy";

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

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  classification: "local" | "international";
  salary: string;
  description: string;
  requirements: string;
  vacanciesAvailable: number;
  deadline: string | null;
  datePosted: string | null;
  imageUrl: string | null;
};

type Props = {
  seeker: Seeker;
  onNavigate: (page: JobSeekerPage) => void;
};

export default function JobsModule({
  seeker,
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
            location: row.location || "Location not specified",
            type: row.employment_type || "Type not specified",
            classification: row.job_classification,
            salary,
            description: row.description || "No description provided.",
            requirements: row.requirements || "",
            vacanciesAvailable: row.vacancies_available,
            deadline: row.deadline,
            datePosted: row.date_posted,
            imageUrl: row.image_url ?? null,
          };
        });

        setJobs(availableJobs);
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
  }, []);

  useEffect(() => {
    if (!selectedJob) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedJob(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedJob]);

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

  const toggleSave = (jobId: string) => {
    setSavedJobs((current) =>
      current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId]
    );
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

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLocation("All");
                setType("All");
              }}
              className="mt-4 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Clear Filters
            </button>

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
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0759AE] text-sm font-black text-white">
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-slate-400">{postedDate}</p>
                      <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
                        {job.company}
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
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91]"
                    >
                      View / Apply
                      <AppIcon name="arrowRight" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSave(job.id)}
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
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-700">
                    {selectedJob.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-blue-700">
                      {selectedJob.company}
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
                  <p className="mt-2 text-sm text-slate-600">
                    {selectedJob.company}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                    <span className="capitalize">{selectedJob.classification}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedJob.type}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-700">
                    <span className="inline-flex items-center gap-2">
                      <AppIcon name="dollar" className="h-4 w-4 text-amber-500" />
                      {selectedJob.salary}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <AppIcon name="mapPin" className="h-4 w-4 text-slate-500" />
                      {selectedJob.location}
                    </span>
                  </div>
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
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Online application via portal.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Close details
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Profile Reminder */}
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

        <div className="flex gap-3">

          <div className="text-xl">
            <AppIcon name="lightbulb" className="h-6 w-6 text-yellow-700" />
          </div>

          <div className="flex-1">

            <h3 className="font-semibold text-yellow-900">
              Complete your profile
            </h3>

            <p className="mt-1 text-sm leading-5 text-yellow-800">
              Keeping your profile updated can help you find opportunities
              that match your qualifications.
            </p>

            <button
              type="button"
              onClick={() => onNavigate("Profile")}
              className="mt-3 text-sm font-bold text-yellow-900 underline hover:text-yellow-700"
            >
              Update My Profile <AppIcon name="arrowRight" className="ml-1 inline h-4 w-4" />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
