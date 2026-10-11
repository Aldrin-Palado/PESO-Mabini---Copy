import React from "react";

type JobPost = {
  id?: string;
  job_vacancy_id?: string;
  title?: string;
  job_title?: string;
  position?: string;
  [key: string]: any;
};

type Employer = {
  id?: string;
  employer_id?: string;
  company_name?: string;
  [key: string]: any;
};

type JobSeeker = {
  id?: string;
  job_seeker_id?: string;
  full_name?: string;
  [key: string]: any;
};

type Application = {
  id?: string;
  application_id?: string;
  status?: string;
  application_status?: string;
  [key: string]: any;
};

type DashboardCounts = {
  jobs: number;
  applications: number;
  employers: number;
  jobSeekers: number;
};

type Props = {
  counts: DashboardCounts;

  applications: Application[];
  jobPosts: JobPost[];
  employers: Employer[];
  jobSeekers: JobSeeker[];

  ModuleHeader: React.ComponentType<{
    title: string;
    description: string;
    onRefresh?: () => void;
  }>;

  StatCard: React.ComponentType<{
    title: string;
    value: number;
  }>;

  AnalyticsCard: React.ComponentType<{
    title: string;
    value: number;
  }>;

  SummaryRow: React.ComponentType<{
    label: string;
    value: number;
  }>;
};

export default function AnalyticsModule({
  counts,
  applications,
  jobPosts,
  employers,
  jobSeekers,
  ModuleHeader,
  StatCard,
  AnalyticsCard,
  SummaryRow,
}: Props) {
  const pendingApplications =
    applications.filter(
      (application) => {

        const status =
          application.status ||
          application.application_status ||
          "";

        return (
          status.toLowerCase() ===
          "pending"
        );
      }
    ).length;

  const approvedApplications =
    applications.filter(
      (application) => {

        const status =
          application.status ||
          application.application_status ||
          "";

        return (
          status.toLowerCase() ===
          "approved"
        );
      }
    ).length;

  const rejectedApplications =
    applications.filter(
      (application) => {

        const status =
          application.status ||
          application.application_status ||
          "";

        return (
          status.toLowerCase() ===
          "rejected"
        );
      }
    ).length;

  const hiredApplications =
    applications.filter(
      (application) => {

        const status =
          application.status ||
          application.application_status ||
          "";

        return (
          status.toLowerCase() ===
          "hired"
        );
      }
    ).length;

  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Analytics & Reports"
        description="View employment service statistics and system activity."
      />

      {/* MAIN STATISTICS */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <ReportStatCard
          icon="jobs"
          title="Total Job Posts"
          value={counts.jobs}
          StatCard={StatCard}
        />

        <ReportStatCard
          icon="employers"
          title="Total Employers"
          value={counts.employers}
          StatCard={StatCard}
        />

        <ReportStatCard
          icon="jobSeekers"
          title="Total Job Seekers"
          value={counts.jobSeekers}
          StatCard={StatCard}
        />

        <ReportStatCard
          icon="applications"
          title="Total Applications"
          value={counts.applications}
          StatCard={StatCard}
        />

      </div>

      {/* APPLICATION STATISTICS */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <svg
            className="h-5 w-5 text-[#203F8B]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M4 19V5m0 14h16M8 15v-4m4 4V7m4 8v-6m4 6V9"
            />
          </svg>
          Application Statistics
        </h4>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <AnalyticsCard
            title="Pending"
            value={pendingApplications}
          />

          <AnalyticsCard
            title="Approved"
            value={approvedApplications}
          />

          <AnalyticsCard
            title="Rejected"
            value={rejectedApplications}
          />

          <AnalyticsCard
            title="Hired"
            value={hiredApplications}
          />

        </div>

      </div>

      {/* SYSTEM SUMMARY */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <svg
            className="h-5 w-5 text-[#203F8B]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M4 6.5h16M4 12h16M4 17.5h10M7 4v5m5-2v5m4-3v5"
            />
          </svg>
          System Summary
        </h4>

        <div className="mt-5 space-y-4">

          <SummaryRow
            label="Registered Employers"
            value={employers.length}
          />

          <SummaryRow
            label="Registered Job Seekers"
            value={jobSeekers.length}
          />

          <SummaryRow
            label="Available Job Posts"
            value={jobPosts.length}
          />

          <SummaryRow
            label="Applications Recorded"
            value={applications.length}
          />

        </div>

      </div>

    </div>
  );
}

function ReportStatCard({
  icon,
  title,
  value,
  StatCard,
}: {
  icon: "jobs" | "employers" | "jobSeekers" | "applications";
  title: string;
  value: number;
  StatCard: Props["StatCard"];
}) {
  const iconPaths = {
    jobs: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    employers:
      "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01",
    jobSeekers:
      "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 3.13a4 4 0 1 1 0 7.75",
    applications:
      "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-7 8 2 2 4-4",
  } satisfies Record<typeof icon, string>;
  const iconColors = {
    jobs: "bg-blue-50 text-[#203F8B]",
    employers: "bg-red-50 text-[#C62832]",
    jobSeekers: "bg-amber-50 text-[#A16207]",
    applications: "bg-blue-50 text-[#203F8B]",
  } satisfies Record<typeof icon, string>;

  return (
    <div className="relative">
      <StatCard title={title} value={value} />
      <span
        className={`pointer-events-none absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl ${iconColors[icon]}`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d={iconPaths[icon]}
          />
        </svg>
      </span>
    </div>
  );
}