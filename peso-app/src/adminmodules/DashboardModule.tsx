import type { AdminModule } from "../components/AdminSidebar";
import AppIcon, { type AppIconName } from "../components/AppIcon";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Account = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_no?: string | null;
  is_active: boolean;
  role: "superadmin" | "staff";
};

type DashboardMetric = {
  label: string;
  value: number;
};

type DashboardStats = Partial<Record<AdminModule, DashboardMetric[]>>;

type MonthlyApplicationPoint = {
  key: string;
  label: string;
  value: number;
};

type ActivityLog = {
  log_id: string;
  action: string;
  details: unknown;
  created_at: string;
};

type Props = {
  stats: DashboardStats;
  permissions: AdminModule[];
  statsError?: string;
  statsLoading: boolean;
  realtimeUnavailable?: boolean;
  account: Account | null;
  logs: ActivityLog[];
  auditLogError?: string;
  monthlyApplicationTrend: MonthlyApplicationPoint[];
  onNavigate: (page: AdminModule) => void;
};

function formatActivityDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function DashboardModule({
  stats,
  permissions,
  statsError,
  statsLoading,
  realtimeUnavailable = false,
  account,
  logs,
  auditLogError,
  monthlyApplicationTrend,
  onNavigate,
}: Props) {
  const isAdmin = account?.role === "superadmin";
  const pendingEmployerCount =
  stats.Employers?.find((item) => item.label === "Pending")?.value ?? 0;

const pendingApplicationCount =
  stats.Applications?.find((item) => item.label === "Pending")?.value ?? 0;

const canViewEmployers =
  isAdmin || permissions.includes("Employers");

const canViewApplications =
  isAdmin || permissions.includes("Applications");
  const overallMetrics = [
    { module: "Job Post", label: "Job Posts", icon: "briefcase" },
    { module: "Applications", label: "Applications", icon: "file" },
    { module: "Employers", label: "Employers", icon: "building" },
    { module: "Job Seekers", label: "Job Seekers", icon: "users" },
  ] as const;

  const applicationStatusColors: Record<string, string> = {
    pending: "#F59E0B",
    "under review": "#2563EB",
    shortlisted: "#7C3AED",
    qualified: "#0891B2",
    interviewed: "#4F46E5",
    hired: "#059669",
    rejected: "#DC2626",
    withdrawn: "#64748B",
  };
  const applicationStatusSeries = (stats.Applications ?? [])
    .filter((item) => item.label !== "Total applications")
    .map((item, index) => ({
      name: item.label,
      value: item.value,
      color:
        applicationStatusColors[item.label.toLowerCase()] ??
        ["#F59E0B", "#2563EB", "#7C3AED", "#0891B2", "#4F46E5", "#059669"][
          index % 6
        ],
    }));

  const hasApplicationData = Boolean(stats.Applications);
  const hasApplications = applicationStatusSeries.some((item) => item.value > 0);
  const displayedApplicationTotal =
    stats.Applications?.find((item) => item.label === "Total applications")
      ?.value ??
    applicationStatusSeries.reduce((total, item) => total + item.value, 0);

  return (
    <div className="space-y-7">
      {canViewApplications && (
        <section aria-labelledby="application-overview-heading" className="space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <div>
              <h2 id="application-overview-heading" className="text-lg font-bold text-[#203F8B]">
                Application overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Application status and volume over the last six months.
              </p>
              {realtimeUnavailable && (
                <p role="status" className="mt-2 text-xs text-amber-700">
                  Live updates are reconnecting. This dashboard will refresh automatically.
                </p>
              )}
            </div>
          </div>

          <div className="grid min-w-0 gap-5 xl:grid-cols-2">
            <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800">
                  Application status
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Current applications by status.
                </p>
              </div>

              {statsLoading ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Loading application status...
                </p>
              ) : !hasApplicationData ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Application status data is unavailable.
                </p>
              ) : (
                <div className="grid items-center gap-4 sm:grid-cols-[minmax(150px,1fr)_minmax(0,1.2fr)]">
                  <div className="relative h-48 min-w-0">
                    {hasApplications ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={applicationStatusSeries}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={52}
                              outerRadius={78}
                              paddingAngle={3}
                            >
                              {applicationStatusSeries.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: 10,
                                fontSize: 12,
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-slate-800">
                            {displayedApplicationTotal}
                          </span>
                          <span className="text-xs text-slate-500">Applications</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
                        No applications in these statuses yet.
                      </div>
                    )}
                  </div>

                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {applicationStatusSeries.map((item) => (
                      <li key={item.name} className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {item.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800">
                  Monthly applications
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Applications received during the last six months.
                </p>
              </div>

              {statsLoading ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Loading monthly applications...
                </p>
              ) : !hasApplicationData ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Monthly application data is unavailable.
                </p>
              ) : (
                <div className="h-48 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyApplicationTrend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748B", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        width={36}
                        tick={{ fill: "#64748B", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Applications"
                        stroke="#203F8B"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#203F8B" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
          </div>
        </section>
      )}
      {statsError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Dashboard statistics could not be loaded: {statsError}
        </p>
      )}

      <section aria-label="Dashboard scoreboard" className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#203F8B] text-[#FACC15] shadow-sm">
            <AppIcon name="chart" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[#203F8B]">Overall dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">
              Platform totals at a glance.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {overallMetrics.map(({ module, label, icon }) => {
            if (!isAdmin && !permissions.includes(module)) return null;
            const value = stats[module]?.[0]?.value;
            return (
              <article
                key={module}
                className="group relative min-h-36 overflow-hidden rounded-2xl border border-[#DCE5F2] bg-white p-5 shadow-[0_8px_24px_-18px_rgba(32,63,139,0.55)] transition hover:-translate-y-1 hover:border-[#9DB7E3] hover:shadow-md"
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#203F8B] via-[#0759AE] to-[#FACC15]" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
                    <p className="mt-3 text-4xl font-black leading-none tracking-tight text-[#203F8B]">
                      {value === undefined ? (statsLoading ? "..." : "—") : value}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {value === undefined && !statsLoading ? "Unavailable" : "All records"}
                    </p>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#203F8B] transition group-hover:border-[#FACC15] group-hover:bg-[#FFF9DB]">
                    <AppIcon name={icon as AppIconName} className="h-5 w-5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {!statsLoading &&
  ((canViewEmployers && pendingEmployerCount > 0) ||
    (canViewApplications && pendingApplicationCount > 0)) && (
    <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Needs Attention
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Items awaiting review or follow-up.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {canViewEmployers && pendingEmployerCount > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-100 bg-white p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Employers awaiting verification
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {pendingEmployerCount} pending
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("Employers")}
              className="shrink-0 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-[#244FE8] hover:bg-blue-50"
            >
              Review
            </button>
          </div>
        )}

        {canViewApplications && pendingApplicationCount > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-100 bg-white p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Applications pending review
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {pendingApplicationCount} pending
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("Applications")}
              className="shrink-0 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-[#244FE8] hover:bg-blue-50"
            >
              Review
            </button>
          </div>
        )}
      </div>
    </section>
  )}

      {account?.role === "superadmin" && (
        <section className="flex flex-col gap-5 rounded-xl border border-blue-100 bg-blue-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#244FE8] text-white shadow-sm">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 4.5 6v5.2c0 4.4 3.1 8.4 7.5 9.8 4.4-1.4 7.5-5.4 7.5-9.8V6L12 3Z" strokeLinejoin="round" strokeWidth="1.8" />
                <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </span>
            <div>
              <h4 className="font-bold text-slate-900">Super Admin Control Center</h4>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-700">
                Review administrator accounts and monitor activity across the PESO MABINI platform.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("Admin Accounts")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#244FE8] shadow-sm transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244FE8]"
          >
            Review accounts
            <span aria-hidden="true">›</span>
          </button>
        </section>
      )}

      {account?.role === "superadmin" && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h4 className="font-bold text-slate-900">Account activity</h4>
              <p className="mt-1 text-sm text-slate-500">
                Latest recorded administrative actions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("Admin Audit Logs")}
              className="self-start rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#203F8B] sm:self-auto"
            >
              View audit logs
            </button>
          </div>

          {auditLogError && logs.length === 0 ? (
            <p
              role="alert"
              className="px-5 py-8 text-sm text-red-700 sm:px-6"
            >
              {auditLogError}
            </p>
          ) : (
            <>
              {auditLogError && (
                <p
                  role="status"
                  className="px-5 py-3 text-sm text-amber-700 sm:px-6"
                >
                  {auditLogError}
                </p>
              )}

              {logs.length ? (
                <ul className="divide-y divide-slate-100">
                  {logs.slice(0, 4).map((log) => (
                    <li
                      key={log.log_id}
                      className="flex items-center gap-4 px-5 py-4 sm:px-6"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#3156A2]">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="m5 12 4 4L19 6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {log.action}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatActivityDate(log.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 text-sm text-slate-500 sm:px-6">
                  No recent account activity has been recorded.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
