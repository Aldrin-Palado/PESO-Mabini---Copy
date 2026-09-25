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
    <nav className="sticky top-0 z-50 border-b border-[#007FFF] bg-[#007FFF]">
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
                    ? "text-yellow-400"
                    : "text-white hover:text-yellow-300"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Authentication buttons */}
        <div className="flex shrink-0 flex-nowrap items-center gap-2">
  <Link
    to="/login"
    className="whitespace-nowrap rounded-xl bg-yellow-400 px-4 py-2 font-bold text-slate-900 transition hover:bg-yellow-300"
  >
    Login
  </Link>

  <Link
    to="/register"
    className="whitespace-nowrap rounded-xl bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600"
  >
    Register
  </Link>
</div>

      </div>
    </nav>
  );
}