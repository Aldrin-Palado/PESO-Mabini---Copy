import React from "react";

type Account = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_no?: string;
  is_active: boolean;
  role: "superadmin" | "staff";
};

type DashboardCounts = {
  jobs: number;
  applications: number;
  employers: number;
  jobSeekers: number;
};

type Props = {
  counts: DashboardCounts;
  account: Account | null;
  onRefresh: () => void;

  StatCard: React.ComponentType<{
    title: string;
    value: number;
  }>;
};

export default function DashboardModule({
  counts,
  account,
  onRefresh,
  StatCard,
}: Props) {
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h3 className="text-xl font-bold text-slate-800">
            Dashboard Overview
          </h3>

          <p className="text-sm text-slate-500">
            Welcome back,{" "}
            {account?.full_name}.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Refresh
        </button>

      </div>

      {/* STATISTICS */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Job Posts"
          value={counts.jobs}
        />

        <StatCard
          title="Applications"
          value={counts.applications}
        />

        <StatCard
          title="Employers"
          value={counts.employers}
        />

        <StatCard
          title="Job Seekers"
          value={counts.jobSeekers}
        />

      </div>

      {/* SYSTEM OVERVIEW */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h4 className="text-lg font-bold text-slate-800">
          System Overview
        </h4>

        <p className="mt-2 text-sm text-slate-500">
          Use the navigation menu to manage
          employment services, job vacancies,
          employers, job seekers, applications,
          announcements, and reports.
        </p>

      </div>

    </div>
  );
}