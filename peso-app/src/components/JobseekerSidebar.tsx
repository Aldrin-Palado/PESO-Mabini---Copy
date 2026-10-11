import React from "react";

export type JobSeekerPage =
  | "Home"
  | "Jobs"
  | "Application"
  | "Messages"
  | "Profile";

type Props = {
  activePage: JobSeekerPage;
  setActivePage: (page: JobSeekerPage) => void;
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
    label: "Application",
    icon: "▤",
  },
  {
    label: "Messages",
    icon: "▣",
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
  onLogout,
}: Props) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-blue-100 bg-white">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-blue-100 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 font-bold text-white shadow-sm">
            P
          </div>

          <div>
            <h1 className="text-lg font-bold text-blue-800">
              PESO-Hub
            </h1>

            <p className="text-xs text-gray-500">
              Job Seeker
            </p>
          </div>
        </div>
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
                onClick={() => setActivePage(item.label)}
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
                onClick={() => setActivePage(item.label)}
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
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <span className="flex w-5 justify-center text-lg">
            ↪
          </span>

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}