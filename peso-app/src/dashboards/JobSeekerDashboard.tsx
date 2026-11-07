import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppIcon from "../components/AppIcon";
import ProfileAvatar from "../components/ProfileAvatar";

import { supabase } from "../services/supabase";
import {
  RESUME_ACCEPT,
  RESUME_FORMATS_LABEL,
  RESUME_MIME_TYPES,
  getResumeExtension,
} from "../services/resumes";

import JobSeekerSidebar, {
  type JobSeekerPage,
} from "../components/JobseekerSidebar";

import HomeModule from "../jobseekersmodules/HomeModule";
import JobsModule from "../jobseekersmodules/JobsModule";
import SavedJobsModule from "../jobseekersmodules/SavedJobsModule";
import ApplicationsModule from "../jobseekersmodules/ApplicationsModule";
import MessagesModule from "../jobseekersmodules/MessagesModule";
import AIChatbotModule from "../jobseekersmodules/AIChatbotModule";
import JobMatchesModule from "../jobseekersmodules/JobMatchesModule";
import {
  areJobSeekerProfileSectionsComplete,
  JOB_SEEKER_PROFILE_SECTION_TITLES,
  getIncompleteJobSeekerProfileSections,
  isJobSeekerProfileComplete,
} from "../services/jobSeekerProfile";

const portalBackground = new URL(
  "../assets/images/bry-bg.png",
  import.meta.url,
).href;

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
  birth_date: string | null;
  resume_url: string | null;
  verification_status: "pending" | "verified" | "not_approved";
  registration_details: unknown;
};

type JobSeekerNotification = {
  message_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  sender_label: string;
};

type MessageContactSummary = {
  user_id: string;
  display_name: string;
  role: string;
};

async function loadUnreadJobSeekerMessages(
  userId: string,
): Promise<JobSeekerNotification[]> {
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
    const roleLabel =
      contact?.role === "Admin"
        ? "PESO Admin"
        : contact?.role === "Staff"
          ? "PESO Staff"
          : contact?.role || "PESO";

    return {
      ...message,
      sender_label: contact?.display_name
        ? `${roleLabel} ${contact.display_name} messaged you`
        : `${roleLabel} messaged you`,
    };
  });
}

type ScreeningValue = string | number | boolean | string[] | null;
type ScreeningDetails = Record<string, ScreeningValue>;

type ScreeningField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "checkboxes" | "checkbox";
  options?: string[];
  required?: boolean;
};

