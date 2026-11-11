
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";

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

type InsightCategory = "month" | "job title" | "company" | "status";

type SelectedInsight = {
  category: InsightCategory;
  label: string;
  value: number;
} | null;

type Props = {
  counts: DashboardCounts;
  applications: Application[];
  jobPosts: JobPost[];
  employers: Employer[];
  jobSeekers: JobSeeker[];
  loading: boolean;
  loadError: string;

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

const BLUE = "#203F8B";
const RED = "#E3262E";

const tooltipStyle = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "10px",
  fontSize: "12px",
  padding: "8px 12px",
};

export default function AnalyticsModule({
  counts,
  applications,
  jobPosts,
  employers,
  jobSeekers,
  loading,
  loadError,
  StatCard,
  AnalyticsCard,
  SummaryRow,
}: Props) {
  const [selectedInsight, setSelectedInsight] =
    useState<SelectedInsight>(null);

  // APPLICATION STATUS COUNTS

  const pendingApplications = applications.filter(
    (application) => {
      const status =
        application.status ||
        application.application_status ||
        "";

      return status.toLowerCase() === "pending";
    }
  ).length;

  const approvedApplications = applications.filter(
    (application) => {
      const status =
        application.status ||
        application.application_status ||
        "";

      return status.toLowerCase() === "approved";
    }
  ).length;

  const rejectedApplications = applications.filter(
    (application) => {
      const status =
        application.status ||
        application.application_status ||
        "";

      return status.toLowerCase() === "rejected";
    }
  ).length;

  const hiredApplications = applications.filter(
    (application) => {
      const status =
        application.status ||
        application.application_status ||
        "";

      return status.toLowerCase() === "hired";
    }
  ).length;

  // ANALYTICS DATA

  const analyticsData = useMemo(() => {
    const statuses = [
      { key: "pending", label: "Pending" },
      { key: "under_review", label: "Under Review" },
      { key: "shortlisted", label: "Shortlisted" },
      { key: "qualified", label: "Qualified" },
      { key: "interviewed", label: "Interviewed" },
      { key: "withdrawn", label: "Withdrawn" },
      { key: "hired", label: "You're Hired" },
      { key: "rejected", label: "Rejected" },
    ];

    // LAST SIX MONTHS

    const monthBuckets = Array.from(
      { length: 6 },
      (_, index) => {
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
      }
    );

    const monthlyMap = new Map(
      monthBuckets.map((month) => [month.key, month] as const)
    );

    const titleCounts = new Map<string, number>();
    const companyCounts = new Map<string, number>();

    const statusCounts = new Map<string, number>(
      statuses.map((status) => [status.key, 0] as const)
    );

    // EMPLOYER LOOKUP

    const employerNames = new Map(
      employers.map((employer) => [
        String(employer.employer_id || ""),
        String(
          employer.name ||
          employer.company_name ||
          employer.business_name ||
          "Unknown Company"
        ),
      ] as const)
    );

    // PROCESS APPLICATIONS

    applications.forEach((application) => {
      const date = application.date_applied
        ? new Date(application.date_applied)
        : null;

      if (date && !Number.isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        const month = monthlyMap.get(key);

        if (month) {
          month.value++;
        }
      }

      const title = String(
        application.position_title ||
        "Unspecified Position"
      ).trim();

      titleCounts.set(
        title,
        (titleCounts.get(title) || 0) + 1
      );

      const company =
        employerNames.get(
          String(application.employer_id || "")
        ) || "Unknown Company";

      companyCounts.set(
        company,
        (companyCounts.get(company) || 0) + 1
      );

      const status = String(
        application.status ||
        application.application_status ||
        ""
      ).toLowerCase();

      if (statusCounts.has(status)) {
        statusCounts.set(
          status,
          (statusCounts.get(status) || 0) + 1
        );
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
        (job) =>
          String(job.status || "").toLowerCase() === "open"
      ).length,
    };
  }, [applications, employers, jobPosts]);

  // CHART SELECTION

  const handleChartSelect = (
    category: InsightCategory,
    data: any
  ) => {
    const item = data?.payload ?? data;

    if (!item) return;

    setSelectedInsight({
      category,
      label: String(item.label || ""),
      value: Number(item.value || 0),
    });
  };

  // MONTHLY TREND INSIGHT

  const selectedMonthIndex =
    selectedInsight?.category === "month"
      ? analyticsData.monthlyApplications.findIndex(
          (month) => month.label === selectedInsight.label
        )
      : -1;

  const selectedMonth =
    selectedMonthIndex >= 0
      ? analyticsData.monthlyApplications[selectedMonthIndex]
      : null;

  const previousMonth =
    selectedMonthIndex > 0
      ? analyticsData.monthlyApplications[
          selectedMonthIndex - 1
        ]
      : null;

  const monthlyTrendInsight = (() => {
    if (!selectedMonth) return "";

    if (!previousMonth) {
      return `${selectedMonth.value} ${
        selectedMonth.value === 1
          ? "application was"
          : "applications were"
      } recorded in ${selectedMonth.label}. No previous month is available for comparison.`;
    }

    const difference =
      selectedMonth.value - previousMonth.value;

    if (difference > 0) {
      return `Applications increased by ${difference} compared with ${previousMonth.label}, from ${previousMonth.value} to ${selectedMonth.value}.`;
    }

    if (difference < 0) {
      return `Applications decreased by ${Math.abs(
        difference
      )} compared with ${previousMonth.label}, from ${previousMonth.value} to ${selectedMonth.value}.`;
    }

    return `Application volume remained unchanged compared with ${previousMonth.label}, with ${selectedMonth.value} applications in both months.`;
  })();

  // SHARED INSIGHT DESCRIPTION

  const insightDescription = !selectedInsight
    ? ""
    : selectedInsight.category === "month"
      ? monthlyTrendInsight
      : selectedInsight.category === "job title"
        ? `${selectedInsight.value} ${
            selectedInsight.value === 1
              ? "application was"
              : "applications were"
          } submitted for ${selectedInsight.label}.`
        : selectedInsight.category === "company"
          ? `${selectedInsight.value} ${
              selectedInsight.value === 1
                ? "application was"
                : "applications were"
            } submitted to ${selectedInsight.label}.`
          : `${selectedInsight.value} ${
              selectedInsight.value === 1
                ? "application currently has"
                : "applications currently have"
            } the status ${selectedInsight.label}.`;

  // RECOMMENDED ACTION

  const recommendedAction = !selectedInsight
    ? ""
    : selectedInsight.category === "month"
      ? selectedInsight.value === 0
        ? "Review whether job vacancies were published and visible during this month."
        : "Compare this month's application volume with other months to identify changes in applicant activity."
      : selectedInsight.category === "job title"
        ? "Review the qualifications and skills associated with this position when planning job matching activities."
        : selectedInsight.category === "company"
          ? "Review this employer's active vacancies and applicant volume to assess recruitment demand."
          : "Review applications under this status and follow up on records requiring action.";

  return (
    <div className="space-y-6">
      {/* LOADING */}

      {loading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          Loading analytics data...
        </div>
      )}

      {/* ERROR */}

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

      {/* CHARTS AND SHARED INSIGHT PANEL */}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

        {/* LEFT: ANALYTICS CHARTS */}

        <div className="grid min-w-0 gap-6 md:grid-cols-2">

          {/* MONTHLY APPLICATION TRENDS */}

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">

            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                Monthly Application Trends
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Applications received during the last six months.
              </p>
            </div>

            <div className="h-[280px] w-full">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart
                  data={analyticsData.monthlyApplications}
                  margin={{
                    top: 20,
                    right: 12,
                    left: -15,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                  />

                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "#F1F5F9" }}
                  />

                  <Bar
                    dataKey="value"
                    name="Applications"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                    onClick={(data: any) =>
                      handleChartSelect("month", data)
                    }
                    className="cursor-pointer"
                  >

                    {analyticsData.monthlyApplications.map(
                      (month) => (
                        <Cell
                          key={month.key}
                          fill={
                            selectedInsight?.category === "month" &&
                            selectedInsight.label === month.label
                              ? RED
                              : BLUE
                          }
                        />
                      )
                    )}

                    <LabelList
                      dataKey="value"
                      position="top"
                      fill="#475569"
                      fontSize={12}
                    />

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            </div>

            <p className="mt-3 text-xs text-slate-500">
              Select a bar to view monthly application insights.
            </p>

          </div>

          {/* TOP 5 JOB TITLES */}

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                Top 5 Most Applied Job Titles
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Job positions ranked by applications received.
              </p>
            </div>

            {analyticsData.topJobTitles.length === 0 ? (

              <p className="py-8 text-center text-sm text-slate-500">
                No application data available yet.
              </p>

            ) : (

              <div className="h-[280px] w-full">

                <ResponsiveContainer width="100%" height="100%">

                  <BarChart
                    data={analyticsData.topJobTitles}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 5,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#E2E8F0"
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748B", fontSize: 11 }}
                    />

                    <YAxis
                      type="category"
                      dataKey="label"
                      width={105}
                      interval={0}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#475569", fontSize: 11 }}
                    />

                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "#F1F5F9" }}
                    />

                    <Bar
                      dataKey="value"
                      name="Applications"
                      radius={[0, 6, 6, 0]}
                      barSize={19}
                      onClick={(data: any) =>
                        handleChartSelect("job title", data)
                      }
                      className="cursor-pointer"
                    >

                      {analyticsData.topJobTitles.map((job) => (
                        <Cell
                          key={job.label}
                          fill={
                            selectedInsight?.category === "job title" &&
                            selectedInsight.label === job.label
                              ? RED
                              : BLUE
                          }
                        />
                      ))}

                      <LabelList
                        dataKey="value"
                        position="right"
                        fill="#475569"
                        fontSize={11}
                      />

                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              </div>

            )}

            <p className="mt-3 text-xs text-slate-500">
              Select a job title to view its insights.
            </p>

          </div>

          {/* TOP 5 COMPANIES */}

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                Top 5 Companies by Applications
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Employers ranked by applications received.
              </p>
            </div>

            {analyticsData.topCompanies.length === 0 ? (

              <p className="py-8 text-center text-sm text-slate-500">
                No company application data available yet.
              </p>

            ) : (

              <div className="h-[280px] w-full">

                <ResponsiveContainer width="100%" height="100%">

                  <BarChart
                    data={analyticsData.topCompanies}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 5,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#E2E8F0"
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748B", fontSize: 11 }}
                    />

                    <YAxis
                      type="category"
                      dataKey="label"
                      width={105}
                      interval={0}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#475569", fontSize: 11 }}
                    />

                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "#F1F5F9" }}
                    />

                    <Bar
                      dataKey="value"
                      name="Applications"
                      radius={[0, 6, 6, 0]}
                      barSize={19}
                      onClick={(data: any) =>
                        handleChartSelect("company", data)
                      }
                      className="cursor-pointer"
                    >

                      {analyticsData.topCompanies.map((company) => (
                        <Cell
                          key={company.label}
                          fill={
                            selectedInsight?.category === "company" &&
                            selectedInsight.label === company.label
                              ? RED
                              : BLUE
                          }
                        />
                      ))}

                      <LabelList
                        dataKey="value"
                        position="right"
                        fill="#475569"
                        fontSize={11}
                      />

                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              </div>

            )}

            <p className="mt-3 text-xs text-slate-500">
              Select a company to view its insights.
            </p>

          </div>

          {/* APPLICATION STATUS BREAKDOWN */}

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">

            <div className="mb-5">
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

              <p className="py-8 text-center text-sm text-slate-500">
                No application status data available yet.
              </p>

            ) : (

              <div className="h-[260px] w-full">

                <ResponsiveContainer width="100%" height="100%">

                  <BarChart
                    data={analyticsData.statusBreakdown}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 35,
                      left: 5,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#E2E8F0"
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748B", fontSize: 11 }}
                    />

                    <YAxis
                      type="category"
                      dataKey="label"
                      width={105}
                      interval={0}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#475569", fontSize: 11 }}
                    />

                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "#F1F5F9" }}
                    />

                    <Bar
                      dataKey="value"
                      name="Applications"
                      radius={[0, 6, 6, 0]}
                      barSize={19}
                      onClick={(data: any) =>
                        handleChartSelect("status", data)
                      }
                      className="cursor-pointer"
                    >

                      {analyticsData.statusBreakdown.map((status) => (
                        <Cell
                          key={status.label}
                          fill={
                            selectedInsight?.category === "status" &&
                            selectedInsight.label === status.label
                              ? RED
                              : BLUE
                          }
                        />
                      ))}

                      <LabelList
                        dataKey="value"
                        position="right"
                        fill="#475569"
                        fontSize={11}
                      />

                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              </div>

            )}

            <p className="mt-3 text-xs text-slate-500">
              Select a status to view its insights.
            </p>

          </div>

        </div>

        {/* RIGHT: SHARED INSIGHT PANEL */}

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">

          <div className="flex items-start justify-between gap-3">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Analytics Insights
              </p>

              <h3 className="mt-2 text-xl font-bold text-slate-800">
                {selectedInsight
                  ? selectedInsight.label
                  : "Selected Chart Insight"}
              </h3>
            </div>

            {selectedInsight && (
              <button
                type="button"
                onClick={() => setSelectedInsight(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Clear
              </button>
            )}

          </div>

          {selectedInsight ? (

            <div className="mt-6 space-y-5">

              {/* SELECTED VALUE */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {selectedInsight.category === "month"
                    ? "Monthly Applications"
                    : "Total Applications"}
                </p>

                <p className="mt-2 text-4xl font-bold text-[#203F8B]">
                  {selectedInsight.value.toLocaleString()}
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {insightDescription}
                </p>

              </div>

              {/* RECOMMENDED ACTION */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex items-center gap-2">

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
                      d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0-1.414-1.414M7.05 7.05 5.636 5.636M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>

                  <h4 className="text-sm font-bold text-blue-900">
                    Recommended Action
                  </h4>

                </div>

                <p className="mt-3 text-sm leading-relaxed text-blue-800">
                  {recommendedAction}
                </p>

              </div>

              {/* SELECTED CATEGORY */}

              <div className="border-t border-slate-200 pt-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Insight Category
                </p>

                <p className="mt-2 text-sm font-semibold capitalize text-slate-800">
                  {selectedInsight.category}
                </p>

              </div>

            </div>

          ) : (

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">

              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-[#203F8B]">

                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4 19V5m0 14h16M8 15v-4m4 4V7m4 8v-6"
                  />
                </svg>

              </div>

              <h4 className="text-sm font-bold text-slate-800">
                Explore Your Analytics
              </h4>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Select any bar from the charts to view detailed insights and recommended actions here.
              </p>

              <p className="mt-4 text-xs text-slate-500">
                Your selected chart information will appear in this panel.
              </p>

            </div>

          )}

        </aside>

      </div>

      {/* APPLICATION STATISTICS AND SYSTEM SUMMARY */}

      <div className="grid gap-6 xl:grid-cols-2">

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

          <div className="mt-5 grid gap-4 md:grid-cols-2">

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

    </div>
  );
}

// STATISTICS CARD WITH ICON

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

      <StatCard
        title={title}
        value={value}
      />

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
