
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppIcon from "../components/AppIcon";
import SidebarToggle from "../components/SidebarToggle";
import EmployersSidebar, {
  type EmployerMenuName,
} from "../components/EmployerSidebar";

import DashboardModule from "../employersmodules/DashboardModule";
import MyJobPostModule from "../employersmodules/MyJobPostModule";
import ApplicationsModule from "../employersmodules/ApplicationsModule";
import CompanyProfileModule from "../employersmodules/CompanyProfileModule";
import MessagesModule from "../employersmodules/MessagesModule";
import EmployerRegistrationProfileModule from "../employersmodules/EmployerRegistrationProfileModule";
import {
  getEmployerRegistrationChecklist,
  type EmployerVerificationDocument,
} from "../services/employerRegistration";

import { supabase } from "../services/supabase";

const portalBackground = new URL(
  "../assets/images/bry-bg.png",
  import.meta.url,
).href;

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
  verification_status: "pending" | "verified" | "not_approved";
  verification_refresh_required: boolean;
  logo_url: string | null;
  company_description: string | null;
  industry: string | null;
  website: string | null;
  registration_details: unknown;
  verification_documents: unknown;
}

interface JobPost {
  job_vacancy_id: string;
  employer_id: string;
  position_title: string;
  description: string | null;
  job_qualifications: string | null;
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
  applicant_name?: string | null;
  applicant_email?: string | null;
  applicant_contact_no?: string | null;
  applicant_address?: string | null;
  applicant_user_id?: string | null;
  applicant_qualification_files?: { name: string; path: string }[] | null;
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
  company_logo_url?: string | null;
}

interface EmployerNotification {
  message_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  sender_label: string;
}

interface MessageContactSummary {
  user_id: string;
  display_name: string;
  role: string;
}

