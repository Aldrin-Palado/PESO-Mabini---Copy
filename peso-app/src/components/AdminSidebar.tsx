import { supabase } from "../services/supabase";

export type AdminModule =
  | "Dashboard"
  | "Job Post"
  | "Employers"
  | "Job Seekers"
  | "Applications"
  | "Announcement"
  | "Analytics & Reports"
  | "Admin Accounts"
  | "Admin Audit Logs";

type AdminSidebarProps = {
  activePage: AdminModule | "My Profile";
  setActivePage: (page: AdminModule | "My Profile") => void;
  permissions: AdminModule[];
  isSuperadmin: boolean;
};

export default function AdminSidebar({
  activePage,
  setActivePage,
  permissions,
  isSuperadmin,
}: AdminSidebarProps) {
  // Regular system modules
  const mainModules: AdminModule[] = [
    "Dashboard",
    "Job Post",
    "Employers",
    "Job Seekers",
    "Applications",
    "Announcement",
    "Analytics & Reports",
  ];

  // Administrative-only modules
  const adminModules: AdminModule[] = [
    "Admin Accounts",
    "Admin Audit Logs",
  ];

  const canAccess = (module: AdminModule) => {
    // Administrative modules are ONLY accessible by Admin
    if (
      module === "Admin Accounts" ||
      module === "Admin Audit Logs"
    ) {
      return isSuperadmin;
    }

    // Admin has access to all regular modules
    // Staff can only access modules assigned to them
    return isSuperadmin || permissions.includes(module);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-blue-900 text-white shadow-xl">

      {/* Logo / Title */}
      <div className="border-b border-blue-800 px-6 py-5">
        <h1 className="text-xl font-bold">
          Admin Portal
        </h1>

        <p className="mt-1 text-xs text-blue-200">
          PESO-Hub
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">

        {/* =========================
            MAIN MENU
        ========================= */}
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-blue-300">
          Main Menu
        </p>

        <div className="space-y-1">
          {mainModules.map((module) => {
            if (!canAccess(module)) return null;

            const isActive = activePage === module;

            return (
              <button
                key={module}
                onClick={() => setActivePage(module)}
                className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-red-600 text-white shadow"
                    : "text-blue-100 hover:bg-blue-800 hover:text-white"
                }`}
              >
                {module}
              </button>
            );
          })}
        </div>

        {/* =========================
            ADMINISTRATION
        ========================= */}
        {isSuperadmin && (
          <div className="mt-7">

            {/* Separator */}
            <div className="mb-5 border-t border-blue-800" />

            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-blue-300">
              Administration
            </p>

            <div className="space-y-1">
              {adminModules.map((module) => {
                if (!canAccess(module)) return null;

                const isActive = activePage === module;

                return (
                  <button
                    key={module}
                    onClick={() => setActivePage(module)}
                    className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-red-600 text-white shadow"
                        : "text-blue-100 hover:bg-blue-800 hover:text-white"
                    }`}
                  >
                    {module}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </nav>

      {/* =========================
          BOTTOM MENU
      ========================= */}
      <div className="border-t border-blue-800 p-3">

        {/* My Profile */}
        <button
          onClick={() => setActivePage("My Profile")}
          className={`mb-1 w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
            activePage === "My Profile"
              ? "bg-red-600 text-white"
              : "text-blue-100 hover:bg-blue-800 hover:text-white"
          }`}
        >
          My Profile
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-200 transition hover:bg-red-700 hover:text-white"
        >
          Logout
        </button>

      </div>
    </aside>
  );
}