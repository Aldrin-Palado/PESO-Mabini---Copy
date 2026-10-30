
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarToggle from "../components/SidebarToggle";
import EmployersSidebar, {
  type EmployerMenuName,
} from "../components/EmployerSidebar";

import DashboardModule from "../employersmodules/DashboardModule";
import MyJobPostModule from "../employersmodules/MyJobPostModule";
import ApplicationsModule from "../employersmodules/ApplicationsModule";
import CompanyProfileModule from "../employersmodules/CompanyProfileModule";
import MessagesModule from "../employersmodules/MessagesModule";

import { supabase } from "../services/supabase";

/* =========================
   TYPES
========================= */

type MenuName =
  | "Dashboard"
  | "My Job Posts"
  | "Applications"
  | "Messages"
  | "Company Profile";

interface EmployerProfile {
  employer_id: string;
  user_id: string | null;
  name: string;
  address: string | null;
  contact_person: string | null;
  contact_no: string | null;
  email: string | null;
  is_verified: boolean;
}

interface JobPost {
  job_vacancy_id: string;
  employer_id: string;
  position_title: string;
  description: string | null;
  requirements: string | null;
  location: string;
  employment_type: string;
  job_classification: "local" | "international";
  salary_min: number | null;
  salary_max: number | null;
  vacancies_available: number;
  status: string;
  date_posted: string;
  deadline: string | null;
  image_url: string | null;
}

interface ApplicationRow {
  application_id: string;
  employer_id: string;
  job_seeker_id: string;
  position_title: string | null;
  status: string;
  date_applied: string;
  applicant_name?: string;
}

interface CompanyProfileForm {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_description: string;
  industry?: string | null;
  website?: string | null;
  contact_person?: string | null;
}

/* =========================
   CONSTANTS
========================= */

const menuItems: { name: MenuName; icon: string }[] = [
  { name: "Dashboard", icon: "▦" },
  { name: "My Job Posts", icon: "▤" },
  { name: "Applications", icon: "✓" },
  { name: "Company Profile", icon: "▣" },
];

/* =========================
   MAIN COMPONENT
========================= */

