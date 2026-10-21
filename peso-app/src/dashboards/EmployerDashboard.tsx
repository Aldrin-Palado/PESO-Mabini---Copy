import { useEffect, useState, type FormEvent } from "react";
import SidebarToggle from "../components/SidebarToggle";
import { supabase } from "../services/supabase";

type MenuName = "Dashboard" | "My Job Posts" | "Applications" | "Company Profile";
const menuItems: { name: MenuName; icon: string }[] = [
  { name: "Dashboard", icon: "▦" },
  { name: "My Job Posts", icon: "▤" },
  { name: "Applications", icon: "✓" },
  { name: "Company Profile", icon: "▣" },
];

type EmployerProfile = {
  employer_id: string;
  user_id: string | null;
  name: string;
  address: string | null;
  contact_person: string | null;
  contact_no: string | null;
  email: string | null;
  is_verified: boolean;
};

type JobPost = {
  job_vacancy_id: string;
  employer_id: string;
  position_title: string;
  description: string | null;
  requirements: string | null;
  location: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  vacancies_available: number;
  status: string;
  date_posted: string;
  deadline: string | null;
};

type ApplicationRow = {
  application_id: string;
  employer_id: string;
  job_seeker_id: string;
  position_title: string | null;
  status: string;
  date_applied: string;
  applicant_name?: string;
};

const dateLabel = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