const screeningSections: {
  title: string;
  fields: ScreeningField[];
}[] = [
  {
    title: "I. Personal Information",
    fields: [
      { key: "middleName", label: "Middle Name", required: true },
      { key: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
      { key: "sex", label: "Sex", type: "select", options: ["Female", "Male", "Prefer not to say"], required: true },
      { key: "contactNumber", label: "Contact Number", required: true },
      { key: "presentAddress", label: "Present Address", type: "textarea", required: true },
      { key: "permanentAddress", label: "Permanent Address", type: "textarea", required: true },
      { key: "civilStatus", label: "Civil Status", type: "select", options: ["Single", "Married", "Widowed", "Separated", "Annulled", "Others"], required: true },
      { key: "fatherName", label: "Father's Name", required: true },
      { key: "motherName", label: "Mother's Name", required: true },
      { key: "parentsCivilStatus", label: "Parents' Civil Status", type: "select", options: ["Single", "Married", "Widowed", "Separated", "Annulled", "Others"], required: true },
      { key: "governmentIdType", label: "Type of Government ID", type: "select", options: ["Philippine Identification (PhilID)", "SSS", "GSIS", "UMID", "Driver's License", "Passport", "Voter's ID", "PRC ID", "PhilHealth", "Postal ID", "Other"], required: true },
      { key: "governmentIdNumber", label: "Government ID Number", required: true },
      { key: "heightCm", label: "Height (cm)", type: "number", required: true },
      { key: "weightKg", label: "Weight (kg)", type: "number", required: true },
      { key: "disability", label: "Disability", type: "select", options: ["Visual", "Hearing", "Speech", "Physical", "Mental", "Other", "N/A"], required: true },
      { key: "privacyConsent", label: "I agree to the Data Privacy Statement", type: "checkbox", required: true },
    ],
  },
  {
    title: "II. Employment Information",
    fields: [
      { key: "employmentStatus", label: "Employment Status", type: "select", options: ["Employed", "Wage Employed", "Self-employed", "Fisherman/Fisherfolk", "Vendor/Retailer", "Home-based Worker", "Transport", "Domestic Worker", "Freelancer", "Artisan/Craft Worker", "Unemployed", "N/A"], required: true },
      { key: "unemploymentDurationMonths", label: "Months Looking for Work", type: "number" },
      { key: "unemploymentReason", label: "Reason for Unemployment", type: "select", options: ["New entrant/Fresh graduate", "Finished contract", "Resigned", "Retired", "Terminated/Laid off due to calamity", "Terminated/Laid off (local)", "Terminated/Laid off (abroad)", "Other"] },
      { key: "isOfw", label: "Are you an OFW?", type: "select", options: ["Yes", "No"], required: true },
      { key: "isFormerOfw", label: "Are you a former OFW?", type: "select", options: ["Yes", "No"], required: true },
      { key: "is4PsBeneficiary", label: "Are you a 4Ps beneficiary?", type: "select", options: ["Yes", "No"], required: true },
      { key: "preferredOccupation", label: "Preferred Occupation", required: true },
      { key: "companyApplyingFor", label: "Company Applying For", required: true },
      { key: "preferredWorkLocation", label: "Preferred Work Location", type: "select", options: ["Mabini", "Batangas Province", "Anywhere in the Philippines", "Other"], required: true },
      { key: "otherWorkLocation", label: "Other Preferred Work Location" },
    ],
  },
  {
    title: "III. Language / Dialect Proficiency",
    fields: [
      { key: "languages", label: "Languages", type: "checkboxes", options: ["Filipino", "English", "Mandarin"], required: true },
      { key: "otherLanguage", label: "Other Language / Dialect" },
    ],
  },
  {
    title: "IV. Educational Background",
    fields: [
      { key: "educationLevel", label: "Highest Educational Attainment", type: "select", options: ["Elementary", "High School", "Senior High School", "Technical/Vocational", "College", "Postgraduate", "Undergraduate", "No formal education"], required: true },
      { key: "elementaryEducation", label: "Elementary (school / year graduated)", required: true },
      { key: "secondaryEducation", label: "Secondary (school / K-12 / strand / year graduated)", required: true },
      { key: "tertiaryEducation", label: "Tertiary (university / course / year graduated)", required: true },
      { key: "graduateStudies", label: "Graduate Studies / Postgraduate" },
      { key: "undergraduateLevel", label: "Undergraduate Level" },
    ],
  },
  {
    title: "V. Technical / Vocational and Other Training",
    fields: [
      { key: "training1", label: "Training / Course 1", type: "textarea", required: true },
      { key: "training2", label: "Training / Course 2", type: "textarea", required: true },
      { key: "training3", label: "Training / Course 3", type: "textarea", required: true },
    ],
  },
  {
    title: "VI. Eligibility / Professional License",
    fields: [
      { key: "eligibility1", label: "Eligibility / Professional License 1", type: "textarea", required: true },
      { key: "eligibility2", label: "Eligibility / Professional License 2", type: "textarea", required: true },
    ],
  },
  {
    title: "VII. Work Experience",
    fields: [
      { key: "noWorkExperience", label: "I have no previous work experience", type: "checkbox", required: true },
      { key: "workExperience1", label: "Most Recent Work Experience", type: "textarea", required: true },
      { key: "workExperience2", label: "Previous Work Experience 2", type: "textarea" },
      { key: "workExperience3", label: "Previous Work Experience 3", type: "textarea" },
    ],
  },
  {
    title: "VIII. Other Skills Acquired Without Certificate",
    fields: [
      { key: "otherSkills", label: "Other Skills Acquired Without Certificate", type: "textarea", required: true },
    ],
  },
  {
    title: "IX. History of SPES / GIP Engagement",
    fields: [
      { key: "spesGipHistory", label: "Participated in SPES / GIP?", type: "select", options: ["Yes", "No"], required: true },
      { key: "engagementPeriod", label: "Period of Engagement", required: true },
      { key: "spesGipId", label: "SPES / GIP ID Number", required: true },
    ],
  },
  {
    title: "Certification / Authorization",
    fields: [
      { key: "signature", label: "E-Signature", required: true },
      { key: "signatureDate", label: "Date Signed", type: "date", required: true },
    ],
  },
];

function parseScreeningDetails(value: unknown): ScreeningDetails {
  let details = value;
  if (typeof details === "string") {
    try {
      details = JSON.parse(details);
    } catch {
      return {};
    }
  }
  if (!details || typeof details !== "object" || Array.isArray(details)) return {};

  return Object.fromEntries(
    Object.entries(details).filter(([, fieldValue]) =>
      fieldValue === null ||
      typeof fieldValue === "string" ||
      typeof fieldValue === "number" ||
      typeof fieldValue === "boolean" ||
      (Array.isArray(fieldValue) && fieldValue.every((item) => typeof item === "string")),
    ),
  ) as ScreeningDetails;
}

function SignaturePad({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (signature: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));

      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);

      if (value.startsWith("data:image/")) {
        const image = new Image();
        image.onload = () => {
          context.drawImage(image, 0, 0, bounds.width, bounds.height);
        };
        image.src = value;
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [value]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    if (!context) return;

    const point = getPoint(event);
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.1, point.y + 0.1);
    context.strokeStyle = "#123B70";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
  };

  const continueDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(event.currentTarget.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        aria-label="Draw your signature"
        className={`mt-2 h-40 w-full rounded-lg border border-slate-300 bg-white touch-none ${disabled ? "cursor-not-allowed opacity-70" : "cursor-crosshair"}`}
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-normal normal-case tracking-normal text-slate-500">
          Sign in the box using your mouse, finger, or stylus.
        </p>
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || !value}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold normal-case tracking-normal text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

