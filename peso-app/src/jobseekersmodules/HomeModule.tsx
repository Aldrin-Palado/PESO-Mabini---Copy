import React from "react";

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

const jobPosts: JobPost[] = [
  {
    id: "1",
    company: "ABC Technology Solutions",
    title: "Junior Web Developer",
    location: "Lipa City, Batangas",
    type: "Full-time",
    description:
      "We are looking for a motivated Junior Web Developer to join our development team.",
    posted: "2 hours ago",
  },
  {
    id: "2",
    company: "Batangas Manufacturing Inc.",
    title: "Production Staff",
    location: "Batangas City",
    type: "Full-time",
    description:
      "Hiring production staff with good communication skills and willingness to work in a team.",
    posted: "5 hours ago",
  },
  {
    id: "3",
    company: "Mabini Business Center",
    title: "Administrative Assistant",
    location: "Mabini, Batangas",
    type: "Full-time",
    description:
      "Seeking an organized and responsible administrative assistant.",
    posted: "Yesterday",
  },
];

export default function HomeModule({
  seeker,
  onNavigate,
}: Props) {
  const firstName =
    seeker.full_name?.trim().split(" ")[0] || "Job Seeker";

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

      {/* Search / Quick Actions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            {firstName.charAt(0).toUpperCase()}
          </div>

          <button
            type="button"
            onClick={() => onNavigate("Jobs")}
            className="flex-1 rounded-full bg-gray-100 px-5 py-3 text-left text-sm text-gray-500 transition hover:bg-gray-200"
          >
            Search for jobs, companies, or opportunities...
          </button>

        </div>

        <div className="mt-4 flex border-t border-gray-100 pt-3">

          <button
            type="button"
            onClick={() => onNavigate("Jobs")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
          >
            💼
            Find Jobs
          </button>

          <div className="w-px bg-gray-200" />

          <button
            type="button"
            onClick={() => onNavigate("Messages")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
          >
            🔔
            PESO Updates
          </button>

        </div>
      </div>

      {/* PESO Announcement */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="flex items-start gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
            P
          </div>

          <div className="flex-1">

            <h2 className="font-semibold text-gray-900">
              PESO Mabini
            </h2>

            <p className="text-xs text-gray-400">
              Public Employment Service Office · 1 day ago
            </p>

            <p className="mt-4 text-sm leading-6 text-gray-700">
              Welcome to PESO-Hub! Check this feed regularly for
              employment opportunities, announcements, job fairs,
              and other employment-related activities.
            </p>

            <div className="mt-4 rounded-xl bg-blue-50 p-4">

              <p className="text-sm font-semibold text-blue-800">
                📢 Employment Updates
              </p>

              <p className="mt-1 text-sm text-blue-700">
                New job opportunities are now available for job seekers.
              </p>

            </div>
          </div>
        </div>

        <div className="mt-5 flex border-t border-gray-100 pt-3">

          <button
            type="button"
            className="flex-1 rounded-lg py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            👍 Like
          </button>

          <button
            type="button"
            className="flex-1 rounded-lg py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            💬 Comment
          </button>

          <button
            type="button"
            className="flex-1 rounded-lg py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            ↗ Share
          </button>

        </div>
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

        <div className="space-y-4">

          {jobPosts.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-gray-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
            >

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
                      📍 {job.location}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      💼 {job.type}
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
                    View Job →
                  </button>

                </div>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Profile Reminder */}
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

        <div className="flex gap-3">

          <div className="text-xl">
            💡
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
              Update My Profile →
            </button>

          </div>
        </div>
      </div>

    </div>
  );
}