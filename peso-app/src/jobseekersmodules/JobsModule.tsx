import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import AppIcon from "../components/AppIcon";

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
        const allRows = [];

        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from("job_vacancy")
            .select(`
              job_vacancy_id,
              position_title,
              location,
              employment_type,
              salary_min,
              salary_max,
              description,
              requirements,
              vacancies_available,
              deadline,
              date_posted,
              image_url,
              employer (
                name
              )
            `)
            .eq("status", "open")
            .order("date_posted", { ascending: false })
            .order("job_vacancy_id", { ascending: false })
            .range(offset, offset + pageSize - 1);

          if (error) {
            throw new Error(error.message);
          }

          allRows.push(...(data ?? []));

          if (!data || data.length < pageSize) {
            break;
          }
        }

        if (!active) return;

        const availableJobs: Job[] = allRows.map((row) => {
          const employer = Array.isArray(row.employer)
            ? row.employer[0]
            : row.employer;
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
            company: employer?.name || "Employer",
            location: row.location || "Location not specified",
            type: row.employment_type || "Type not specified",
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

            return (
              <div
                key={job.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200"
              >

                {job.imageUrl && (
                  <img
                    src={job.imageUrl}
                    alt={`${job.title} job`}
                    className="mb-5 h-64 w-full rounded-xl bg-slate-50 object-contain sm:h-80"
                    loading="lazy"
                  />
                )}

                <div className="flex gap-4">

                  {/* Company Logo */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-blue-700">
                    {job.company.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="text-lg font-bold text-gray-900">
                      {job.title}
                    </h3>

                    <p className="font-medium text-blue-700">
                      {job.company}
                    </p>

                    {/* Job Information */}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">

                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        <AppIcon name="mapPin" className="mr-1 inline h-3.5 w-3.5" /> {job.location}
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        <AppIcon name="briefcase" className="mr-1 inline h-3.5 w-3.5" /> {job.type}
                      </span>

                      <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                        <AppIcon name="dollar" className="mr-1 inline h-3.5 w-3.5" /> {job.salary}
                      </span>

                    </div>

                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {job.description}
                    </p>

                    {/* Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={() => setSelectedJob(job)}
                        className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSave(job.id)}
                        className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition ${
                          isSaved
                            ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                            : "border-blue-200 text-blue-700 hover:bg-blue-50"
                        }`}
                      >
                        <AppIcon
                          name="star"
                          className={`mr-1 inline h-4 w-4 ${isSaved ? "fill-current" : ""}`}
                        />
                        {isSaved ? "Saved" : "Save"}
                      </button>

                    </div>

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
            className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  {selectedJob.company}
                </p>
                <h2
                  id={`job-title-${selectedJob.id}`}
                  className="mt-1 text-2xl font-bold text-gray-900"
                >
                  {selectedJob.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                aria-label="Close job details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            {selectedJob.imageUrl && (
              <img
                src={selectedJob.imageUrl}
                alt={`${selectedJob.title} job`}
                className="mt-6 max-h-[60vh] w-full rounded-xl bg-slate-50 object-contain"
              />
            )}

            <dl className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-gray-500">Location</dt>
                <dd className="mt-1 text-gray-900">{selectedJob.location}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Employment type</dt>
                <dd className="mt-1 text-gray-900">{selectedJob.type}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Salary</dt>
                <dd className="mt-1 text-gray-900">{selectedJob.salary}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Available openings</dt>
                <dd className="mt-1 text-gray-900">
                  {selectedJob.vacanciesAvailable}
                </dd>
              </div>
              {selectedJob.deadline && (
                <div>
                  <dt className="font-semibold text-gray-500">
                    Application deadline
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(`${selectedJob.deadline}T00:00:00`).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {selectedJob.datePosted && (
                <div>
                  <dt className="font-semibold text-gray-500">Date posted</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(selectedJob.datePosted).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="font-bold text-gray-900">Job description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {selectedJob.description}
                </p>
              </div>
              {selectedJob.requirements && (
                <div>
                  <h3 className="font-bold text-gray-900">Requirements</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                    {selectedJob.requirements}
                  </p>
                </div>
              )}
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
