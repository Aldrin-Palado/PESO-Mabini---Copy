import { useEffect, useState } from "react";
import SidebarToggle from "./SidebarToggle";
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
  // Off-canvas below `lg`: a permanently fixed 256px column leaves no room
  // for content on a 320px phone.
  const [isOpen, setIsOpen] = useState(false);

  // Escape closes the drawer (keyboard users on a tablet/desktop viewport).
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const go = (module: AdminModule | "My Profile") => {
    setActivePage(module);
    setIsOpen(false);
  };

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
    <>
      {/* Tap-away backdrop, small screens only */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-blue-900 text-white shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none lg:w-64 lg:translate-x-0 lg:overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        {/* Logo / Title */}
        <div className="flex items-start justify-between gap-2 border-b border-blue-800 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-5 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">
              Admin Portal
            </h1>

            <p className="mt-1 text-xs text-blue-200">
              PESO-Hub
            </p>
          </div>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-100 transition hover:bg-blue-800 lg:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 lg:overflow-y-auto">

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
                  onClick={() => go(module)}
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
                    onClick={() => go(module)}
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
        <div className="border-t border-blue-800 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">

          {/* My Profile */}
          <button
            onClick={() => go("My Profile")}
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

      <SidebarToggle
        open={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      />
    </>
  );
}