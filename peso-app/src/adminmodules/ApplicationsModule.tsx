import React, { useState } from "react";
import { supabase } from "../services/supabase";

type Application = {
  id?: string;
  application_id?: string;
  job_seeker_id?: string;
  employer_id?: string;
  job_vacancy_id?: string;
  status?: string;
  application_status?: string;
  created_at?: string;
  date_applied?: string;
  position_title?: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  resume_url?: string | null;
  [key: string]: any;
};

type Props = {
  applications: Application[];

  search: string;
  setSearch: (value: string) => void;

  statusFilter: string;
  setStatusFilter: (value: string) => void;

  loading: boolean;
  onRefresh: () => void;

  ModuleHeader: React.ComponentType<{
    title: string;
    description: string;
    onRefresh?: () => void;
  }>;

  TableHeader: React.ComponentType<{
    children: React.ReactNode;
  }>;

  TableCell: React.ComponentType<{
    children: React.ReactNode;
    bold?: boolean;
  }>;

  StatusBadge: React.ComponentType<{
    status: string;
  }>;

  LoadingMessage: React.ComponentType;

  EmptyMessage: React.ComponentType<{
    message: string;
  }>;

  formatDate: (date?: string) => string;
};

export default function ApplicationsModule({
  applications,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  loading,
  onRefresh,
  ModuleHeader,
  TableHeader,
  TableCell,
  StatusBadge,
  LoadingMessage,
  EmptyMessage,
  formatDate,
}: Props) {
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState("");

  const openResume = async (
    application: Application,
    rowId: string,
  ) => {
    const resumePath =
      typeof application.resume_url === "string"
        ? application.resume_url
        : "";

    if (!resumePath) return;

    setOpeningResumeId(rowId);
    setResumeError("");

    try {
      const { data, error } = await supabase.storage
        .from("Resume Files")
        .createSignedUrl(resumePath, 60);

      if (error) throw error;

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    } catch (openError) {
      console.error("Resume view error:", openError);
      setResumeError(
        openError instanceof Error
          ? openError.message
          : "Unable to open this resume. Please try again.",
      );
    } finally {
      setOpeningResumeId(null);
    }
  };

  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Applications"
        description="View submitted applications and open each applicant's resume to assess their qualifications."
        onRefresh={onRefresh}
      />

      {/* SEARCH AND FILTER */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search applications..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
          >

            <option value="All">
              All Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Under Review">
              Under Review
            </option>

            <option value="Interview">
              Interview
            </option>

            <option value="Hired">
              Hired
            </option>

            <option value="Rejected">
              Rejected
            </option>

            <option value="Withdrawn">
              Withdrawn
            </option>

          </select>

        </div>

      </div>

      {resumeError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {resumeError}
        </p>
      )}

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {loading ? (
          <LoadingMessage />
        ) : applications.length === 0 ? (
          <EmptyMessage message="No applications found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <TableHeader>
                    Application ID
                  </TableHeader>

                  <TableHeader>
                    Applicant
                  </TableHeader>

                  <TableHeader>
                    Position
                  </TableHeader>

                  <TableHeader>
                    Resume
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader>
                    Date Applied
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {applications.map(
                  (
                    application,
                    index
                  ) => {

                    const status =
                      application.status ||
                      application.application_status ||
                      "Unknown";

                    const rowId = String(
                      application.id ||
                        application.application_id ||
                        index,
                    );

                    return (
                      <tr
                        key={rowId}
                        className="hover:bg-slate-50"
                      >

                        <TableCell bold>
                          {application.application_id ||
                            application.id ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          <span className="block font-semibold text-slate-700">
                            {application.applicant_name ||
                              application.job_seeker_id ||
                              "-"}
                          </span>
                          {application.applicant_email && (
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {application.applicant_email}
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {application.position_title ||
                            application.job_vacancy_id ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          {application.resume_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                void openResume(
                                  application,
                                  rowId,
                                )
                              }
                              disabled={
                                openingResumeId === rowId
                              }
                              className="rounded-full border border-[#203F8B] px-3 py-1.5 text-xs font-semibold text-[#203F8B] transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                            >
                              {openingResumeId === rowId
                                ? "Opening..."
                                : "View Resume"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Not uploaded
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={status}
                          />
                        </TableCell>

                        <TableCell>
                          {formatDate(
                            application.date_applied ||
                              application.created_at
                          )}
                        </TableCell>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}