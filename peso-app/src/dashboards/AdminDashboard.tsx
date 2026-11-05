import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "../services/supabase";

import AdminSidebar, {
  AdminModule,
} from "../components/AdminSidebar";
import ProfileAvatar from "../components/ProfileAvatar";

import AdminAccounts from "../adminmodules/AdminAccounts";

import DashboardModule from "../adminmodules/DashboardModule";
import JobPostsModule from "../adminmodules/JobPostsModule";
import EmployersModule, {
  type EmployerFormValues,
  type EmployerVerificationStatus,
} from "../adminmodules/EmployersModule";
import JobSeekersModule, {
  type JobSeekerFormValues,
} from "../adminmodules/JobSeekersModule";
import ApplicationsModule from "../adminmodules/ApplicationsModule";
import AnnouncementModule from "../adminmodules/AnnouncementModule";
import PESOPosts from "../adminmodules/PESOPosts";
import AnalyticsModule from "../adminmodules/AnalyticsModule";
import MessagesModule from "../adminmodules/MessagesModule";
import {
  decideApplication as submitApplicationDecision,
  type ApplicationDecisionResult,
} from "../services/applicationDecisions";

/* ============================================================
   TYPES
============================================================ */

type Account = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_no?: string | null;
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
  admin_id?: string | null;
  peso_staff_id?: string | null;
  actor_name?: string;
  actor_role?: string;
  action: string;
  details: any;
  created_at: string;
};

function getAuditLogErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const databaseError = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const message =
      typeof databaseError.message === "string"
        ? databaseError.message
        : "An unknown error occurred.";
    const code =
      typeof databaseError.code === "string" ? ` (${databaseError.code})` : "";
    const details =
      typeof databaseError.details === "string" && databaseError.details
        ? ` ${databaseError.details}`
        : "";
    const hint =
      typeof databaseError.hint === "string" && databaseError.hint
        ? ` ${databaseError.hint}`
        : "";
    return `${message}${code}${details}${hint}`;
  }
  return "An unknown error occurred.";
}

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
  position_title?: string;
  employer_id?: string;
  company_name?: string;
  employer_name?: string;
  location?: string;
  employment_type?: string;
  status?: string;
  description?: string;
  created_at?: string;
  date_posted?: string;
  [key: string]: any;
};