async function loadUnreadEmployerMessages(
  userId: string,
): Promise<EmployerNotification[]> {
  const { data: messages, error: messagesError } = await supabase
    .from("peso_messages")
    .select("message_id, sender_user_id, body, created_at")
    .eq("recipient_user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false });

  if (messagesError) throw messagesError;
  if (!messages?.length) return [];

  const { data: contacts, error: contactsError } = await supabase.rpc(
    "get_peso_message_contacts",
  );
  if (contactsError) throw contactsError;

  const contactsByUserId = new Map(
    ((contacts ?? []) as MessageContactSummary[]).map((contact) => [
      contact.user_id,
      contact,
    ]),
  );

  return messages.map((message) => {
    const contact = contactsByUserId.get(message.sender_user_id);
    return {
      ...message,
      sender_label: contact
        ? `${contact.role} ${contact.display_name} messaged you`
        : "A PESO user messaged you",
    };
  });
}

async function loadEmployerApplications(
  employerId: string,
): Promise<ApplicationRow[]> {
  const { data: applicationRows, error: applicationError } = await supabase
    .from("application")
    .select(
      "application_id, employer_id, job_seeker_id, position_title, status, date_applied, applicant_name, applicant_email, applicant_contact_no, applicant_address, applicant_qualification_files",
    )
    .eq("employer_id", employerId)
    .order("date_applied", { ascending: false });

  if (applicationError) {
    throw new Error(`Applications could not be loaded: ${applicationError.message}`);
  }

  const rows = (applicationRows || []) as ApplicationRow[];
  const seekerIds = [
    ...new Set(rows.map((application) => application.job_seeker_id).filter(Boolean)),
  ];
  let seekerDetailsById = new Map<
    string,
    {
      name: string;
      email: string | null;
      contactNumber: string | null;
      userId: string | null;
    }
  >();

  if (seekerIds.length > 0) {
    const { data: seekers, error: seekerError } = await supabase
      .from("job_seeker")
      .select("job_seeker_id, user_id, full_name, email, contact_no")
      .in("job_seeker_id", seekerIds);

    if (seekerError) {
      console.error("Applicant names could not be loaded:", seekerError);
    } else {
      seekerDetailsById = new Map(
        (seekers || []).map((seeker) => [
          seeker.job_seeker_id,
          {
            name: seeker.full_name || "Job Seeker",
            email: seeker.email,
            contactNumber: seeker.contact_no,
            userId: seeker.user_id,
          },
        ]),
      );
    }
  }

  return rows.map((application) => {
    const seeker = seekerDetailsById.get(application.job_seeker_id);
    return {
      ...application,
      applicant_name: application.applicant_name || seeker?.name || "Job Seeker",
      applicant_email: application.applicant_email || seeker?.email || null,
      contact_number:
        application.applicant_contact_no || seeker?.contactNumber || null,
      applicant_address: application.applicant_address || null,
      applicant_user_id: seeker?.userId ?? null,
    };
  });
}

/* =========================
   CONSTANTS
========================= */

const menuItems: { name: MenuName; icon: string }[] = [
  { name: "Dashboard", icon: "▦" },
  { name: "My Job Posts", icon: "▤" },
  { name: "Applications", icon: "✓" },
  { name: "Messages", icon: "✉" },
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
  const [notifications, setNotifications] = useState<EmployerNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [messageContactToOpen, setMessageContactToOpen] = useState<string | undefined>();

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

  useEffect(() => {
    const userId = profile?.user_id;
    if (!userId) return;

    let active = true;
    const refreshNotifications = async () => {
      try {
        const unreadMessages = await loadUnreadEmployerMessages(userId);
        if (active) {
          setNotifications(unreadMessages);
          setNotificationsError("");
        }
      } catch (notificationError) {
        console.error("Could not load Employer notifications:", notificationError);
        if (active) {
          setNotificationsError("Notifications could not be loaded. Please try again.");
        }
      }
    };

    void refreshNotifications();

    const channel = supabase
      .channel(`employer-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peso_messages",
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => void refreshNotifications(),
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notificationsOpen]);

  const openNotifications = async () => {
    if (!profile?.user_id) return;
    setNotificationsOpen(true);
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      setNotifications(await loadUnreadEmployerMessages(profile.user_id));
    } catch (notificationError) {
      console.error("Could not load Employer notifications:", notificationError);
      setNotificationsError("Notifications could not be loaded. Please try again.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const openNotificationConversation = async (
    notification: EmployerNotification,
  ) => {
    const { error: readError } = await supabase
      .from("peso_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("message_id", notification.message_id);

    if (readError) {
      console.error("Could not mark notification as read:", readError);
      setNotificationsError("The message could not be marked as read. Please try again.");
      return;
    }

    setNotifications((current) =>
      current.filter((item) => item.message_id !== notification.message_id),
    );
    setNotificationsOpen(false);
    setMessageContactToOpen(notification.sender_user_id);
    navigate("Messages");
  };

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
          "employer_id, user_id, name, address, contact_person, contact_no, email, is_verified, verification_status, verification_refresh_required, logo_url, company_description, industry, website, registration_details, verification_documents"
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
          "job_vacancy_id, employer_id, position_title, description, job_qualifications, requirements, location, employment_type, job_classification, salary_min, salary_max, vacancies_available, status, date_posted, deadline, image_url"
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

    setApplications(await loadEmployerApplications(employer.employer_id));
  }, []);

  useEffect(() => {
    const employerId = profile?.employer_id;
    if (!employerId) return;

    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(`employer-applications-${employerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "application",
          filter: `employer_id=eq.${employerId}`,
        },
        () => {
          if (refreshTimer) clearTimeout(refreshTimer);
          refreshTimer = setTimeout(() => {
            void loadEmployerApplications(employerId)
              .then((updatedApplications) => {
                if (active) {
                  setApplications(updatedApplications);
                  setError("");
                }
              })
              .catch((applicationError: unknown) => {
                console.error("Could not refresh employer applications:", applicationError);
                if (active) {
                  setError(
                    applicationError instanceof Error
                      ? applicationError.message
                      : "Applications could not be updated in real time.",
                  );
                }
              });
          }, 150);
        },
      )
      .subscribe((status, subscriptionError) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            "Employer application realtime subscription failed:",
            subscriptionError,
          );
          if (active) {
            setError(
              "Live application updates are temporarily unavailable. Refresh the page to reconnect.",
            );
          }
        }
      });

    return () => {
      active = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [profile?.employer_id]);

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
    if (!window.confirm("Are you sure you want to log out?")) return;

    setError("");

    const { error: signOutError } =
      await supabase.auth.signOut();

    if (signOutError) {
      setError(`Unable to log out: ${signOutError.message}`);
      return;
    }

    window.location.replace("/");
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
    updatedProfile: CompanyProfileForm,
    logoFile: File | null,
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

    let logoUrl = profile.logo_url;
    let uploadedLogoPath: string | null = null;

    if (logoFile) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(logoFile.type)) {
        throw new Error("Choose a JPG, PNG, or WebP company image.");
      }
      if (logoFile.size > 5 * 1024 * 1024) {
        throw new Error("Company image must be 5 MB or smaller.");
      }

      const safeFileName = logoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      uploadedLogoPath = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;
      const { error: uploadError } = await supabase.storage
        .from("employer-logos")
        .upload(uploadedLogoPath, logoFile, {
          cacheControl: "3600",
          contentType: logoFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Company image upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("employer-logos")
        .getPublicUrl(uploadedLogoPath);
      logoUrl = publicUrlData.publicUrl;
    }

    const changes = {
      name: updatedProfile.company_name.trim(),
      address: updatedProfile.company_address.trim() || null,
      contact_person:
        updatedProfile.contact_person?.trim() || null,
      contact_no: updatedProfile.company_phone.trim() || null,
      logo_url: logoUrl,
      email: updatedProfile.company_email.trim(),
      company_description: updatedProfile.company_description.trim() || null,
      industry: updatedProfile.industry?.trim() || null,
      website: updatedProfile.website?.trim() || null,
    };

    const { data, error: updateError } = await supabase
      .from("employer")
      .update(changes)
      .eq("user_id", user.id)
      .select(
        "employer_id, user_id, name, address, contact_person, contact_no, email, is_verified, verification_status, verification_refresh_required, logo_url, company_description, industry, website, registration_details, verification_documents"
      )
      .maybeSingle();

    if (updateError) {
      if (uploadedLogoPath) {
        const { error: cleanupError } = await supabase.storage
          .from("employer-logos")
          .remove([uploadedLogoPath]);
        if (cleanupError) {
          console.error("Could not remove unreferenced company image:", cleanupError);
        }
      }
      throw new Error(
        `Company profile update failed: ${updateError.message}`
      );
    }

    if (!data) {
      if (uploadedLogoPath) {
        const { error: cleanupError } = await supabase.storage
          .from("employer-logos")
          .remove([uploadedLogoPath]);
        if (cleanupError) {
          console.error("Could not remove unreferenced company image:", cleanupError);
        }
      }
      throw new Error(
        "Profile was not updated. Check your employer permissions."
      );
    }

    setProfile(data as EmployerProfile);
    if (uploadedLogoPath && profile.logo_url) {
      const oldLogoPath = profile.logo_url.split("/employer-logos/")[1]?.split("?")[0];
      if (oldLogoPath) {
        const { error: removeError } = await supabase.storage
          .from("employer-logos")
          .remove([decodeURIComponent(oldLogoPath)]);
        if (removeError) {
          console.error("Could not remove previous company image:", removeError);
        }
      }
    }
    return logoUrl;
  };

  const handleSaveRegistrationDetails = async (
    details: Record<string, unknown>,
  ) => {
    if (!profile?.user_id) {
      throw new Error("Employer profile is not available.");
    }

    const text = (key: string) =>
      typeof details[key] === "string" ? details[key] as string : "";
    const industries = Array.isArray(details.industries)
      ? details.industries.filter(
          (industry): industry is string => typeof industry === "string",
        )
      : [];
    const address = [
      text("address_house_street"),
      text("address_barangay"),
      text("address_city"),
    ].filter(Boolean).join(", ");
    const changes = {
      registration_details: {
        ...details,
      },
      verification_details_reviewed_at: new Date().toISOString(),
      industry: industries.join(", ") || null,
      website: text("website").trim() || null,
      email: text("email").trim().toLowerCase() || profile.email,
      address: address || profile.address,
      contact_person: text("hr_manager_name").trim() || profile.contact_person,
      contact_no: text("mobile").trim() || profile.contact_no,
    };

    const { data, error: updateError } = await supabase
      .from("employer")
      .update(changes)
      .eq("user_id", profile.user_id)
      .select(
        "employer_id, user_id, name, address, contact_person, contact_no, email, is_verified, verification_status, verification_refresh_required, logo_url, company_description, industry, website, registration_details, verification_documents",
      )
      .maybeSingle();

    if (updateError) {
      throw new Error(`Registration details could not be saved: ${updateError.message}`);
    }
    if (!data) {
      throw new Error("Registration details were not saved. Check your employer permissions.");
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
    company_description: profile.company_description || "",
    industry: profile.industry,
    website: profile.website,
    contact_person: profile.contact_person || "",
    company_logo_url: profile.logo_url,
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
            employerName={profile.name}
            employerLogoUrl={profile.logo_url}
            profileComplete={getEmployerRegistrationChecklist(
              profile.registration_details,
              profile.verification_documents,
              profile,
            ).every((item) => item.complete)}
            isVerified={profile.is_verified}
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
        return <MessagesModule initialContactId={messageContactToOpen} />;

      case "Company Profile":
        return (
          <div className="space-y-8">
            <CompanyProfileModule
              profile={companyProfile}
              onSave={handleSaveCompanyProfile}
            />
            <EmployerRegistrationProfileModule
              profile={{
                employer_id: profile.employer_id,
                user_id: profile.user_id || "",
                name: profile.name,
                email: profile.email,
                address: profile.address,
                contact_person: profile.contact_person,
                contact_no: profile.contact_no,
                industry: profile.industry,
                website: profile.website,
              }}
              registrationDetails={profile.registration_details}
              verificationDocuments={profile.verification_documents}
              onSave={handleSaveRegistrationDetails}
              onDocumentsSaved={(documents: EmployerVerificationDocument[]) =>
                setProfile((current) =>
                  current ? { ...current, verification_documents: documents } : current,
                )
              }
            />
          </div>
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
    <div className="relative isolate min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(245, 248, 252, 0.88), rgba(245, 248, 252, 0.88)), url("${portalBackground}")`,
        }}
      />

      {/* Sidebar */}
      <EmployersSidebar
        activeMenu={activeMenu as EmployerMenuName}
        setActiveMenu={navigate}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onSignOut={signOut}
        hasUnreadMessages={notifications.length > 0}
      />

      {/* Mobile Sidebar Toggle */}
      <SidebarToggle
        open={isSidebarOpen}
        onClick={() => setIsSidebarOpen((value) => !value)}
        label="Toggle employer navigation menu"
      />

      {/* Main Content */}
      <main className="min-h-screen lg:ml-64">
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

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => void openNotifications()}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ""}`}
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
              >
                <AppIcon name="bell" className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>

              <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#0446A7] text-sm font-bold text-white">
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={`${displayName} logo`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  initial
                )}
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
                {refreshing ? "Retrying..." : "Try Again"}
              </button>
            </div>
          )}

          {profile.verification_refresh_required ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <p>
                Your account was automatically unverified because your company
                screening details need an update. Review and resubmit them so
                PESO can verify your account again.
              </p>
              <button
                type="button"
                onClick={() => navigate("Company Profile")}
                className="shrink-0 rounded-lg bg-amber-800 px-3 py-2 font-bold text-white hover:bg-amber-900"
              >
                Update company details
              </button>
            </div>
          ) : !profile.is_verified &&
            profile.verification_status === "pending" &&
            getEmployerRegistrationChecklist(
              profile.registration_details,
              profile.verification_documents,
              profile,
            ).every((item) => item.complete) ? (
            <p
              role="status"
              className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
            >
              Your employer account is awaiting PESO verification. Job posting
              is available after PESO approves your company details.
            </p>
          ) : null}

          {renderContent()}
        </section>
      </main>

      {notificationsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/40 p-4 pt-[calc(env(safe-area-inset-top)+5rem)] sm:justify-end sm:pr-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setNotificationsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="employer-notifications-title"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2
                  id="employer-notifications-title"
                  className="text-lg font-bold text-[#123B70]"
                >
                  Notifications
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Messages from job seekers and PESO staff.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                aria-label="Close notifications"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </header>

            {notificationsError && (
              <p
                role="alert"
                className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {notificationsError}
              </p>
            )}

            {notificationsLoading ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <AppIcon
                  name="bell"
                  className="mx-auto h-8 w-8 text-slate-300"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  You’re all caught up
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  You have no unread notifications.
                </p>
              </div>
            ) : (
              <ul className="max-h-[min(60vh,32rem)] divide-y divide-slate-100 overflow-y-auto">
                {notifications.map((notification) => (
                  <li key={notification.message_id}>
                    <button
                      type="button"
                      onClick={() =>
                        void openNotificationConversation(notification)
                      }
                      className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-blue-50"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800">
                          {notification.sender_label}
                        </span>
                        <span className="mt-1 block whitespace-pre-wrap break-words text-xs text-slate-600">
                          {notification.body}
                        </span>
                        <span className="mt-2 block text-[10px] text-slate-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
