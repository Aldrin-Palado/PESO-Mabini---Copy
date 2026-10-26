
import type { Dispatch, SetStateAction } from "react";

export type EmployerMenuName =
  | "Dashboard"
  | "My Job Posts"
  | "Applications"
  | "Company Profile";

interface EmployersSidebarProps {
  activeMenu: EmployerMenuName;
  setActiveMenu: (menu: EmployerMenuName) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  displayName: string;
  email: string | null;
  onSignOut: () => void;
}

const menuItems: {
  name: EmployerMenuName;
  icon: string;
}[] = [
  { name: "Dashboard", icon: "▦" },
  { name: "My Job Posts", icon: "▤" },
  { name: "Applications", icon: "✓" },
  { name: "Company Profile", icon: "▣" },
];

function EmployersSidebar({
  activeMenu,
  setActiveMenu,
  isSidebarOpen,
  setIsSidebarOpen,
  displayName,
  email,
  onSignOut,
}: EmployersSidebarProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "E";

  const handleNavigation = (menu: EmployerMenuName) => {
    setActiveMenu(menu);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Employer navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col overflow-y-auto bg-[#0446A7] text-white transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-[#0446A7]">
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
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg px-2 py-1 text-2xl hover:bg-white/10 lg:hidden"
          >
            ×
          </button>
        </div>

        {/* Employer information */}
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FED442] font-black text-[#123B70]">
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {displayName}
              </p>

              <p className="truncate text-xs text-blue-100">
                {email || "Employer"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-5">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-blue-200">
            Employer Portal
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const active = activeMenu === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleNavigation(item.name)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-white text-[#0446A7] shadow-sm"
                      : "text-blue-50 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      active
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
        <div className="mt-auto border-t border-white/10 p-4">
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-50 transition hover:bg-white/10"
          >
            <span aria-hidden="true">↪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default EmployersSidebar;