export default function EmployerDashboard() {
  const navigateToRoute = useNavigate();
  const [activeMenu, setActiveMenu] =
    useState<MenuName>("Dashboard");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [profile, setProfile] =
    useState<EmployerProfile | null>(null);

  const [jobs, setJobs] = useState<JobPost[]>([]);

  const [applications, setApplications] =
    useState<ApplicationRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [loginRequired, setLoginRequired] = useState(false);

  /* =========================
     SIDEBAR ESCAPE HANDLER
  ========================= */

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  /* =========================
     LOAD EMPLOYER DATA
  ========================= */

  const fetchEmployerData = useCallback(async () => {
    setError("");
    setLoginRequired(false);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setProfile(null);
      setJobs([]);
      setApplications([]);
      setLoginRequired(true);

      throw new Error(
        "Your employer login session has expired. Please sign in again."
      );
    }

    /* Load authenticated employer profile */

    const { data: employerRow, error: profileError } =
      await supabase
        .from("employer")
        .select(
          "employer_id, user_id, name, address, contact_person, contact_no, email, is_verified"
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (profileError) {
      throw new Error(
        `Could not load employer profile: ${profileError.message}`
      );
    }

    if (!employerRow) {
      setProfile(null);
      setJobs([]);
      setApplications([]);
      setLoginRequired(true);
      throw new Error(
        "Your employer login session has expired or could not be verified. Please sign in again."
      );
    }

    const employer = employerRow as EmployerProfile;

    setProfile(employer);

    /* Load employer-owned job vacancies */

    const { data: jobRows, error: jobError } =
      await supabase
        .from("job_vacancy")
        .select(
          "job_vacancy_id, employer_id, position_title, description, requirements, location, employment_type, job_classification, salary_min, salary_max, vacancies_available, status, date_posted, deadline, image_url"
        )
        .eq("employer_id", employer.employer_id)
        .order("date_posted", { ascending: false });

    if (jobError) {
      throw new Error(
        `Your profile loaded, but job posts could not be loaded: ${jobError.message}`
      );
    }

    const employerJobs = (jobRows || []) as JobPost[];

    setJobs(employerJobs);

    /* Load employer applications */

    const { data: applicationRows, error: applicationError } =
      await supabase
        .from("application")
        .select(
          "application_id, employer_id, job_seeker_id, position_title, status, date_applied"
        )
        .eq("employer_id", employer.employer_id)
        .order("date_applied", { ascending: false });

    if (applicationError) {
      throw new Error(
        `Job posts loaded, but applications could not be loaded: ${applicationError.message}`
      );
    }

    const rows = (applicationRows || []) as ApplicationRow[];

    /* Load applicant names */

    const seekerIds = [
      ...new Set(
        rows
          .map((application) => application.job_seeker_id)
          .filter(Boolean)
      ),
    ];

    let namesById = new Map<string, string>();

    if (seekerIds.length > 0) {
      const { data: seekers, error: seekerError } =
        await supabase
          .from("job_seeker")
          .select("job_seeker_id, full_name")
          .in("job_seeker_id", seekerIds);

      if (seekerError) {
        console.error(
          "Applicant names could not be loaded:",
          seekerError
        );
      } else {
        namesById = new Map(
          (seekers || []).map(
            (seeker: {
              job_seeker_id: string;
              full_name: string | null;
            }) => [
              seeker.job_seeker_id,
              seeker.full_name || "Job Seeker",
            ]
          )
        );
      }
    }

    const enrichedApplications = rows.map((application) => ({
      ...application,
      applicant_name:
        namesById.get(application.job_seeker_id) ||
        "Job Seeker",
    }));

    setApplications(enrichedApplications);
  }, []);

  /* =========================
     INITIAL DATA LOAD
  ========================= */

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setLoading(true);
      setError("");

      try {
        await fetchEmployerData();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load employer data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [fetchEmployerData]);

  /* =========================
     NAVIGATION
  ========================= */

  const navigate = (menu: string) => {
    if (menuItems.some((item) => item.name === menu)) {
      setActiveMenu(menu as MenuName);
    }

    setIsSidebarOpen(false);
  };

  /* =========================
     REFRESH DATA
  ========================= */

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");

    try {
      await fetchEmployerData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh employer data."
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================
     SIGN OUT
  ========================= */

  const signOut = async () => {
    setError("");

    const { error: signOutError } =
      await supabase.auth.signOut();

    if (signOutError) {
      setError(`Unable to log out: ${signOutError.message}`);
      return;
    }

    window.location.assign("/");
  };

  const signInAgain = async () => {
    setError("");

    const { error: signOutError } =
      await supabase.auth.signOut();

    if (signOutError) {
      setError(`Unable to end your current session: ${signOutError.message}`);
      return;
    }

    navigateToRoute("/login", { replace: true });
  };

  /* =========================
     COMPANY PROFILE SAVE
  ========================= */

  const handleSaveCompanyProfile = async (
    updatedProfile: CompanyProfileForm
  ) => {
    if (!profile) {
      throw new Error("Employer profile is not available.");
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error(
        authError?.message || "Please sign in again."
      );
    }

    const changes = {
      name: updatedProfile.company_name.trim(),
      address: updatedProfile.company_address.trim() || null,
      contact_person:
        updatedProfile.contact_person?.trim() || null,
      contact_no: updatedProfile.company_phone.trim() || null,
    };

    const { data, error: updateError } = await supabase
      .from("employer")
      .update(changes)
      .eq("user_id", user.id)
      .select(
        "employer_id, user_id, name, address, contact_person, contact_no, email, is_verified"
      )
      .maybeSingle();

    if (updateError) {
      throw new Error(
        `Company profile update failed: ${updateError.message}`
      );
    }

    if (!data) {
      throw new Error(
        "Profile was not updated. Check your employer permissions."
      );
    }

    setProfile(data as EmployerProfile);
  };

  /* =========================
     DISPLAY VALUES
  ========================= */

  const displayName =
    profile?.name?.trim() ||
    profile?.contact_person?.trim() ||
    "Employer";

  const initial = displayName.charAt(0).toUpperCase() || "E";

  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FC] p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#0446A7]" />

          <h1 className="text-xl font-black text-[#123B70]">
            Loading Employer Portal
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please wait while we load your company information.
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FC] p-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
            !
          </div>

          <h1 className="text-xl font-black text-[#123B70]">
            {loginRequired
              ? "Employer Login Session Expired"
              : "Employer Portal Unavailable"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error ||
              "Your employer profile could not be loaded."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {loginRequired ? (
              <button
                type="button"
                onClick={signInAgain}
                className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white hover:bg-[#123B70]"
              >
                Sign In Again
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white hover:bg-[#123B70] disabled:opacity-50"
              >
                {refreshing ? "Retrying..." : "Try Again"}
              </button>
            )}

            <button
              type="button"
              onClick={signOut}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     MODULE ADAPTERS
  ========================= */

  const dashboardProfile = {
    name: profile.name,
    contact_person: profile.contact_person,
  };

  const dashboardJobs = jobs.map((job) => ({
    job_vacancy_id: Number(job.job_vacancy_id),
    position_title: job.position_title,
    status: job.status,
  }));

  const dashboardApplications = applications.map((application) => ({
    id: application.application_id,
    applicant_name: application.applicant_name || "Job Seeker",
    position_title: application.position_title || "Job post",
    status: application.status,
    created_at: application.date_applied,
  }));

  const companyProfile = {
    company_name: profile.name || "",
    company_email: profile.email || "",
    company_phone: profile.contact_no || "",
    company_address: profile.address || "",
    company_description: "",
    industry: null,
    website: null,
    contact_person: profile.contact_person || "",
  };

  /* =========================
     PAGE CONTENT
  ========================= */

  const renderContent = () => {
    switch (activeMenu) {
      case "My Job Posts":
        return (
          <MyJobPostModule
            jobs={jobs}
            employerId={profile.employer_id}
            onRefresh={handleRefresh}
          />
        );

      case "Applications":
        return (
          <ApplicationsModule
            applications={applications}
            onRefresh={handleRefresh}
          />
        );

      case "Messages":
        return <MessagesModule />;

      case "Company Profile":
        return (
          <CompanyProfileModule
            profile={companyProfile}
            onSave={handleSaveCompanyProfile}
          />
        );

      case "Dashboard":
      default:
        return (
          <DashboardModule
            profile={dashboardProfile}
            jobs={dashboardJobs}
            applications={dashboardApplications}
            onNavigate={navigate}
          />
        );
    }
  };

  /* =========================
     MAIN LAYOUT
  ========================= */

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      {/* Sidebar */}
      <EmployersSidebar
        activeMenu={activeMenu as EmployerMenuName}
        setActiveMenu={navigate}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onSignOut={signOut}
      />

      {/* Mobile Sidebar Toggle */}
      <SidebarToggle
        open={isSidebarOpen}
        onClick={() => setIsSidebarOpen((value) => !value)}
        label="Toggle employer navigation menu"
      />

      {/* Main Content */}
      <main className="min-h-screen lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 pl-20 py-4 sm:px-6 sm:pl-20 lg:px-8">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Employer Portal
              </p>

              <h2 className="truncate text-lg font-black text-[#123B70] sm:text-xl">
                {activeMenu}
              </h2>
            </div>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0446A7] text-sm font-bold text-white">
                {initial}
              </div>

              <div>
                <p className="max-w-48 truncate text-sm font-bold text-slate-800">
                  {displayName}
                </p>

                <p className="max-w-48 truncate text-xs text-slate-500">
                  {profile.email || "Employer"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="space-y-4 p-4 sm:p-6 lg:p-8">
          {error && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="shrink-0 rounded-lg border border-amber-300 px-3 py-2 font-bold hover:bg-amber-100 disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          )}

          {renderContent()}
        </section>
      </main>
    </div>
  );
}
