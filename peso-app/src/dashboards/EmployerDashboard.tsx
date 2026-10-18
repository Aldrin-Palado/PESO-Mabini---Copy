import { useEffect, useState, type FormEvent } from "react";
import SidebarToggle from "../components/SidebarToggle";
import { supabase } from "../services/supabase";

type MenuItem = {
  name: string;
  icon: string;
};

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: "▦" },
  { name: "My Job Posts", icon: "▤" },
  { name: "Applications", icon: "✓" },
  { name: "Company Profile", icon: "▣" },
];

const recentApplications = [
  {
    applicant: "Juan Dela Cruz",
    position: "IT Support Specialist",
    date: "Sep 28, 2026",
    status: "Pending",
  },
  {
    applicant: "Maria Santos",
    position: "IT Support Specialist",
    date: "Sep 27, 2026",
    status: "Shortlisted",
  },
  {
    applicant: "Pedro Reyes",
    position: "Sales Associate",
    date: "Sep 26, 2026",
    status: "For Review",
  },
];

function EmployerDashboard() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // Off-canvas below `lg`: on small screens the sidebar used to disappear
  // entirely, leaving no way to switch sections.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const go = (name: string) => {
    setActiveMenu(name);
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "My Job Posts":
        return <MyJobPosts />;

      case "Applications":
        return <Applications />;

      case "Company Profile":
        return <CompanyProfile />;

      default:
        return <Dashboard />;
    }
  };

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
        id="employer-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-[#0446A7] text-white transition-transform duration-300 ease-out motion-reduce:transition-none lg:translate-x-0 lg:overflow-hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-5 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-black text-[#0446A7]">
            P
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-black">
              PESO-Hub
            </h1>

            <p className="text-xs text-blue-100">
              Employer Portal
            </p>
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

        {/* Employer Profile */}
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FED442] font-black text-[#123B70]">
              A
            </div>

            <div>
              <p className="text-sm font-bold">
                ABC Manufacturing
              </p>

              <p className="text-xs text-blue-100">
                Employer
              </p>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5">

          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-blue-200">
            Employer Portal
          </p>

          <nav className="space-y-1">

            {menuItems.map((item) => {
              const isActive = activeMenu === item.name;

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
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${
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
            onClick={() => {
              console.log("Logout");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-50 transition hover:bg-white/10"
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      <SidebarToggle
        open={isSidebarOpen}
        onClick={() =>
          setIsSidebarOpen((value) => !value)
        }
        label="Toggle employer navigation menu"
      />

      {/* ================= MAIN AREA ================= */}
      <main className="min-h-screen lg:ml-72">

        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

          <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+1rem)] lg:px-8">

            <div className="min-w-0">

              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Employer Portal
              </p>

              <h2 className="truncate text-lg font-black text-[#123B70] sm:text-xl">
                {activeMenu}
              </h2>

            </div>


            <div className="flex items-center gap-3">

              {/* Notification */}
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">

                ●

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EA4B45]" />

              </button>


              {/* Employer */}
              <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0446A7] text-sm font-bold text-white">
                  A
                </div>

                <div>

                  <p className="text-sm font-bold text-slate-800">
                    ABC Manufacturing
                  </p>

                  <p className="text-xs text-slate-500">
                    Employer
                  </p>

                </div>

              </div>

            </div>

          </div>

        </header>


        {/* Page Content */}
        <section className="p-6 lg:p-8">
          {renderContent()}
        </section>

      </main>

    </div>
  );
}


/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard() {
  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div>

        <h1 className="text-3xl font-black text-[#123B70]">
          Welcome, ABC Manufacturing
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your job vacancies and applicants from your employer portal.
        </p>

      </div>


      {/* Statistics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <EmployerStatCard
          title="Active Job Posts"
          value="8"
          change="Currently active"
          icon="▤"
          color="blue"
        />

        <EmployerStatCard
          title="Total Applications"
          value="64"
          change="+12 this month"
          icon="✓"
          color="red"
        />

        <EmployerStatCard
          title="Shortlisted"
          value="18"
          change="Applicants selected"
          icon="★"
          color="yellow"
        />

        <EmployerStatCard
          title="Hired"
          value="6"
          change="Successful hires"
          icon="♙"
          color="green"
        />

      </div>


      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Job Posts */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-black text-[#123B70]">
                My Job Posts
              </h2>

              <p className="text-sm text-slate-500">
                Your currently posted vacancies
              </p>
            </div>

            <button className="rounded-xl bg-[#0446A7] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#123B70]">
              + Post a Job
            </button>

          </div>


          <div className="space-y-3">

            <JobPostRow
              title="IT Support Specialist"
              applicants="24 applicants"
              status="Active"
            />

            <JobPostRow
              title="Sales Associate"
              applicants="18 applicants"
              status="Active"
            />

            <JobPostRow
              title="Administrative Assistant"
              applicants="12 applicants"
              status="Active"
            />

            <JobPostRow
              title="Customer Service Representative"
              applicants="10 applicants"
              status="Closed"
            />

          </div>

        </div>


        {/* Application Summary */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black text-[#123B70]">
            Application Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Applicant status
          </p>


          <div className="mt-6 space-y-5">

            <ApplicationProgress
              label="Pending"
              value="20"
              width="31%"
              color="bg-[#FED442]"
            />

            <ApplicationProgress
              label="For Review"
              value="12"
              width="19%"
              color="bg-[#0446A7]"
            />

            <ApplicationProgress
              label="Shortlisted"
              value="18"
              width="28%"
              color="bg-green-500"
            />

            <ApplicationProgress
              label="Rejected"
              value="8"
              width="12%"
              color="bg-[#EA4B45]"
            />

            <ApplicationProgress
              label="Hired"
              value="6"
              width="10%"
              color="bg-[#123B70]"
            />

          </div>

        </div>

      </div>


      {/* Recent Applications */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

          <div>

            <h2 className="text-lg font-black text-[#123B70]">
              Recent Applications
            </h2>

            <p className="text-sm text-slate-500">
              Latest applicants for your job posts
            </p>

          </div>

          <button className="font-semibold text-[#0446A7] hover:underline">
            View All
          </button>

        </div>


        <div className="table-scroll">

          <table className="w-full text-left">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">

              <tr>

                <th className="px-6 py-4">
                  Applicant
                </th>

                <th className="px-6 py-4">
                  Position
                </th>

                <th className="px-6 py-4">
                  Date Applied
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {recentApplications.map((application, index) => (

                <tr
                  key={index}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >

                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {application.applicant}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {application.position}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {application.date}
                  </td>

                  <td className="px-6 py-4">
                    <EmployerStatus status={application.status} />
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   STAT CARD
===================================================== */

function EmployerStatCard({
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

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-black text-[#123B70]">
            {value}
          </h3>

        </div>


        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black ${colors[color]}`}
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


/* =====================================================
   JOB POST ROW
===================================================== */

function JobPostRow({
  title,
  applicants,
  status,
}: {
  title: string;
  applicants: string;
  status: string;
}) {

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-100 hover:bg-blue-50/40">

      <div className="flex items-center gap-4">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 font-black text-[#0446A7]">
          ▤
        </div>

        <div>

          <h3 className="font-bold text-slate-800">
            {title}
          </h3>

          <p className="text-xs text-slate-500">
            {applicants}
          </p>

        </div>

      </div>


      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          status === "Active"
            ? "bg-green-100 text-green-700"
            : "bg-slate-200 text-slate-600"
        }`}
      >
        {status}
      </span>

    </div>
  );
}


/* =====================================================
   APPLICATION PROGRESS
===================================================== */

function ApplicationProgress({
  label,
  value,
  width,
  color,
}: {
  label: string;
  value: string;
  width: string;
  color: string;
}) {

  return (
    <div>

      <div className="mb-2 flex justify-between text-sm">

        <span className="font-semibold text-slate-600">
          {label}
        </span>

        <span className="font-bold text-slate-800">
          {value}
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className={`h-full rounded-full ${color}`}
          style={{ width }}
        />

      </div>

    </div>
  );
}


/* =====================================================
   STATUS
===================================================== */

function EmployerStatus({
  status,
}: {
  status: string;
}) {

  const styles: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-700",
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


/* =====================================================
   MY JOB POSTS
===================================================== */

function MyJobPosts() {

  const jobs = [
    {
      title: "IT Support Specialist",
      applicants: 24,
      date: "September 20, 2026",
      status: "Active",
    },
    {
      title: "Sales Associate",
      applicants: 18,
      date: "September 18, 2026",
      status: "Active",
    },
    {
      title: "Administrative Assistant",
      applicants: 12,
      date: "September 15, 2026",
      status: "Active",
    },
    {
      title: "Customer Service Representative",
      applicants: 10,
      date: "August 28, 2026",
      status: "Closed",
    },
  ];

  return (
    <div className="space-y-6">

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <h1 className="text-3xl font-black text-[#123B70]">
            My Job Posts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your company's job vacancies.
          </p>

        </div>

        <button className="rounded-xl bg-[#0446A7] px-5 py-3 font-bold text-white transition hover:bg-[#123B70]">
          + Post a Job
        </button>

      </div>


      <div className="grid gap-5">

        {jobs.map((job, index) => (

          <div
            key={index}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-black text-[#0446A7]">
                  ▤
                </div>

                <div>

                  <h2 className="text-lg font-black text-[#123B70]">
                    {job.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Posted {job.date}
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-4">

                <div className="text-center">
                  <p className="text-xl font-black text-[#123B70]">
                    {job.applicants}
                  </p>

                  <p className="text-xs text-slate-500">
                    Applicants
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    job.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {job.status}
                </span>

                <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Manage
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}


/* =====================================================
   APPLICATIONS
===================================================== */

function Applications() {

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-black text-[#123B70]">
          Applications
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review and manage applicants for your job posts.
        </p>

      </div>


      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5">

          <div className="flex flex-col gap-3 md:flex-row">

            <input
              type="text"
              placeholder="Search applicants..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100"
            />

            <select className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 outline-none">
              <option>All Status</option>
              <option>Pending</option>
              <option>For Review</option>
              <option>Shortlisted</option>
              <option>Rejected</option>
            </select>

          </div>

        </div>


        <div className="table-scroll">

          <table className="w-full text-left">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">

              <tr>

                <th className="px-6 py-4">
                  Applicant
                </th>

                <th className="px-6 py-4">
                  Position
                </th>

                <th className="px-6 py-4">
                  Date Applied
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4">
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {recentApplications.map((application, index) => (

                <tr
                  key={index}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >

                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {application.applicant}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {application.position}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {application.date}
                  </td>

                  <td className="px-6 py-4">
                    <EmployerStatus status={application.status} />
                  </td>

                  <td className="px-6 py-4">

                    <button className="rounded-lg bg-[#0446A7] px-3 py-2 text-xs font-bold text-white hover:bg-[#123B70]">
                      View
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   COMPANY PROFILE
===================================================== */

type EmployerProfile = {
  employer_id: string;
  name: string;
  address: string | null;
  contact_person: string | null;
  contact_no: string | null;
  email: string | null;
};

function CompanyProfile() {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    contact_person: "",
    contact_no: "",
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        if (!cancelled) setError(`Unable to verify your account: ${authError.message}`);
        if (!cancelled) setLoading(false);
        return;
      }
      if (!user) {
        if (!cancelled) {
          setError("Please sign in to view your company profile.");
          setLoading(false);
        }
        return;
      }

      const { data, error: queryError } = await supabase
        .from("employer")
        .select("employer_id, name, address, contact_person, contact_no, email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (queryError) {
        console.error("Employer profile load error:", queryError);
        setError(`Unable to load your company profile: ${queryError.message}`);
      } else if (!data) {
        setError("Your company profile could not be found.");
      } else {
        const loaded = data as EmployerProfile;
        setProfile(loaded);
        setForm({
          name: loaded.name,
          address: loaded.address ?? "",
          contact_person: loaded.contact_person ?? "",
          contact_no: loaded.contact_no ?? "",
        });
      }
      setLoading(false);
    };
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const changes = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        contact_person: form.contact_person.trim() || null,
        contact_no: form.contact_no.trim() || null,
      };
      const { data, error: updateError } = await supabase
        .from("employer")
        .update(changes)
        .eq("employer_id", profile.employer_id)
        .select("employer_id, name, address, contact_person, contact_no, email")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("Your company profile was not updated. Please sign in again and try once more.");
      const updated = data as EmployerProfile;
      setProfile(updated);
      setForm({
        name: updated.name,
        address: updated.address ?? "",
        contact_person: updated.contact_person ?? "",
        contact_no: updated.contact_no ?? "",
      });
      setEditing(false);
      setSuccess("Company profile updated.");
    } catch (saveError) {
      console.error("Employer profile update error:", saveError);
      setError(saveError instanceof Error ? saveError.message : "Unable to save your company profile.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!profile) return;
    setForm({
      name: profile.name,
      address: profile.address ?? "",
      contact_person: profile.contact_person ?? "",
      contact_no: profile.contact_no ?? "",
    });
    setEditing(false);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#123B70]">Company Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your company and representative information.
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</p>}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading company profile...</div>
      ) : profile ? (
        <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0446A7] text-3xl font-black text-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#123B70]">{profile.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{profile.address || "Company address not provided"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Company Name
              <input value={editing ? form.name : profile.name} onChange={(event) => setForm({ ...form, name: event.target.value })} disabled={!editing} required maxLength={160} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Authorized Representative
              <input value={editing ? form.contact_person : profile.contact_person ?? ""} onChange={(event) => setForm({ ...form, contact_person: event.target.value })} disabled={!editing} maxLength={120} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Email Address
              <input value={profile.email ?? ""} disabled className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500" />
              <span className="mt-1 block text-xs font-normal text-slate-500">Contact support to change your sign-in email.</span>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Contact Number
              <input type="tel" value={editing ? form.contact_no : profile.contact_no ?? ""} onChange={(event) => setForm({ ...form, contact_no: event.target.value })} disabled={!editing} maxLength={30} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
            </label>
            <label className="block text-sm font-bold text-slate-700 md:col-span-2">
              Company Address
              <textarea value={editing ? form.address : profile.address ?? ""} onChange={(event) => setForm({ ...form, address: event.target.value })} disabled={!editing} maxLength={300} rows={3} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {editing ? (
              <>
                <button type="button" onClick={cancelEdit} disabled={saving} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-full bg-[#0446A7] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#123B70] disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
              </>
            ) : (
              <button type="button" onClick={() => { setError(""); setSuccess(""); setEditing(true); }} className="rounded-full bg-[#0446A7] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#123B70]">Edit Profile</button>
            )}
          </div>
        </form>
      ) : null}
    </div>
  );
}


export default EmployerDashboard;