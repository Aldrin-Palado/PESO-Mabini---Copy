import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

import AdminSidebar, {
  AdminModule,
} from "../components/AdminSidebar";

import AdminAccounts from "../pages/AdminAccounts";

import DashboardModule from "../adminmodules/DashboardModule";
import JobPostsModule from "../adminmodules/JobPostsModule";
import EmployersModule from "../adminmodules/EmployersModule";
import JobSeekersModule from "../adminmodules/JobSeekersModule";
import ApplicationsModule from "../adminmodules/ApplicationsModule";
import AnnouncementModule from "../adminmodules/AnnouncementModule";
import AnalyticsModule from "../adminmodules/AnalyticsModule";

/* ============================================================
   TYPES
============================================================ */

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

/*
 * These interfaces intentionally use common fields.
 * The Supabase queries below use select("*") so the
 * dashboard can display your existing records.
 */

type JobPost = {
  id?: string;
  job_vacancy_id?: string;
  title?: string;
  job_title?: string;
  position?: string;
  company_name?: string;
  employer_name?: string;
  location?: string;
  employment_type?: string;
  status?: string;
  description?: string;
  created_at?: string;
  [key: string]: any;
};

type Employer = {
  id?: string;
  employer_id?: string;
  company_name?: string;
  business_name?: string;
  full_name?: string;
  email?: string;
  contact_no?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  [key: string]: any;
};

type JobSeeker = {
  id?: string;
  job_seeker_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_no?: string;
  phone?: string;
  address?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  [key: string]: any;
};

type Application = {
  id?: string;
  application_id?: string;
  job_seeker_id?: string;
  employer_id?: string;
  job_vacancy_id?: string;
  status?: string;
  application_status?: string;
  created_at?: string;
  [key: string]: any;
};

