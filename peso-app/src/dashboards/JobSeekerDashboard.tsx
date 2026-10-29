import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../services/supabase";

import JobSeekerSidebar, {
  type JobSeekerPage,
} from "../components/JobseekerSidebar";

import HomeModule from "../jobseekersmodules/HomeModule";
import JobsModule from "../jobseekersmodules/JobsModule";
import ApplicationsModule from "../jobseekersmodules/ApplicationsModule";
import MessagesModule from "../jobseekersmodules/MessagesModule";
import AIChatbotModule from "../jobseekersmodules/AIChatbotModule";
import JobMatchesModule from "../jobseekersmodules/JobMatchesModule";

// =====================================================
// TYPES
// =====================================================

type Seeker = {
  job_seeker_id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_no: string | null;
  address: string | null;
  resume_url: string | null;
};

// =====================================================
// DASHBOARD
// =====================================================

export default function JobSeekerDashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] =
    useState<JobSeekerPage>("Home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [seeker, setSeeker] = useState<Seeker | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    contact_no: "",
    address: "",
  });

  // =====================================================
  // LOAD CURRENT JOB SEEKER
  // =====================================================

  useEffect(() => {
    loadCurrentSeeker();
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  const loadCurrentSeeker = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get currently authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      // No authenticated user
      if (authError || !user) {
        navigate("/", { replace: true });
        return;
      }

      // Get Job Seeker profile
      const { data, error: seekerError } = await supabase
        .from("job_seeker")
        .select(
          `
            job_seeker_id,
            user_id,
            full_name,
            email,
            contact_no,
            address,
            resume_url
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (seekerError) {
        console.error(
          "Error loading Job Seeker:",
          seekerError
        );

        setError(
          "Unable to load your Job Seeker account."
        );

        return;
      }

      // No Job Seeker profile
      if (!data) {
        await supabase.auth.signOut();

        navigate("/", { replace: true });

        return;
      }

      setSeeker(data as Seeker);
    } catch (err) {
      console.error(
        "Unexpected Job Seeker dashboard error:",
        err
      );

      setError(
        "Something went wrong while loading your account."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PAGE NAVIGATION
  // =====================================================

  const handlePageChange = (page: JobSeekerPage) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  const startProfileEdit = () => {
    if (!seeker) return;
    setProfileForm({
      full_name: seeker.full_name,
      contact_no: seeker.contact_no ?? "",
      address: seeker.address ?? "",
    });
    setProfileError("");
    setProfileSuccess("");
    setEditingProfile(true);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!seeker || savingProfile) return;

    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const { data, error: updateError } = await supabase
        .from("job_seeker")
        .update({
          full_name: profileForm.full_name.trim(),
          contact_no: profileForm.contact_no.trim() || null,
          address: profileForm.address.trim() || null,
        })
        .eq("job_seeker_id", seeker.job_seeker_id)
        .select("full_name, contact_no, address")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) throw new Error("Your profile was not updated. Please sign in again and try once more.");

      setSeeker({ ...seeker, ...data });
      setEditingProfile(false);
      setProfileSuccess("Your profile has been updated.");
    } catch (saveError) {
      console.error("Job seeker profile update error:", saveError);
      setProfileError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update your profile. Please try again.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      setLoading(true);

      const { error: logoutError } =
        await supabase.auth.signOut();

      if (logoutError) {
        console.error(
          "Logout error:",
          logoutError
        );
      }
    } catch (error) {
      console.error(
        "Unexpected logout error:",
        error
      );
    } finally {
      navigate("/", { replace: true });
    }
  };

  // =====================================================
  // PROFILE
  // =====================================================

  const renderProfile = () => {
    // This prevents Profile from rendering without seeker data
    if (!seeker) {
      return null;
    }

    const profileFields = [
      {
        label: "Full Name",
        value: seeker.full_name || "Not provided",
      },
      {
        label: "Email Address",
        value: seeker.email || "Not provided",
      },
      {
        label: "Contact Number",
        value:
          seeker.contact_no || "Not provided",
      },
      {
        label: "Address",
        value:
          seeker.address || "Not provided",
      },
      {
        label: "Resume / CV",
        value: seeker.resume_url
          ? "Resume uploaded"
          : "No resume uploaded",
      },
    ];

    return (
      <div className="mx-auto max-w-5xl space-y-6">

        {/* PAGE TITLE */}
        <div>
          <h1 className="text-3xl font-black text-[#123B70]">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your personal information and
            Job Seeker account details.
          </p>
        </div>

        {profileSuccess && (
          <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {profileSuccess}
          </p>
        )}
        {profileError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {profileError}
          </p>
        )}

        {/* PROFILE CARD */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* PROFILE HEADER */}
          <div className="bg-gradient-to-r from-[#123B70] to-[#0446A7] px-6 py-8 text-white">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

              {/* AVATAR */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl font-black">

                {seeker.full_name
                  ? seeker.full_name
                      .charAt(0)
                      .toUpperCase()
                  : "J"}

              </div>

              {/* NAME */}
              <div>
                <h2 className="text-2xl font-black">
                  {seeker.full_name ||
                    "Job Seeker"}
                </h2>

                <p className="mt-1 text-sm text-blue-100">
                  Job Seeker
                </p>
              </div>

            </div>

          </div>

          {/* INFORMATION */}
          <form onSubmit={saveProfile}>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              {editingProfile ? (
                <>
                  <label className="rounded-2xl bg-slate-50 p-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Full Name
                    <input
                      value={profileForm.full_name}
                      onChange={(event) => setProfileForm({ ...profileForm, full_name: event.target.value })}
                      required
                      maxLength={120}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Email Address
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-slate-800">
                      {seeker.email || "Not provided"}
                    </p>
                    <p className="mt-1 text-xs font-normal text-slate-500">
                      Contact support to change your sign-in email.
                    </p>
                  </div>
                  <label className="rounded-2xl bg-slate-50 p-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Contact Number
                    <input
                      type="tel"
                      value={profileForm.contact_no}
                      onChange={(event) => setProfileForm({ ...profileForm, contact_no: event.target.value })}
                      maxLength={30}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="rounded-2xl bg-slate-50 p-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Address
                    <textarea
                      value={profileForm.address}
                      onChange={(event) => setProfileForm({ ...profileForm, address: event.target.value })}
                      maxLength={300}
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Resume / CV
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {seeker.resume_url ? "Resume uploaded" : "No resume uploaded"}
                    </p>
                    <p className="mt-1 text-xs font-normal text-slate-500">
                      Manage your resume from AI Job Matches.
                    </p>
                  </div>
                </>
              ) : (
                profileFields.map((field) => (
                  <div key={field.label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {field.label}
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-slate-800">
                      {field.value}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              {editingProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    disabled={savingProfile}
                    className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#064A91] disabled:cursor-wait disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startProfileEdit}
                  className="rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#064A91]"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>

        </div>

        {/* ACCOUNT INFORMATION */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black text-[#123B70]">
            Account Information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            {/* ACCOUNT TYPE */}
            <div className="rounded-2xl bg-blue-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-[#0446A7]">
                Account Type
              </p>

              <p className="mt-2 text-sm font-bold text-slate-800">
                Job Seeker
              </p>

            </div>

            {/* ACCOUNT STATUS */}
            <div className="rounded-2xl bg-green-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                Account Status
              </p>

              <p className="mt-2 text-sm font-bold text-slate-800">
                Active
              </p>

            </div>

          </div>

        </div>

        {/* ACCOUNT ACTIONS */}
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black text-slate-800">
            Account Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Sign out of your PESO-Hub Job Seeker
            account.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Logout
          </button>

        </div>

      </div>
    );
  };

  // =====================================================
  // CONTENT
  // =====================================================

  const renderContent = () => {
    /*
      IMPORTANT:
      If there is no seeker, don't render any module.
    */
    if (!seeker) {
      return null;
    }

    switch (activePage) {

      // -------------------------------------------------
      // HOME
      // -------------------------------------------------

      case "Home":
        return (
          <HomeModule
            seeker={seeker}
            onNavigate={(page) =>
              handlePageChange(
                page === "Applications"
                  ? "Application"
                  : page
              )
            }
          />
        );

      // -------------------------------------------------
      // JOBS
      // -------------------------------------------------

      case "Jobs":
        return (
          <JobsModule
            seeker={seeker}
            onNavigate={(page) =>
              handlePageChange(
                page === "Applications"
                  ? "Application"
                  : page
              )
            }
          />
        );

      // -------------------------------------------------
      // APPLICATION
      // -------------------------------------------------

      case "Application":
        return (
          <ApplicationsModule
            seeker={seeker}
            onNavigate={(page) =>
              handlePageChange(
                page === "Applications"
                  ? "Application"
                  : page
              )
            }
          />
        );

      // -------------------------------------------------
      // MESSAGES
      // -------------------------------------------------

      case "Messages":
        return (
          <MessagesModule
            seeker={seeker}
            onNavigate={(page) =>
              handlePageChange(
                page === "Applications"
                  ? "Application"
                  : page
              )
            }
          />
        );

      case "AI Job Matches":
        return <JobMatchesModule />;

      case "AI Assistant":
        return <AIChatbotModule />;

      // -------------------------------------------------
      // PROFILE
      // -------------------------------------------------

      case "Profile":
        return renderProfile();

      // -------------------------------------------------
      // DEFAULT
      // -------------------------------------------------

      default:
        return (
          <HomeModule
            seeker={seeker}
            onNavigate={(page) =>
              handlePageChange(
                page === "Applications"
                  ? "Application"
                  : page
              )
            }
          />
        );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#0446A7]" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading your dashboard...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // ERROR / NO PROFILE
  // =====================================================

  if (error || !seeker) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <h2 className="mt-5 text-xl font-black text-[#123B70]">
            Unable to load your profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              "Your Job Seeker profile could not be found."}
          </p>

          <div className="mt-6 flex justify-center gap-3">

            <button
              type="button"
              onClick={loadCurrentSeeker}
              className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white hover:bg-[#123B70]"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/", {
                  replace: true,
                })
              }
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Back to Home
            </button>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN DASHBOARD
  // =====================================================

  /*
    IMPORTANT:
    At this point TypeScript knows that:
    
    seeker !== null
    
    because of the check above:
    
    if (error || !seeker) { ... }
    
    Therefore seeker.full_name is safe here.
  */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <JobSeekerSidebar
        activePage={activePage}
        setActivePage={handlePageChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main className="min-h-screen lg:ml-64">

        {/* =================================================
            TOP HEADER
            ================================================= */}

        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

            {/* PAGE TITLE */}

            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((open) => !open)}
                aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isSidebarOpen}
                aria-controls="job-seeker-sidebar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-[#123B70] transition hover:bg-slate-50 lg:hidden"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                PESO-Hub
              </p>

              <h1 className="truncate text-xl font-black text-[#123B70]">
                {activePage === "Application"
                  ? "Applications"
                  : activePage}
              </h1>
              </div>
            </div>

            {/* SEARCH BAR */}

            <div className="hidden max-w-md flex-1 md:block">

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="text-slate-400">
                  🔎
                </span>

                <input
                  type="text"
                  placeholder="Search jobs..."
                  onFocus={() =>
                    handlePageChange("Jobs")
                  }
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />

              </div>

            </div>

            {/* =================================================
                USER AREA
                ================================================= */}

            <div className="flex shrink-0 items-center gap-3">

              {/* MESSAGES */}

              <button
                type="button"
                onClick={() =>
                  handlePageChange("Messages")
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                aria-label="Messages"
              >
                ✉

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              </button>

              {/* =================================================
                  PROFILE
                  ================================================= */}

              <button
                type="button"
                onClick={() =>
                  handlePageChange("Profile")
                }
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50"
                aria-label="Open profile"
              >

                {/* PROFILE AVATAR */}

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-black text-[#0446A7]">

                  {seeker.full_name
                    ? seeker.full_name
                        .charAt(0)
                        .toUpperCase()
                    : "J"}

                </div>

                {/* PROFILE INFORMATION */}

                <div className="hidden text-left sm:block">

                  <p className="max-w-32 truncate text-sm font-bold text-[#123B70]">
                    {seeker.full_name ||
                      "Job Seeker"}
                  </p>

                  <p className="text-xs text-slate-500">
                    Job Seeker
                  </p>

                </div>

              </button>

            </div>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
            ================================================= */}

        <section className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {renderContent()}
        </section>

      </main>

    </div>
  );
}