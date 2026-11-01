import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import AppIcon from "../components/AppIcon";
import type { OpenJobVacancyRow } from "../types/JobVacancy";

type Seeker = {
  job_seeker_id: string;
};

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
  onNavigateToJobs: () => void;
};

export default function SavedJobsModule({
  seeker,
  onNavigateToJobs,
}: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [unavailableCount, setUnavailableCount] = useState(0);
  const [removingJobId, setRemovingJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    let active = true;

    const loadSavedJobs = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const { data: savedRows, error: savedError } = await supabase
          .from("saved_job")
          .select("job_vacancy_id")
          .eq("job_seeker_id", seeker.job_seeker_id);

        if (savedError) throw savedError;

        const savedIds = [
          ...new Set((savedRows ?? []).map((row) => row.job_vacancy_id)),
        ];

        if (savedIds.length === 0) {
          if (active) {
            setJobs([]);
            setUnavailableCount(0);
          }
          return;
        }

        const pageSize = 500;
        const allRows: OpenJobVacancyRow[] = [];

        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .rpc("get_open_job_vacancies")
            .order("date_posted", { ascending: false })
            .order("job_vacancy_id", { ascending: false })
            .range(offset, offset + pageSize - 1);

          if (error) throw error;

          allRows.push(...((data ?? []) as OpenJobVacancyRow[]));

          if (!data || data.length < pageSize) break;
        }

        const openJobs: Job[] = allRows.map((row) => {
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

        const savedIdSet = new Set(savedIds);
        const availableSavedJobs = openJobs.filter((job) =>
          savedIdSet.has(job.id)
        );

        if (active) {
          setJobs(availableSavedJobs);
          setUnavailableCount(
            Math.max(0, savedIds.length - availableSavedJobs.length)
          );
        }
      } catch (error) {
        if (!active) return;

        console.error("Error loading saved jobs:", error);
        setLoadError(
          `Unable to load saved jobs: ${
            error instanceof Error ? error.message : "Unexpected error."
          }`
        );
        setJobs([]);
        setUnavailableCount(0);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSavedJobs();

    return () => {
      active = false;
    };
  }, [seeker.job_seeker_id]);

  const removeSavedJob = async (jobId: string) => {
    if (removingJobId) return;

    setRemovingJobId(jobId);
    setActionError("");

    const { error } = await supabase
      .from("saved_job")
      .delete()
      .eq("job_seeker_id", seeker.job_seeker_id)
      .eq("job_vacancy_id", jobId);

    if (error) {
      console.error("Error removing saved job:", error);
      setActionError(`Unable to remove saved job: ${error.message}`);
      setRemovingJobId(null);
      return;
    }

    setJobs((current) => current.filter((job) => job.id !== jobId));

    if (selectedJob?.id === jobId) {
      setSelectedJob(null);
    }

    setRemovingJobId(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#123B70]">
            Saved Jobs
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review the job opportunities you bookmarked.
          </p>
        </div>

        <span className="text-sm font-semibold text-slate-500">
          {jobs.length} available saved job{jobs.length === 1 ? "" : "s"}
        </span>
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading your saved jobs...
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          {loadError}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <AppIcon
            name="star"
            className="mx-auto h-10 w-10 text-slate-300"
          />
          <h3 className="mt-3 font-bold text-slate-900">
            No available saved jobs
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Save job opportunities from the Jobs page and they will appear here.
          </p>

          {unavailableCount > 0 && (
            <p className="mx-auto mt-3 max-w-md text-xs text-amber-700">
              {unavailableCount} previously saved job
              {unavailableCount === 1 ? " is" : "s are"} no longer open or available.
            </p>
          )}

          <button
            type="button"
            onClick={onNavigateToJobs}
            className="mt-5 rounded-xl bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91]"
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        <>
          {unavailableCount > 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {unavailableCount} saved job
              {unavailableCount === 1 ? " is" : "s are"} no longer open or available, so
              {unavailableCount === 1 ? " it is" : " they are"} not shown here.
            </p>
          )}

          <div className="space-y-4">
            {jobs.map((job) => {
              const postedDate = job.datePosted
                ? new Date(job.datePosted).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })
                : "Recently posted";

              return (
                <article
                  key={job.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-7">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0759AE] text-sm font-black text-white">
                        {job.company.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-400">
                          {postedDate}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                          {job.company}
                        </p>
                        <h3 className="mt-2 text-lg font-black text-slate-950">
                          {job.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span className="capitalize">{job.classification}</span>
                          <span aria-hidden="true">·</span>
                          <span>{job.type}</span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <AppIcon
                              name="dollar"
                              className="h-4 w-4 text-amber-500"
                            />
                            {job.salary}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <AppIcon
                              name="mapPin"
                              className="h-4 w-4 text-slate-500"
                            />
                            {job.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {job.imageUrl && (
                    <div className="border-y border-slate-100 bg-slate-50">
                      <img
                        src={job.imageUrl}
                        alt={`${job.title} job posting`}
                        className="max-h-64 w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91]"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => void removeSavedJob(job.id)}
                      disabled={removingJobId !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      <AppIcon name="star" className="h-4 w-4 fill-current" />
                      {removingJobId === job.id ? "Removing..." : "Remove Saved"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

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
            aria-labelledby={`saved-job-title-${selectedJob.id}`}
            className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-blue-700">
                  {selectedJob.company}
                </p>
                <h3
                  id={`saved-job-title-${selectedJob.id}`}
                  className="mt-1 text-xl font-black text-slate-950"
                >
                  {selectedJob.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                aria-label="Close job details"
                className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <AppIcon name="x" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <AppIcon name="mapPin" className="h-4 w-4" />
                  {selectedJob.location}
                </span>
                <span className="inline-flex items-center gap-2">
                  <AppIcon name="dollar" className="h-4 w-4 text-amber-500" />
                  {selectedJob.salary}
                </span>
                <span>{selectedJob.type}</span>
              </div>

              {selectedJob.imageUrl && (
                <img
                  src={selectedJob.imageUrl}
                  alt={`${selectedJob.title} job`}
                  className="max-h-64 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
                />
              )}

              <section>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  Job Overview
                </h4>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <dt className="text-xs font-semibold text-slate-500">
                      Classification
                    </dt>
                    <dd className="mt-1 text-sm font-bold capitalize text-slate-900">
                      {selectedJob.classification}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <dt className="text-xs font-semibold text-slate-500">
                      Available Openings
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-slate-900">
                      {selectedJob.vacanciesAvailable}
                    </dd>
                  </div>
                  {selectedJob.deadline && (
                    <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                      <dt className="text-xs font-semibold text-slate-500">
                        Application Deadline
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-slate-900">
                        {new Date(
                          `${selectedJob.deadline}T00:00:00`
                        ).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              <section>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  Job Description
                </h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedJob.description}
                </p>
              </section>

              <section>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  Requirements
                </h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedJob.requirements || "No specific requirements provided."}
                </p>
              </section>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJob(null);
                    onNavigateToJobs();
                  }}
                  className="rounded-xl bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91]"
                >
                  Go to Jobs
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close Details
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}