function EmployerDashboard() {
  const [activeMenu, setActiveMenu] = useState<MenuName>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isSidebarOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployerPortal() {
      setLoading(true);
      setError("");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (authError || !user) {
        setError(authError?.message || "Please sign in to access the employer portal.");
        setLoading(false);
        return;
      }

      // Resolve the employer profile from the currently authenticated user.
      const { data: employerRow, error: profileError } = await supabase
        .from("employer")
        .select("employer_id, user_id, name, address, contact_person, contact_no, email, is_verified")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (profileError) {
        console.error("Employer profile load failed:", profileError);
        setError(`Could not load your employer profile: ${profileError.message}`);
        setLoading(false);
        return;
      }
      if (!employerRow) {
        setError("No employer profile is linked to this login. Please contact PESO support.");
        setLoading(false);
        return;
      }

      const employer = employerRow as EmployerProfile;
      setProfile(employer);

      // Load only job vacancies owned by this employer.
      const { data: jobRows, error: jobError } = await supabase
        .from("job_vacancy")
        .select("job_vacancy_id, employer_id, position_title, description, requirements, location, employment_type, salary_min, salary_max, vacancies_available, status, date_posted, deadline")
        .eq("employer_id", employer.employer_id)
        .order("date_posted", { ascending: false });

      if (cancelled) return;
      if (jobError) {
        console.error("Employer job posts load failed:", jobError);
        setError(`Your profile loaded, but job posts could not be loaded: ${jobError.message}`);
        setLoading(false);
        return;
      }
      setJobs((jobRows || []) as JobPost[]);

      // The application's actual schema links each application directly to employer_id.
      const { data: applicationRows, error: applicationError } = await supabase
        .from("application")
        .select("application_id, employer_id, job_seeker_id, position_title, status, date_applied")
        .eq("employer_id", employer.employer_id)
        .order("date_applied", { ascending: false });

      if (cancelled) return;
      if (applicationError) {
        console.error("Employer applications load failed:", applicationError);
        setError(`Job posts loaded, but applications could not be loaded: ${applicationError.message}`);
        setApplications([]);
        setLoading(false);
        return;
      }

      const rows = (applicationRows || []) as ApplicationRow[];
      const seekerIds = [...new Set(rows.map((row) => row.job_seeker_id).filter(Boolean))];
      let namesById = new Map<string, string>();

      if (seekerIds.length) {
        const { data: seekers, error: seekerError } = await supabase
          .from("job_seeker")
          .select("job_seeker_id, full_name")
          .in("job_seeker_id", seekerIds);

        if (cancelled) return;
        if (seekerError) {
          // Keep the applications visible even if applicant names are blocked by RLS.
          console.error("Applicant names load failed:", seekerError);
        } else {
          namesById = new Map(
            (seekers || []).map((seeker: { job_seeker_id: string; full_name: string | null }) => [
              seeker.job_seeker_id,
              seeker.full_name || "Job Seeker",
            ]),
          );
        }
      }

      setApplications(rows.map((row) => ({
        ...row,
        applicant_name: namesById.get(row.job_seeker_id) || "Job Seeker",
      })));
      setLoading(false);
    }

    void loadEmployerPortal();
    return () => { cancelled = true; };
  }, []);

  const navigate = (menu: string) => {
    if (menuItems.some((item) => item.name === menu)) setActiveMenu(menu as MenuName);
    setIsSidebarOpen(false);
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(`Unable to log out: ${signOutError.message}`);
      return;
    }
    window.location.assign("/");
  };

  const displayName = profile?.name?.trim() || profile?.contact_person?.trim() || "Employer";
  const initial = displayName.charAt(0).toUpperCase() || "E";

  const content = () => {
    if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">Loading your employer portal...</div>;
    if (!profile) return <EmptyState message={error || "Your employer profile could not be found."} />;
    switch (activeMenu) {
      case "My Job Posts": return <MyJobPosts jobs={jobs} />;
      case "Applications": return <Applications applications={applications} />;
      case "Company Profile": return <CompanyProfile profile={profile} onUpdated={setProfile} />;
      default: return <Dashboard profile={profile} jobs={jobs} applications={applications} onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      {isSidebarOpen && <button type="button" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col overflow-y-auto bg-[#0446A7] text-white transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-[#0446A7]">P</div>
          <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-black">PESO-Hub</h1><p className="text-xs text-blue-100">Employer Portal</p></div>
          <button type="button" onClick={() => setIsSidebarOpen(false)} aria-label="Close navigation" className="lg:hidden">×</button>
        </div>
        <div className="border-b border-white/10 px-5 py-5"><div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FED442] font-black text-[#123B70]">{initial}</div>
          <div className="min-w-0"><p className="truncate text-sm font-bold">{displayName}</p><p className="truncate text-xs text-blue-100">{profile?.email || "Employer"}</p></div>
        </div></div>
        <div className="flex-1 px-4 py-5"><p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-blue-200">Employer Portal</p><nav className="space-y-1">
          {menuItems.map((item) => {
            const active = activeMenu === item.name;
            return <button key={item.name} type="button" onClick={() => navigate(item.name)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${active ? "bg-white text-[#0446A7] shadow-sm" : "text-blue-50 hover:bg-white/10"}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-[#FED442] text-[#123B70]" : "bg-white/10 text-white"}`}>{item.icon}</span>{item.name}
            </button>;
          })}
        </nav></div>
        <div className="mt-auto border-t border-white/10 p-4"><button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-50 hover:bg-white/10">↪ Logout</button></div>
      </aside>

      <SidebarToggle open={isSidebarOpen} onClick={() => setIsSidebarOpen((value) => !value)} label="Toggle employer navigation menu" />
      <main className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0"><p className="text-xs font-medium text-slate-500 sm:text-sm">Employer Portal</p><h2 className="truncate text-lg font-black text-[#123B70] sm:text-xl">{activeMenu}</h2></div>
          <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0446A7] text-sm font-bold text-white">{initial}</div><div><p className="max-w-48 truncate text-sm font-bold text-slate-800">{displayName}</p><p className="max-w-48 truncate text-xs text-slate-500">{profile?.email || "Employer"}</p></div></div>
        </div></header>
        <section className="space-y-4 p-4 sm:p-6 lg:p-8">
          {error && profile && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
          {content()}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ profile, jobs, applications, onNavigate }: { profile: EmployerProfile; jobs: JobPost[]; applications: ApplicationRow[]; onNavigate: (menu: string) => void }) {
  const activeJobs = jobs.filter((job) => ["open", "active"].includes(job.status.toLowerCase())).length;
  const countStatus = (status: string) => applications.filter((app) => app.status.toLowerCase() === status.toLowerCase()).length;
  const summary = [
    { label: "Pending", value: countStatus("pending"), color: "bg-[#FED442]" },
    { label: "For Review", value: countStatus("for review"), color: "bg-[#0446A7]" },
    { label: "Shortlisted", value: countStatus("shortlisted"), color: "bg-green-500" },
    { label: "Rejected", value: countStatus("rejected"), color: "bg-[#EA4B45]" },
    { label: "Hired", value: countStatus("hired"), color: "bg-[#123B70]" },
  ];
  return <div className="space-y-8">
    <div><h1 className="text-3xl font-black text-[#123B70]">Welcome, {profile.name || profile.contact_person || "Employer"}</h1><p className="mt-1 text-sm text-slate-500">Manage your company's job vacancies and applicants.</p></div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Active Job Posts" value={activeJobs} note={`${jobs.length} total job posts`} icon="▤" color="blue" />
      <StatCard title="Total Applications" value={applications.length} note="Applications for your jobs" icon="✓" color="red" />
      <StatCard title="Shortlisted" value={countStatus("shortlisted")} note="Applicants shortlisted" icon="★" color="yellow" />
      <StatCard title="Hired" value={countStatus("hired")} note="Successful hires" icon="♙" color="green" />
    </div>
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <div className="mb-6 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-[#123B70]">My Job Posts</h2><p className="text-sm text-slate-500">Your currently posted vacancies</p></div><button type="button" onClick={() => onNavigate("My Job Posts")} className="rounded-xl bg-[#0446A7] px-4 py-2 text-sm font-bold text-white hover:bg-[#123B70]">View Posts</button></div>
        {jobs.length ? <div className="space-y-3">{jobs.slice(0, 5).map((job) => <JobPostRow key={job.job_vacancy_id} title={job.position_title} meta={`${applications.filter((app) => app.position_title === job.position_title).length} applications`} status={job.status} />)}</div> : <EmptyState message="You have not posted any jobs yet." />}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-black text-[#123B70]">Application Summary</h2><p className="mt-1 text-sm text-slate-500">Status of applications for your jobs</p><div className="mt-6 space-y-5">{summary.map((item) => <Progress key={item.label} label={item.label} value={item.value} max={Math.max(applications.length, 1)} color={item.color} />)}</div></div>
    </div>
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-6 py-5"><h2 className="text-lg font-black text-[#123B70]">Recent Applications</h2><p className="text-sm text-slate-500">Latest applicants for your job posts</p></div><ApplicationsTable applications={applications.slice(0, 5)} /></div>
  </div>;
}

function StatCard({ title, value, note, icon, color }: { title: string; value: number; note: string; icon: string; color: "blue" | "red" | "yellow" | "green" }) {
  const colors = { blue: "bg-blue-50 text-[#0446A7]", red: "bg-red-50 text-[#EA4B45]", yellow: "bg-yellow-50 text-[#D39E00]", green: "bg-green-50 text-green-600" };
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-500">{title}</p><h3 className="mt-2 text-3xl font-black text-[#123B70]">{value}</h3></div><div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black ${colors[color]}`}>{icon}</div></div><p className="mt-4 text-xs font-semibold text-slate-500">{note}</p></div>;
}

function JobPostRow({ title, meta, status }: { title: string; meta: string; status: string }) {
  const active = ["open", "active"].includes(status.toLowerCase());
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex min-w-0 items-center gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-black text-[#0446A7]">▤</div><div className="min-w-0"><h3 className="truncate font-bold text-slate-800">{title}</h3><p className="text-xs text-slate-500">{meta}</p></div></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{status}</span></div>;
}

function Progress({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return <div><div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-slate-600">{label}</span><span className="font-bold text-slate-800">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} /></div></div>;
}

function StatusBadge({ status }: { status: string | null }) {
  const value = status || "pending";
  const styles: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", shortlisted: "bg-green-100 text-green-700", "for review": "bg-blue-100 text-blue-700", rejected: "bg-red-100 text-red-700", hired: "bg-indigo-100 text-indigo-700" };
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[value.toLowerCase()] || "bg-slate-100 text-slate-600"}`}>{value}</span>;
}

function ApplicationsTable({ applications }: { applications: ApplicationRow[] }) {
  if (!applications.length) return <div className="p-6"><EmptyState message="No applications have been received for your job posts yet." /></div>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">Applicant</th><th className="px-6 py-4">Position</th><th className="px-6 py-4">Date Applied</th><th className="px-6 py-4">Status</th></tr></thead><tbody>{applications.map((app) => <tr key={app.application_id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">{app.applicant_name || "Job Seeker"}</td><td className="px-6 py-4 text-sm text-slate-600">{app.position_title || "Job post"}</td><td className="px-6 py-4 text-sm text-slate-600">{dateLabel(app.date_applied)}</td><td className="px-6 py-4"><StatusBadge status={app.status} /></td></tr>)}</tbody></table></div>;
}

function MyJobPosts({ jobs }: { jobs: JobPost[] }) {
  return <div className="space-y-6"><div><h1 className="text-3xl font-black text-[#123B70]">My Job Posts</h1><p className="mt-1 text-sm text-slate-500">Only vacancies belonging to your employer account are shown.</p></div>
    {jobs.length ? <div className="grid gap-5">{jobs.map((job) => <article key={job.job_vacancy_id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div className="flex min-w-0 items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl font-black text-[#0446A7]">▤</div><div className="min-w-0"><h2 className="text-lg font-black text-[#123B70]">{job.position_title}</h2><p className="mt-1 text-sm text-slate-500">{job.location} · {job.employment_type}</p><p className="mt-1 text-xs text-slate-500">Posted {dateLabel(job.date_posted)}{job.deadline ? ` · Deadline ${dateLabel(job.deadline)}` : ""}</p></div></div><StatusBadge status={job.status} /></div>{(job.salary_min !== null || job.salary_max !== null) && <p className="mt-3 text-sm font-semibold text-slate-700">Salary: {job.salary_min ?? "—"} – {job.salary_max ?? "—"}</p>}{job.description && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{job.description}</p>}{job.requirements && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600"><strong>Requirements:</strong> {job.requirements}</p>}<p className="mt-3 text-xs text-slate-500">Vacancies available: {job.vacancies_available}</p></article>)}</div> : <EmptyState message="You have not posted any jobs yet." />}
  </div>;
}

function Applications({ applications }: { applications: ApplicationRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const filtered = applications.filter((app) => `${app.applicant_name || ""} ${app.position_title || ""}`.toLowerCase().includes(search.toLowerCase()) && (status === "All Status" || app.status.toLowerCase() === status.toLowerCase()));
  return <div className="space-y-6"><div><h1 className="text-3xl font-black text-[#123B70]">Applications</h1><p className="mt-1 text-sm text-slate-500">Review applications submitted to your job posts.</p></div><div className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><div className="flex flex-col gap-3 md:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search applicants or positions..." className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0446A7]" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600"><option>All Status</option><option value="pending">Pending</option><option value="for review">For Review</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option><option value="hired">Hired</option></select></div></div><ApplicationsTable applications={filtered} /></div></div>;
}

function CompanyProfile({ profile, onUpdated }: { profile: EmployerProfile; onUpdated: (profile: EmployerProfile) => void }) {
  const [form, setForm] = useState({ name: profile.name || "", address: profile.address || "", contact_person: profile.contact_person || "", contact_no: profile.contact_no || "" });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm({ name: profile.name || "", address: profile.address || "", contact_person: profile.contact_person || "", contact_no: profile.contact_no || "" });
  }, [profile]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError(authError?.message || "Please sign in again.");
      setSaving(false);
      return;
    }
    const changes = { name: form.name.trim(), address: form.address.trim() || null, contact_person: form.contact_person.trim() || null, contact_no: form.contact_no.trim() || null };
    const { data, error: updateError } = await supabase.from("employer")
      .update(changes)
      .eq("user_id", user.id)
      .select("employer_id, user_id, name, address, contact_person, contact_no, email, is_verified")
      .maybeSingle();
    if (updateError || !data) {
      setError(updateError?.message || "Profile was not updated. Check your database permissions.");
    } else {
      onUpdated(data as EmployerProfile);
      setEditing(false);
      setSuccess("Company profile updated successfully.");
    }
    setSaving(false);
  };

  const cancel = () => {
    setForm({ name: profile.name || "", address: profile.address || "", contact_person: profile.contact_person || "", contact_no: profile.contact_no || "" });
    setEditing(false); setError(""); setSuccess("");
  };

  return <div className="space-y-6"><div><h1 className="text-3xl font-black text-[#123B70]">Company Profile</h1><p className="mt-1 text-sm text-slate-500">Your company information linked to this login.</p></div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</p>}
    <form onSubmit={save} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0446A7] text-3xl font-black text-white">{(profile.name || "E").charAt(0).toUpperCase()}</div><div><h2 className="text-2xl font-black text-[#123B70]">{profile.name || "Company name not provided"}</h2><p className="mt-1 text-sm text-slate-500">{profile.address || "Company address not provided"}</p><p className="mt-1 text-xs text-slate-500">{profile.is_verified ? "Verified employer" : "Verification pending"}</p></div></div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-bold text-slate-700">Company Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} disabled={!editing} required maxLength={160} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal disabled:bg-slate-50" /></label>
        <label className="block text-sm font-bold text-slate-700">Authorized Representative<input value={form.contact_person} onChange={(event) => setForm({ ...form, contact_person: event.target.value })} disabled={!editing} maxLength={120} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal disabled:bg-slate-50" /></label>
        <label className="block text-sm font-bold text-slate-700">Email Address<input value={profile.email || ""} disabled className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500" /></label>
        <label className="block text-sm font-bold text-slate-700">Contact Number<input type="tel" value={form.contact_no} onChange={(event) => setForm({ ...form, contact_no: event.target.value })} disabled={!editing} maxLength={30} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal disabled:bg-slate-50" /></label>
        <label className="block text-sm font-bold text-slate-700 md:col-span-2">Company Address<textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} disabled={!editing} maxLength={300} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal disabled:bg-slate-50" /></label>
      </div>
      <div className="mt-6 flex justify-end gap-3">{editing ? <><button type="button" onClick={cancel} disabled={saving} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving} className="rounded-full bg-[#0446A7] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button></> : <button type="button" onClick={() => { setError(""); setSuccess(""); setEditing(true); }} className="rounded-full bg-[#0446A7] px-6 py-2.5 text-sm font-bold text-white">Edit Profile</button>}</div>
    </form>
  </div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl text-[#0446A7]">▤</div><p className="mt-3 font-semibold text-slate-700">{message}</p></div>;
}

export default EmployerDashboard;
