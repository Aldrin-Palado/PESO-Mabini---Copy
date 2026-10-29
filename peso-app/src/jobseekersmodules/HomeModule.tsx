import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type Seeker = {
  job_seeker_id: string;
  full_name?: string | null;
  email?: string | null;
};

type JobPost = {
  id: string;
  company: string;
  title: string;
  location: string;
  type: string;
  description: string;
  posted: string;
  imageUrl: string | null;
};

type JobSeekerPage =
  | "Home"
  | "Jobs"
  | "Applications"
  | "Messages"
  | "Profile";

type Props = {
  seeker: Seeker;
  onNavigate: (page: JobSeekerPage) => void;
};

export default function HomeModule({
  seeker,
  onNavigate,
}: Props) {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");

  const firstName =
    seeker.full_name?.trim().split(" ")[0] || "Job Seeker";

  useEffect(() => {
    let active = true;

    const loadRecommendedJobs = async () => {
      setJobsLoading(true);
      setJobsError("");

      const { data, error } = await supabase
        .from("job_vacancy")
        .select(`
          job_vacancy_id,
          position_title,
          location,
          employment_type,
          description,
          date_posted,
          image_url,
          employer (
            name
          )
        `)
        .eq("status", "open")
        .order("date_posted", { ascending: false })
        .limit(3);

      if (!active) return;

      if (error) {
        console.error("Error loading recommended jobs:", error);
        setJobsError(`Unable to load jobs: ${error.message}`);
        setJobPosts([]);
        setJobsLoading(false);
        return;
      }

      setJobPosts(
        (data ?? []).map((row) => {
          const employer = Array.isArray(row.employer)
            ? row.employer[0]
            : row.employer;

          return {
            id: row.job_vacancy_id,
            company: employer?.name || "Employer",
            title: row.position_title,
            location: row.location || "Location not specified",
            type: row.employment_type || "Type not specified",
            description: row.description || "No description provided.",
            posted: row.date_posted
              ? new Date(row.date_posted).toLocaleDateString()
              : "Recently",
            imageUrl: row.image_url ?? null,
          };
        })
      );
      setJobsLoading(false);
    };

    void loadRecommendedJobs();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-5">

      {/* Welcome Post */}
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-7 text-white">

          <p className="mb-1 text-sm text-blue-100">
            Welcome back, {firstName}
          </p>

          <h1 className="text-2xl font-bold">
            Find opportunities that match your skills.
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-blue-100">
            Explore job opportunities, track your applications,
            communicate with employers, and keep your profile updated.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("Jobs")}
            className="mt-5 rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-blue-900 transition hover:bg-yellow-300"
          >
            Explore Jobs
          </button>

        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex">

          <button
            type="button"
            onClick={() => onNavigate("Jobs")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <AppIcon name="briefcase" className="h-5 w-5" />
            Find Jobs
          </button>

          <div className="w-px bg-gray-200" />

          <button
            type="button"
            onClick={() => onNavigate("Messages")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <AppIcon name="bell" className="h-5 w-5" />
            PESO Updates
          </button>

        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">PESO Announcements</h2>
        <p className="mt-2 text-sm text-gray-500">
          No announcements are available.
        </p>
      </div>

      {/* Recommended Jobs */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="mb-5 flex items-center justify-between">

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recommended Jobs
            </h2>

            <p className="text-sm text-gray-500">
              Opportunities you may be interested in
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("Jobs")}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            See all
          </button>

        </div>

        {jobsLoading ? (
          <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            Loading recommended jobs...
          </p>
        ) : jobsError ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-5 text-sm text-red-800"
          >
            {jobsError}
          </p>
        ) : jobPosts.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            No open job posts are available right now. Check the Jobs page
            again later.
          </p>
        ) : (
          <div className="space-y-4">
          {jobPosts.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-gray-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
            >

              {job.imageUrl && (
                <img
                  src={job.imageUrl}
                  alt={`${job.title} job`}
                  className="mb-4 h-56 w-full rounded-lg bg-slate-50 object-contain sm:h-72"
                  loading="lazy"
                />
              )}

              <div className="flex gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                  {job.company.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex flex-col justify-between gap-2 sm:flex-row">

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {job.title}
                      </h3>

                      <p className="text-sm font-medium text-blue-700">
                        {job.company}
                      </p>
                    </div>

                    <span className="text-xs text-gray-400">
                      {job.posted}
                    </span>

                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      <AppIcon name="mapPin" className="mr-1 inline h-3.5 w-3.5" /> {job.location}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      <AppIcon name="briefcase" className="mr-1 inline h-3.5 w-3.5" /> {job.type}
                    </span>

                  </div>

                  <p className="mt-3 text-sm leading-5 text-gray-600">
                    {job.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => onNavigate("Jobs")}
                    className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    View Job <AppIcon name="arrowRight" className="ml-1 inline h-4 w-4" />
                  </button>

                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Profile Reminder */}
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

        <div className="flex gap-3">

          <div className="text-xl">
            <AppIcon name="lightbulb" className="h-6 w-6 text-yellow-700" />
          </div>

          <div className="flex-1">

            <h3 className="font-semibold text-yellow-900">
              Keep your profile updated
            </h3>

            <p className="mt-1 text-sm leading-5 text-yellow-800">
              Employers can better understand your qualifications when
              your education, skills, experience, and contact information
              are complete.
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
import AppIcon from "../components/AppIcon";
