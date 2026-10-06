import React, { useMemo, useState } from "react";

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
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
};

type Props = {
  seeker: Seeker;
  onNavigate: (page: JobSeekerPage) => void;
};

const jobs: Job[] = [
  {
    id: 1,
    title: "Junior Web Developer",
    company: "ABC Technology Solutions",
    location: "Lipa City, Batangas",
    type: "Full-time",
    salary: "₱18,000 - ₱25,000",
    description:
      "Develop and maintain web applications while working with the development team.",
  },
  {
    id: 2,
    title: "Production Staff",
    company: "Batangas Manufacturing Inc.",
    location: "Batangas City",
    type: "Full-time",
    salary: "₱15,000 - ₱20,000",
    description:
      "Assist in production operations and maintain workplace safety standards.",
  },
  {
    id: 3,
    title: "Administrative Assistant",
    company: "Mabini Business Center",
    location: "Mabini, Batangas",
    type: "Full-time",
    salary: "₱16,000 - ₱22,000",
    description:
      "Handle administrative tasks, documents, scheduling, and office coordination.",
  },
  {
    id: 4,
    title: "Customer Service Representative",
    company: "Batangas Business Services",
    location: "Batangas",
    type: "Full-time",
    salary: "₱17,000 - ₱24,000",
    description:
      "Assist customers and provide support through different communication channels.",
  },
];

export default function JobsModule({
  seeker,
  onNavigate,
}: Props) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [type, setType] = useState("All");
  const [savedJobs, setSavedJobs] = useState<number[]>([]);

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
  }, [search, location, type]);

  const toggleSave = (jobId: number) => {
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
              🔍
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
            {filteredJobs.length} job(s)
          </span>

        </div>

        {filteredJobs.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">

            <div className="text-4xl">
              🔍
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
                        📍 {job.location}
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        💼 {job.type}
                      </span>

                      <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                        💰 {job.salary}
                      </span>

                    </div>

                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {job.description}
                    </p>

                    {/* Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={() => onNavigate("Applications")}
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
                        {isSaved ? "★ Saved" : "☆ Save"}
                      </button>

                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}

      </div>

      {/* Profile Reminder */}
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

        <div className="flex gap-3">

          <div className="text-xl">
            💡
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
              Update My Profile →
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}