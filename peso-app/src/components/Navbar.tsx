import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Job Vacancies", path: "/jobs" },
    { name: "Employers", path: "/employers" },
    { name: "Contact Us", path: "/contact" },
  ];

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 font-black text-white">
            P
          </div>

          <span className="text-xl font-black text-slate-900">
            PESO-Hub
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`font-semibold transition ${
                  isActive
                    ? "text-sky-600"
                    : "text-slate-600 hover:text-sky-600"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Authentication buttons */}
        <div className="flex gap-2">
          <button className="rounded-xl border border-sky-600 px-4 py-2 font-bold text-sky-600 transition hover:bg-sky-50">
            Login
          </button>

          <button className="rounded-xl bg-sky-600 px-4 py-2 font-bold text-white transition hover:bg-sky-500">
            Register
          </button>
        </div>

      </div>
    </nav>
  );
}