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
  const [account, setAccount] =
    useState<Account | null>(null);

  const [permissions, setPermissions] =
    useState<AdminModule[]>([]);

  const [activePage, setActivePage] =
    useState<AdminModule | "My Profile">("Dashboard");

  const [loading, setLoading] = useState(true);

  const [counts, setCounts] = useState({
    jobs: 0,
    applications: 0,
    employers: 0,
    jobSeekers: 0,
  });

  const [auditLogs, setAuditLogs] =
    useState<AuditLog[]>([]);

  const isSuperadmin =
    account?.role === "superadmin";

  // ============================================================
  // LOAD CURRENT ACCOUNT
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
    if (
      isSuperadmin &&
      activePage === "Admin Audit Logs"
    ) {
      loadAuditLogs();
    }
  }, [isSuperadmin, activePage]);

  // ============================================================
  // LOAD CURRENT ACCOUNT
  // ============================================================

  const loadCurrentAccount = async () => {
    setLoading(true);

    try {
      // --------------------------------------------------------
      // 1. GET CURRENT AUTHENTICATED USER
      // --------------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(
          "Authentication error:",
          authError
        );

        window.location.href = "/login";
        return;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      console.log(
        "AUTH USER ID:",
        user.id
      );

      console.log(
        "AUTH USER EMAIL:",
        user.email
      );

      // --------------------------------------------------------
      // 2. CHECK PESO ADMIN FIRST
      // --------------------------------------------------------

      const {
        data: admin,
        error: adminError,
      } = await supabase
        .from("peso_admin")
        .select(
          `
            admin_id,
            user_id,
            full_name,
            email,
            contact_no,
            is_active
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      console.log(
        "PESO ADMIN RECORD:",
        admin
      );

      if (adminError) {
        console.error(
          "Superadmin query error:",
          adminError
        );

        /*
         * IMPORTANT:
         * Do NOT continue to peso_staff if the
         * peso_admin query itself failed.
         */
        alert(
          "Unable to verify your Superadmin account."
        );

        return;
      }

      // --------------------------------------------------------
      // 3. USER IS SUPERADMIN
      // --------------------------------------------------------

      if (admin) {
        console.log(
          "ROLE DETECTED: SUPERADMIN"
        );

        // Check active status
        if (!admin.is_active) {
          alert(
            "Your Superadmin account is inactive."
          );

          await supabase.auth.signOut();

          window.location.href = "/login";
          return;
        }

        // ------------------------------------------------------
        // SET SUPERADMIN ACCOUNT
        // ------------------------------------------------------

        setAccount({
          id: admin.admin_id,
          user_id: admin.user_id,
          full_name: admin.full_name,
          email: admin.email,
          contact_no: admin.contact_no,
          is_active: admin.is_active,
          role: "superadmin",
        });

        // ------------------------------------------------------
        // SUPERADMIN GETS ALL ADMIN MODULES
        // ------------------------------------------------------

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

        /*
         * VERY IMPORTANT:
         *
         * Once peso_admin is found, we STOP.
         *
         * We DO NOT query peso_staff.
         */
        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // 4. USER WAS NOT FOUND IN PESO_ADMIN
      //    NOW CHECK PESO_STAFF
      // --------------------------------------------------------

      console.log(
        "User is not registered as Superadmin."
      );

      const {
        data: staff,
        error: staffError,
      } = await supabase
        .from("peso_staff")
        .select(
          `
            peso_staff_id,
            user_id,
            admin_id,
            full_name,
            email,
            contact_no,
            is_active
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      console.log(
        "PESO STAFF RECORD:",
        staff
      );

      if (staffError) {
        console.error(
          "Staff query error:",
          staffError
        );

        alert(
          "Unable to verify your PESO Staff account."
        );

        return;
      }

      // --------------------------------------------------------
      // 5. USER IS STAFF
      // --------------------------------------------------------

      if (staff) {
        console.log(
          "ROLE DETECTED: PESO STAFF"
        );

        if (!staff.is_active) {
          alert(
            "Your PESO Staff account is inactive."
          );

          await supabase.auth.signOut();

          window.location.href = "/login";
          return;
        }

        // ------------------------------------------------------
        // SET STAFF ACCOUNT
        // ------------------------------------------------------

        setAccount({
          id: staff.peso_staff_id,
          user_id: staff.user_id,
          full_name: staff.full_name,
          email: staff.email,
          contact_no: staff.contact_no,
          is_active: staff.is_active,
          role: "staff",
        });

        // ------------------------------------------------------
        // LOAD STAFF PERMISSIONS
        // ------------------------------------------------------

        const {
          data: permissionData,
          error: permissionError,
        } = await supabase
          .from("staff_permissions")
          .select(
            `
              dashboard_overview,
              analytics,
              job_posts,
              job_application,
              employers,
              job_seekers,
              notifications
            `
          )
          .eq(
            "peso_staff_id",
            staff.peso_staff_id
          )
          .maybeSingle();

        if (permissionError) {
          console.error(
            "Permission query error:",
            permissionError
          );

          setPermissions([]);
        } else {
          setPermissions(
            convertPermissions(
              permissionData as Permissions | null
            )
          );
        }

        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // 6. USER IS NOT ADMIN OR STAFF
      // --------------------------------------------------------

      console.error(
        "No PESO Admin or PESO Staff record found."
      );

      alert(
        "Your account does not have access to this system."
      );

      await supabase.auth.signOut();

      window.location.href = "/login";
    } catch (error) {
      console.error(
        "Account loading error:",
        error
      );

      alert(
        "An error occurred while loading your account."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CONVERT DATABASE PERMISSIONS
  // ============================================================

  const convertPermissions = (
    permission: Permissions | null
  ): AdminModule[] => {
    if (!permission) {
      return [];
    }

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
    // Everyone can access their own profile
    if (page === "My Profile") {
      return true;
    }

    // Superadmin can access EVERYTHING
    if (account?.role === "superadmin") {
      return true;
    }

    // Staff can NEVER access these
    if (
      page === "Admin Accounts" ||
      page === "Admin Audit Logs"
    ) {
      return false;
    }

    // Staff uses assigned permissions
    return permissions.includes(page);
  };

  // ============================================================
  // LOAD DASHBOARD COUNTS
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
        applications:
          applicationsResult.count ?? 0,
        employers:
          employersResult.count ?? 0,
        jobSeekers:
          jobSeekersResult.count ?? 0,
      });
    } catch (error) {
      console.error(
        "Dashboard count error:",
        error
      );
    }
  };

  // ============================================================
  // AUDIT LOGS
  // ============================================================

  const loadAuditLogs = async () => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(100);

      if (error) {
        console.error(
          "Audit log error:",
          error
        );
        return;
      }

      setAuditLogs(data ?? []);
    } catch (error) {
      console.error(
        "Audit log loading error:",
        error
      );
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
        return (
          <PlaceholderPage title="Job Post" />
        );

      case "Employers":
        return (
          <PlaceholderPage title="Employers" />
        );

      case "Job Seekers":
        return (
          <PlaceholderPage title="Job Seekers" />
        );

      case "Applications":
        return (
          <PlaceholderPage title="Applications" />
        );

      case "Announcement":
        return (
          <PlaceholderPage title="Announcement" />
        );

      case "Analytics & Reports":
        return (
          <PlaceholderPage
            title="Analytics & Reports"
          />
        );

      case "Admin Accounts":
        if (account?.role !== "superadmin") {
          return <AccessDenied />;
        }

        return <AdminAccounts />;

      case "Admin Audit Logs":
        if (account?.role !== "superadmin") {
          return <AccessDenied />;
        }

        return (
          <AuditLogs logs={auditLogs} />
        );

      case "My Profile":
        return (
          <MyProfile account={account} />
        );

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
        isSuperadmin={
          account?.role === "superadmin"
        }
      />

      <main className="min-h-screen lg:ml-64">

        {/* HEADER */}

        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 shadow-sm sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:pb-5 lg:px-8">

          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">

              <h2 className="truncate text-xl font-bold text-slate-800 sm:text-2xl">
                {activePage}
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {account?.role === "superadmin"
                  ? "Superadmin"
                  : "PESO Staff"}
              </p>

            </div>

            <div className="min-w-0 text-right">

              <p className="truncate text-sm font-semibold text-slate-700 sm:text-base">
                {account?.full_name}
              </p>

              <p className="hidden truncate text-xs text-slate-500 sm:block">
                {account?.email}
              </p>

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <section className="px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-6 sm:pt-8 sm:pb-10 lg:px-8">
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

        <div className="table-scroll">

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
                        ? JSON.stringify(
                            log.details
                          )
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