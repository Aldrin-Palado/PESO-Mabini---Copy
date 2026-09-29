import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type StaffPermission = {
  dashboard_overview: boolean;
  analytics: boolean;
  job_posts: boolean;
  job_application: boolean;
  employers: boolean;
  job_seekers: boolean;
  notifications: boolean;
};

type StaffAccount = {
  peso_staff_id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_no: string;
};

type ModuleName =
  | "Dashboard Overview"
  | "Analytics"
  | "Job Posts"
  | "Job Application"
  | "Employers"
  | "Job Seekers"
  | "Notifications";

export default function StaffDashboard() {
  const [staff, setStaff] =
    useState<StaffAccount | null>(null);

  const [permissions, setPermissions] =
    useState<StaffPermission | null>(null);

  const [activePage, setActivePage] =
    useState<ModuleName | "My Profile">(
      "My Profile"
    );

  const [loading, setLoading] =
    useState(true);

  /* =====================================================
     LOAD STAFF
  ===================================================== */

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);

    try {
      /* ---------------------------------------------
         GET LOGGED-IN USER
      --------------------------------------------- */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.href = "/login";
        return;
      }

      /* ---------------------------------------------
         FIND STAFF ACCOUNT
      --------------------------------------------- */

      const { data: staffData, error: staffError } =
        await supabase
          .from("peso_staff")
          .select(
            `
            peso_staff_id,
            user_id,
            full_name,
            email,
            contact_no
            `
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

      if (staffError) {
        console.error(
          "Staff loading error:",
          staffError
        );

        return;
      }

      if (!staffData) {
        alert(
          "You are not registered as a PESO Staff."
        );

        window.location.href = "/login";
        return;
      }

      setStaff(staffData);

      /* ---------------------------------------------
         LOAD PERMISSIONS
      --------------------------------------------- */

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
          staffData.peso_staff_id
        )
        .maybeSingle();

      if (permissionError) {
        console.error(
          "Permission loading error:",
          permissionError
        );
      }

      setPermissions(
        permissionData || {
          dashboard_overview: false,
          analytics: false,
          job_posts: false,
          job_application: false,
          employers: false,
          job_seekers: false,
          notifications: false,
        }
      );

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     CHECK WHETHER MODULE IS ASSIGNED
  ===================================================== */

  const isAssigned = (
    module: ModuleName
  ): boolean => {

    if (!permissions) {
      return false;
    }

    switch (module) {

      case "Dashboard Overview":
        return permissions.dashboard_overview;

      case "Analytics":
        return permissions.analytics;

      case "Job Posts":
        return permissions.job_posts;

      case "Job Application":
        return permissions.job_application;

      case "Employers":
        return permissions.employers;

      case "Job Seekers":
        return permissions.job_seekers;

      case "Notifications":
        return permissions.notifications;

      default:
        return false;
    }
  };

  /* =====================================================
     MODULE LIST
  ===================================================== */

  const modules: {
    name: ModuleName;
    icon: string;
  }[] = [
    {
      name: "Dashboard Overview",
      icon: "▦",
    },
    {
      name: "Analytics",
      icon: "▥",
    },
    {
      name: "Job Posts",
      icon: "▤",
    },
    {
      name: "Job Application",
      icon: "▣",
    },
    {
      name: "Employers",
      icon: "◆",
    },
    {
      name: "Job Seekers",
      icon: "♙",
    },
    {
      name: "Notifications",
      icon: "●",
    },
  ];

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    await supabase.auth.signOut();

    window.location.href = "/login";
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FC]">

        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#0446A7]" />

          <p className="font-semibold text-slate-500">
            Loading Staff Dashboard...
          </p>

        </div>

      </div>
    );
  }

  if (!staff) {
    return null;
  }

  /* =====================================================
     VISIBLE MODULES
  ===================================================== */

  const visibleModules =
    modules.filter((module) =>
      isAssigned(module.name)
    );

  /* =====================================================
     PAGE CONTENT
  ===================================================== */

  const renderContent = () => {

    switch (activePage) {

      case "Dashboard Overview":
        return <DashboardOverview />;

      case "Analytics":
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

      case "My Profile":
        return (
          <MyProfile staff={staff} />
        );

      default:
        return (
          <MyProfile staff={staff} />
        );
    }
  };

  /* =====================================================
     INTERFACE
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#F5F8FC]">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-[#0446A7] text-white">

        {/* LOGO */}

        <div className="border-b border-blue-400/30 px-6 py-6">

          <h1 className="text-2xl font-black">
            PESO-Hub
          </h1>

          <p className="mt-1 text-sm text-blue-100">
            Staff Portal
          </p>

        </div>

        {/* MENU */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-blue-200">
            Main Menu
          </p>

          <div className="space-y-1">

            {visibleModules.map(
              (module) => {

                const active =
                  activePage === module.name;

                return (
                  <button
                    key={module.name}
                    type="button"
                    onClick={() =>
                      setActivePage(
                        module.name
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-white text-[#0446A7] shadow-sm"
                        : "text-white hover:bg-blue-600"
                    }`}
                  >

                    <span className="w-6 text-center">
                      {module.icon}
                    </span>

                    <span>
                      {module.name}
                    </span>

                  </button>
                );
              }
            )}

          </div>

          {/* ACCOUNT */}

          <p className="mb-3 mt-8 px-3 text-xs font-bold uppercase tracking-wider text-blue-200">
            Account
          </p>

          <button
            type="button"
            onClick={() =>
              setActivePage("My Profile")
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
              activePage === "My Profile"
                ? "bg-white text-[#0446A7]"
                : "text-white hover:bg-blue-600"
            }`}
          >

            <span className="w-6 text-center">
              ◉
            </span>

            <span>
              My Profile
            </span>

          </button>

        </nav>

        {/* LOGOUT */}

        <div className="border-t border-blue-400/30 p-4">

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >

            <span className="w-6 text-center">
              ↪
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="ml-72 min-h-screen">

        {/* HEADER */}

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">

          <div>

            <p className="text-sm font-semibold text-slate-400">
              PESO Staff
            </p>

            <h1 className="text-2xl font-black text-[#123B70]">
              {activePage}
            </h1>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-bold text-slate-800">
                {staff.full_name}
              </p>

              <p className="text-xs text-slate-500">
                PESO Staff
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0446A7] font-black text-white">

              {staff.full_name
                .charAt(0)
                .toUpperCase()}

            </div>

          </div>

        </header>

        {/* PAGE */}

        <div className="p-8">
          {renderContent()}
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
        Employment statistics and reports.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">

        <p className="font-bold text-slate-700">
          Analytics Module
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Employment data and system statistics
          will appear here.
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
          Job vacancy management interface.
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
        Job Applications
      </h2>

      <p className="mt-2 text-slate-500">
        Review and manage job applications.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">

        <p className="font-bold text-slate-700">
          Application Management
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Applications assigned to this module
          can be managed here.
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
          Employer records will appear here.
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
          Job seeker records will appear here.
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

    const { data, error } =
      await supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(20);

    if (!error) {
      setLogs(data || []);
    }
  };

  return (
    <div className="space-y-6">

      <div>

        <h2 className="text-2xl font-black text-[#123B70]">
          Notifications
        </h2>

        <p className="mt-1 text-slate-500">
          Recent administrative activity.
        </p>

      </div>

      {logs.length === 0 ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">

          <p className="font-semibold text-slate-500">
            No recent activity.
          </p>

        </div>

      ) : (

        <div className="space-y-3">

          {logs.map((log) => (

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

          ))}

        </div>

      )}

    </div>
  );
}


/* =========================================================
   MY PROFILE
========================================================= */

function MyProfile({
  staff,
}: {
  staff: StaffAccount;
}) {

  return (
    <div className="space-y-6">

      <div>

        <h2 className="text-2xl font-black text-[#123B70]">
          My Profile
        </h2>

        <p className="mt-1 text-slate-500">
          Your PESO-Hub staff account information.
        </p>

      </div>

      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#0446A7] text-3xl font-black text-white">

          {staff.full_name
            .charAt(0)
            .toUpperCase()}

        </div>

        <div className="space-y-4">

          <ProfileField
            label="Full Name"
            value={staff.full_name}
          />

          <ProfileField
            label="Email"
            value={staff.email}
          />

          <ProfileField
            label="Contact Number"
            value={
              staff.contact_no ||
              "Not provided"
            }
          />

          <ProfileField
            label="Role"
            value="PESO Staff"
          />

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

      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>

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