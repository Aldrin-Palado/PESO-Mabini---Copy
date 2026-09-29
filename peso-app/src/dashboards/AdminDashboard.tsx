import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

import AdminSidebar, {
  AdminModule,
} from "../components/AdminSidebar";

import AdminAccounts from "../pages/AdminAccounts";

/* =========================================================
   TYPES
========================================================= */

type Account = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
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

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const [account, setAccount] =
    useState<Account | null>(null);

  const [permissions, setPermissions] =
    useState<AdminModule[]>([]);

  const [activePage, setActivePage] =
  useState<AdminModule | "My Profile">(
    "Dashboard"
  );

  const [loading, setLoading] = useState(true);

  /* =====================================================
     LOAD CURRENT ACCOUNT
  ===================================================== */

  useEffect(() => {
    loadCurrentAccount();
  }, []);

  const loadCurrentAccount = async () => {
    setLoading(true);

    /* ---------------------------------------------
       GET LOGGED-IN USER
    --------------------------------------------- */

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    /* =================================================
       CHECK SUPERADMIN
       Superadmin is stored in peso_admin
    ================================================= */

    const {
      data: admin,
      error: adminError,
    } = await supabase
      .from("peso_admin")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (adminError) {
      console.error(
        "Error checking Superadmin:",
        adminError
      );
    }

    /* ---------------------------------------------
       USER IS SUPERADMIN
    --------------------------------------------- */

    if (admin) {
      setAccount({
        id: admin.admin_id,
        user_id: admin.user_id,
        full_name: admin.full_name,
        email: admin.email,
        is_active: admin.is_active,
        role: "superadmin",
      });

      /*
        Superadmin automatically has access
        to every module.

        Admin Accounts does NOT come from
        staff_permissions.
      */

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

      setActivePage("Dashboard Overview");

      setLoading(false);
      return;
    }

    /* =================================================
       CHECK PESO STAFF
    ================================================= */

    const {
      data: staff,
      error: staffError,
    } = await supabase
      .from("peso_staff")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (staffError) {
      console.error(
        "Error checking PESO Staff:",
        staffError
      );
    }

    /* ---------------------------------------------
       USER IS NOT STAFF
    --------------------------------------------- */

    if (!staff) {
      alert(
        "You do not have permission to access the Admin Portal."
      );

      window.location.href = "/";
      return;
    }

    /* ---------------------------------------------
       SET STAFF ACCOUNT
    --------------------------------------------- */

    setAccount({
      id: staff.peso_staff_id,
      user_id: staff.user_id,
      full_name: staff.full_name,
      email: staff.email,
      is_active: staff.is_active,
      role: "staff",
    });

    /* =================================================
       LOAD STAFF PERMISSIONS
    ================================================= */

    const {
      data: permissionData,
      error: permissionError,
    } = await supabase
      .from("staff_permissions")
      .select("*")
      .eq(
        "peso_staff_id",
        staff.peso_staff_id
      )
      .maybeSingle();

    if (permissionError) {
      console.error(
        "Error loading staff permissions:",
        permissionError
      );
    }

    /* ---------------------------------------------
       CONVERT PERMISSIONS
    --------------------------------------------- */

    if (permissionData) {
      const staffModules =
        convertPermissions(permissionData);

      setPermissions(staffModules);

      /*
        If Dashboard Overview is not allowed,
        open My Profile instead.
      */

      if (
        !permissionData.dashboard_overview
      ) {
        setActivePage("My Profile");
      } else {
        setActivePage(
          "Dashboard Overview"
        );
      }
    } else {
      /*
        Staff has no permission record.
        Only My Profile should be available.
      */

      setPermissions([]);
      setActivePage("My Profile");
    }

    setLoading(false);
  };

  /* =====================================================
     CONVERT DATABASE PERMISSIONS
     
     IMPORTANT:
     There is NO admin_accounts here.
     Admin Accounts is Superadmin-only.
  ===================================================== */

  const convertPermissions = (
  data: Permissions
): AdminModule[] => {

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

  useEffect(() => {
    loadCurrentAccount();
  }, []);

  useEffect(() => {
    if (account) {
      loadDashboardCounts();
    }
  }, [account]);

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

      const { data: permissionData, error: permissionError } =
        await supabase
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
        convertPermissions(permissionData as Permissions | null)
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
}  const result: AdminModule[] = [];

  if (data.dashboard_overview) {
    result.push("Dashboard");
  }

  if (data.job_posts) {
    result.push("Job Post");
  }

  if (data.employers) {
    result.push("Employers");
  }

  if (data.job_seekers) {
    result.push("Job Seekers");
  }

  if (data.job_application) {
    result.push("Applications");
  }

  if (data.notifications) {
    result.push("Announcement");
  }

  if (data.analytics) {
    result.push("Analytics & Reports");
  }

  /*
    IMPORTANT:
    Admin Accounts and Admin Audit Logs
    are NEVER loaded from staff permissions.
  */

  return result;
};

  /* =====================================================
     LOADING SCREEN
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FC]">
        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#0446A7]" />

          <p className="font-semibold text-slate-500">
            Loading PESO-Hub...
          </p>

        </div>
      </div>
    );
  }

  if (!account) {
    return null;
  }

  const isSuperadmin =
    account.role === "superadmin";

  /* =====================================================
     CHECK PAGE ACCESS
  ===================================================== */

  const canAccess = (
    page: AdminModule
  ) => {
    /*
      Superadmin can access everything.
    */

    if (isSuperadmin) {
      return true;
    }

    /*
      STAFF CANNOT ACCESS ADMIN ACCOUNTS
      UNDER ANY CIRCUMSTANCE.
    */

    if (page === "Admin Accounts") {
      return false;
    }

    return permissions.includes(page);
  };

  /* =====================================================
     PAGE CONTENT
  ===================================================== */

  const renderPage = () => {

    /* ---------------------------------------------
       MY PROFILE
       Everyone can access this.
    --------------------------------------------- */

    if (activePage === "My Profile") {
      return (
        <MyProfile account={account} />
      );
    }

    /* ---------------------------------------------
       ADMIN ACCOUNTS
       SUPERADMIN ONLY
    --------------------------------------------- */

    if (activePage === "Admin Accounts") {

      if (!isSuperadmin) {
        return <AccessDenied />;
      }

      return <AdminAccounts />;
    }

    /* ---------------------------------------------
       CHECK OTHER PERMISSIONS
    --------------------------------------------- */

    if (!canAccess(activePage)) {
      return <AccessDenied />;
    }

    /* ---------------------------------------------
       MODULES
    --------------------------------------------- */

    switch (activePage) {

      case "Dashboard Overview":
        return <DashboardOverview />;

      case "Analytics & Reports":
        return <Analytics />;

      case "Job Posts":
        return <JobPosts />;

      case "Job Application":
        return <JobApplications />;

      case "Employers":
        return <Employers />;

      case "Job Seekers":
        return <JobSeekers />;

      case "Notifications":
        return <Notifications />;

      default:
        return <AccessDenied />;
    }
  };

  /* =====================================================
     MAIN LAYOUT
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#F5F8FC]">

      {/* SIDEBAR */}

      <AdminSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        permissions={permissions}
        isSuperadmin={isSuperadmin}
      />

      {/* MAIN CONTENT */}

      <main className="ml-72 min-h-screen">

        {/* HEADER */}

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">

          <div>

            <p className="text-sm font-semibold text-slate-400">
              {isSuperadmin
                ? "Superadmin"
                : "PESO Staff"}
            </p>

            <h1 className="text-2xl font-black text-[#123B70]">
              {activePage}
            </h1>

          </div>

          {/* USER INFO */}

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-bold text-slate-800">
                {account.full_name}
              </p>

              <p className="text-xs text-slate-500">
                {isSuperadmin
                  ? "PESO Head"
                  : "PESO Staff"}
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0446A7] font-black text-white">
              {account.full_name
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <div className="p-8">
          {renderPage()}
        </div>

      </main>

    </div>
  );
}

