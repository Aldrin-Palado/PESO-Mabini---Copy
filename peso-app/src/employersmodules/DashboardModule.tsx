
import type { ReactNode } from "react";
import AppIcon, { type AppIconName } from "../components/AppIcon";

interface EmployerProfile {
  name?: string | null;
  contact_person?: string | null;
}

interface JobPost {
  job_vacancy_id: number;
  position_title: string;
  status: string;
}

interface ApplicationRow {
  id: number | string;
  applicant_name: string;
  position_title: string;
  status: string;
  created_at?: string;
}

interface DashboardModuleProps {
  profile: EmployerProfile;
  jobs: JobPost[];
  applications: ApplicationRow[];
  onNavigate: (menu: string) => void;
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: AppIconName;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{title}</p>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-[#0446A7]">
          <AppIcon name={icon} className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-3xl font-black text-[#123B70]">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    "for review": "bg-blue-100 text-blue-800",
    shortlisted: "bg-green-100 text-green-800",
    hired: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    open: "bg-green-100 text-green-800",
    active: "bg-green-100 text-green-800",
    closed: "bg-slate-100 text-slate-700",
    inactive: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        styles[normalized] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function ApplicationProgress({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0 ? Math.min((value / total) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-[#123B70]">{value}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#0446A7] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function RecentApplications({
  applications,
}: {
  applications: ApplicationRow[];
}) {
  if (applications.length === 0) {
    return <EmptyState message="No applications have been received yet." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-6 py-3 font-semibold">Applicant</th>
            <th className="px-6 py-3 font-semibold">Position</th>
            <th className="px-6 py-3 font-semibold">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {applications.map((application) => (
            <tr key={application.id}>
              <td className="px-6 py-4">
                <p className="text-sm font-semibold text-slate-800">
                  {application.applicant_name}
                </p>
              </td>

              <td className="px-6 py-4 text-sm text-slate-600">
                {application.position_title}
              </td>

              <td className="px-6 py-4">
                <StatusBadge status={application.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardModule({
  profile,
  jobs,
  applications,
  onNavigate,
}: DashboardModuleProps) {
  const activeJobs = jobs.filter((job) =>
    ["open", "active"].includes(job.status?.toLowerCase())
  ).length;

  const countStatus = (status: string) =>
    applications.filter(
      (application) =>
        application.status?.toLowerCase() === status.toLowerCase()
    ).length;

  const employerName =
    profile.name || profile.contact_person || "Employer";

  const summary: {
    label: string;
    value: number;
  }[] = [
    { label: "Pending", value: countStatus("pending") },
    { label: "For Review", value: countStatus("for review") },
    { label: "Shortlisted", value: countStatus("shortlisted") },
    { label: "Hired", value: countStatus("hired") },
    { label: "Rejected", value: countStatus("rejected") },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section>
        <h1 className="text-2xl font-black text-[#123B70] sm:text-3xl">
          Welcome, {employerName}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage your job vacancies and review applications.
        </p>
      </section>

      {/* Statistics */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Job Posts"
          value={activeJobs}
          description={`${jobs.length} total job posts`}
          icon="briefcase"
        />

        <StatCard
          title="Applications"
          value={applications.length}
          description="Total received"
          icon="check"
        />

        <StatCard
          title="Shortlisted"
          value={countStatus("shortlisted")}
          description="Applicants shortlisted"
          icon="star"
        />

        <StatCard
          title="Hired"
          value={countStatus("hired")}
          description="Successful hires"
          icon="users"
        />
      </section>

      {/* Jobs and Application Summary */}
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#123B70]">
                My Job Posts
              </h2>

              <p className="text-sm text-slate-500">
                Your latest job vacancies
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("My Job Posts")}
              className="rounded-xl bg-[#0446A7] px-4 py-2 text-sm font-bold text-white hover:bg-[#123B70]"
            >
              View Posts
            </button>
          </div>

          {jobs.length === 0 ? (
            <EmptyState message="You have not posted any jobs yet." />
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.job_vacancy_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      {job.position_title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Job Vacancy
                    </p>
                  </div>

                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Application Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-[#123B70]">
            Application Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Applicant status overview
          </p>

          <div className="mt-6 space-y-5">
            {summary.map((item) => (
              <ApplicationProgress
                key={item.label}
                label={item.label}
                value={item.value}
                total={applications.length}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Applications */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-black text-[#123B70]">
            Recent Applications
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest applicants for your job vacancies
          </p>
        </div>

        <RecentApplications
          applications={applications.slice(0, 5)}
        />
      </section>
    </div>
  );
}
