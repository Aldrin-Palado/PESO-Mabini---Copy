import type { AdminModule } from "../components/AdminSidebar";
import AppIcon, { type AppIconName } from "../components/AppIcon";
import ModuleScoreboard from "./ModuleScoreboard";

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
  account: Account | null;
  logs: ActivityLog[];
  onRefresh: () => void;
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
  account,
  logs,
  onRefresh,
  onNavigate,
}: Props) {
  const isAdmin = account?.role === "superadmin";
  const overallMetrics = [
    { module: "Job Post", label: "Job Posts", icon: "briefcase" },
    { module: "Applications", label: "Applications", icon: "file" },
    { module: "Employers", label: "Employers", icon: "building" },
    { module: "Job Seekers", label: "Job Seekers", icon: "users" },
    { module: "Announcement", label: "Announcements", icon: "bell" },
    { module: "PESO Posts", label: "PESO Posts", icon: "megaphone" },
  ] as const;
  const moduleScoreboards = [
    { module: "Job Post", title: "Job Posts" },
    { module: "Applications", title: "Applications" },
    { module: "Employers", title: "Employers" },
    { module: "Job Seekers", title: "Job Seekers" },
    { module: "Announcement", title: "Announcements" },
    { module: "PESO Posts", title: "PESO Posts" },
  ] as const;

  return (
    <div className="space-y-7">
      <section className="flex justify-end">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#203F8B]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 7v5h-5M4 17v-5h5m10.1-2A7 7 0 0 0 6 6L4 8m16 8-2 2a7 7 0 0 1-13.1-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
          Refresh
        </button>
      </section>

      {statsError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Dashboard statistics could not be loaded: {statsError}
        </p>
      )}

      <section aria-label="Overall platform details" className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Overall platform details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Summary totals across the PESO MABINI platform.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {overallMetrics.map(({ module, label, icon }) => {
            if (!isAdmin && !permissions.includes(module)) return null;
            const value = stats[module]?.[0]?.value;
            if (value === undefined) return null;
            return (
              <article
                key={module}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0759AE]">
                  <AppIcon name={icon as AppIconName} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-[#123B70]">
                    {value}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-label="Dashboard scoreboards" className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Module scoreboards</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {moduleScoreboards.map(({ module, title }) => {
            if (!isAdmin && !permissions.includes(module)) return null;
            const metrics = stats[module];
            if (!metrics?.length) return null;
            return (
              <ModuleScoreboard
                key={module}
                title={title}
                metrics={metrics}
              />
            );
          })}
        </div>
      </section>

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

          {logs.length ? (
            <ul className="divide-y divide-slate-100">
              {logs.slice(0, 4).map((log) => (
                <li key={log.log_id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#3156A2]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{log.action}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatActivityDate(log.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-500 sm:px-6">
              No recent account activity has been recorded.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
