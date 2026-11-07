
import type { Dispatch, SetStateAction } from "react";
import AppIcon from "./AppIcon";

const pesoLogo = new URL("../assets/images/Peso-logo.png", import.meta.url).href;

export type EmployerMenuName =
  | "Dashboard"
  | "My Job Posts"
  | "Applications"
  | "Messages"
  | "Company Profile";

interface EmployersSidebarProps {
  activeMenu: EmployerMenuName;
  setActiveMenu: (menu: EmployerMenuName) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  onSignOut: () => void;
}

const menuItems: {
  name: EmployerMenuName;
  icon?: string;
}[] = [
  { name: "Dashboard", icon: "▦" },
  { name: "My Job Posts", icon: "▤" },
  { name: "Applications", icon: "✓" },
  { name: "Messages" },
  { name: "Company Profile", icon: "▣" },
];

function EmployersSidebar({
  activeMenu,
  setActiveMenu,
  isSidebarOpen,
  setIsSidebarOpen,
  onSignOut,
}: EmployersSidebarProps) {
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
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 max-w-[85vw] flex-col border-r border-blue-100 bg-white text-slate-700 shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none lg:translate-x-0 lg:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding */}
        <div className="flex min-h-20 items-center justify-between gap-3 border-b border-blue-100 px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={pesoLogo}
              alt="PESO MABINI logo"
              width={546}
              height={457}
              className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="whitespace-nowrap text-lg font-bold">
                <span className="text-blue-800">PESO </span>
                <span className="text-red-600">MABINI</span>
              </h1>
              <p className="text-xs text-gray-500">Employer</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Main Menu
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
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <span className="flex w-5 justify-center" aria-hidden="true">
                    {item.name === "Messages" ? (
                      <AppIcon name="message" className="h-5 w-5" />
                    ) : (
                      item.icon
                    )}
                  </span>

                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="border-t border-blue-100 p-4">
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <span className="flex w-5 justify-center text-lg" aria-hidden="true">
              ↪
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default EmployersSidebar;
