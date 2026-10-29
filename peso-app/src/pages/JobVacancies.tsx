import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";
import JobCard from "../components/JobCard";
import Navbar from "../components/Navbar";
import AppIcon from "../components/AppIcon";
import type {
  JobVacancy,
  OpenJobVacancyRow,
} from "../types/JobVacancy";
import { supabase } from "../services/supabase";

function JobVacancies() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .rpc("get_open_job_vacancies")
        .order("date_posted", { ascending: false });

      if (error) {
        console.error("Error loading job vacancies:", error);
        setJobs([]);
        setLoadError(`Unable to load job vacancies: ${error.message}`);
        setLoading(false);
        return;
      }

      const formattedJobs: JobVacancy[] = (
        (data ?? []) as OpenJobVacancyRow[]
      ).map((job) => {
        let salary = "Salary not specified";

        if (job.salary_min != null && job.salary_max != null) {
          salary = `₱${Number(job.salary_min).toLocaleString()} - ₱${Number(
            job.salary_max
          ).toLocaleString()}`;
        } else if (job.salary_min != null) {
          salary = `From ₱${Number(job.salary_min).toLocaleString()}`;
        } else if (job.salary_max != null) {
          salary = `Up to ₱${Number(job.salary_max).toLocaleString()}`;
        }

        return {
          job_vacancy_id: job.job_vacancy_id,
          position_title: job.position_title,
          location: job.location ?? undefined,
          employment_type: job.employment_type ?? undefined,
          salary,
          description: job.description ?? undefined,
          requirements: job.requirements ?? undefined,
          vacancies_available: job.vacancies_available ?? undefined,
          deadline: job.deadline ?? undefined,
          date_posted: job.date_posted ?? undefined,
          image_url: job.image_url ?? null,
          job_classification: job.job_classification,
          employer: {
            name: job.employer_name ?? undefined,
          },
        };
      });

      setJobs(formattedJobs);
      setLoading(false);
    };

    void loadJobs();
  }, []);

  const classification = searchParams.get("classification");
  const filteredJobs = jobs.filter((job) => {
    const searchText = search.toLowerCase();

    return (
      (!classification || job.job_classification === classification) &&
      (job.position_title.toLowerCase().includes(searchText) ||
        (job.location?.toLowerCase() ?? "").includes(searchText) ||
        (job.employment_type?.toLowerCase() ?? "").includes(searchText) ||
        (job.employer?.name?.toLowerCase() ?? "").includes(searchText))
    );
  });

  return (
    <div className="whirl-page-background min-h-screen text-slate-800">

      <Navbar />

      {/* Philippine-inspired accent */}
      <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

      {/* Hero */}
      <section className="hero-shell-compact relative isolate overflow-hidden bg-slate-950">

        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sky-600/20 blur-3xl" />

        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="max-w-3xl">

            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />

              <span className="text-xs font-semibold text-white sm:text-sm">
                Public Employment Service Office
              </span>
            </div>

            <h1 className="hero-heading-compact font-black text-white">
              Job{" "}
              <span className="text-sky-300">
                Vacancies
              </span>
            </h1>

            <p className="hero-lead mt-6 max-w-2xl text-slate-300">
              Find available employment opportunities and connect with
              employers through PESO Mabini.
            </p>

          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-sky-400 via-yellow-400 to-red-500" />
      </section>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-14 lg:px-8 lg:py-16">

        {/* Search */}
        <section className="mb-12">

          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
              Find Opportunities
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Search Available Jobs
            </h2>

            <p className="mt-2 text-slate-500">
              Search by job title, employer, location, or employment type.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

            <div className="p-5">
              <label
                htmlFor="job-search"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Search Jobs
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <AppIcon name="search" />
                </span>

                <input
                  id="job-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by job title, employer, location, or type..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Jobs */}
        <section>

          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                Employment Opportunities
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-900">
                Available Jobs
              </h2>
            </div>

            {!loading && (
              <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                {filteredJobs.length}{" "}
                {filteredJobs.length === 1 ? "job" : "jobs"} found
              </div>
            )}

          </div>

          {/* Loading */}
          {loading && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

              <div className="px-4 py-14 text-center sm:px-6 sm:py-20">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-50">
                  <div className="h-7 w-7 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-slate-800">
                  Loading job vacancies...
                </h3>

                <p className="mt-2 text-slate-500">
                  Please wait while we retrieve the latest opportunities.
                </p>

              </div>
            </div>
          )}

          {/* No Jobs */}
          {!loading && loadError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
            >
              {loadError}
            </div>
          )}

          {!loading && !loadError && filteredJobs.length === 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

              <div className="px-4 py-14 text-center sm:px-6 sm:py-20">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-50">
                  <AppIcon name="briefcase" className="h-9 w-9 text-sky-700" />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-800">
                  No Job Vacancies Found
                </h3>

                <p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">
                  There are currently no job vacancies matching your search.
                  Please check back later for new opportunities.
                </p>

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-6 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
                  >
                    Clear Search
                  </button>
                )}

              </div>
            </div>
          )}

          {/* Job Cards */}
          {!loading && !loadError && filteredJobs.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {filteredJobs.map((job, index) => (
                <JobCard
                  key={job.job_vacancy_id}
                  job={job}
                  index={index}
                />
              ))}

            </div>
          )}

        </section>
      </main>

      <Footer />

    </div>
  );
}

export default JobVacancies;