type Employer = {
  id?: string;
  employer_id?: string;
  company_name?: string;
  business_name?: string;
  full_name?: string;
  name?: string;
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
  date_applied?: string;
  position_title?: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  resume_url?: string | null;
  [key: string]: any;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
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
  const [auditLogError, setAuditLogError] = useState("");

  const isSuperadmin =
    account?.role === "superadmin";

  const saveAccountProfile = async (
    values: Pick<Account, "full_name" | "contact_no">,
  ) => {
    if (!account) throw new Error("Your account profile is not loaded.");
    if (account.role === "superadmin") {
      const { data, error } = await supabase
        .from("peso_admin")
        .update({ full_name: values.full_name.trim() })
        .eq("admin_id", account.id)
        .select("full_name")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Your profile was not updated. Please sign in again and try once more.");
      setAccount({ ...account, full_name: data.full_name });
      return;
    }

    const { data, error } = await supabase
      .from("peso_staff")
      .update({
        full_name: values.full_name.trim(),
        contact_no: values.contact_no?.trim() || null,
      })
      .eq("peso_staff_id", account.id)
      .select("full_name, contact_no")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Your profile was not updated. Please sign in again and try once more.");
    setAccount({ ...account, ...data });
  };

  /* ============================================================
     DATA FOR MODULES
  ============================================================ */

  const [jobPosts, setJobPosts] =
    useState<JobPost[]>([]);

  const [employers, setEmployers] =
    useState<Employer[]>([]);

  const [jobSeekers, setJobSeekers] =
    useState<JobSeeker[]>([]);

  const [jobSeekerApplicationCounts, setJobSeekerApplicationCounts] =
    useState<Record<string, number>>({});

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [moduleLoading, setModuleLoading] =
    useState(false);

  const [moduleError, setModuleError] = useState("");

  const [analyticsLoading, setAnalyticsLoading] =
  useState(false);

  const [analyticsError, setAnalyticsError] =
  useState("");

  const [applicationsError, setApplicationsError] =
    useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

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

    if (activePage === "Analytics & Reports") {
  loadAnalyticsData();
}

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
    if (activePage === "Announcement") {
      loadAnnouncements();
    }
    if (activePage === "Dashboard" && account.role === "superadmin") {
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
        .select("admin_id, user_id, full_name, email, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        console.error(
          "Admin query error:",
          adminError
        );

        alert(
          `Unable to verify your Admin account: ${adminError.message}`
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
          "Messages",
          "Announcement",
          "PESO Posts",
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
      result.push("PESO Posts");
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

    if (page === "Messages") {
      return account?.role === "staff";
    }

    if (
      page === "Admin Accounts" ||
      page === "Admin Audit Logs"
    ) {
      return false;
    }

    return permissions.includes(page);
  };

  const loadAnnouncements = async () => {
    const { data, error } = await supabase
      .from("peso_announcements")
      .select("id, title, message, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading PESO announcements:", error);
      alert(`Unable to load announcements: ${error.message}`);
      return;
    }

    setAnnouncements((data ?? []) as Announcement[]);
  };

  const createAnnouncement = async () => {
    const title = announcementTitle.trim();
    const message = announcementMessage.trim();
    if (!title || !message) {
      alert("Please enter an announcement title and message.");
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      alert(`Unable to verify your account: ${authError.message}`);
      return;
    }
    if (!authData.user) {
      alert("Please sign in again before publishing an announcement.");
      return;
    }

    const { data, error } = await supabase
      .from("peso_announcements")
      .insert({
        title,
        message,
        created_by: authData.user.id,
      })
      .select("id, title, message, created_at")
      .single();

    if (error) {
      console.error("Error creating PESO announcement:", error);
      alert(`Unable to publish announcement: ${error.message}`);
      return;
    }

    setAnnouncements((current) => [data as Announcement, ...current]);
    setAnnouncementTitle("");
    setAnnouncementMessage("");
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from("peso_announcements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting PESO announcement:", error);
      alert(`Unable to delete announcement: ${error.message}`);
      return;
    }

    setAnnouncements((current) =>
      current.filter((announcement) => announcement.id !== id),
    );
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

  const loadAnalyticsData = async () => {
  setAnalyticsLoading(true);
  setAnalyticsError("");

  try {
    const [
      applicationsResult,
      jobsResult,
      employersResult,
      seekersResult,
    ] = await Promise.all([
      supabase
        .from("application")
        .select(
          "application_id, employer_id, job_seeker_id, position_title, status, date_applied"
        ),

      supabase
        .from("job_vacancy")
        .select(
          "job_vacancy_id, employer_id, position_title, status, date_posted, created_at"
        ),

      supabase
        .from("employer")
        .select("employer_id, name, created_at"),

      supabase
        .from("job_seeker")
        .select("job_seeker_id, full_name, created_at"),
    ]);

    const errors = [
      applicationsResult.error?.message,
      jobsResult.error?.message,
      employersResult.error?.message,
      seekersResult.error?.message,
    ].filter(Boolean);

    if (errors.length > 0) {
      throw new Error(errors.join(" | "));
    }

    const applicationData = applicationsResult.data ?? [];
    const jobData = jobsResult.data ?? [];
    const employerData = employersResult.data ?? [];
    const seekerData = seekersResult.data ?? [];

    setApplications(applicationData as Application[]);
    setJobPosts(jobData as JobPost[]);
    setEmployers(employerData as Employer[]);
    setJobSeekers(seekerData as JobSeeker[]);

    setCounts({
      jobs: jobData.length,
      applications: applicationData.length,
      employers: employerData.length,
      jobSeekers: seekerData.length,
    });

  } catch (error) {
    console.error("Analytics loading error:", error);

    setAnalyticsError(
      error instanceof Error
        ? error.message
        : "Unable to load analytics data."
    );

  } finally {
    setAnalyticsLoading(false);
  }
};

  /* ============================================================
     JOB POSTS
  ============================================================ */

  const loadJobPosts = async () => {
    setModuleLoading(true);
    setModuleError("");

    try {
      const [jobsResult, employersResult] = await Promise.all([
        supabase
        .from("job_vacancy")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),
        supabase
          .from("employer")
          .select("employer_id, name"),
      ]);

      if (jobsResult.error) {
        console.error(
          "Job posts error:",
          jobsResult.error
        );
        setJobPosts([]);
        setModuleError(`Job posts could not be loaded: ${jobsResult.error.message}`);
        return;
      }

      if (employersResult.error) {
        console.error("Job post employer names error:", employersResult.error);
        setModuleError(
          `Job posts loaded, but employer names could not be loaded: ${employersResult.error.message}`,
        );
      }

      const employersById = new Map(
        (employersResult.data ?? []).map((employer) => [
          employer.employer_id,
          employer.name,
        ]),
      );
      setJobPosts(
        (jobsResult.data ?? []).map((job) => ({
          ...job,
          company_name: employersById.get(job.employer_id) || "",
        })),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  /* ============================================================
     EMPLOYERS
  ============================================================ */

  const loadEmployers = async () => {
    setModuleLoading(true);
    setModuleError("");

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
        setEmployers([]);
        setModuleError(`Employers could not be loaded: ${error.message}`);
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
    setModuleError("");

    try {
      const [seekersResult, applicationsResult] = await Promise.all([
        supabase
          .from("job_seeker")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("application").select("job_seeker_id"),
      ]);

      if (seekersResult.error) {
        console.error(
          "Job seekers error:",
          seekersResult.error
        );
        setJobSeekers([]);
        setModuleError(`Job seekers could not be loaded: ${seekersResult.error.message}`);
        return;
      }

      setJobSeekers(seekersResult.data ?? []);
      if (applicationsResult.error) {
        console.error("Job seeker application counts error:", applicationsResult.error);
        setJobSeekerApplicationCounts({});
        setModuleError(
          `Job seekers loaded, but application counts could not be loaded: ${applicationsResult.error.message}`,
        );
        return;
      }

      const counts: Record<string, number> = {};
      for (const application of applicationsResult.data ?? []) {
        counts[application.job_seeker_id] =
          (counts[application.job_seeker_id] ?? 0) + 1;
      }
      setJobSeekerApplicationCounts(counts);
    } finally {
      setModuleLoading(false);
    }
  };

  const updateEmployer = async (
    employerId: string,
    values: EmployerFormValues,
  ) => {
    const { data, error } = await supabase
      .from("employer")
      .update({
        name: values.name.trim(),
        email: values.email.trim() || null,
        contact_person: values.contact_person.trim() || null,
        contact_no: values.contact_no.trim() || null,
        address: values.address.trim() || null,
      })
      .eq("employer_id", employerId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Employer update error:", error);
      throw new Error(`Employer could not be updated: ${error.message}`);
    }
    if (!data) {
      throw new Error("Employer was not updated because the record no longer exists.");
    }

    setEmployers((current) =>
      current.map((employer) =>
        employer.employer_id === employerId ? data : employer,
      ),
    );
  };

  const updateEmployerStatus = async (
    employerId: string,
    status: EmployerVerificationStatus,
  ) => {
    const { data, error } = await supabase
      .from("employer")
      .update({
        verification_status: status,
        is_verified: status === "verified",
      })
      .eq("employer_id", employerId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Employer verification status update error:", error);
      throw new Error(
        `Employer verification status could not be updated: ${error.message}`,
      );
    }
    if (!data) {
      throw new Error(
        "Employer status was not updated because the record no longer exists.",
      );
    }

    setEmployers((current) =>
      current.map((employer) =>
        employer.employer_id === employerId ? data : employer,
      ),
    );
  };

  const updateEmployerActiveStatus = async (
    employerId: string,
    isActive: boolean,
  ) => {
    const { data, error } = await supabase
      .from("employer")
      .update({ is_active: isActive })
      .eq("employer_id", employerId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Employer account status update error:", error);
      throw new Error(`Employer account status could not be updated: ${error.message}`);
    }
    if (!data) {
      throw new Error(
        "Employer account status was not updated because the record no longer exists.",
      );
    }

    setEmployers((current) =>
      current.map((employer) =>
        employer.employer_id === employerId ? data : employer,
      ),
    );
  };

  const updateJobSeeker = async (
    jobSeekerId: string,
    values: JobSeekerFormValues,
  ) => {
    const { data, error } = await supabase
      .from("job_seeker")
      .update({
        full_name: values.full_name.trim(),
        email: values.email.trim() || null,
        contact_no: values.contact_no.trim() || null,
        address: values.address.trim() || null,
        birth_date: values.birth_date || null,
      })
      .eq("job_seeker_id", jobSeekerId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Job seeker update error:", error);
      throw new Error(`Job seeker could not be updated: ${error.message}`);
    }
    if (!data) {
      throw new Error("Job seeker was not updated because the record no longer exists.");
    }

    setJobSeekers((current) =>
      current.map((jobSeeker) =>
        jobSeeker.job_seeker_id === jobSeekerId ? data : jobSeeker,
      ),
    );
  };

  const deleteJobSeeker = async (jobSeekerId: string) => {
    const { data, error } = await supabase
      .from("job_seeker")
      .delete()
      .eq("job_seeker_id", jobSeekerId)
      .select("job_seeker_id")
      .maybeSingle();

    if (error) {
      console.error("Job seeker deletion error:", error);
      throw new Error(`Job seeker could not be deleted: ${error.message}`);
    }
    if (!data) {
      throw new Error("Job seeker was not deleted because the record no longer exists.");
    }

    setJobSeekers((current) =>
      current.filter((jobSeeker) => jobSeeker.job_seeker_id !== jobSeekerId),
    );
    setApplications((current) =>
      current.filter((application) => application.job_seeker_id !== jobSeekerId),
    );
    setJobSeekerApplicationCounts((current) => {
      const nextCounts = { ...current };
      delete nextCounts[jobSeekerId];
      return nextCounts;
    });
    setCounts((current) => ({
      ...current,
      jobSeekers: Math.max(0, current.jobSeekers - 1),
    }));
  };

  /* ============================================================
     APPLICATIONS
  ============================================================ */

  const loadApplications = async () => {
    setModuleLoading(true);
    setApplicationsError("");

    try {
      const [
        applicationsResult,
        seekersResult,
        employersResult,
        jobsResult,
      ] =
        await Promise.all([
          supabase.from("application").select("*"),
          supabase
            .from("job_seeker")
            .select(
              "job_seeker_id, full_name, email, contact_no, address, resume_url, created_at, registration_details, birth_date, is_active",
            )
            .order("created_at", {
              ascending: false,
            }),
          supabase.from("employer").select("employer_id, name"),
          supabase
            .from("job_vacancy")
            .select("job_vacancy_id, position_title, employer_id, requirements, location"),
        ]);

      const seekers = seekersResult.data ?? [];
      const employersById = new Map(
        (employersResult.data ?? []).map((employer) => [
          employer.employer_id,
          employer.name,
        ]),
      );
      const jobs = jobsResult.data ?? [];
      const supportingErrors: string[] = [];

      if (seekersResult.error) {
        console.error(
          "Application applicant details error:",
          seekersResult.error,
        );
        supportingErrors.push(
          `Applicant details could not be loaded: ${seekersResult.error.message}`,
        );
      } else {
        setJobSeekers(seekers);
      }
      if (employersResult.error) {
        console.error("Application employers error:", employersResult.error);
        supportingErrors.push(
          `Employer names could not be loaded: ${employersResult.error.message}`,
        );
      }
      if (jobsResult.error) {
        console.error("Application job details error:", jobsResult.error);
        supportingErrors.push(
          `Job requirements could not be loaded: ${jobsResult.error.message}`,
        );
      }

      if (applicationsResult.error) {
        console.error(
          "Applications error:",
          applicationsResult.error,
        );

        setApplications([]);
        setApplicationsError(
          [
            `Unable to load applications: ${applicationsResult.error.message}`,
            ...supportingErrors,
          ].join(" "),
        );

        return;
      }

      const rows = [...(applicationsResult.data ?? [])].sort(
        (first, second) => {
          const firstDate = new Date(
            first.date_applied ||
              first.created_at ||
              first.updated_at ||
              0,
          ).getTime();
          const secondDate = new Date(
            second.date_applied ||
              second.created_at ||
              second.updated_at ||
              0,
          ).getTime();

          return secondDate - firstDate;
        },
      );
      const seekersById = new Map(
        seekers.map((seeker) => [
          seeker.job_seeker_id,
          seeker,
        ]),
      );
      const findJob = (application: Application) =>
        jobs.find((job) =>
          application.job_vacancy_id
            ? job.job_vacancy_id === application.job_vacancy_id
            : job.employer_id === application.employer_id &&
              job.position_title === application.position_title,
        );

      setApplications(
        rows.map((application) => {
          const seeker = seekersById.get(
            application.job_seeker_id,
          );
          const job = findJob(application);

          return {
            ...application,
            applicant_name:
              application.applicant_name ?? seeker?.full_name ?? null,
            applicant_email:
              application.applicant_email ?? seeker?.email ?? null,
            resume_url:
              application.applicant_resume_url ?? seeker?.resume_url ?? null,
            contact_number:
              application.applicant_contact_no ?? seeker?.contact_no ?? null,
            applicant_address:
              application.applicant_address ?? seeker?.address ?? null,
            employer_name:
              employersById.get(application.employer_id) ?? null,
            job_requirements:
              job?.requirements ?? null,
            job_location:
              job?.location ?? null,
          };
        }),
      );
      setApplicationsError(supportingErrors.join(" "));
    } finally {
      setModuleLoading(false);
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: string,
  ) => {
    const { data, error } = await supabase
      .from("application")
      .update({ status })
      .eq("application_id", applicationId)
      .select("application_id")
      .maybeSingle();

    if (error) {
      console.error("Application status update error:", error);
      throw new Error(`Application status could not be updated: ${error.message}`);
    }
    if (!data) {
      throw new Error("Application was not updated because the record no longer exists.");
    }

    setApplications((current) =>
      current.map((application) =>
        application.application_id === applicationId
          ? { ...application, status, application_status: status }
          : application,
      ),
    );
  };

  const decideApplication = async (
    applicationId: string,
    approved: boolean,
  ): Promise<ApplicationDecisionResult> => {
    const result = await submitApplicationDecision(applicationId, approved);
    setApplications((current) =>
      current.map((application) =>
        application.application_id === applicationId
          ? {
              ...application,
              status: result.status,
              application_status: result.status,
            }
          : application,
      ),
    );
    return result;
  };

  const deleteApplication = async (applicationId: string) => {
    const { data, error } = await supabase
      .from("application")
      .delete()
      .eq("application_id", applicationId)
      .select("application_id")
      .maybeSingle();

    if (error) {
      console.error("Application deletion error:", error);
      throw new Error(`Application could not be deleted: ${error.message}`);
    }
    if (!data) {
      throw new Error("Application was not deleted because the record no longer exists.");
    }

    setApplications((current) =>
      current.filter((application) => application.application_id !== applicationId),
    );
  };

  /* ============================================================
     AUDIT LOGS
  ============================================================ */

  const loadAuditLogs = async () => {
    setAuditLogError("");
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setAuditLogs([]);
        setAuditLogError(
          "Your sign-in session has expired. Sign in again to view audit logs.",
        );
        return;
      }

      const logsResult = await supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsResult.error) {
        console.error("Audit log query error:", logsResult.error);
        setAuditLogs([]);
        setAuditLogError(
          `Audit logs could not be loaded: ${getAuditLogErrorMessage(logsResult.error)}`,
        );
        return;
      }

      const [adminsResult, staffResult] = await Promise.all([
        supabase.from("peso_admin").select("admin_id, full_name"),
        supabase.from("peso_staff").select("peso_staff_id, full_name"),
      ]);

      if (adminsResult.error) {
        console.error("Audit log admin names error:", adminsResult.error);
      }
      if (staffResult.error) {
        console.error("Audit log staff names error:", staffResult.error);
      }

      const adminNames = new Map(
        (adminsResult.data ?? []).map((admin) => [
          admin.admin_id,
          admin.full_name,
        ]),
      );
      const staffNames = new Map(
        (staffResult.data ?? []).map((staff) => [
          staff.peso_staff_id,
          staff.full_name,
        ]),
      );

      setAuditLogs(
        (logsResult.data ?? []).map((log) => ({
          ...log,
          actor_name:
            (log.peso_staff_id
              ? staffNames.get(log.peso_staff_id)
              : undefined) ||
            (typeof log.details?.actor_name === "string"
              ? log.details.actor_name
              : undefined) ||
            (log.admin_id ? adminNames.get(log.admin_id) : undefined) ||
            "Admin",
          actor_role:
            (typeof log.details?.actor_role === "string"
              ? log.details.actor_role
              : undefined) ||
            (log.peso_staff_id ? "Staff" : "Admin"),
        })),
      );
      if (adminsResult.error || staffResult.error) {
        setAuditLogError(
            "Audit log records loaded, but some actor names could not be resolved.",
        );
      }
    } catch (error) {
      console.error("Audit log loading error:", error);
      setAuditLogs([]);
      setAuditLogError(
        `Audit logs could not be loaded: ${getAuditLogErrorMessage(error)}`,
      );
    }
  };

  /* ============================================================
     FILTERED EMPLOYERS
  ============================================================ */

  const filteredEmployers = useMemo(() => {
    return employers.filter((employer) => {
      const name =
        employer.name ||
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
            logs={auditLogs}
            onRefresh={() => {
              loadDashboardCounts();
              if (account?.role === "superadmin") {
                loadAuditLogs();
              }
            }}
            onNavigate={setActivePage}
          />
        );

      /* ========================================================
         JOB POST
      ======================================================== */

      case "Job Post":
        return (
          <JobPostsModule
            jobs={jobPosts}
            loadError={moduleError}
            search={jobSearch}
            setSearch={setJobSearch}
            statusFilter={jobStatusFilter}
            setStatusFilter={setJobStatusFilter}
            loading={moduleLoading}
            onRefresh={loadJobPosts}
            ModuleHeader={ModuleHeader}
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
            loadError={moduleError}
            search={employerSearch}
            setSearch={setEmployerSearch}
            loading={moduleLoading}
            onRefresh={loadEmployers}
            onUpdate={updateEmployer}
            onUpdateStatus={updateEmployerStatus}
            onToggleActive={updateEmployerActiveStatus}
            ModuleHeader={ModuleHeader}
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
            applicationCounts={jobSeekerApplicationCounts}
            loadError={moduleError}
            search={jobSeekerSearch}
            setSearch={setJobSeekerSearch}
            loading={moduleLoading}
            onRefresh={loadJobSeekers}
            onUpdate={updateJobSeeker}
            onDelete={deleteJobSeeker}
            ModuleHeader={ModuleHeader}
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
            applications={applications}
            loadError={applicationsError}
            search={applicationSearch}
            setSearch={setApplicationSearch}
            statusFilter={applicationStatusFilter}
            setStatusFilter={setApplicationStatusFilter}
            loading={moduleLoading}
            canDecideApplications={isSuperadmin}
            onRefresh={loadApplications}
            onUpdateStatus={updateApplicationStatus}
            onDecideApplication={decideApplication}
            onDelete={deleteApplication}
            ModuleHeader={ModuleHeader}
            LoadingMessage={LoadingMessage}
            EmptyMessage={EmptyMessage}
            formatDate={formatDate}
          />
        );

      case "Messages":
        return <MessagesModule canDecideApplications={isSuperadmin} />;

      case "Announcement":
        return (
          <AnnouncementModule
            title={announcementTitle}
            setTitle={setAnnouncementTitle}
            message={announcementMessage}
            setMessage={setAnnouncementMessage}
            announcements={announcements}
            onCreate={() => void createAnnouncement()}
            onDelete={(id) => void deleteAnnouncement(id)}
            ModuleHeader={ModuleHeader}
            EmptyMessage={EmptyMessage}
            formatDate={formatDate}
          />
        );

      /* ========================================================
         PESO POSTS
      ======================================================== */

      case "PESO Posts":
        return <PESOPosts />;

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
            loading={analyticsLoading}
            loadError={analyticsError}
            onRefresh={loadAnalyticsData}
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
            loadError={auditLogError}
            onRefresh={loadAuditLogs}
          />
        );

      /* ========================================================
         PROFILE
      ======================================================== */

      case "My Profile":
        return (
          <MyProfile
            account={account}
            onSave={saveAccountProfile}
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
            Loading PESO MABINI...
          </p>

        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN LAYOUT
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      <AdminSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        permissions={permissions}
        isSuperadmin={
          account?.role ===
          "superadmin"
        }
      />

      <main className="min-h-screen lg:ml-56">

        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 pl-20 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 sm:px-6 sm:pl-20 sm:pt-[calc(env(safe-area-inset-top)+1rem)] sm:pb-4 lg:px-8">

          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">

              <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                {activePage}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Admin <span className="px-1 text-slate-300">/</span> {activePage}
              </p>

            </div>

            <div className="flex min-w-0 items-center gap-3">
              {account?.user_id && (
                <ProfileAvatar
                  key={account.user_id}
                  userId={account.user_id}
                  fullName={account.full_name}
                  size="small"
                  showControls={false}
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {account?.full_name}
                </p>
                <p className="hidden truncate text-xs text-slate-500 sm:block">
                  {account?.role === "superadmin" ? "Super Administrator" : "PESO Staff"}
                </p>
              </div>

            </div>

          </div>

        </header>

        {/* CONTENT */}
        <section className="px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-6 sm:pt-7 sm:pb-10 lg:px-8">
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
  loadError,
  onRefresh,
}: {
  logs: AuditLog[];
  loadError: string;
  onRefresh: () => void;
}) {
  const defaultFilters = {
    dateFrom: "",
    dateTo: "",
    admin: "all",
    keyword: "",
    area: "all",
    action: "all",
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const getDetails = (details: unknown): Record<string, unknown> => {
    if (!details || typeof details !== "object" || Array.isArray(details)) {
      return {};
    }
    return details as Record<string, unknown>;
  };

  const formatDetailValue = (value: unknown, field: string) => {
    if (value === null || value === undefined) return "—";
    if (field === "is_active" && typeof value === "boolean") {
      return value ? "Active" : "Deactivated";
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
    return JSON.stringify(value);
  };

  const renderLogDetails = (log: AuditLog) => {
    const details = getDetails(log.details);
    const summary =
      typeof details.summary === "string" ? details.summary : "";
    const changes =
      details.changes &&
      typeof details.changes === "object" &&
      !Array.isArray(details.changes)
        ? (details.changes as Record<string, unknown>)
        : {};
    const changeEntries = Object.entries(changes);

    if (!summary) {
      return log.details
        ? typeof log.details === "string"
          ? log.details
          : JSON.stringify(log.details)
        : "-";
    }

    return (
      <div className="space-y-1">
        <p className="font-medium text-slate-700">{summary}</p>
        {changeEntries.length > 0 && (
          <ul className="list-inside list-disc text-slate-500">
            {changeEntries.map(([field, value]) => {
              const change =
                value && typeof value === "object" && !Array.isArray(value)
                  ? (value as Record<string, unknown>)
                  : {};
              return (
                <li key={field}>
                  {field.replace(/_/g, " ")}: {formatDetailValue(change.from, field)}
                  {" → "}
                  {formatDetailValue(change.to, field)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  const getArea = (log: AuditLog) => {
    const details = getDetails(log.details);
    const recordedArea =
      details.area || details.section || details.module;
    if (typeof recordedArea === "string" && recordedArea.trim()) {
      return recordedArea.replace(/^section:\s*/i, "").replace(/_/g, " ");
    }

    const action = log.action.toLowerCase();
    if (action.includes("permission") || action.includes("staff")) {
      return "Admin Accounts";
    }
    if (action.includes("job seeker")) return "Job Seekers";
    if (action.includes("employer")) return "Employers";
    if (action.includes("application")) return "Applications";
    if (action.includes("job")) return "Job Posts";
    if (action.includes("login") || action.includes("dashboard")) {
      return "Admin Portal";
    }
    return "Admin Portal";
  };

  const getIpDevice = (log: AuditLog) => {
    const details = getDetails(log.details);
    const ip =
      details.ip_address || details.ip || details.ipAddress;
    const device =
      typeof details.device === "string" ? details.device : "";
    const userAgent =
      typeof details.user_agent === "string"
        ? details.user_agent
        : typeof details.userAgent === "string"
          ? details.userAgent
          : "";
    const deviceDetails = [device, userAgent]
      .filter(Boolean)
      .join(" · ");
    const values = [
      typeof ip === "string" ? `IP: ${ip}` : "",
      deviceDetails ? `Device: ${deviceDetails}` : "",
    ].filter(Boolean);
    return values.join(" · ") || "Not recorded";
  };

  const areas = [...new Set(logs.map(getArea))].sort();
  const actions = [...new Set(logs.map((log) => log.action))].sort();
  const admins = [...new Set(logs.map((log) => log.actor_name || "Admin"))].sort();
  const filteredLogs = logs.filter((log) => {
    const date = log.created_at.slice(0, 10);
    const keyword = appliedFilters.keyword.trim().toLowerCase();
    const detailsText =
      typeof log.details === "string"
        ? log.details
        : JSON.stringify(log.details ?? "");
    const matchesKeyword =
      !keyword ||
      `${log.actor_name || ""} ${getArea(log)} ${log.action} ${detailsText} ${getIpDevice(log)}`
        .toLowerCase()
        .includes(keyword);

    return (
      (!appliedFilters.dateFrom || date >= appliedFilters.dateFrom) &&
      (!appliedFilters.dateTo || date <= appliedFilters.dateTo) &&
      (appliedFilters.admin === "all" ||
        (log.actor_name || "Admin") === appliedFilters.admin) &&
      (appliedFilters.area === "all" ||
        getArea(log) === appliedFilters.area) &&
      (appliedFilters.action === "all" ||
        log.action === appliedFilters.action) &&
      matchesKeyword
    );
  });

  const clearFilters = () => {
    const clearedFilters = {
      dateFrom: "",
      dateTo: "",
      admin: "all",
      keyword: "",
      area: "all",
      action: "all",
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#123B70]">Admin Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Audit trail for admin and staff activities (who did what, where, and when).
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Showing all available logs by default. Use the date range to narrow results.
          </p>
        </div>
        <p className="hidden text-right text-[10px] text-slate-400 md:block">
          Showing up to 500 recent records.<br />
          Use filters to narrow down results.
        </p>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{loadError}</p>
          {loadError.includes("session has expired") && (
            <a
              href="/login"
              className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-2 text-center text-xs font-bold text-red-700 hover:bg-red-100"
            >
              Sign in again
            </a>
          )}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedFilters({ ...filters });
        }}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-[11px] font-semibold text-slate-600">
            Date From
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            />
          </label>
          <label className="block text-[11px] font-semibold text-slate-600">
            Date To
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            />
          </label>
          <label className="block text-[11px] font-semibold text-slate-600">
            Admin
            <select
              value={filters.admin}
              onChange={(event) => setFilters({ ...filters, admin: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            >
              <option value="all">All admins</option>
              {admins.map((admin) => <option key={admin} value={admin}>{admin}</option>)}
            </select>
          </label>
          <label className="block text-[11px] font-semibold text-slate-600">
            Keyword
            <input
              type="search"
              value={filters.keyword}
              onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
              placeholder="Area, action, details..."
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800 placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-[11px] font-semibold text-slate-600">
            Area
            <select
              value={filters.area}
              onChange={(event) => setFilters({ ...filters, area: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            >
              <option value="all">All areas</option>
              {areas.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <label className="block flex-1 text-[11px] font-semibold text-slate-600">
            Action
            <select
              value={filters.action}
              onChange={(event) => setFilters({ ...filters, action: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            >
              <option value="all">All actions</option>
              {actions.map((action) => <option key={action} value={action}>{action}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2 sm:ml-auto">
            <button
              type="submit"
              className="rounded-md bg-[#0759AE] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#064A91]"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800">Logs</h2>
          <span className="text-[11px] text-slate-400">
            {filteredLogs.length} record{filteredLogs.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed">
            <thead className="bg-slate-50 text-left">
              <tr>
                {[
                  ["Date / Time", "w-[14%]"],
                  ["Actor", "w-[14%]"],
                  ["Area", "w-[13%]"],
                  ["Action", "w-[14%]"],
                  ["Details", "w-[25%]"],
                  ["IP / Device", "w-[20%]"],
                ].map(([label, width]) => (
                  <th
                    key={label}
                    className={`${width} px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    {loadError
                      ? "Audit log records are unavailable until the error above is resolved."
                      : logs.length === 0
                        ? "No audit logs found."
                        : "No logs match these filters."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.log_id} className="align-top hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 text-[10px] text-slate-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-medium text-slate-700">
                      {log.actor_name || "Admin"}
                      {log.actor_role ? ` (${log.actor_role})` : ""}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-600">
                      {getArea(log)}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-medium text-slate-700">
                      {log.action}
                    </td>
                    <td className="break-words px-3 py-2.5 text-[10px] leading-4 text-slate-600">
                      {renderLogDetails(log)}
                    </td>
                    <td className="break-words px-3 py-2.5 text-[10px] leading-4 text-slate-500">
                      {getIpDevice(log)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ================================================================
   MY PROFILE
================================================================ */

function MyProfile({
  account,
  onSave,
}: {
  account: Account | null;
  onSave: (values: Pick<Account, "full_name" | "contact_no">) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: account?.full_name ?? "",
    contact_no: account?.contact_no ?? "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      setEditing(false);
    } catch (saveError) {
      console.error("Admin profile update error:", saveError);
      setError(saveError instanceof Error ? saveError.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#123B70]">Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your PESO Mabini account information.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setEditing(true);
            }}
            className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123B70]"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-5 border-b border-slate-100 bg-slate-50 px-6 py-6 sm:flex-row sm:items-center">
          {account?.user_id && (
            <ProfileAvatar
              userId={account.user_id}
              fullName={account.full_name}
              size="large"
              showControls={editing}
            />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-black text-[#123B70]">
              {account?.full_name || "PESO User"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {account?.role === "superadmin" ? "Super Admin" : "PESO Staff"}
            </p>
            <p className="mt-1 break-words text-sm text-slate-500">
              {account?.email || "Email not available"}
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700">
            Full Name
            <input
              value={editing ? form.full_name : account?.full_name ?? ""}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              required
              maxLength={120}
              disabled={!editing || saving}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Email
            <input
              type="email"
              value={account?.email ?? ""}
              readOnly
              aria-describedby="admin-profile-email-note"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-500 outline-none disabled:bg-slate-50"
            />
            <span id="admin-profile-email-note" className="mt-1 block text-xs font-normal text-slate-400">
              Contact the super admin to change your sign-in email.
            </span>
          </label>

          {account?.role === "staff" && (
            <label className="block text-sm font-bold text-slate-700">
              Contact Number
              <input
                type="tel"
                value={editing ? form.contact_no : account.contact_no ?? ""}
                onChange={(event) => setForm({ ...form, contact_no: event.target.value })}
                maxLength={30}
                disabled={!editing || saving}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </label>
          )}

          {editing && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    full_name: account?.full_name ?? "",
                    contact_no: account?.contact_no ?? "",
                  });
                  setError("");
                  setEditing(false);
                }}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123B70] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </form>
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

        <h3 className="text-lg font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="rounded-md bg-[#203F8B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193474]"
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

function TableHeader({
  children,
  className = "",
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <th className={`whitespace-nowrap border-b border-slate-200 ${compact ? "px-2 py-2" : "px-4 py-3"} text-left text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

function TableCell({
  children,
  bold = false,
  className = "",
  compact = false,
}: {
  children: React.ReactNode;
  bold?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <td
      className={`${compact ? "px-2 py-2" : "px-4 py-3"} ${compact ? "text-xs" : "text-sm"} ${className} ${
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