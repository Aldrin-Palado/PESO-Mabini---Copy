import React from "react";

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
  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Job Seekers"
        description="View registered job seekers and their information."
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

                    return (
                      <tr
                        key={
                          jobSeeker.id ||
                          jobSeeker.job_seeker_id ||
                          index
                        }
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