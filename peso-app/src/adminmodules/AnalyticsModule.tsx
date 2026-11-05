import React, { useMemo, useState } from "react";

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

  loading: boolean;
  loadError: string;
  onRefresh: () => void;

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
  loading,
  loadError,
  onRefresh,
  ModuleHeader,
  StatCard,
  AnalyticsCard,
  SummaryRow,
}: Props) {
  const [selectedInsight, setSelectedInsight] = useState<{
  category: "month" | "job title" | "company" | "status";
  label: string;
  value: number;
} | null>(null);
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

    const analyticsData = useMemo(() => {
  const statuses = [
    { key: "pending", label: "Pending" },
    { key: "under_review", label: "Under Review" },
    { key: "interview", label: "Interview" },
    { key: "hired", label: "Hired" },
    { key: "rejected", label: "Rejected" },
    { key: "withdrawn", label: "Withdrawn" },
  ];

  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    return {
      key: `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      value: 0,
    };
  });

  const monthlyMap = new Map(
    monthBuckets.map((month) => [month.key, month])
  );

  const titleCounts = new Map<string, number>();
  const companyCounts = new Map<string, number>();

  const statusCounts = new Map<string, number>(
    statuses.map((status) => [status.key, 0])
  );

  const employerNames = new Map(
    employers.map((employer) => [
      String(employer.employer_id || ""),
      String(
        employer.name ||
        employer.company_name ||
        employer.business_name ||
        "Unknown Company"
      ),
    ])
  );

  applications.forEach((application) => {
    const date = application.date_applied
      ? new Date(application.date_applied)
      : null;

    if (date && !Number.isNaN(date.getTime())) {
      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const month = monthlyMap.get(key);

      if (month) month.value++;
    }

    const title = String(
      application.position_title || "Unspecified Position"
    ).trim();

    titleCounts.set(title, (titleCounts.get(title) || 0) + 1);

    const company =
      employerNames.get(String(application.employer_id || "")) ||
      "Unknown Company";

    companyCounts.set(
      company,
      (companyCounts.get(company) || 0) + 1
    );

    const status = String(
      application.status || application.application_status || ""
    ).toLowerCase();

    if (statusCounts.has(status)) {
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    }
  });

  return {
    monthlyApplications: monthBuckets,

    topJobTitles: Array.from(titleCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),

    topCompanies: Array.from(companyCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),

    statusBreakdown: statuses.map((status) => ({
      label: status.label,
      value: statusCounts.get(status.key) || 0,
    })),

    availableJobs: jobPosts.filter(
      (job) => String(job.status || "").toLowerCase() === "open"
    ).length,
  };
}, [applications, employers, jobPosts]);

const maxMonthlyApplications = Math.max(
  ...analyticsData.monthlyApplications.map(
    (month) => month.value
  ),
  1
);

const maxJobTitleApplications = Math.max(
  ...analyticsData.topJobTitles.map(
    (job) => job.value
  ),
  1
);

const maxCompanyApplications = Math.max(
  ...analyticsData.topCompanies.map(
    (company) => company.value
  ),
  1
);

const maxStatusApplications = Math.max(
  ...analyticsData.statusBreakdown.map(
    (status) => status.value
  ),
  1
);

  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Analytics & Reports"
        description="View employment service statistics and system activity."
        onRefresh={onRefresh}
      />

      {loading && (
  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
    Loading analytics data...
  </div>
)}

{loadError && (
  <div
    role="alert"
    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
  >
    Unable to load analytics: {loadError}
  </div>
)}

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

      {/* MONTHLY APPLICATION TRENDS */}
<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="mb-6">
    <h3 className="text-lg font-bold text-slate-800">
      Monthly Application Trends
    </h3>
    <p className="mt-1 text-sm text-slate-500">
      Applications received during the last six months.
    </p>
  </div>

  <div className="flex h-64 items-end gap-3 border-b border-slate-200 px-2">
    {analyticsData.monthlyApplications.map((month) => {
      const barHeight =
        month.value === 0
          ? 2
          : Math.max(
              (month.value / maxMonthlyApplications) * 100,
              8
            );

      const isSelected =
        selectedInsight?.category === "month" &&
        selectedInsight.label === month.label;

      return (
        <button
          key={month.key}
          type="button"
          onClick={() =>
            setSelectedInsight({
              category: "month",
              label: month.label,
              value: month.value,
            })
          }
          aria-label={`${month.label}: ${month.value} applications`}
          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="text-xs font-semibold text-slate-600">
            {month.value}
          </span>

          <div className="flex w-full flex-1 items-end justify-center">
            <div
              className={`w-full max-w-14 rounded-t-md transition-colors ${
                isSelected
                  ? "bg-[#E3262E]"
                  : "bg-[#203F8B] group-hover:bg-[#3158B5]"
              }`}
              style={{ height: `${barHeight}%` }}
            />
          </div>

          <span className="whitespace-nowrap text-xs text-slate-500">
            {month.label}
          </span>
        </button>
      );
    })}
  </div>

  <p className="mt-4 text-xs text-slate-500">
    Select a month to view its insights.
  </p>
</div>

{/* TOP 5 MOST APPLIED JOB TITLES */}
<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="mb-6">
    <h3 className="text-lg font-bold text-slate-800">
      Top 5 Most Applied Job Titles
    </h3>
    <p className="mt-1 text-sm text-slate-500">
      Job positions ranked by the number of applications received.
    </p>
  </div>

  {analyticsData.topJobTitles.length === 0 ? (
    <p className="py-6 text-center text-sm text-slate-500">
      No application data available yet.
    </p>
  ) : (
    <div className="space-y-5">
      {analyticsData.topJobTitles.map((job, index) => {
        const isSelected =
          selectedInsight?.category === "job title" &&
          selectedInsight.label === job.label;

        const barWidth =
          (job.value / maxJobTitleApplications) * 100;

        return (
          <button
            key={job.label}
            type="button"
            onClick={() =>
              setSelectedInsight({
                category: "job title",
                label: job.label,
                value: job.value,
              })
            }
            className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium text-slate-700">
                {index + 1}. {job.label}
              </span>

              <span className="shrink-0 text-sm font-bold text-slate-800">
                {job.value}
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  isSelected ? "bg-[#E3262E]" : "bg-[#203F8B]"
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  )}

  <p className="mt-5 text-xs text-slate-500">
    Select a job title to view its insights and recommended actions.
  </p>
</div>

{/* TOP 5 COMPANIES BY APPLICATIONS */}
<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="mb-6">
    <h3 className="text-lg font-bold text-slate-800">
      Top 5 Companies by Applications
    </h3>
    <p className="mt-1 text-sm text-slate-500">
      Employers ranked by the number of applications received.
    </p>
  </div>

  {analyticsData.topCompanies.length === 0 ? (
    <p className="py-6 text-center text-sm text-slate-500">
      No company application data available yet.
    </p>
  ) : (
    <div className="space-y-5">
      {analyticsData.topCompanies.map((company, index) => {
        const isSelected =
          selectedInsight?.category === "company" &&
          selectedInsight.label === company.label;

        const barWidth =
          (company.value / maxCompanyApplications) * 100;

        return (
          <button
            key={company.label}
            type="button"
            onClick={() =>
              setSelectedInsight({
                category: "company",
                label: company.label,
                value: company.value,
              })
            }
            className="w-full rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium text-slate-700">
                {index + 1}. {company.label}
              </span>

              <span className="shrink-0 text-sm font-bold text-slate-800">
                {company.value}
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  isSelected ? "bg-[#E3262E]" : "bg-[#203F8B]"
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  )}

  <p className="mt-5 text-xs text-slate-500">
    Select a company to view its insights and recommended actions.
  </p>
</div>

{/* APPLICATION STATUS BREAKDOWN */}
<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="mb-6">
    <h3 className="text-lg font-bold text-slate-800">
      Application Status Breakdown
    </h3>
    <p className="mt-1 text-sm text-slate-500">
      Distribution of applications across different statuses.
    </p>
  </div>

  {analyticsData.statusBreakdown.every(
    (status) => status.value === 0
  ) ? (
    <p className="py-6 text-center text-sm text-slate-500">
      No application status data available yet.
    </p>
  ) : (
    <div className="space-y-5">
      {analyticsData.statusBreakdown.map((status) => {
        const isSelected =
          selectedInsight?.category === "status" &&
          selectedInsight.label === status.label;

        const barWidth =
          (status.value / maxStatusApplications) * 100;

        return (
          <button
            key={status.label}
            type="button"
            onClick={() =>
              setSelectedInsight({
                category: "status",
                label: status.label,
                value: status.value,
              })
            }
            className="w-full rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">
                {status.label}
              </span>

              <span className="text-sm font-bold text-slate-800">
                {status.value}
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  isSelected ? "bg-[#E3262E]" : "bg-[#203F8B]"
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  )}

  <p className="mt-5 text-xs text-slate-500">
    Select a status to view its insights and recommended actions.
  </p>
</div>

{/* SELECTED CHART INSIGHT */}
{selectedInsight && (
  <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          Selected Chart Insight
        </p>

        <h3 className="mt-2 text-lg font-bold text-slate-800">
          {selectedInsight.label}
        </h3>

        <p className="mt-2 text-sm text-slate-600">
          {selectedInsight.value}{" "}
          {selectedInsight.value === 1
            ? "application"
            : "applications"}

          {selectedInsight.category === "month"
            ? ` were recorded in ${selectedInsight.label}.`
            : selectedInsight.category === "job title"
              ? ` were submitted for ${selectedInsight.label}.`
              : selectedInsight.category === "company"
                ? ` were submitted to ${selectedInsight.label}.`
                : ` currently have the status ${selectedInsight.label}.`}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setSelectedInsight(null)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
      >
        Clear
      </button>
    </div>

    <div className="mt-5 rounded-lg bg-blue-50 p-4">
      <p className="text-sm font-bold text-blue-900">
        Recommended Action
      </p>

      <p className="mt-2 text-sm leading-relaxed text-blue-800">
        {selectedInsight.category === "month"
          ? selectedInsight.value === 0
            ? "Review whether job vacancies were published and visible during this month."
            : "Compare this month's application volume with other months to identify changes in applicant activity."
          : selectedInsight.category === "job title"
            ? "Review the qualifications and skills associated with this position when planning job matching activities."
            : selectedInsight.category === "company"
              ? "Review this employer's active vacancies and applicant volume to assess recruitment demand."
              : "Review applications under this status and follow up on records requiring action."}
      </p>
    </div>
  </div>
)}

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