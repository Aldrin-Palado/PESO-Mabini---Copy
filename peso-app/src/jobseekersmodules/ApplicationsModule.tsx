import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

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
  id: string;
  job: string;
  company: string;
  date: string;
  status: string;
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
          normalizedStatus === "interview"
        ? "bg-blue-50 text-blue-700"
        : normalizedStatus === "hired"
          ? "bg-green-50 text-green-700"
          : normalizedStatus === "rejected"
            ? "bg-red-50 text-red-700"
            : "bg-gray-100 text-gray-700";

  const label = status.replace(/_/g, " ");

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
          employer (
            name
          )
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

      setApplications(
        (data ?? []).map((row) => {
          const employer = Array.isArray(row.employer)
            ? row.employer[0]
            : row.employer;

          return {
            id: row.application_id,
            job: row.position_title || "Position not specified",
            company: employer?.name || "Employer",
            date: new Date(row.date_applied).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            status: row.status,
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
          "interview",
          "hired",
          "rejected",
          "withdrawn",
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
            {item === "All"
              ? item
              : item.replace(/_/g, " ")}
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
import AppIcon from "../components/AppIcon";
