import type { AdminModule } from "../components/AdminSidebar";

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
  const displayName = account?.full_name.trim().split(/\s+/)[0] || "there";
  const sections: AdminModule[] = [
    "Job Post",
    "Applications",
    "Employers",
    "Job Seekers",
    "Announcement",
    "PESO Posts",
  ];

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3156A2]">
            PESO MABINI administration
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {displayName}. Here is your service overview.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#203F8B] sm:self-auto"
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

      <div className="space-y-6">
        {sections.map((section) => {
          const sectionStats = stats[section];
          if (!permissions.includes(section) || !sectionStats?.length) return null;

          return (
            <section
              key={section}
              aria-label={`${section} statistics`}
              className="space-y-3"
            >
              <h4 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">
                {section}
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {sectionStats.map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-medium text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      {metric.value}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

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
