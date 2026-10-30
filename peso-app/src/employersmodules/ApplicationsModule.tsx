
import { useState } from "react";
import { supabase } from "../services/supabase";

type ApplicationRow = {
  application_id: string;
  employer_id: string;
  job_seeker_id: string;
  job_vacancy_id?: string | null;
  position_title: string | null;
  status: string;
  date_applied: string;
  applicant_name?: string;
  applicant_email?: string | null;
  contact_number?: string | null;
};

type Props = {
  applications: ApplicationRow[];
  onRefresh: () => Promise<void> | void;
};

export default function ApplicationsModule({
  applications,
  onRefresh,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredApplications = applications.filter((application) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      (application.applicant_name || "")
        .toLowerCase()
        .includes(searchValue) ||
      (application.position_title || "")
        .toLowerCase()
        .includes(searchValue);

    const matchesStatus =
      statusFilter === "All Status" ||
      application.status.toLowerCase() ===
        statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleStatusChange = async (
    application: ApplicationRow,
    newStatus: string
  ) => {
    setUpdatingId(application.application_id);
    setMessage("");

    const { error } = await supabase
      .from("application")
      .update({
        status: newStatus,
      })
      .eq("application_id", application.application_id)
      .eq("employer_id", application.employer_id);

    setUpdatingId(null);

    if (error) {
      setMessage(
        `Failed to update application status: ${error.message}`
      );
      return;
    }

    setMessage("Application status updated successfully.");

    await onRefresh();
  };

  const statusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "shortlisted":
        return "bg-blue-100 text-blue-700";

      case "hired":
      case "accepted":
        return "bg-green-100 text-green-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "for review":
      case "under_review":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-black text-[#123B70]">
          Applications
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View and manage job seekers who applied to your job postings.
        </p>
      </div>

      {/* MESSAGE */}

      {message && (
        <div
          role="status"
          className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800"
        >
          {message}
        </div>
      )}

      {/* APPLICATIONS CONTAINER */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        {/* SEARCH AND FILTER */}

        <div className="border-b border-slate-100 p-5">

          <div className="flex flex-col gap-3 md:flex-row">

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search job seeker or job position..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0446A7]"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="All Status">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
              <option value="withdrawn">Withdrawn</option>
            </select>

          </div>

          <p className="mt-3 text-xs text-slate-500">
            Showing {filteredApplications.length} application(s)
          </p>

        </div>

        {/* APPLICATION LIST */}

        {filteredApplications.length === 0 ? (

          <div className="p-10 text-center">

            <h2 className="text-lg font-bold text-[#123B70]">
              No Applications Found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              There are no applications matching your search.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {filteredApplications.map((application) => (

              <article
                key={application.application_id}
                className="p-5 transition hover:bg-slate-50 sm:p-6"
              >

                {/* APPLICANT INFORMATION */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div className="min-w-0">

                    <h2 className="text-lg font-black text-[#123B70]">
                      {application.applicant_name ||
                        "Job Seeker"}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Applied Position:{" "}
                      {application.position_title ||
                        "Job Position"}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Application Date:{" "}
                      {formatDate(application.date_applied)}
                    </p>

                  </div>

                  {/* APPLICATION STATUS */}

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(application.status)}`}
                  >
                    {application.status}
                  </span>

                </div>

                {/* CONTACT INFORMATION */}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm text-slate-700">
                      {application.applicant_email ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Contact Number
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {application.contact_number ||
                        "Not available"}
                    </p>
                  </div>

                </div>

                {/* UPDATE STATUS */}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">

                  <label
                    htmlFor={`status-${application.application_id}`}
                    className="text-xs font-bold text-slate-500"
                  >
                    Update Application Status
                  </label>

                  <select
                    id={`status-${application.application_id}`}
                    value={application.status}
                    disabled={
                      updatingId === application.application_id
                    }
                    onChange={(event) =>
                      void handleStatusChange(
                        application,
                        event.target.value
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>

                  {updatingId === application.application_id && (
                    <span className="text-xs text-slate-500">
                      Updating...
                    </span>
                  )}

                </div>

              </article>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}
