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
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0446A7] font-black text-white">
            P
          </div>

          <span className="text-xl font-black text-[#123B70]">
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
                className={`relative py-2 font-semibold transition ${
                  isActive
                    ? "text-[#0446A7] after:absolute after:-bottom-2 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-[#EA4B45]"
                    : "text-[#123B70] hover:text-[#0446A7]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Authentication Buttons */}
        <div className="flex shrink-0 flex-nowrap items-center gap-3">

          {/* Login */}
          <Link
            to="/login"
            className="whitespace-nowrap rounded-xl border-2 border-[#0446A7] bg-white px-5 py-2 font-bold text-[#0446A7] transition hover:bg-[#0446A7] hover:text-white"
          >
            Login
          </Link>

          {/* Register */}
          <Link
            to="/register"
            className="whitespace-nowrap rounded-xl bg-[#EA4B45] px-5 py-2 font-bold text-white transition hover:bg-[#D93D38]"
          >
            Register
          </Link>

        </div>

      </div>
    </nav>
  );
}