/* =========================================================
   DASHBOARD OVERVIEW
========================================================= */

function DashboardOverview() {

  const [counts, setCounts] = useState({
    jobs: 0,
    applications: 0,
    employers: 0,
    seekers: 0,
  });

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {

    const [
      jobs,
      applications,
      employers,
      seekers,
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
      jobs: jobs.count || 0,
      applications:
        applications.count || 0,
      employers:
        employers.count || 0,
      seekers:
        seekers.count || 0,
    });
  };

  return (
    <div className="space-y-8">

      <div>

        <h2 className="text-2xl font-black text-[#123B70]">
          Dashboard Overview
        </h2>

        <p className="mt-1 text-slate-500">
          Overview of the PESO-Hub employment system.
        </p>

      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Job Posts"
          value={counts.jobs}
          icon="▤"
        />

        <StatCard
          title="Applications"
          value={counts.applications}
          icon="▥"
        />

        <StatCard
          title="Employers"
          value={counts.employers}
          icon="◆"
        />

        <StatCard
          title="Job Seekers"
          value={counts.seekers}
          icon="♙"
        />

      </div>

    </div>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

function Analytics() {

  return (
    <div>

      <h2 className="text-2xl font-black text-[#123B70]">
        Analytics
      </h2>

      <p className="mt-2 text-slate-500">
        Employment statistics and reports will be displayed here.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">

        <p className="font-bold text-slate-700">
          Analytics Module
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Your existing job, application,
          employer, and job seeker tables
          can be used to build the
          analytics charts.
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   JOB POSTS
========================================================= */

function JobPosts() {

  return (
    <div>

      <h2 className="text-2xl font-black text-[#123B70]">
        Job Posts
      </h2>

      <p className="mt-2 text-slate-500">
        Manage employer job vacancies.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">

        <p className="font-bold text-slate-700">
          Job Vacancy Management
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Connected to the job_vacancy table.
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   JOB APPLICATIONS
========================================================= */

function JobApplications() {

  return (
    <div>

      <h2 className="text-2xl font-black text-[#123B70]">
        Job Application
      </h2>

      <p className="mt-2 text-slate-500">
        Manage submitted job applications.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">

        <p className="font-bold text-slate-700">
          Application Management
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Connected to the application table.
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   EMPLOYERS
========================================================= */

function Employers() {

  return (
    <div>

      <h2 className="text-2xl font-black text-[#123B70]">
        Employers
      </h2>

      <p className="mt-2 text-slate-500">
        Manage registered employers.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">

        <p className="font-bold text-slate-700">
          Employer Management
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Connected to the employer table.
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   JOB SEEKERS
========================================================= */

function JobSeekers() {

  return (
    <div>

      <h2 className="text-2xl font-black text-[#123B70]">
        Job Seekers
      </h2>

      <p className="mt-2 text-slate-500">
        Manage registered job seekers.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">

        <p className="font-bold text-slate-700">
          Job Seeker Management
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Connected to the job_seeker table.
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function Notifications() {

  const [logs, setLogs] =
    useState<any[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {

    const {
      data,
      error,
    } = await supabase
      .from("admin_activity_log")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(20);

    if (error) {
      console.error(
        "Error loading notifications:",
        error
      );

      return;
    }

    setLogs(data || []);
  };

  return (
    <div className="space-y-6">

      <div>

        <h2 className="text-2xl font-black text-[#123B70]">
          Notifications
        </h2>

        <p className="mt-1 text-slate-500">
          Recent administrative system activity.
        </p>

      </div>

      <div className="space-y-3">

        {logs.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">

            <p className="font-semibold text-slate-500">
              No recent activity.
            </p>

          </div>

        ) : (

          logs.map((log) => (

            <div
              key={log.log_id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >

              <p className="font-bold text-slate-800">
                {log.action}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {new Date(
                  log.created_at
                ).toLocaleString()}
              </p>

            </div>

          ))
        )}

      </div>

    </div>
  );
}

/* =========================================================
   MY PROFILE
========================================================= */

function MyProfile({
  account,
}: {
  account: Account;
}) {

  return (
    <div className="space-y-6">

      <div>

        <h2 className="text-2xl font-black text-[#123B70]">
          My Profile
        </h2>

        <p className="mt-1 text-slate-500">
          Your PESO-Hub account information.
        </p>

      </div>

      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#0446A7] text-3xl font-black text-white">

          {account.full_name
            .charAt(0)
            .toUpperCase()}

        </div>

        <div className="space-y-4">

          <ProfileField
            label="Full Name"
            value={account.full_name}
          />

          <ProfileField
            label="Email"
            value={account.email}
          />

          <ProfileField
            label="Role"
            value={
              account.role === "superadmin"
                ? "PESO Head / Superadmin"
                : "PESO Staff"
            }
          />

          <ProfileField
            label="Status"
            value={
              account.is_active
                ? "Active"
                : "Inactive"
            }
          />

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   ACCESS DENIED
========================================================= */

function AccessDenied() {

  return (
    <div className="flex min-h-[500px] items-center justify-center">

      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-500">
          !
        </div>

        <h2 className="mt-4 text-xl font-black text-slate-800">
          Access Restricted
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to
          access this module. Please contact
          the Superadmin if you need access.
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-[#123B70]">
            {value}
          </p>

        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-[#0446A7]">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   PROFILE FIELD
========================================================= */

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div>

      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
        {value}
      </div>

    </div>
  );
}