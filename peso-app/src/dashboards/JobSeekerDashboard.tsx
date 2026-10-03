import { useEffect, useMemo, useState } from "react";
import PesoLogo from "../components/PesoLogo";
import SidebarToggle from "../components/SidebarToggle";
import { supabase } from "../services/supabase";

/* =====================================================
   TYPES
===================================================== */

type Page =
  | "Overview"
  | "Explore Job"
  | "Inbox"
  | "My Application"
  | "Saved Jobs";

type MenuItem = {
  name: Page;
  icon: string;
};

const menuItems: MenuItem[] = [
  { name: "Overview", icon: "▦" },
  { name: "Explore Job", icon: "▤" },
  { name: "Inbox", icon: "✉" },
  { name: "My Application", icon: "✓" },
  { name: "Saved Jobs", icon: "★" },
];

type Seeker = {
  job_seeker_id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_no: string | null;
  address: string | null;
  resume_url: string | null;
};

type Vacancy = {
  job_vacancy_id: string;
  position_title: string;
  location: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  requirements: string | null;
  date_posted: string;
  deadline: string | null;
  employer: {
    employer_id: string;
    name: string;
  } | null;
};

type JobApplication = {
  application_id: string;
  position_title: string | null;
  date_applied: string;
  employer: {
    name: string;
  } | null;
};

type InboxMessage = {
  id: string;
  sender: string;
  role: string;
  subject: string;
  body: string;
  time: string;
  unread: boolean;
};

/* =====================================================
   HELPERS
===================================================== */

/**
 * Saved jobs live in `localStorage` because the schema has no `saved_job`
 * table. The whole vacancy row is stored rather than just its id: a saved
 * posting still has to render after the recruiter closes it and it drops
 * out of the `status = 'open'` query that feeds Explore Job.
 *
 * Keyed per seeker so two accounts on one browser don't share a list.
 */
const savedKey = (jobSeekerId: string) =>
  `peso-hub:saved-jobs:${jobSeekerId}`;

function readSavedJobs(jobSeekerId: string): Vacancy[] {
  try {
    const raw = window.localStorage.getItem(savedKey(jobSeekerId));

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is Vacancy =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Vacancy).job_vacancy_id === "string" &&
        typeof (item as Vacancy).position_title === "string",
    );
  } catch {
    // Corrupt or unreadable storage (private mode, quota) must not stop the
    // dashboard from rendering.
    return [];
  }
}

function writeSavedJobs(
  jobSeekerId: string,
  jobs: Vacancy[],
) {
  try {
    window.localStorage.setItem(
      savedKey(jobSeekerId),
      JSON.stringify(jobs),
    );
  } catch {
    // Ignore quota errors; the in-memory list still works for this session.
  }
}

function formatSalary(
  min: number | null,
  max: number | null,
) {
  if (min === null && max === null) {
    return "Salary not specified";
  }

  if (min !== null && max !== null) {
    return `₱${min.toLocaleString()} - ₱${max.toLocaleString()}`;
  }

  return `₱${(min ?? max)?.toLocaleString()}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/* =====================================================
   SHARED PIECES
===================================================== */

function SeekerStatCard({
  title,
  value,
  change,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: "blue" | "red" | "yellow" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 text-[#0446A7]",
    red: "bg-red-50 text-[#EA4B45]",
    yellow: "bg-yellow-50 text-[#D39E00]",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-black text-[#123B70]">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${colors[color]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        {change}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Submitted: "bg-yellow-100 text-yellow-700",
    Shortlisted: "bg-green-100 text-green-700",
    "For Review": "bg-blue-100 text-blue-700",
    Rejected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function ProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-semibold text-slate-600">
          {label}
        </span>

        <span className="font-bold text-slate-800">
          {value}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/** Empty state in the house style: brand hairline, emoji in a tinted circle. */
function EmptyState({
  emoji,
  tint,
  title,
  body,
  action,
}: {
  emoji: string;
  tint: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

      <div className="px-4 py-14 text-center sm:px-6 sm:py-20">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${tint}`}
        >
          <span className="text-3xl">{emoji}</span>
        </div>

        <h3 className="mt-6 text-2xl font-bold text-slate-800">
          {title}
        </h3>

        <p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">
          {body}
        </p>

        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}

const secondaryButton =
  "rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50";

const primaryButton =
  "rounded-xl bg-[#0446A7] px-5 py-3 font-bold text-white transition hover:bg-[#123B70]";

