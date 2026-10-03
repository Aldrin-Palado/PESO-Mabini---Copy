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

        <StatCard
          title="Total Job Posts"
          value={counts.jobs}
        />

        <StatCard
          title="Total Employers"
          value={counts.employers}
        />

        <StatCard
          title="Total Job Seekers"
          value={counts.jobSeekers}
        />

        <StatCard
          title="Total Applications"
          value={counts.applications}
        />

      </div>

      {/* APPLICATION STATISTICS */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h4 className="text-lg font-bold text-slate-800">
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

        <h4 className="text-lg font-bold text-slate-800">
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