import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import AdminSidebar, {
  AdminModule,
} from "../components/AdminSidebar";
import AdminAccounts from "../pages/AdminAccounts";

type Account = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_no?: string;
  is_active: boolean;
  role: "superadmin" | "staff";
};

type Permissions = {
  dashboard_overview: boolean;
  analytics: boolean;
  job_posts: boolean;
  job_application: boolean;
  employers: boolean;
  job_seekers: boolean;
  notifications: boolean;
};

type AuditLog = {
  log_id: string;
  action: string;
  details: any;
  created_at: string;
};

export default function AdminDashboard() {
  const [account, setAccount] = useState<Account | null>(null);

  const [permissions, setPermissions] = useState<AdminModule[]>([]);

  const [activePage, setActivePage] =
    useState<AdminModule | "My Profile">("Dashboard");

  const [loading, setLoading] = useState(true);

  const [counts, setCounts] = useState({
    jobs: 0,
    applications: 0,
    employers: 0,
    jobSeekers: 0,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const isSuperadmin = account?.role === "superadmin";

  // ============================================================
  // LOAD ACCOUNT
  // ============================================================

  useEffect(() => {
    loadCurrentAccount();
  }, []);

  // ============================================================
  // LOAD DASHBOARD COUNTS
  // ============================================================

  useEffect(() => {
    if (account) {
      loadDashboardCounts();
    }
  }, [account]);

  // ============================================================
  // LOAD AUDIT LOGS
  // ============================================================

  useEffect(() => {
    if (isSuperadmin && activePage === "Admin Audit Logs") {
      loadAuditLogs();
    }
  }, [isSuperadmin, activePage]);

  // ============================================================
  // LOAD CURRENT ACCOUNT
  // ============================================================

  const loadCurrentAccount = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // --------------------------------------------------------
      // CHECK SUPERADMIN
      // --------------------------------------------------------

      const { data: admin, error: adminError } = await supabase
        .from("peso_admin")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (adminError) {
        console.error("Superadmin query error:", adminError);
      }

      if (admin) {
        setAccount({
          id: admin.admin_id,
          user_id: admin.user_id,
          full_name: admin.full_name,
          email: admin.email,
          contact_no: admin.contact_no,
          is_active: admin.is_active,
          role: "superadmin",
        });

        // Superadmin has ALL permissions
        setPermissions([
          "Dashboard",
          "Job Post",
          "Employers",
          "Job Seekers",
          "Applications",
          "Announcement",
          "Analytics & Reports",
          "Admin Accounts",
          "Admin Audit Logs",
        ]);

        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // CHECK STAFF
      // --------------------------------------------------------

      const { data: staff, error: staffError } = await supabase
        .from("peso_staff")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (staffError) {
        console.error("Staff query error:", staffError);
      }

      if (!staff) {
        alert("Your account does not have access to this system.");
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      setAccount({
        id: staff.peso_staff_id,
        user_id: staff.user_id,
        full_name: staff.full_name,
        email: staff.email,
        contact_no: staff.contact_no,
        is_active: staff.is_active,
        role: "staff",
      });

      // --------------------------------------------------------
      // LOAD STAFF PERMISSIONS
      // --------------------------------------------------------

      const {
        data: permissionData,
        error: permissionError,
      } = await supabase
        .from("staff_permissions")
        .select("*")
        .eq("peso_staff_id", staff.peso_staff_id)
        .maybeSingle();

      if (permissionError) {
        console.error(
          "Permission query error:",
          permissionError
        );
      }

      setPermissions(
        convertPermissions(
          permissionData as Permissions | null
        )
      );

      setLoading(false);
    } catch (error) {
      console.error("Account loading error:", error);
      setLoading(false);
    }
  };

  // ============================================================
  // CONVERT DATABASE PERMISSIONS
  // ============================================================

  const convertPermissions = (
    permission: Permissions | null
  ): AdminModule[] => {
    if (!permission) return [];

    const result: AdminModule[] = [];

    if (permission.dashboard_overview) {
      result.push("Dashboard");
    }

    if (permission.job_posts) {
      result.push("Job Post");
    }

    if (permission.employers) {
      result.push("Employers");
    }

    if (permission.job_seekers) {
      result.push("Job Seekers");
    }

    if (permission.job_application) {
      result.push("Applications");
    }

    if (permission.notifications) {
      result.push("Announcement");
    }

    if (permission.analytics) {
      result.push("Analytics & Reports");
    }

    return result;
  };

  // ============================================================
  // ACCESS CHECK
  // ============================================================

  const canAccess = (
    page: AdminModule | "My Profile"
  ) => {
    if (page === "My Profile") {
      return true;
    }

    if (isSuperadmin) {
      return true;
    }

    // Staff can NEVER access these
    if (
      page === "Admin Accounts" ||
      page === "Admin Audit Logs"
    ) {
      return false;
    }

    return permissions.includes(page);
  };

  // ============================================================
  // DASHBOARD COUNTS
  // ============================================================

  const loadDashboardCounts = async () => {
    try {
      const [
        jobsResult,
        applicationsResult,
        employersResult,
        jobSeekersResult,
      ] = await Promise.all([
        supabase
          .from("job_vacancy")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("application")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("employer")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("job_seeker")
          .select("*", {
            count: "exact",
            head: true,
          }),
      ]);

      setCounts({
        jobs: jobsResult.count ?? 0,
        applications: applicationsResult.count ?? 0,
        employers: employersResult.count ?? 0,
        jobSeekers: jobSeekersResult.count ?? 0,
      });
    } catch (error) {
      console.error("Dashboard count error:", error);
    }
  };

  // ============================================================
  // AUDIT LOGS
  // ============================================================

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(100);

      if (error) {
        console.error("Audit log error:", error);
        return;
      }

      setAuditLogs(data ?? []);
    } catch (error) {
      console.error("Audit log loading error:", error);
    }
  };

  // ============================================================
  // PAGE RENDERING
  // ============================================================

  const renderPage = () => {
    if (!canAccess(activePage)) {
      return <AccessDenied />;
    }

    switch (activePage) {
      case "Dashboard":
        return (
          <DashboardOverview
            counts={counts}
            account={account}
          />
        );

      case "Job Post":
        return <PlaceholderPage title="Job Post" />;

      case "Employers":
        return <PlaceholderPage title="Employers" />;

      case "Job Seekers":
        return <PlaceholderPage title="Job Seekers" />;

      case "Applications":
        return <PlaceholderPage title="Applications" />;

      case "Announcement":
        return <PlaceholderPage title="Announcement" />;

      case "Analytics & Reports":
        return (
          <PlaceholderPage title="Analytics & Reports" />
        );

      case "Admin Accounts":
        if (!isSuperadmin) {
          return <AccessDenied />;
        }

        return <AdminAccounts />;

      case "Admin Audit Logs":
        if (!isSuperadmin) {
          return <AccessDenied />;
        }

        return <AuditLogs logs={auditLogs} />;

      case "My Profile":
        return <MyProfile account={account} />;

      default:
        return <AccessDenied />;
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />

          <p className="text-sm text-slate-600">
            Loading PESO-Hub...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN LAYOUT
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        permissions={permissions}
        isSuperadmin={isSuperadmin}
      />

      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-8 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {activePage}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isSuperadmin
                  ? "Superadmin"
                  : "PESO Staff"}
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-700">
                {account?.full_name}
              </p>

              <p className="text-xs text-slate-500">
                {account?.email}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="p-8">
          {renderPage()}
        </section>
      </main>
    </div>
  );
}

