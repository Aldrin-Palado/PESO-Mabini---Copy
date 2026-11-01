import React from "react";

export type JobSeekerPage =
  | "Home"
  | "Jobs"
  | "Saved Jobs"
  | "Application"
  | "Messages"
  | "AI Job Matches"
  | "AI Assistant"
  | "Profile";

type Props = {
  activePage: JobSeekerPage;
  setActivePage: (page: JobSeekerPage) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

const menuItems: {
  label: JobSeekerPage;
  icon: string;
}[] = [
  {
    label: "Home",
    icon: "⌂",
  },
  {
    label: "Jobs",
    icon: "💼",
  },
  {
    label: "Saved Jobs",
    icon: "☆",
  },
  {
    label: "Application",
    icon: "▤",
  },
  {
    label: "Messages",
    icon: "▣",
  },
  {
    label: "AI Job Matches",
    icon: "✦",
  },
  {
    label: "AI Assistant",
    icon: "✧",
  },
];

const accountItems: {
  label: JobSeekerPage;
  icon: string;
}[] = [
  {
    label: "Profile",
    icon: "◉",
  },
];

export default function JobSeekerSidebar({
  activePage,
  setActivePage,
  isOpen,
  onClose,
  onLogout,
}: Props) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        id="job-seeker-sidebar"
        aria-label="Job seeker navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 max-w-[85vw] flex-col border-r border-blue-100 bg-white shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none lg:translate-x-0 lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex min-h-20 items-center justify-between gap-3 border-b border-blue-100 px-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 font-bold text-white shadow-sm">
              P
            </div>

            <div>
              <h1 className="text-lg font-bold text-blue-800">
                <span className="text-blue-800">PESO </span>
                <span className="text-red-600">MABINI</span>
              </h1>

              <p className="text-xs text-gray-500">Job Seeker</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
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
              const active = activePage === item.label;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setActivePage(item.label);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <span className="flex w-5 justify-center text-lg">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Account
          </p>

          <nav className="space-y-1">
            {accountItems.map((item) => {
              const active = activePage === item.label;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setActivePage(item.label);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <span className="flex w-5 justify-center text-lg">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="border-t border-blue-100 p-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <span className="flex w-5 justify-center text-lg">
              ↪
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}