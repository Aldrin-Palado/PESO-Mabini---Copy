import { useNavigate } from "react-router-dom";

export type AdminModule =
  | "Dashboard Overview"
  | "Analytics"
  | "Job Posts"
  | "Job Application"
  | "Employers"
  | "Job Seekers"
  | "Admin Accounts"
  | "Notifications";

type AdminSidebarProps = {
  activePage: AdminModule | "My Profile";
  setActivePage: (
    page: AdminModule | "My Profile"
  ) => void;
  permissions: AdminModule[];
  isSuperadmin: boolean;
};

const modules: {
  name: AdminModule;
  icon: string;
}[] = [
  {
    name: "Dashboard Overview",
    icon: "▣",
  },
  {
    name: "Analytics",
    icon: "◉",
  },
  {
    name: "Job Posts",
    icon: "▤",
  },
  {
    name: "Job Application",
    icon: "▥",
  },
  {
    name: "Employers",
    icon: "♙",
  },
  {
    name: "Job Seekers",
    icon: "♙",
  },
  {
    name: "Admin Accounts",
    icon: "⚙",
  },
  {
    name: "Notifications",
    icon: "🔔",
  },
];

export default function AdminSidebar({
  activePage,
  setActivePage,
  permissions,
  isSuperadmin,
}: AdminSidebarProps) {
  const navigate = useNavigate();

  const visibleModules = isSuperadmin
    ? modules
    : modules.filter((module) =>
        permissions.includes(module.name)
      );

  const handleLogout = async () => {
    // Supabase logout will be added here
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-[#0446A7] text-white">

      {/* Logo */}
      <div className="border-b border-blue-400/30 px-6 py-6">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FED442] text-xl font-black text-[#123B70]">
            P
          </div>

          <div>
            <h1 className="text-xl font-black">
              PESO-Hub
            </h1>

            <p className="text-xs text-blue-100">
              Staff / Admin Portal
            </p>
          </div>

        </div>

      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">

        {visibleModules.map((module) => {
          const isActive =
            activePage === module.name;

          return (
            <button
              key={module.name}
              onClick={() =>
                setActivePage(module.name)
              }
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                isActive
                  ? "bg-white text-[#0446A7] shadow-sm"
                  : "text-blue-50 hover:bg-blue-600"
              }`}
            >

              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isActive
                    ? "bg-[#FED442] text-[#123B70]"
                    : "bg-blue-600"
                }`}
              >
                {module.icon}
              </span>

              {module.name}

            </button>
          );
        })}

      </nav>

      {/* Bottom */}
      <div className="border-t border-blue-400/30 p-4">

        <button
          onClick={() =>
            setActivePage("My Profile")
          }
          className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${
            activePage === "My Profile"
              ? "bg-white text-[#0446A7]"
              : "text-blue-50 hover:bg-blue-600"
          }`}
        >

          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            ♙
          </span>

          My Profile

        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-blue-50 transition hover:bg-red-500"
        >

          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            ↪
          </span>

          Logout

        </button>

      </div>

    </aside>
  );
}