import { useEffect, useState, type FormEvent } from "react";
import SidebarToggle from "../components/SidebarToggle";
import AppIcon, { type AppIconName } from "../components/AppIcon";
import ProfileAvatar from "../components/ProfileAvatar";
import { supabase } from "../services/supabase";
import { openStoredResume } from "../services/resumes";
import type {
  EmployerDocumentStatus,
  EmployerVerificationDocument,
} from "../services/employerRegistration";
import MessagesModule from "../adminmodules/MessagesModule";
import PESOPosts from "../adminmodules/PESOPosts";

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
  contact_no: string | null;
};

type ModuleName =
  | "Dashboard Overview"
  | "Analytics"
  | "Job Posts"
  | "Job Application"
  | "Employers"
  | "Job Seekers"
  | "Messages"
  | "PESO Posts";

type StaffRecordPage = "Job Posts" | "Employers" | "Job Seekers";
type StaffRecord = Record<string, unknown>;

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

  const [records, setRecords] = useState<StaffRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [recordsRefresh, setRecordsRefresh] = useState(0);

  // Off-canvas below `lg`: a permanent 288px column leaves no room for
  // content on a 320px phone.
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, [isSidebarOpen]);

  const go = (page: ModuleName | "My Profile") => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  const saveStaffProfile = async (values: Pick<StaffAccount, "full_name" | "contact_no">) => {
    if (!staff) throw new Error("Your staff profile is not loaded.");
    const { data, error } = await supabase
      .from("peso_staff")
      .update({
        full_name: values.full_name.trim(),
        contact_no: values.contact_no?.trim() || null,
      })
      .eq("peso_staff_id", staff.peso_staff_id)
      .select("full_name, contact_no")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Your profile was not updated. Please sign in again and try once more.");
    setStaff({ ...staff, ...data });
  };

  const reviewStaffEmployerDocuments = async (
    employerId: string,
    documents: EmployerVerificationDocument[],
  ) => {
    const { data, error } = await supabase
      .from("employer")
      .update({ verification_documents: documents })
      .eq("employer_id", employerId)
      .select("employer_id, verification_documents")
      .maybeSingle();

    if (error) {
      console.error("Staff employer document review update failed:", error);
      throw new Error(`Document review status could not be saved: ${error.message}`);
    }
    if (!data) {
      throw new Error("Document review status was not saved because the employer record no longer exists.");
    }

    setRecords((current) =>
      current.map((record) =>
        record.employer_id === employerId
          ? { ...record, verification_documents: data.verification_documents }
          : record,
      ),
    );
  };

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

  useEffect(() => {
    if (
      activePage !== "Job Posts" &&
      activePage !== "Employers" &&
      activePage !== "Job Seekers"
    ) {
      return;
    }

    let cancelled = false;

    const loadRecords = async () => {
      setRecordsLoading(true);
      setRecordsError("");
      setRecords([]);

      try {
        let rows: StaffRecord[] = [];

        if (activePage === "Job Posts") {
          const [jobsResult, employersResult] = await Promise.all([
            supabase
              .from("job_vacancy")
              .select(
                "job_vacancy_id, employer_id, position_title, description, requirements, location, employment_type, salary_min, salary_max, vacancies_available, status, date_posted, deadline",
              )
              .order("date_posted", { ascending: false }),
            supabase.from("employer").select("employer_id, name, logo_url"),
          ]);

          if (jobsResult.error) throw jobsResult.error;
          if (employersResult.error) {
            console.error("Employer names could not be loaded:", employersResult.error);
            if (!cancelled) {
              setRecordsError(
                `Job posts loaded, but employer names could not be loaded: ${employersResult.error.message}`,
              );
            }
          }

          const employerNames = new Map(
            (employersResult.data ?? []).map((employer) => [
              employer.employer_id,
              { name: employer.name, logo_url: employer.logo_url },
            ]),
          );
          rows = (jobsResult.data ?? []).map((job) => ({
            ...job,
            employer_name:
              employerNames.get(job.employer_id)?.name || job.employer_id,
            employer_logo_url:
              employerNames.get(job.employer_id)?.logo_url || null,
          }));
        } else if (activePage === "Employers") {
          const { data, error } = await supabase
            .from("employer")
            .select(
            "employer_id, name, contact_person, email, contact_no, address, is_verified, verification_status, created_at, registration_details, verification_documents",
            )
            .order("created_at", { ascending: false });

          if (error) throw error;
          rows = data ?? [];
        } else {
          const { data, error } = await supabase
            .from("job_seeker")
            .select(
              "job_seeker_id, full_name, email, contact_no, address, birth_date, resume_url, created_at",
            )
            .order("created_at", { ascending: false });

          if (error) throw error;
          rows = data ?? [];
        }

        if (!cancelled) setRecords(rows);
      } catch (error) {
        console.error(`${activePage} could not be loaded:`, error);
        if (!cancelled) {
          setRecordsError(
            error instanceof Error
              ? error.message
              : `Unable to load ${activePage.toLowerCase()}.`,
          );
        }
      } finally {
        if (!cancelled) setRecordsLoading(false);
      }
    };

    void loadRecords();

    return () => {
      cancelled = true;
    };
  }, [activePage, recordsRefresh]);

  /* =====================================================
     CHECK WHETHER MODULE IS ASSIGNED
  ===================================================== */

  const isAssigned = (
    module: ModuleName
  ): boolean => {

    if (module === "Messages") {
      return true;
    }

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

      case "PESO Posts":
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
      name: "Messages",
      icon: "✉",
    },
    {
      name: "PESO Posts",
      icon: "▣",
    },
  ];

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    await supabase.auth.signOut();

    window.location.replace("/login");
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
    if (
      activePage !== "My Profile" &&
      !isAssigned(activePage)
    ) {
      return (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h2 className="font-bold text-red-700">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            This module has not been assigned to your account.
          </p>
        </div>
      );
    }

    switch (activePage) {

      case "Dashboard Overview":
        return <DashboardOverview />;

      case "Analytics":
        return <Analytics />;

      case "Job Posts":
        return (
          <StaffRecordsModule
            page="Job Posts"
            records={records}
            loading={recordsLoading}
            error={recordsError}
            onRefresh={() => setRecordsRefresh((value) => value + 1)}
          />
        );

      case "Job Application":
        return <JobApplications />;

      case "Employers":
        return (
          <StaffRecordsModule
            page="Employers"
            records={records}
            loading={recordsLoading}
            error={recordsError}
            onRefresh={() => setRecordsRefresh((value) => value + 1)}
            onReviewDocuments={reviewStaffEmployerDocuments}
          />
        );

      case "Job Seekers":
        return (
          <StaffRecordsModule
            page="Job Seekers"
            records={records}
            loading={recordsLoading}
            error={recordsError}
            onRefresh={() => setRecordsRefresh((value) => value + 1)}
          />
        );

      case "Messages":
        return <MessagesModule mode="staff" />;

      case "PESO Posts":
        return <PESOPosts />;

      case "My Profile":
        return (
          <MyProfile staff={staff} onSave={saveStaffProfile} />
        );

      default:
        return (
          <MyProfile staff={staff} onSave={saveStaffProfile} />
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

      {/* Tap-away backdrop, small screens only */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        id="staff-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-[#0446A7] text-white transition-transform duration-300 ease-out motion-reduce:transition-none lg:translate-x-0 lg:overflow-hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        {/* LOGO */}

        <div className="flex items-start justify-between gap-2 border-b border-blue-400/30 px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 sm:px-6 sm:pb-6">

          <div className="min-w-0">
            <h1 className="text-xl font-black sm:text-2xl">
              PESO MABINI
            </h1>

            <p className="mt-1 text-sm text-blue-100">
              Staff Portal
            </p>
          </div>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsSidebarOpen(false)}
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-100 transition hover:bg-blue-600 lg:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

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
                      go(module.name)
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
              go("My Profile")
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

        <div className="mt-auto border-t border-blue-400/30 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">

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

      <SidebarToggle
        open={isSidebarOpen}
        onClick={() =>
          setIsSidebarOpen((value) => !value)
        }
        label="Toggle staff navigation menu"
      />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="min-h-screen lg:ml-72">

        {/* HEADER */}

        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 pl-20 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 sm:px-6 sm:pl-20 sm:pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:pb-5 lg:px-8">

          <div>

            <p className="text-sm font-semibold text-slate-400">
              PESO Staff
            </p>

            <h1 className="truncate text-xl font-black text-[#123B70] sm:text-2xl">
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

            <ProfileAvatar
              key={staff.user_id}
              userId={staff.user_id}
              fullName={staff.full_name}
              size="small"
              showControls={false}
            />

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
          Overview of the PESO MABINI employment system.
        </p>

      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Job Posts"
          value={counts.jobs}
          icon="briefcase"
        />

        <StatCard
          title="Applications"
          value={counts.applications}
          icon="file"
        />

        <StatCard
          title="Employers"
          value={counts.employers}
          icon="building"
        />

        <StatCard
          title="Job Seekers"
          value={counts.seekers}
          icon="users"
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


function StaffRecordsModule({
  page,
  records,
  loading,
  error,
  onRefresh,
  onReviewDocuments,
}: {
  page: StaffRecordPage;
  records: StaffRecord[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onReviewDocuments?: (
    employerId: string,
    documents: EmployerVerificationDocument[],
  ) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);

  const columns: {
    label: string;
    value: (record: StaffRecord) => string;
  }[] =
    page === "Job Posts"
      ? [
          { label: "Job Title", value: (record) => textValue(record.position_title) },
          { label: "Employer", value: (record) => textValue(record.employer_name) },
          { label: "Location", value: (record) => textValue(record.location) },
          { label: "Employment Type", value: (record) => textValue(record.employment_type) },
          {
            label: "Salary Range",
            value: (record) =>
              record.salary_min != null || record.salary_max != null
                ? `${textValue(record.salary_min, "-")} – ${textValue(record.salary_max, "-")}`
                : "-",
          },
          { label: "Openings", value: (record) => textValue(record.vacancies_available) },
          {
            label: "Status",
            value: (record) =>
              record.status === "open"
                ? "Active"
                : record.status === "draft"
                  ? "Inactive"
                  : record.status === "closed"
                    ? "Closed"
                    : textValue(record.status),
          },
          { label: "Date Posted", value: (record) => dateValue(record.date_posted) },
          { label: "Deadline", value: (record) => dateValue(record.deadline) },
          { label: "Description", value: (record) => textValue(record.description) },
          { label: "Requirements", value: (record) => textValue(record.requirements) },
        ]
      : page === "Employers"
        ? [
            { label: "Company / Employer", value: (record) => textValue(record.name) },
            { label: "Contact Person", value: (record) => textValue(record.contact_person) },
            { label: "Email", value: (record) => textValue(record.email) },
            { label: "Contact Number", value: (record) => textValue(record.contact_no) },
            { label: "Address", value: (record) => textValue(record.address) },
            {
              label: "Documents",
              value: (record) =>
                Array.isArray(record.verification_documents)
                  ? `${record.verification_documents.length} uploaded`
                  : "None uploaded",
            },
            {
              label: "Verification",
              value: (record) =>
                record.verification_status === "verified"
                  ? "Verified"
                  : record.verification_status === "not_approved"
                    ? "Not approved"
                    : record.is_verified === true
                      ? "Verified"
                      : "Pending",
            },
            { label: "Registered", value: (record) => dateValue(record.created_at) },
          ]
        : [
            { label: "Name", value: (record) => textValue(record.full_name) },
            { label: "Email", value: (record) => textValue(record.email) },
            { label: "Contact Number", value: (record) => textValue(record.contact_no) },
            { label: "Address", value: (record) => textValue(record.address) },
            { label: "Birth Date", value: (record) => dateValue(record.birth_date) },
            {
              label: "Resume",
              value: (record) => record.resume_url ? "Uploaded" : "Not uploaded",
            },
            { label: "Registered", value: (record) => dateValue(record.created_at) },
          ];

  const filteredRecords = records.filter((record) =>
    columns
      .map((column) => column.value(record))
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleOpenResume = async (record: StaffRecord, index: number) => {
    const resumePath = textValue(record.resume_url, "");
    if (!resumePath) return;

    const rowId = textValue(record.job_seeker_id, String(index));
    setOpeningResumeId(rowId);
    setResumeError("");

    try {
      await openStoredResume(resumePath);
    } catch (error) {
      console.error("Could not open job seeker resume:", error);
      setResumeError(
        error instanceof Error
          ? error.message
          : "Unable to open this resume. Please try again.",
      );
    } finally {
      setOpeningResumeId(null);
    }
  };

  const getRecordDocuments = (record: StaffRecord) => {
    if (!Array.isArray(record.verification_documents)) return [];
    return record.verification_documents.filter(
      (document): document is EmployerVerificationDocument =>
        Boolean(
          document &&
            typeof document === "object" &&
            typeof document.id === "string" &&
            typeof document.storage_path === "string" &&
            typeof document.file_name === "string" &&
            typeof document.status === "string",
        ),
    );
  };

  const handleOpenEmployerDocument = async (
    document: EmployerVerificationDocument,
  ) => {
    setDocumentError("");
    setOpeningDocumentId(document.id);
    const { data, error: signedUrlError } = await supabase.storage
      .from("employer-verification-documents")
      .createSignedUrl(document.storage_path, 60);
    setOpeningDocumentId(null);
    if (signedUrlError) {
      console.error("Could not open employer registration document:", signedUrlError);
      setDocumentError(signedUrlError.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleReviewEmployerDocument = async (
    record: StaffRecord,
    documentId: string,
    status: EmployerDocumentStatus,
  ) => {
    const employerId = textValue(record.employer_id, "");
    if (!employerId || !onReviewDocuments) return;
    const documents = getRecordDocuments(record).map((document) =>
      document.id === documentId
        ? { ...document, status, reviewed_at: new Date().toISOString() }
        : document,
    );
    setDocumentError("");
    try {
      await onReviewDocuments(employerId, documents);
    } catch (reviewError) {
      setDocumentError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to update document review status.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#123B70]">{page}</h2>
          <p className="mt-2 text-slate-500">
            View complete {page.toLowerCase()} information.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={`Search ${page.toLowerCase()}...`}
        aria-label={`Search ${page.toLowerCase()}`}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
      />

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Could not load {page.toLowerCase()}: {error}
        </p>
      )}
      {resumeError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {resumeError}
        </p>
      )}
      {documentError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {documentError}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {error ? "Records are unavailable until the load issue is fixed." : `No ${page.toLowerCase()} found.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.label} className="px-4 py-3 font-bold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record, index) => (
                  <tr
                    key={textValue(
                      record.job_vacancy_id ||
                        record.employer_id ||
                        record.job_seeker_id,
                      String(index),
                    )}
                    className="align-top hover:bg-slate-50"
                  >
                    {columns.map((column, columnIndex) => (
                      <td
                        key={column.label}
                        className={`max-w-sm px-4 py-3 text-slate-700 ${
                          columnIndex === 0 ? "font-semibold text-slate-900" : ""
                        } ${column.label === "Description" || column.label === "Requirements" ? "whitespace-normal" : "whitespace-nowrap"}`}
                      >
                        {page === "Job Seekers" && column.label === "Resume" ? (
                          record.resume_url ? (
                            <button
                              type="button"
                              onClick={() => void handleOpenResume(record, index)}
                              disabled={
                                openingResumeId ===
                                textValue(record.job_seeker_id, String(index))
                              }
                              className="rounded-full border border-[#203F8B] px-3 py-1.5 text-xs font-semibold text-[#203F8B] hover:bg-blue-50 disabled:opacity-60"
                            >
                              {openingResumeId ===
                              textValue(record.job_seeker_id, String(index))
                                ? "Opening..."
                                : "View Resume"}
                            </button>
                          ) : (
                            "Not uploaded"
                          )
                        ) : (
                          page === "Employers" && column.label === "Documents" ? (
                            <div className="min-w-[16rem] space-y-2 whitespace-normal">
                              {getRecordDocuments(record).length === 0 ? (
                                <span className="text-xs text-slate-500">None uploaded</span>
                              ) : (
                                getRecordDocuments(record).map((document) => (
                                  <div key={document.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2">
                                    <button
                                      type="button"
                                      onClick={() => void handleOpenEmployerDocument(document)}
                                      disabled={openingDocumentId === document.id}
                                      className="max-w-40 truncate text-left text-xs font-semibold text-blue-700 hover:underline"
                                    >
                                      {openingDocumentId === document.id ? "Preparing link..." : document.file_name}
                                    </button>
                                    <select
                                      aria-label={`Review status for ${document.file_name}`}
                                      value={document.status}
                                      onChange={(event) => {
                                        const status = event.target.value;
                                        if (status === "pending" || status === "approved" || status === "rejected") {
                                          void handleReviewEmployerDocument(record, document.id, status);
                                        }
                                      }}
                                      className="rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px]"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="approved">Approved</option>
                                      <option value="rejected">Rejected</option>
                                    </select>
                                  </div>
                                ))
                              )}
                            </div>
                          ) : page === "Job Posts" && column.label === "Employer" ? (
                            <span className="inline-flex max-w-full items-center gap-2">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                                {typeof record.employer_logo_url === "string" &&
                                record.employer_logo_url ? (
                                  <img
                                    src={record.employer_logo_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  textValue(record.employer_name, "E")
                                    .charAt(0)
                                    .toUpperCase()
                                )}
                              </span>
                              <span className="truncate">
                                {column.value(record)}
                              </span>
                            </span>
                          ) : (
                            column.value(record)
                          )
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function textValue(value: unknown, fallback = "-"): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function dateValue(value: unknown): string {
  if (typeof value !== "string" || !value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
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
   MY PROFILE
========================================================= */

function MyProfile({
  staff,
  onSave,
}: {
  staff: StaffAccount;
  onSave: (values: Pick<StaffAccount, "full_name" | "contact_no">) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: staff.full_name,
    contact_no: staff.contact_no ?? "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      setEditing(false);
    } catch (saveError) {
      console.error("Staff profile update error:", saveError);
      setError(saveError instanceof Error ? saveError.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#123B70]">My Profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your PESO MABINI staff account information.
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
          <ProfileAvatar
            userId={staff.user_id}
            fullName={staff.full_name}
            size="large"
            showControls={editing}
          />
          <div className="min-w-0">
            <h3 className="text-lg font-black text-[#123B70]">
              {staff.full_name}
            </h3>
            <p className="mt-1 text-sm text-slate-500">PESO Staff</p>
            <p className="mt-1 break-words text-sm text-slate-500">
              {staff.email}
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700">
            Full Name
            <input
              value={editing ? form.full_name : staff.full_name}
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
              value={staff.email}
              readOnly
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-500"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Contact Number
            <input
              type="tel"
              value={editing ? form.contact_no : staff.contact_no ?? ""}
              onChange={(event) => setForm({ ...form, contact_no: event.target.value })}
              maxLength={30}
              disabled={!editing || saving}
              placeholder="Not provided"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Role
            <input
              value="PESO Staff"
              disabled
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-500"
            />
          </label>

          {editing && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    full_name: staff.full_name,
                    contact_no: staff.contact_no ?? "",
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
  icon: AppIconName;
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
          <AppIcon name={icon} className="h-6 w-6" />
        </div>

      </div>

    </div>
  );
}