// ============================================================
// DASHBOARD OVERVIEW
// ============================================================

function DashboardOverview({
  counts,
  account,
}: {
  counts: {
    jobs: number;
    applications: number;
    employers: number;
    jobSeekers: number;
  };
  account: Account | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-800">
          Dashboard Overview
        </h3>

        <p className="text-sm text-slate-500">
          Welcome back, {account?.full_name}.
        </p>
      </div>

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
    </div>
  );
}

// ============================================================
// AUDIT LOGS
// ============================================================

function AuditLogs({
  logs,
}: {
  logs: AuditLog[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-800">
          Admin Audit Logs
        </h3>

        <p className="text-sm text-slate-500">
          Records of administrative activities.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                  Action
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                  Details
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.log_id}>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {log.action}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {log.details
                        ? JSON.stringify(log.details)
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(
                        log.created_at
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MY PROFILE
// ============================================================

function MyProfile({
  account,
}: {
  account: Account | null;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="mb-6 text-xl font-bold text-slate-800">
          My Profile
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <ProfileField
            label="Full Name"
            value={account?.full_name}
          />

          <ProfileField
            label="Email"
            value={account?.email}
          />

          <ProfileField
            label="Contact Number"
            value={account?.contact_no}
          />

          <ProfileField
            label="Role"
            value={
              account?.role === "superadmin"
                ? "Superadmin"
                : "PESO Staff"
            }
          />

          <ProfileField
            label="Account Status"
            value={
              account?.is_active
                ? "Active"
                : "Inactive"
            }
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PLACEHOLDER
// ============================================================

function PlaceholderPage({
  title,
}: {
  title: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <h3 className="text-xl font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        This module is ready for implementation.
      </p>
    </div>
  );
}

// ============================================================
// ACCESS DENIED
// ============================================================

function AccessDenied() {
  return (
    <div className="rounded-xl border border-red-200 bg-white p-10 text-center shadow-sm">
      <h3 className="text-xl font-bold text-red-600">
        Access Denied
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        You do not have permission to access this module.
      </p>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-blue-900">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// PROFILE FIELD
// ============================================================

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {value || "-"}
      </p>
    </div>
  );
}