// =====================================================
// DASHBOARD
// =====================================================

export default function JobSeekerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activePage, setActivePage] = useState<JobSeekerPage>(() => {
    const state = location.state;
    if (state && typeof state === "object" && "page" in state) {
      if (state.page === "Profile" || state.page === "Jobs") {
        return state.page;
      }
    }

    return new URLSearchParams(location.search).has("job") ? "Jobs" : "Home";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(location.search).has("job")) {
      setActivePage("Jobs");
    }
  }, [location.search]);

  const [seeker, setSeeker] = useState<Seeker | null>(null);
  const [hasProfilePhoto, setHasProfilePhoto] = useState<boolean | null>(null);
  const [notifications, setNotifications] = useState<JobSeekerNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [messageContactToOpen, setMessageContactToOpen] = useState<string | undefined>();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingScreening, setEditingScreening] = useState(false);
  const [savingScreening, setSavingScreening] = useState(false);
  const [screeningForm, setScreeningForm] = useState<ScreeningDetails>({});
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [openingResume, setOpeningResume] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeSuccess, setResumeSuccess] = useState("");
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

  useEffect(() => {
    if (!seeker?.user_id) return;

    let active = true;
    const refreshNotifications = async () => {
      try {
        const unreadMessages = await loadUnreadJobSeekerMessages(seeker.user_id);
        if (active) {
          setNotifications(unreadMessages);
          setNotificationsError("");
        }
      } catch (notificationError) {
        console.error("Could not load Job Seeker notifications:", notificationError);
        if (active) {
          setNotificationsError("Notifications could not be loaded. Please try again.");
        }
      }
    };

    void refreshNotifications();

    const channel = supabase
      .channel(`job-seeker-notifications-${seeker.user_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peso_messages",
          filter: `recipient_user_id=eq.${seeker.user_id}`,
        },
        () => void refreshNotifications(),
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [seeker?.user_id]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notificationsOpen]);

  const openNotifications = async () => {
    if (!seeker?.user_id) return;
    setNotificationsOpen(true);
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      setNotifications(await loadUnreadJobSeekerMessages(seeker.user_id));
    } catch (notificationError) {
      console.error("Could not load Job Seeker notifications:", notificationError);
      setNotificationsError("Notifications could not be loaded. Please try again.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const openNotificationConversation = async (
    notification: JobSeekerNotification,
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
    handlePageChange("Messages");
  };

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
            birth_date,
            resume_url,
            verification_status,
            registration_details
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

  const startScreeningEdit = () => {
    if (!seeker) return;
    const details = parseScreeningDetails(seeker.registration_details);
    details.dateOfBirth = seeker.birth_date || String(details.dateOfBirth || "");
    details.contactNumber = seeker.contact_no || String(details.contactNumber || "");
    details.presentAddress = seeker.address || String(details.presentAddress || "");
    setScreeningForm(details);
    setProfileError("");
    setProfileSuccess("");
    setEditingScreening(true);
  };

  const saveScreening = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!seeker || savingScreening) return;

    const birthDate = String(screeningForm.dateOfBirth || "").trim();
    const contactNumber = String(screeningForm.contactNumber || "").trim();
    const presentAddress = String(screeningForm.presentAddress || "").trim();
    const previousDetails = parseScreeningDetails(seeker.registration_details);
    const screeningDetails = {
      ...screeningForm,
      privacyConsentAt:
        screeningForm.privacyConsent === true
          ? previousDetails.privacyConsentAt || new Date().toISOString()
          : null,
    };

    setSavingScreening(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const { data, error: updateError } = await supabase
        .from("job_seeker")
        .update({
          registration_details: screeningDetails,
          birth_date: birthDate || null,
          contact_no: contactNumber || null,
          address: presentAddress || null,
        })
        .eq("job_seeker_id", seeker.job_seeker_id)
        .select("registration_details, birth_date, contact_no, address")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) {
        throw new Error("Your screening details were not saved. Please sign in again and try once more.");
      }

      setSeeker({ ...seeker, ...data });
      setEditingScreening(false);
      setProfileSuccess("Your screening details have been updated.");
    } catch (saveError) {
      console.error("Job seeker screening details update error:", saveError);
      setProfileError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update your screening details. Please try again.",
      );
    } finally {
      setSavingScreening(false);
    }
  };

  const saveResume = async () => {
    if (!seeker || !resumeFile || uploadingResume) return;

    const extension = getResumeExtension(resumeFile.name);

    if (!RESUME_MIME_TYPES[extension]) {
      setResumeError(`Please choose a ${RESUME_FORMATS_LABEL} file.`);
      return;
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      setResumeError("Resume must not exceed 5 MB.");
      return;
    }

    setUploadingResume(true);
    setResumeError("");
    setResumeSuccess("");

    const resumePath = `${seeker.user_id}/${Date.now()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("Resume Files")
        .upload(resumePath, resumeFile, {
          upsert: false,
          contentType: RESUME_MIME_TYPES[extension],
        });

      if (uploadError) throw uploadError;

      const { data, error: profileError } = await supabase
        .from("job_seeker")
        .update({ resume_url: resumePath })
        .eq("user_id", seeker.user_id)
        .select("resume_url")
        .maybeSingle();

      if (profileError) {
        const { error: cleanupError } = await supabase.storage
          .from("Resume Files")
          .remove([resumePath]);
        if (cleanupError) {
          console.error("Could not remove unlinked resume upload:", cleanupError);
        }
        throw profileError;
      }

      if (!data) {
        const { error: cleanupError } = await supabase.storage
          .from("Resume Files")
          .remove([resumePath]);
        if (cleanupError) {
          console.error("Could not remove unlinked resume upload:", cleanupError);
        }
        throw new Error(
          "Your profile could not be updated. Please sign in again and try once more.",
        );
      }

      const previousResumePath = seeker.resume_url;
      setSeeker({ ...seeker, resume_url: data.resume_url });
      setResumeFile(null);
      setResumeSuccess("Your resume has been uploaded.");

      if (previousResumePath && previousResumePath !== resumePath) {
        const { error: removeError } = await supabase.storage
          .from("Resume Files")
          .remove([previousResumePath]);
        if (removeError) {
          console.error("Previous resume could not be removed:", removeError);
          setResumeSuccess(
            "Your resume was updated, but the previous file could not be removed.",
          );
        }
      }
    } catch (uploadError) {
      console.error("Resume upload error:", uploadError);
      setResumeError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload your resume. Please try again.",
      );
    } finally {
      setUploadingResume(false);
    }
  };

  const openResume = async () => {
    if (!seeker?.resume_url || openingResume) return;

    setOpeningResume(true);
    setResumeError("");

    try {
      const { data, error: signedUrlError } = await supabase.storage
        .from("Resume Files")
        .createSignedUrl(seeker.resume_url, 60, { download: true });

      if (signedUrlError) throw signedUrlError;

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    } catch (openError) {
      console.error("Resume download error:", openError);
      setResumeError(
        openError instanceof Error
          ? openError.message
          : "Unable to open your resume. Please try again.",
      );
    } finally {
      setOpeningResume(false);
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

    const savedScreeningDetails = parseScreeningDetails(seeker.registration_details);
    const incompleteSections = getIncompleteJobSeekerProfileSections(
      seeker.registration_details,
    );
    const incompleteTasks = [
      ...incompleteSections,
      ...(!seeker.resume_url ? ["Resume / CV"] : []),
    ];
    const completedTaskCount =
      JOB_SEEKER_PROFILE_SECTION_TITLES.length +
      1 -
      incompleteTasks.length;
    const setupProgress = Math.round(
      (completedTaskCount / (JOB_SEEKER_PROFILE_SECTION_TITLES.length + 1)) * 100,
    );
    savedScreeningDetails.dateOfBirth =
      seeker.birth_date || String(savedScreeningDetails.dateOfBirth || "");
    savedScreeningDetails.contactNumber =
      seeker.contact_no || String(savedScreeningDetails.contactNumber || "");
    savedScreeningDetails.presentAddress =
      seeker.address || String(savedScreeningDetails.presentAddress || "");

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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#123B70]">
                Job Seeker Profile Setup
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Complete each task and upload your resume before applying for a job.
              </p>
            </div>
            <p className="shrink-0 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">
              {completedTaskCount} of {JOB_SEEKER_PROFILE_SECTION_TITLES.length + 1} complete
            </p>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Profile setup progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={setupProgress}
          >
            <div
              className="h-full rounded-full bg-blue-700 transition-all"
              style={{ width: `${setupProgress}%` }}
            />
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {[...JOB_SEEKER_PROFILE_SECTION_TITLES, "Resume / CV"].map((task) => {
              const complete = !incompleteTasks.includes(task);
              return (
                <li
                  key={task}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    complete
                      ? "bg-green-50 text-green-800"
                      : "bg-amber-50 text-amber-900"
                  }`}
                >
                  <span aria-hidden="true">{complete ? "✓" : "○"}</span>
                  <span>{task}</span>
                  <span className="ml-auto text-xs font-semibold">
                    {complete ? "Complete" : "To do"}
                  </span>
                </li>
              );
            })}
          </ul>
          {incompleteTasks.length > 0 && !editingScreening && (
            <button
              type="button"
              onClick={startScreeningEdit}
              className="mt-4 rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#064A91]"
            >
              Continue profile setup
            </button>
          )}
          {incompleteTasks.length === 0 && (
            <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">
              Your profile is complete and ready for job applications.
            </p>
          )}
        </section>

        {/* PROFILE CARD */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={saveProfile}>
            <div className="flex flex-col gap-5 border-b border-slate-100 bg-slate-50 px-6 py-6 sm:flex-row sm:items-center">
              <ProfileAvatar
                userId={seeker.user_id}
                fullName={seeker.full_name}
                size="large"
                showControls={editingProfile}
                onPhotoStatusChange={setHasProfilePhoto}
              />
              <div className="min-w-0">
                <h2 className="text-lg font-black text-[#123B70]">
                  {seeker.full_name || "Job Seeker"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Job Seeker</p>
                <p className="mt-1 break-words text-sm text-slate-500">
                  {seeker.email || "Not provided"}
                </p>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">
                Full Name
                <input
                  value={editingProfile ? profileForm.full_name : seeker.full_name}
                  onChange={(event) => setProfileForm({ ...profileForm, full_name: event.target.value })}
                  required
                  maxLength={120}
                  disabled={!editingProfile || savingProfile}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Email Address
                <input
                  type="email"
                  value={seeker.email || ""}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-500"
                />
                <span className="mt-1 block text-xs font-normal text-slate-400">
                  Contact support to change your sign-in email.
                </span>
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Contact Number
                <input
                  type="tel"
                  value={editingProfile ? profileForm.contact_no : seeker.contact_no || ""}
                  onChange={(event) => setProfileForm({ ...profileForm, contact_no: event.target.value })}
                  maxLength={30}
                  disabled={!editingProfile || savingProfile}
                  placeholder="Not provided"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Address
                <textarea
                  value={editingProfile ? profileForm.address : seeker.address || ""}
                  onChange={(event) => setProfileForm({ ...profileForm, address: event.target.value })}
                  maxLength={300}
                  rows={2}
                  disabled={!editingProfile || savingProfile}
                  placeholder="Not provided"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                Resume / CV
                <input
                  value={seeker.resume_url ? "Resume uploaded" : "No resume uploaded"}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-500"
                />
                <span className="mt-1 block text-xs font-normal text-slate-400">
                  Use the resume controls below to upload or replace your resume.
                </span>
              </label>

              {editingProfile ? (
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    disabled={savingProfile}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123B70] disabled:cursor-wait disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <div className="flex justify-end border-t border-slate-100 pt-5 sm:col-span-2">
                  <button
                    type="button"
                    onClick={startProfileEdit}
                    className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123B70]"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        <form
          onSubmit={saveScreening}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#123B70]">Screening Details</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review and update the information you provided for employment screening.
              </p>
            </div>
            {!editingScreening && (
              <button
                type="button"
                onClick={startScreeningEdit}
                className="rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#064A91]"
              >
                Edit Screening Details
              </button>
            )}
          </div>

          <div className="space-y-6 p-6">
            {screeningSections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h3 className="border-b border-slate-100 pb-2 text-base font-bold text-[#123B70]">
                  {section.title}
                </h3>
                {section.title === "I. Personal Information" && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <h4 className="font-bold text-slate-900">
                      Data Privacy Statement / Consent
                    </h4>
                    <p>
                      The Public Employment Service Office (PESO) of the
                      Municipality of Mabini, Batangas recognizes its
                      responsibilities under Republic Act No. 10173, the Data
                      Privacy Act of 2012. Information collected will be stored
                      in the office&apos;s authorized information system,
                      accessed only by authorized PESO Mabini personnel, and
                      protected using appropriate safeguards.
                    </p>
                    <p>
                      Information will be used for job application and referral
                      services, DOLE reporting, and Labor Market Information
                      collection. Personal information will not be disclosed
                      without consent and may be retained for up to ten years
                      for Labor Market Information purposes.
                    </p>
                  </div>
                )}
                {section.title === "Certification / Authorization" && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    I certify that the information I provided is true and correct
                    to the best of my knowledge. I authorize PESO Mabini to
                    include my profile in its employment information system
                    and use my personal information for employment facilitation
                    in accordance with Republic Act No. 10173. I understand
                    that DOLE/PESO is not obligated to seek employment on my
                    behalf.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.fields.map((field) => {
                    const rawValue = editingScreening
                      ? screeningForm[field.key]
                      : savedScreeningDetails[field.key];
                    const displayValue = Array.isArray(rawValue)
                      ? rawValue.join(", ")
                      : typeof rawValue === "boolean"
                        ? rawValue ? "Yes" : "No"
                        : String(rawValue ?? "").trim() || "Not provided";
                    const controlClass =
                      "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

                    return (
                      <div
                        key={field.key}
                        className={`rounded-xl bg-slate-50 p-4 ${field.type === "checkboxes" || field.type === "checkbox" || field.key === "signature" ? "sm:col-span-2" : ""}`}
                      >
                        {editingScreening ? (
                          field.key === "signature" ? (
                            <div className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                              {field.label}
                              {field.required && <span className="text-red-600"> *</span>}
                              {typeof rawValue === "string" &&
                                rawValue.length > 0 &&
                                !rawValue.startsWith("data:image/") && (
                                  <span className="mt-2 block rounded-lg bg-white p-3 text-sm font-normal normal-case tracking-normal text-slate-600">
                                    Previously saved typed signature: {rawValue}. Draw below to replace it.
                                  </span>
                                )}
                              <SignaturePad
                                value={String(rawValue ?? "")}
                                disabled={savingScreening}
                                onChange={(signature) =>
                                  setScreeningForm({
                                    ...screeningForm,
                                    [field.key]: signature,
                                  })
                                }
                              />
                            </div>
                          ) : field.type === "checkbox" ? (
                            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={rawValue === true}
                                disabled={savingScreening}
                                onChange={(event) =>
                                  setScreeningForm({
                                    ...screeningForm,
                                    [field.key]: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded border-slate-300 accent-[#0759AE]"
                              />
                              <span>
                                {field.label}
                                {field.required && <span className="text-red-600"> *</span>}
                              </span>
                            </label>
                          ) : (
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                              {field.label}
                              {field.required && <span className="text-red-600"> *</span>}
                              {field.type === "checkboxes" ? (
                                <span className="mt-2 grid gap-2 sm:grid-cols-3">
                                  {field.options?.map((option) => {
                                    const selectedLanguages = Array.isArray(rawValue)
                                      ? rawValue
                                      : [];
                                    return (
                                      <span key={option} className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm font-medium normal-case tracking-normal text-slate-700">
                                        <input
                                          type="checkbox"
                                          checked={selectedLanguages.includes(option)}
                                          disabled={savingScreening}
                                          onChange={(event) =>
                                            setScreeningForm({
                                              ...screeningForm,
                                              [field.key]: event.target.checked
                                                ? [...selectedLanguages, option]
                                                : selectedLanguages.filter((language) => language !== option),
                                            })
                                          }
                                          className="h-4 w-4 rounded border-slate-300 accent-[#0759AE]"
                                        />
                                        {option}
                                      </span>
                                    );
                                  })}
                                </span>
                              ) : field.type === "textarea" ? (
                                <textarea
                                  rows={3}
                                  value={String(rawValue ?? "")}
                                  disabled={savingScreening}
                                  onChange={(event) =>
                                    setScreeningForm({
                                      ...screeningForm,
                                      [field.key]: event.target.value,
                                    })
                                  }
                                  className={controlClass}
                                />
                              ) : field.type === "select" ? (
                                <select
                                  value={String(rawValue ?? "")}
                                  disabled={savingScreening}
                                  onChange={(event) =>
                                    setScreeningForm({
                                      ...screeningForm,
                                      [field.key]: event.target.value,
                                    })
                                  }
                                  className={controlClass}
                                >
                                  <option value="">Choose</option>
                                  {rawValue && !field.options?.includes(String(rawValue)) && (
                                    <option value={String(rawValue)}>{String(rawValue)}</option>
                                  )}
                                  {field.options?.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={field.type || "text"}
                                  value={String(rawValue ?? "")}
                                  disabled={savingScreening}
                                  onChange={(event) =>
                                    setScreeningForm({
                                      ...screeningForm,
                                      [field.key]: event.target.value,
                                    })
                                  }
                                  className={controlClass}
                                />
                              )}
                            </label>
                          )
                        ) : (
                          <>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              {field.label}
                            </p>
                            {field.key === "signature" &&
                            typeof rawValue === "string" &&
                            rawValue.startsWith("data:image/") ? (
                              <img
                                src={rawValue}
                                alt="Saved e-signature"
                                className="mt-2 max-h-32 max-w-full rounded-lg border border-slate-200 bg-white object-contain p-2"
                              />
                            ) : (
                              <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                                {displayValue}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            {!editingScreening && (
              <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                Your data privacy consent and consent date are retained as originally recorded and cannot be changed from this editor.
              </p>
            )}
          </div>

          {editingScreening && (
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setEditingScreening(false)}
                disabled={savingScreening}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingScreening}
                className="rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#064A91] disabled:cursor-wait disabled:opacity-60"
              >
                {savingScreening ? "Saving..." : "Save Screening Details"}
              </button>
            </div>
          )}
        </form>

        {/* RESUME */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#123B70]">Resume / CV</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload a {RESUME_FORMATS_LABEL} file up to 5 MB. Your resume is stored privately.
          </p>

          {resumeError && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {resumeError}
            </p>
          )}
          {resumeSuccess && (
            <p role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {resumeSuccess}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept={RESUME_ACCEPT}
              onChange={(event) => {
                setResumeFile(event.target.files?.[0] ?? null);
                setResumeError("");
                setResumeSuccess("");
              }}
              disabled={uploadingResume}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700"
            />
            <button
              type="button"
              onClick={() => void saveResume()}
              disabled={!resumeFile || uploadingResume}
              className="rounded-full bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#064A91] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingResume ? "Uploading..." : seeker.resume_url ? "Replace Resume" : "Upload Resume"}
            </button>
            {seeker.resume_url && (
              <button
                type="button"
                onClick={() => void openResume()}
                disabled={openingResume}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {openingResume ? "Preparing..." : "Download Current"}
              </button>
            )}
          </div>
          {resumeFile && (
            <p className="mt-2 text-sm text-slate-600">
              Selected: {resumeFile.name}
            </p>
          )}
        </div>

        {/* ACCOUNT INFORMATION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

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
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black text-slate-800">
            Account Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Sign out of your PESO MABINI Job Seeker
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
            profileComplete={areJobSeekerProfileSectionsComplete(
              seeker.registration_details,
            )}
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
            initialJobId={
              location.state &&
              typeof location.state === "object" &&
              "jobId" in location.state &&
              typeof location.state.jobId === "string"
                ? location.state.jobId
                : new URLSearchParams(location.search).get("job") ?? undefined
            }
            profileComplete={areJobSeekerProfileSectionsComplete(
              seeker.registration_details,
            )}
            isVerified={seeker.verification_status === "verified"}
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
      // SAVED JOBS
      // -------------------------------------------------

      case "Saved Jobs":
        return (
          <SavedJobsModule
            seeker={seeker}
            onNavigateToJobs={() => handlePageChange("Jobs")}
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
            initialContactId={messageContactToOpen}
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
            profileComplete={areJobSeekerProfileSectionsComplete(
              seeker.registration_details,
            )}
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
    <div className="relative isolate min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.88)), url("${portalBackground}")`,
        }}
      />

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
                PESO MABINI
              </p>

              <h1 className="truncate text-xl font-black text-[#123B70]">
                {activePage === "Application"
                  ? "Applications"
                  : activePage}
              </h1>
              </div>
            </div>

            {/* =================================================
                USER AREA
                ================================================= */}

            <div className="flex shrink-0 items-center gap-3">

              {/* MESSAGE NOTIFICATIONS */}

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

                <ProfileAvatar
                  key={hasProfilePhoto ? "photo-added" : "photo-missing"}
                  userId={seeker.user_id}
                  fullName={seeker.full_name}
                  size="small"
                  showControls={false}
                  onPhotoStatusChange={setHasProfilePhoto}
                />

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
          {seeker &&
            activePage !== "Profile" &&
            (!isJobSeekerProfileComplete(
              seeker.registration_details,
              seeker.resume_url,
            ) ||
              hasProfilePhoto === false) && (
            <div
              role="status"
              aria-live="polite"
              className="mx-auto mb-6 flex max-w-7xl flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-blue-900">Complete your profile setup</p>
                <p className="mt-1 text-sm text-blue-800">
                  {!isJobSeekerProfileComplete(
                    seeker.registration_details,
                    seeker.resume_url,
                  )
                    ? "Complete your PESO profile and upload a resume before applying for jobs."
                    : "Add a profile picture so employers can recognize you."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePageChange("Profile")}
                className="shrink-0 rounded-xl bg-[#0446A7] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#123B70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0446A7]"
              >
                Complete setup
              </button>
            </div>
          )}
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
            aria-labelledby="job-seeker-notifications-title"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2
                  id="job-seeker-notifications-title"
                  className="text-lg font-bold text-[#123B70]"
                >
                  Notifications
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Messages from PESO staff and other contacts.
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