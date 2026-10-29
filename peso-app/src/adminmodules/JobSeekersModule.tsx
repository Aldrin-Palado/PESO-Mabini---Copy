import React, { useState } from "react";
import { openStoredResume } from "../services/resumes";

type JobSeeker = {
  id?: string;
  job_seeker_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_no?: string;
  phone?: string;
  address?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  [key: string]: any;
};

type Props = {
  jobSeekers: JobSeeker[];
  search: string;
  setSearch: (value: string) => void;

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
};

export default function JobSeekersModule({
  jobSeekers,
  search,
  setSearch,
  loading,
  onRefresh,
  ModuleHeader,
  TableHeader,
  TableCell,
  StatusBadge,
  LoadingMessage,
  EmptyMessage,
}: Props) {
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState("");

  const openResume = async (jobSeeker: JobSeeker, rowId: string) => {
    const resumePath =
      typeof jobSeeker.resume_url === "string" ? jobSeeker.resume_url : "";

    if (!resumePath) return;

    setOpeningResumeId(rowId);
    setResumeError("");

    try {
      await openStoredResume(resumePath);
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
        title="Job Seekers"
        description="View registered job seekers and open their uploaded resumes to assess their qualifications."
        onRefresh={onRefresh}
      />

      {/* SEARCH */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search job seekers..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        />

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
        ) : jobSeekers.length === 0 ? (
          <EmptyMessage message="No job seekers found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <TableHeader>
                    Name
                  </TableHeader>

                  <TableHeader>
                    Email
                  </TableHeader>

                  <TableHeader>
                    Contact
                  </TableHeader>

                  <TableHeader>
                    Address
                  </TableHeader>

                  <TableHeader>
                    Resume
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {jobSeekers.map(
                  (jobSeeker, index) => {

                    const name =
                      jobSeeker.full_name ||
                      (
                        `${jobSeeker.first_name || ""} ${
                          jobSeeker.last_name || ""
                        }`
                      ).trim() ||
                      "Unnamed Job Seeker";

                    const status =
                      jobSeeker.status ||
                      (
                        jobSeeker.is_active
                          ? "Active"
                          : "Inactive"
                      );

                    const rowId = String(
                      jobSeeker.id ||
                        jobSeeker.job_seeker_id ||
                        index,
                    );

                    return (
                      <tr
                        key={rowId}
                        className="hover:bg-slate-50"
                      >

                        <TableCell bold>
                          {name}
                        </TableCell>

                        <TableCell>
                          {jobSeeker.email || "-"}
                        </TableCell>

                        <TableCell>
                          {jobSeeker.contact_no ||
                            jobSeeker.phone ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          {jobSeeker.address || "-"}
                        </TableCell>

                        <TableCell>
                          {jobSeeker.resume_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                void openResume(
                                  jobSeeker,
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