/* =====================================================
   VACANCY CARD
===================================================== */

function VacancyCard({
  job,
  saved,
  applied,
  applying,
  onToggleSave,
  onApply,
}: {
  job: Vacancy;
  saved: boolean;
  applied: boolean;
  applying: boolean;
  onToggleSave: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl font-black text-[#0446A7]">
            ▤
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-black text-[#123B70]">
              {job.position_title}
            </h2>

            <p className="mt-1 truncate text-sm text-slate-500">
              {job.employer?.name ?? "Confidential employer"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={
            saved
              ? `Remove ${job.position_title} from saved jobs`
              : `Save ${job.position_title}`
          }
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
            saved
              ? "border-yellow-300 bg-yellow-50 text-[#D39E00]"
              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          }`}
        >
          {saved ? "★" : "☆"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">
            Location
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {job.location}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">
            Employment
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {job.employment_type}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">
            Salary
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {formatSalary(job.salary_min, job.salary_max)}
          </p>
        </div>
      </div>

      {job.description && (
        <p className="mt-5 text-sm leading-6 text-slate-600">
          {job.description}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          Posted {formatDate(job.date_posted)}

          {job.deadline && ` · Apply by ${formatDate(job.deadline)}`}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSave}
            className={secondaryButton}
          >
            {saved ? "Saved" : "Save"}
          </button>

          <button
            type="button"
            onClick={onApply}
            disabled={applied || applying || !job.employer}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              applied
                ? "cursor-default bg-slate-200 text-slate-500"
                : "bg-[#0446A7] text-white hover:bg-[#123B70]"
            }`}
          >
            {applied ? "Applied" : applying ? "Applying..." : "Apply now"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   OVERVIEW
===================================================== */

function Overview({
  seeker,
  vacancies,
  applications,
  savedJobs,
  unreadCount,
  go,
}: {
  seeker: Seeker;
  vacancies: Vacancy[];
  applications: JobApplication[];
  savedJobs: Vacancy[];
  unreadCount: number;
  go: (page: Page) => void;
}) {
  const recommended = vacancies.slice(0, 3);

  const profileFields = [
    { label: "Full name", done: Boolean(seeker.full_name) },
    { label: "Email address", done: Boolean(seeker.email) },
    { label: "Contact number", done: Boolean(seeker.contact_no) },
    { label: "Address", done: Boolean(seeker.address) },
    { label: "Resume / CV", done: Boolean(seeker.resume_url) },
  ];

  const completed = profileFields.filter((f) => f.done).length;
  const percent = Math.round(
    (completed / profileFields.length) * 100,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#123B70]">
          Welcome back, {firstName(seeker.full_name)}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Here is what is happening with your job search today.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SeekerStatCard
          title="Open Positions"
          value={String(vacancies.length)}
          change="Currently hiring"
          icon="▤"
          color="blue"
        />

        <SeekerStatCard
          title="My Applications"
          value={String(applications.length)}
          change="Submitted so far"
          icon="✓"
          color="yellow"
        />

        <SeekerStatCard
          title="Saved Jobs"
          value={String(savedJobs.length)}
          change="Bookmarked postings"
          icon="★"
          color="red"
        />

        <SeekerStatCard
          title="Unread Messages"
          value={String(unreadCount)}
          change="From employers & PESO"
          icon="✉"
          color="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-black text-[#123B70]">
                Latest Openings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Newest postings matching your profile.
              </p>
            </div>

            <button
              type="button"
              onClick={() => go("Explore Job")}
              className="shrink-0 text-sm font-bold text-[#0446A7] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {recommended.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No job vacancies are open right now.
              </p>
            )}

            {recommended.map((job) => (
              <div
                key={job.job_vacancy_id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-100 hover:bg-blue-50/40"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-black text-[#0446A7]">
                    ▤
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-[#123B70]">
                      {job.position_title}
                    </h3>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {job.employer?.name ?? "Confidential employer"} ·{" "}
                      {job.location}
                    </p>
                  </div>
                </div>

                <span className="hidden shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 sm:inline">
                  Open
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-[#123B70]">
            Profile Strength
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Complete your details to improve your chances.
          </p>

          <div className="mt-6">
            <ProgressBar
              label={`${completed} of ${profileFields.length} completed`}
              value={percent}
              color={
                percent === 100
                  ? "bg-green-500"
                  : "bg-[#0446A7]"
              }
            />
          </div>

          <div className="mt-6 space-y-2.5">
            {profileFields.map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-semibold text-slate-600">
                  {field.label}
                </span>

                {field.done ? (
                  <span className="shrink-0 text-xs font-bold text-green-600">
                    ✓ Added
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-bold text-slate-400">
                    Missing
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   EXPLORE JOB
===================================================== */

function ExploreJob({
  vacancies,
  isSaved,
  isApplied,
  applyingId,
  onToggleSave,
  onApply,
  loadError,
}: {
  vacancies: Vacancy[];
  isSaved: (id: string) => boolean;
  isApplied: (job: Vacancy) => boolean;
  applyingId: string | null;
  onToggleSave: (job: Vacancy) => void;
  onApply: (job: Vacancy) => void;
  loadError: string | null;
}) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All types");

  const types = useMemo(
    () => [
      "All types",
      ...Array.from(
        new Set(vacancies.map((job) => job.employment_type)),
      ).sort(),
    ],
    [vacancies],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return vacancies.filter((job) => {
      const matchesType =
        type === "All types" || job.employment_type === type;

      if (!matchesType) return false;

      if (!term) return true;

      return [
        job.position_title,
        job.location,
        job.employer?.name ?? "",
        job.description ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [vacancies, search, type]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#123B70]">
          Explore Jobs
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Browse every open vacancy from verified PESO employers.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, location, or employer"
          aria-label="Search job vacancies"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100"
        />

        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          aria-label="Filter by employment type"
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100"
        >
          {types.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {loadError && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {loadError}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          emoji="💼"
          tint="bg-sky-50"
          title="No Job Vacancies Found"
          body="There are currently no job vacancies matching your search. Please check back later for new opportunities."
          action={
            (search || type !== "All types") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setType("All types");
                }}
                className="rounded-xl bg-[#0446A7] px-5 py-3 font-semibold text-white transition hover:bg-[#123B70]"
              >
                Clear Search
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-5">
          {filtered.map((job) => (
            <VacancyCard
              key={job.job_vacancy_id}
              job={job}
              saved={isSaved(job.job_vacancy_id)}
              applied={isApplied(job)}
              applying={applyingId === job.job_vacancy_id}
              onToggleSave={() => onToggleSave(job)}
              onApply={() => onApply(job)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   INBOX
===================================================== */

/**
 * Placeholder threads. The schema has no message/conversation table, so this
 * list is local to the component and resets on reload.
 */
const seedMessages: InboxMessage[] = [
  {
    id: "m1",
    sender: "Mabini Tech Solutions",
    role: "Employer",
    subject: "Your application for Web Developer",
    body: "Good day! We have reviewed your resume and would like to invite you for a short interview. Please reply with your available schedule.",
    time: "Today, 9:14 AM",
    unread: true,
  },
  {
    id: "m2",
    sender: "PESO Mabini Office",
    role: "PESO",
    subject: "Job Fair 2026 schedule confirmed",
    body: "The Mabini Job Fair will be held at the Municipal Covered Court. Bring at least five printed copies of your resume.",
    time: "Yesterday, 3:02 PM",
    unread: true,
  },
  {
    id: "m3",
    sender: "Batangas Business Center",
    role: "Employer",
    subject: "Requirements for Administrative Assistant",
    body: "Thank you for your interest. This role requires a bachelor degree holder and at least one year of clerical experience.",
    time: "October 1, 2026",
    unread: false,
  },
];

function Inbox({
  messages,
  selected,
  onOpen,
}: {
  messages: InboxMessage[];
  selected: InboxMessage | null;
  onOpen: (message: InboxMessage) => void;
}) {
  const unreadCount = messages.filter((m) => m.unread).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#123B70]">
          Inbox
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Messages from employers and the PESO Mabini office.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-bold text-slate-800">
              Messages
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-[#EA4B45] px-2 py-0.5 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </p>
          </div>

          <div className="space-y-1 p-3">
            {messages.map((message) => {
              const isActive = selected?.id === message.id;

              return (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => onOpen(message)}
                  className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition ${
                    isActive
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      message.unread
                        ? "bg-[#0446A7]"
                        : "bg-slate-200"
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-sm text-[#123B70] ${
                          message.unread ? "font-black" : "font-bold"
                        }`}
                      >
                        {message.sender}
                      </span>

                      <span className="shrink-0 text-xs text-slate-400">
                        {message.time}
                      </span>
                    </span>

                    <span className="mt-1 block truncate text-sm text-slate-600">
                      {message.subject}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-5">
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-[#123B70]">
                    {selected.subject}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selected.sender} · {selected.role}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {selected.time}
                </span>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-600">
                {selected.body}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button className={primaryButton}>
                  Reply
                </button>

                <button className={secondaryButton}>
                  Mark as unread
                </button>
              </div>
            </>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">
              Select a message to read it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   MY APPLICATION
===================================================== */

function MyApplications({
  applications,
  go,
}: {
  applications: JobApplication[];
  go: (page: Page) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-[#123B70]">
            My Application
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track every job you have applied to.
          </p>
        </div>

        <button
          type="button"
          onClick={() => go("Explore Job")}
          className={primaryButton}
        >
          Browse Jobs
        </button>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          emoji="📝"
          tint="bg-yellow-50"
          title="No Applications Yet"
          body="You have not applied to any job yet. Explore the open vacancies and send your first application."
          action={
            <button
              type="button"
              onClick={() => go("Explore Job")}
              className="rounded-xl bg-[#0446A7] px-5 py-3 font-semibold text-white transition hover:bg-[#123B70]"
            >
              Explore Jobs
            </button>
          }
        />
      ) : (
        <>
          <p className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-slate-600">
            The{" "}
            <code className="font-bold text-[#0446A7]">application</code>{" "}
            table has no status column yet, so every submission is shown as{" "}
            <strong className="font-bold text-slate-700">Pending</strong>{" "}
            until an employer result is recorded.
          </p>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-black text-[#123B70]">
                Submitted Applications
              </h2>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0446A7]">
                {applications.length} total
              </span>
            </div>

            <div className="table-scroll">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Position</th>

                    <th className="px-6 py-4">Employer</th>

                    <th className="px-6 py-4">Date Applied</th>

                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => (
                    <tr
                      key={application.application_id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {application.position_title ?? "—"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {application.employer?.name ?? "—"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(application.date_applied)}
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill status="Submitted" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* =====================================================
   SAVED JOBS
===================================================== */

function SavedJobs({
  savedJobs,
  isApplied,
  applyingId,
  onToggleSave,
  onApply,
  go,
}: {
  savedJobs: Vacancy[];
  isApplied: (job: Vacancy) => boolean;
  applyingId: string | null;
  onToggleSave: (job: Vacancy) => void;
  onApply: (job: Vacancy) => void;
  go: (page: Page) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#123B70]">
          Saved Jobs
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Bookmarked postings you want to come back to. Saved on this device.
        </p>
      </div>

      {savedJobs.length === 0 ? (
        <EmptyState
          emoji="⭐"
          tint="bg-yellow-50"
          title="No Saved Jobs"
          body="Tap the star on any vacancy to bookmark it. Your saved list stays on this device until you clear it."
          action={
            <button
              type="button"
              onClick={() => go("Explore Job")}
              className="rounded-xl bg-[#0446A7] px-5 py-3 font-semibold text-white transition hover:bg-[#123B70]"
            >
              Explore Jobs
            </button>
          }
        />
      ) : (
        <div className="grid gap-5">
          {savedJobs.map((job) => (
            <VacancyCard
              key={job.job_vacancy_id}
              job={job}
              saved
              applied={isApplied(job)}
              applying={applyingId === job.job_vacancy_id}
              onToggleSave={() => onToggleSave(job)}
              onApply={() => onApply(job)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   DASHBOARD
===================================================== */

export default function JobSeekerDashboard() {
  const [seeker, setSeeker] = useState<Seeker | null>(null);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>(
    [],
  );
  const [savedJobs, setSavedJobs] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const [activePage, setActivePage] = useState<Page>("Overview");

  /**
   * Message state lives here, not inside `Inbox`, so the Overview
   * "Unread Messages" stat reads the same list the inbox renders instead of
   * a value that can never update.
   */
  const [messages, setMessages] =
    useState<InboxMessage[]>(seedMessages);

  const [selectedMessage, setSelectedMessage] =
    useState<InboxMessage | null>(seedMessages[0] ?? null);

  // Off-canvas below `lg`: a permanent 288px column leaves no room for
  // content on a 320px phone.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const unreadCount = messages.filter((m) => m.unread).length;

  const openMessage = (message: InboxMessage) => {
    setSelectedMessage(message);
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, unread: false } : item,
      ),
    );
  };

  useEffect(() => {
    if (!isSidebarOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSidebarOpen]);

  const go = (page: Page) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  /* -----------------------------------------------
     LOAD DATA
  ----------------------------------------------- */

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setLoadError(null);

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
         FIND JOB SEEKER ACCOUNT
      --------------------------------------------- */

      const { data: seekerData, error: seekerError } =
        await supabase
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
            `,
          )
          .eq("user_id", user.id)
          .maybeSingle();

      if (seekerError) {
        console.error("Job seeker loading error:", seekerError);
        setLoadError(
          "We could not load your profile. Please refresh the page.",
        );
        return;
      }

      if (!seekerData) {
        alert("You are not registered as a Job Seeker.");

        window.location.href = "/login";
        return;
      }

      setSeeker(seekerData);
      setSavedJobs(readSavedJobs(seekerData.job_seeker_id));

      /* ---------------------------------------------
         LOAD VACANCIES + APPLICATIONS
      --------------------------------------------- */

      const [vacancyResult, applicationResult] = await Promise.all([
        supabase
          .from("job_vacancy")
          .select(
            `
            job_vacancy_id,
            position_title,
            location,
            employment_type,
            salary_min,
            salary_max,
            description,
            requirements,
            date_posted,
            deadline,
            employer (
              employer_id,
              name
            )
            `,
          )
          .eq("status", "open")
          .order("date_posted", { ascending: false }),

        supabase
          .from("application")
          .select(
            `
            application_id,
            position_title,
            date_applied,
            employer (
              name
            )
            `,
          )
          .eq("job_seeker_id", seekerData.job_seeker_id)
          .order("date_applied", { ascending: false }),
      ]);

      if (vacancyResult.error) {
        console.error("Vacancy loading error:", vacancyResult.error);
        setLoadError(
          "Job vacancies could not be loaded right now.",
        );
      }

      if (applicationResult.error) {
        console.error(
          "Application loading error:",
          applicationResult.error,
        );
      }

      setVacancies(
        (vacancyResult.data as Vacancy[] | null) ?? [],
      );

      setApplications(
        (applicationResult.data as JobApplication[] | null) ?? [],
      );
    } catch (error) {
      console.error("Dashboard load failed:", error);
      setLoadError("Something went wrong while loading your dashboard.");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------
     SAVED JOBS
  ----------------------------------------------- */

  const isSaved = (id: string) =>
    savedJobs.some((job) => job.job_vacancy_id === id);

  const toggleSave = (job: Vacancy) => {
    if (!seeker) return;

    const next = isSaved(job.job_vacancy_id)
      ? savedJobs.filter(
          (item) => item.job_vacancy_id !== job.job_vacancy_id,
        )
      : [job, ...savedJobs];

    setSavedJobs(next);
    writeSavedJobs(seeker.job_seeker_id, next);

    setNotice(
      isSaved(job.job_vacancy_id)
        ? `Removed "${job.position_title}" from saved jobs.`
        : `Saved "${job.position_title}".`,
    );
  };

  /* -----------------------------------------------
     APPLY
  ----------------------------------------------- */

  /**
   * `application` is unique on (employer_id, job_seeker_id, position_title)
   * and has no `job_vacancy_id`, so a posting is matched on title + employer
   * name. The employer *name* is what the query returns, and two postings
   * with the same title at different companies must not collide.
   */
  const isApplied = (job: Vacancy) => {
    // Bound to a local: narrowing a parameter's property does not survive
    // into the `some` callback, where TS widens it back to `| null`.
    const employer = job.employer;

    if (!employer) return false;

    const title = job.position_title.trim().toLowerCase();

    return applications.some(
      (application) =>
        application.position_title?.trim().toLowerCase() ===
          title &&
        application.employer?.name === employer.name,
    );
  };

  const applyToJob = async (job: Vacancy) => {
    if (!seeker || !job.employer) return;

    setApplyingId(job.job_vacancy_id);
    setNotice(null);

    const { error } = await supabase.from("application").insert({
      employer_id: job.employer.employer_id,
      job_seeker_id: seeker.job_seeker_id,
      position_title: job.position_title,
    });

    setApplyingId(null);

    if (error) {
      // 23505 is the unique-violation code: the seeker already applied to
      // this employer for this exact position title.
      if (error.code === "23505") {
        setNotice(
          `You already applied for "${job.position_title}".`,
        );
      } else {
        console.error("Application failed:", error);
        setNotice("Your application could not be submitted.");
      }

      return;
    }

    const { data } = await supabase
      .from("application")
      .select(
        `
        application_id,
        position_title,
        date_applied,
        employer (
          name
        )
        `,
      )
      .eq("job_seeker_id", seeker.job_seeker_id)
      .order("date_applied", { ascending: false });

    setApplications((data as JobApplication[] | null) ?? []);

    setNotice(`Application sent for "${job.position_title}".`);
  };

  /* -----------------------------------------------
     LOGOUT
  ----------------------------------------------- */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /* -----------------------------------------------
     RENDER
  ----------------------------------------------- */

  const renderContent = () => {
    if (!seeker) return null;

    switch (activePage) {
      case "Explore Job":
        return (
          <ExploreJob
            vacancies={vacancies}
            isSaved={isSaved}
            isApplied={isApplied}
            applyingId={applyingId}
            onToggleSave={toggleSave}
            onApply={applyToJob}
            loadError={loadError}
          />
        );

      case "Inbox":
        return (
          <Inbox
            messages={messages}
            selected={selectedMessage}
            onOpen={openMessage}
          />
        );

      case "My Application":
        return <MyApplications applications={applications} go={go} />;

      case "Saved Jobs":
        return (
          <SavedJobs
            savedJobs={savedJobs}
            isApplied={isApplied}
            applyingId={applyingId}
            onToggleSave={toggleSave}
            onApply={applyToJob}
            go={go}
          />
        );

      case "Overview":
      default:
        return (
          <Overview
            seeker={seeker}
            vacancies={vacancies}
            applications={applications}
            savedJobs={savedJobs}
            unreadCount={unreadCount}
            go={go}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FC]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#0446A7]" />

          <p className="font-semibold text-slate-500">
            Loading Job Seeker Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!seeker) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FC] px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-red-700">
            Profile Not Found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            We could not load a Job Seeker profile for this account.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className={`mt-6 ${primaryButton}`}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      {/* ================= SIDEBAR ================= */}

      {/* Tap-away backdrop, small screens only */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        id="job-seeker-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-[#0446A7] text-white transition-transform duration-300 ease-out motion-reduce:transition-none lg:translate-x-0 lg:overflow-hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-5 sm:px-6">
          <div className="min-w-0 flex-1">
            <PesoLogo
              size="sm"
              showName
              subtitle="Job Seeker Portal"
              tone="light"
              linkTo={null}
            />
          </div>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsSidebarOpen(false)}
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/10 lg:hidden"
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

        {/* Job Seeker Profile */}
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FED442] font-black text-[#123B70]">
              {firstName(seeker.full_name).charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {seeker.full_name}
              </p>

              <p className="truncate text-xs text-blue-100">
                Job Seeker
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-blue-200">
            Job Seeker Portal
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activePage === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => go(item.name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-[#0446A7] shadow-sm"
                      : "text-blue-50 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${
                      isActive
                        ? "bg-[#FED442] text-[#123B70]"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="mt-auto border-t border-white/10 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-50 transition hover:bg-white/10"
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <SidebarToggle
        open={isSidebarOpen}
        onClick={() => setIsSidebarOpen((value) => !value)}
        label="Toggle job seeker navigation menu"
      />

      {/* ================= MAIN AREA ================= */}
      <main className="min-h-screen lg:ml-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+1rem)] lg:px-8">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Job Seeker Portal
              </p>

              <h2 className="truncate text-lg font-black text-[#123B70] sm:text-xl">
                {activePage}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification */}
              <button
                type="button"
                onClick={() => go("Inbox")}
                aria-label={
                  unreadCount > 0
                    ? `Open inbox, ${unreadCount} unread messages`
                    : "Open inbox"
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              >
                ●

                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EA4B45]" />
                )}
              </button>

              {/* Job Seeker */}
              <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0446A7] text-sm font-bold text-white">
                  {firstName(seeker.full_name).charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {seeker.full_name}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    Job Seeker
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="p-6 lg:p-8">
          {notice && (
            <p
              role="status"
              className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-semibold text-slate-700"
            >
              {notice}
            </p>
          )}

          {renderContent()}
        </section>
      </main>
    </div>
  );
}