/* ============================================================
   MAIN DASHBOARD
============================================================ */

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

  /* ============================================================
     DATA FOR MODULES
  ============================================================ */

  const [jobPosts, setJobPosts] =
    useState<JobPost[]>([]);

  const [employers, setEmployers] =
    useState<Employer[]>([]);

  const [jobSeekers, setJobSeekers] =
    useState<JobSeeker[]>([]);

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [moduleLoading, setModuleLoading] =
    useState(false);

  /* ============================================================
     SEARCH
  ============================================================ */

  const [jobSearch, setJobSearch] = useState("");
  const [employerSearch, setEmployerSearch] = useState("");
  const [jobSeekerSearch, setJobSeekerSearch] = useState("");
  const [applicationSearch, setApplicationSearch] =
    useState("");

  /* ============================================================
     FILTERS
  ============================================================ */

  const [jobStatusFilter, setJobStatusFilter] =
    useState("All");

  const [employerStatusFilter, setEmployerStatusFilter] =
    useState("All");

  const [applicationStatusFilter, setApplicationStatusFilter] =
    useState("All");

  /* ============================================================
     ANNOUNCEMENT
  ============================================================ */

  const [announcementTitle, setAnnouncementTitle] =
    useState("");

  const [announcementMessage, setAnnouncementMessage] =
    useState("");

  const [announcementList, setAnnouncementList] =
    useState<
      {
        id: number;
        title: string;
        message: string;
        created_at: string;
      }[]
    >([]);

  /* ============================================================
     LOAD ACCOUNT
  ============================================================ */

  useEffect(() => {
    loadCurrentAccount();
  }, []);

  /* ============================================================
     LOAD COUNTS
  ============================================================ */

  useEffect(() => {
    if (account) {
      loadDashboardCounts();
    }
  }, [account]);

  /* ============================================================
     LOAD MODULE DATA
  ============================================================ */

  useEffect(() => {
    if (!account) return;

    if (activePage === "Job Post") {
      loadJobPosts();
    }

    if (activePage === "Employers") {
      loadEmployers();
    }

    if (activePage === "Job Seekers") {
      loadJobSeekers();
    }

    if (activePage === "Applications") {
      loadApplications();
    }

    if (activePage === "Admin Audit Logs") {
      loadAuditLogs();
    }
  }, [activePage, account]);

  /* ============================================================
     LOAD CURRENT ACCOUNT
  ============================================================ */

  const loadCurrentAccount = async () => {
    setLoading(true);

    try {
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

      /* --------------------------------------------------------
         CHECK ADMIN
      -------------------------------------------------------- */

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

      if (adminError) {
        console.error(
          "Admin query error:",
          adminError
        );

        alert(
          "Unable to verify your Admin account."
        );

        return;
      }

      /* --------------------------------------------------------
         ADMIN FOUND
      -------------------------------------------------------- */

      if (admin) {
        if (!admin.is_active) {
          alert(
            "Your Admin account is inactive."
          );

          await supabase.auth.signOut();
          window.location.href = "/login";

          return;
        }

        setAccount({
          id: admin.admin_id,
          user_id: admin.user_id,
          full_name: admin.full_name,
          email: admin.email,
          contact_no: admin.contact_no,
          is_active: admin.is_active,
          role: "superadmin",
        });

        /*
         * Admin has access to all modules.
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

        setLoading(false);
        return;
      }

      /* --------------------------------------------------------
         CHECK STAFF
      -------------------------------------------------------- */

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

      if (staffError) {
        console.error(
          "Staff query error:",
          staffError
        );

        alert(
          "Unable to verify your Staff account."
        );

        return;
      }

      if (staff) {
        if (!staff.is_active) {
          alert(
            "Your Staff account is inactive."
          );

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

        /* ------------------------------------------------------
           STAFF PERMISSIONS
        ------------------------------------------------------ */

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

      /* --------------------------------------------------------
         NO ACCOUNT
      -------------------------------------------------------- */

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

  /* ============================================================
     CONVERT STAFF PERMISSIONS
  ============================================================ */

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

  /* ============================================================
     ACCESS CHECK
  ============================================================ */

  const canAccess = (
    page: AdminModule | "My Profile"
  ) => {
    if (page === "My Profile") {
      return true;
    }

    if (account?.role === "superadmin") {
      return true;
    }

    if (
      page === "Admin Accounts" ||
      page === "Admin Audit Logs"
    ) {
      return false;
    }

    return permissions.includes(page);
  };

  /* ============================================================
     DASHBOARD COUNTS
  ============================================================ */

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

  /* ============================================================
     JOB POSTS
  ============================================================ */

  const loadJobPosts = async () => {
    setModuleLoading(true);

    try {
      const { data, error } = await supabase
        .from("job_vacancy")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Job posts error:",
          error
        );

        return;
      }

      setJobPosts(data ?? []);
    } finally {
      setModuleLoading(false);
    }
  };

  /* ============================================================
     EMPLOYERS
  ============================================================ */

  const loadEmployers = async () => {
    setModuleLoading(true);

    try {
      const { data, error } = await supabase
        .from("employer")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Employers error:",
          error
        );

        return;
      }

      setEmployers(data ?? []);
    } finally {
      setModuleLoading(false);
    }
  };

  /* ============================================================
     JOB SEEKERS
  ============================================================ */

  const loadJobSeekers = async () => {
    setModuleLoading(true);

    try {
      const { data, error } = await supabase
        .from("job_seeker")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Job seekers error:",
          error
        );

        return;
      }

      setJobSeekers(data ?? []);
    } finally {
      setModuleLoading(false);
    }
  };

  /* ============================================================
     APPLICATIONS
  ============================================================ */

  const loadApplications = async () => {
    setModuleLoading(true);

    try {
      const { data, error } = await supabase
        .from("application")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Applications error:",
          error
        );

        return;
      }

      setApplications(data ?? []);
    } finally {
      setModuleLoading(false);
    }
  };

  /* ============================================================
     AUDIT LOGS
  ============================================================ */

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

  /* ============================================================
     FILTERED JOB POSTS
  ============================================================ */

  const filteredJobs = useMemo(() => {
    return jobPosts.filter((job) => {
      const title =
        job.title ||
        job.job_title ||
        job.position ||
        "";

      const employer =
        job.company_name ||
        job.employer_name ||
        "";

      const searchMatch =
        `${title} ${employer} ${job.location || ""}`
          .toLowerCase()
          .includes(jobSearch.toLowerCase());

      const status =
        job.status || "Unknown";

      const statusMatch =
        jobStatusFilter === "All" ||
        status.toLowerCase() ===
          jobStatusFilter.toLowerCase();

      return searchMatch && statusMatch;
    });
  }, [
    jobPosts,
    jobSearch,
    jobStatusFilter,
  ]);

  /* ============================================================
     FILTERED EMPLOYERS
  ============================================================ */

  const filteredEmployers = useMemo(() => {
    return employers.filter((employer) => {
      const name =
        employer.company_name ||
        employer.business_name ||
        employer.full_name ||
        "";

      return `${name} ${
        employer.email || ""
      } ${employer.address || ""}`
        .toLowerCase()
        .includes(
          employerSearch.toLowerCase()
        );
    });
  }, [employers, employerSearch]);

  /* ============================================================
     FILTERED JOB SEEKERS
  ============================================================ */

  const filteredJobSeekers = useMemo(() => {
    return jobSeekers.filter((seeker) => {
      const name =
        seeker.full_name ||
        `${seeker.first_name || ""} ${
          seeker.last_name || ""
        }`;

      return `${name} ${
        seeker.email || ""
      } ${seeker.contact_no || seeker.phone || ""}`
        .toLowerCase()
        .includes(
          jobSeekerSearch.toLowerCase()
        );
    });
  }, [
    jobSeekers,
    jobSeekerSearch,
  ]);

  /* ============================================================
     FILTERED APPLICATIONS
  ============================================================ */

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const status =
        application.status ||
        application.application_status ||
        "Unknown";

      const statusMatch =
        applicationStatusFilter === "All" ||
        status.toLowerCase() ===
          applicationStatusFilter.toLowerCase();

      const searchableText =
        JSON.stringify(application);

      const searchMatch =
        searchableText
          .toLowerCase()
          .includes(
            applicationSearch.toLowerCase()
          );

      return statusMatch && searchMatch;
    });
  }, [
    applications,
    applicationSearch,
    applicationStatusFilter,
  ]);

  /* ============================================================
     ANNOUNCEMENT FUNCTION
  ============================================================ */

  const createAnnouncement = () => {
    if (
      !announcementTitle.trim() ||
      !announcementMessage.trim()
    ) {
      alert(
        "Please enter an announcement title and message."
      );

      return;
    }

    const newAnnouncement = {
      id: Date.now(),
      title: announcementTitle.trim(),
      message: announcementMessage.trim(),
      created_at:
        new Date().toISOString(),
    };

    setAnnouncementList((previous) => [
      newAnnouncement,
      ...previous,
    ]);

    setAnnouncementTitle("");
    setAnnouncementMessage("");

    alert("Announcement created.");
  };

  const deleteAnnouncement = (
    id: number
  ) => {
    setAnnouncementList((previous) =>
      previous.filter(
        (announcement) =>
          announcement.id !== id
      )
    );
  };

  /* ============================================================
     PAGE RENDERING
  ============================================================ */

  const renderPage = () => {
    if (!canAccess(activePage)) {
      return <AccessDenied />;
    }

    switch (activePage) {
      /* ========================================================
         DASHBOARD
      ======================================================== */

      case "Dashboard":
        return (
          <DashboardModule
            counts={counts}
            account={account}
            onRefresh={loadDashboardCounts}
            StatCard={StatCard}
          />
        );

      /* ========================================================
         JOB POST
      ======================================================== */

      case "Job Post":
        return (
          <JobPostsModule
            jobs={filteredJobs}
            search={jobSearch}
            setSearch={setJobSearch}
            statusFilter={jobStatusFilter}
            setStatusFilter={setJobStatusFilter}
            loading={moduleLoading}
            onRefresh={loadJobPosts}
            ModuleHeader={ModuleHeader}
            TableHeader={TableHeader}
            TableCell={TableCell}
            StatusBadge={StatusBadge}
            LoadingMessage={LoadingMessage}
            EmptyMessage={EmptyMessage}
            formatDate={formatDate}
          />
        );

      /* ========================================================
         EMPLOYERS
      ======================================================== */

      case "Employers":
        return (
          <EmployersModule
            employers={filteredEmployers}
            search={employerSearch}
            setSearch={setEmployerSearch}
            loading={moduleLoading}
            onRefresh={loadEmployers}
            ModuleHeader={ModuleHeader}
            TableHeader={TableHeader}
            TableCell={TableCell}
            StatusBadge={StatusBadge}
            LoadingMessage={LoadingMessage}
            EmptyMessage={EmptyMessage}
          />
        );

      /* ========================================================
         JOB SEEKERS
      ======================================================== */

      case "Job Seekers":
        return (
          <JobSeekersModule
            jobSeekers={filteredJobSeekers}
            search={jobSeekerSearch}
            setSearch={setJobSeekerSearch}
            loading={moduleLoading}
            onRefresh={loadJobSeekers}
            ModuleHeader={ModuleHeader}
            TableHeader={TableHeader}
            TableCell={TableCell}
            StatusBadge={StatusBadge}
            LoadingMessage={LoadingMessage}
            EmptyMessage={EmptyMessage}
          />
        );

      /* ========================================================
         APPLICATIONS
      ======================================================== */

      case "Applications":
        return (
          <ApplicationsModule
            applications={filteredApplications}
            search={applicationSearch}
            setSearch={setApplicationSearch}
            statusFilter={applicationStatusFilter}
            setStatusFilter={setApplicationStatusFilter}
            loading={moduleLoading}
            onRefresh={loadApplications}
            ModuleHeader={ModuleHeader}
            TableHeader={TableHeader}
            TableCell={TableCell}
            StatusBadge={StatusBadge}
            LoadingMessage={LoadingMessage}
            EmptyMessage={EmptyMessage}
            formatDate={formatDate}
          />
        );

      /* ========================================================
         ANNOUNCEMENT
      ======================================================== */

      case "Announcement":
        return (
          <AnnouncementModule
            title={announcementTitle}
            setTitle={setAnnouncementTitle}
            message={announcementMessage}
            setMessage={setAnnouncementMessage}
            announcements={announcementList}
            onCreate={createAnnouncement}
            onDelete={deleteAnnouncement}
            ModuleHeader={ModuleHeader}
            EmptyMessage={EmptyMessage}
            formatDate={formatDate}
          />
        );

      /* ========================================================
         ANALYTICS
      ======================================================== */

      case "Analytics & Reports":
        return (
          <AnalyticsModule
            counts={counts}
            applications={applications}
            jobPosts={jobPosts}
            employers={employers}
            jobSeekers={jobSeekers}
            ModuleHeader={ModuleHeader}
            StatCard={StatCard}
            AnalyticsCard={AnalyticsCard}
            SummaryRow={SummaryRow}
          />
        );

      /* ========================================================
         ADMIN ACCOUNTS
      ======================================================== */

      case "Admin Accounts":
        if (
          account?.role !==
          "superadmin"
        ) {
          return <AccessDenied />;
        }

        return <AdminAccounts />;

      /* ========================================================
         AUDIT LOGS
      ======================================================== */

      case "Admin Audit Logs":
        if (
          account?.role !==
          "superadmin"
        ) {
          return <AccessDenied />;
        }

        return (
          <AuditLogs
            logs={auditLogs}
          />
        );

      /* ========================================================
         PROFILE
      ======================================================== */

      case "My Profile":
        return (
          <MyProfile
            account={account}
          />
        );

      default:
        return <AccessDenied />;
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

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

  /* ============================================================
     MAIN LAYOUT
  ============================================================ */

  return (
    <div className="min-h-screen bg-slate-100">

      <AdminSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        permissions={permissions}
        isSuperadmin={
          account?.role ===
          "superadmin"
        }
      />

      <main className="ml-64 min-h-screen">

        {/* HEADER */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-8 py-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-800">
                {activePage}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {account?.role ===
                "superadmin"
                  ? "Admin"
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

        {/* CONTENT */}
        <section className="p-8">
          {renderPage()}
        </section>

      </main>

    </div>
  );
}

/* ================================================================
   AUDIT LOGS
================================================================ */

function AuditLogs({
  logs,
}: {
  logs: AuditLog[];
}) {
  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Admin Audit Logs"
        description="Records of administrative activities."
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-50">

              <tr>

                <TableHeader>
                  Action
                </TableHeader>

                <TableHeader>
                  Details
                </TableHeader>

                <TableHeader>
                  Date
                </TableHeader>

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
                  <tr
                    key={log.log_id}
                  >

                    <TableCell bold>
                      {log.action}
                    </TableCell>

                    <TableCell>
                      {log.details
                        ? JSON.stringify(
                            log.details
                          )
                        : "-"}
                    </TableCell>

                    <TableCell>
                      {formatDate(
                        log.created_at
                      )}
                    </TableCell>

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

/* ================================================================
   MY PROFILE
================================================================ */

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
            value={
              account?.full_name
            }
          />

          <ProfileField
            label="Email"
            value={
              account?.email
            }
          />

          <ProfileField
            label="Contact Number"
            value={
              account?.contact_no
            }
          />

          <ProfileField
            label="Role"
            value={
              account?.role ===
              "superadmin"
                ? "Admin"
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

/* ================================================================
   REUSABLE COMPONENTS
================================================================ */

function ModuleHeader({
  title,
  description,
  onRefresh,
}: {
  title: string;
  description: string;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">

      <div>

        <h3 className="text-xl font-bold text-slate-800">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Refresh
        </button>
      )}

    </div>
  );
}

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

function AnalyticsCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-blue-900">
        {value}
      </p>

    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">

      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span className="font-bold text-slate-800">
        {value}
      </span>

    </div>
  );
}

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

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
  bold = false,
}: {
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <td
      className={`px-6 py-4 text-sm ${
        bold
          ? "font-semibold text-slate-700"
          : "text-slate-600"
      }`}
    >
      {children}
    </td>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toLowerCase();

  let classes =
    "bg-slate-100 text-slate-600";

  if (
    normalized === "active" ||
    normalized === "approved" ||
    normalized === "hired"
  ) {
    classes =
      "bg-green-100 text-green-700";
  }

  if (
    normalized === "pending"
  ) {
    classes =
      "bg-yellow-100 text-yellow-700";
  }

  if (
    normalized === "inactive" ||
    normalized === "rejected" ||
    normalized === "closed"
  ) {
    classes =
      "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}

function LoadingMessage() {
  return (
    <div className="p-10 text-center text-sm text-slate-500">
      Loading data...
    </div>
  );
}

function EmptyMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="p-10 text-center">

      <p className="text-sm text-slate-500">
        {message}
      </p>

    </div>
  );
}

function formatDate(
  value?: string
) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

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