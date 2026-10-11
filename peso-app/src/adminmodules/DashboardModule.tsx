import type { AdminModule } from "../components/AdminSidebar";

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

type ActivityLog = {
  log_id: string;
  action: string;
  details: unknown;
  created_at: string;
};

type Props = {
  counts: DashboardCounts;
  account: Account | null;
  logs: ActivityLog[];
  onRefresh: () => void;
  onNavigate: (page: AdminModule) => void;
};

const metrics = [
  {
    key: "jobs",
    title: "Job Posts",
    description: "Posted opportunities",
    icon: "briefcase",
    iconStyle: "bg-cyan-100 text-cyan-700",
  },
  {
    key: "applications",
    title: "Applications",
    description: "Applications received",
    icon: "document",
    iconStyle: "bg-blue-100 text-blue-700",
  },
  {
    key: "employers",
    title: "Employers",
    description: "Registered employers",
    icon: "building",
    iconStyle: "bg-amber-100 text-amber-700",
  },
  {
    key: "jobSeekers",
    title: "Job Seekers",
    description: "Registered job seekers",
    icon: "people",
    iconStyle: "bg-rose-100 text-rose-700",
  },
] as const;

function ActivityIcon({ type }: { type: string }) {
  const iconClass = "h-5 w-5";

  if (type === "briefcase") {
    return (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="7" width="18" height="14" rx="2" strokeWidth="1.8" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (type === "document") {
    return (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M14 3v5h5M9 13h6m-6 4h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (type === "building") {
    return (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-4h4v4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-8.87a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function formatActivityDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function DashboardModule({
  counts,
  account,
  logs,
  onRefresh,
  onNavigate,
}: Props) {
  const displayName = account?.full_name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3156A2]">
            PESO-Hub administration
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

      <section aria-label="PESO-Hub service totals" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.key}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.iconStyle}`}>
              <ActivityIcon type={metric.icon} />
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
              {counts[metric.key]}
            </p>
            <h4 className="mt-1 font-semibold text-slate-800">{metric.title}</h4>
            <p className="mt-1 text-sm text-slate-500">{metric.description}</p>
          </article>
        ))}
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
                Review administrator accounts and monitor activity across the PESO-Hub platform.
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
