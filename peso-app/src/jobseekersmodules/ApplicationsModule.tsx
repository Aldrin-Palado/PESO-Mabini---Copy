import React, { useState } from "react";

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

type Application = {
  id: number;
  job: string;
  company: string;
  location: string;
  date: string;
  status: "Pending" | "Under Review" | "Approved" | "Rejected";
};

type Props = {
  seeker: Seeker;
  onNavigate: (page: JobSeekerPage) => void;
};

const applications: Application[] = [
  {
    id: 1,
    job: "Junior Web Developer",
    company: "ABC Technology Solutions",
    location: "Lipa City, Batangas",
    date: "October 1, 2026",
    status: "Under Review",
  },
  {
    id: 2,
    job: "Administrative Assistant",
    company: "Mabini Business Center",
    location: "Mabini, Batangas",
    date: "September 28, 2026",
    status: "Pending",
  },
  {
    id: 3,
    job: "Production Staff",
    company: "Batangas Manufacturing Inc.",
    location: "Batangas City",
    date: "September 20, 2026",
    status: "Approved",
  },
];

function StatusBadge({
  status,
}: {
  status: Application["status"];
}) {
  const styles = {
    Pending: "bg-yellow-50 text-yellow-700",
    "Under Review": "bg-blue-50 text-blue-700",
    Approved: "bg-green-50 text-green-700",
    Rejected: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function ApplicationsModule({
  seeker,
  onNavigate,
}: Props) {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? applications
      : applications.filter(
          (application) => application.status === filter
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
          "Pending",
          "Under Review",
          "Approved",
          "Rejected",
        ].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === item
                ? "bg-blue-700 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-blue-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Applications */}
      <div className="space-y-4">

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              📄
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
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                  {application.company.charAt(0)}
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
                      📍 {application.location}
                    </span>

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
                      // Application details can be added here later.
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