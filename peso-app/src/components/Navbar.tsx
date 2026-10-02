import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PesoLogo from "./PesoLogo";

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Job Vacancies", path: "/jobs" },
    { name: "Employers", path: "/employers" },
    { name: "Contact Us", path: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      {/* pt/pb carry the notch inset so the bar clears the status bar on
          devices with a cutout, while keeping the original spacing. */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+1rem)] sm:pb-4">

        {/* Logo */}
        <PesoLogo size="sm" showName className="min-w-0" />

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
        <div className="hidden shrink-0 flex-nowrap items-center gap-3 md:flex">

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

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#123B70] transition hover:bg-slate-50 md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div
          id="mobile-navigation"
          className="max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2 md:hidden overscroll-contain"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 font-semibold transition ${
                    isActive
                      ? "bg-sky-50 text-[#0446A7]"
                      : "text-[#123B70] hover:bg-slate-50"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl border-2 border-[#0446A7] px-4 py-2.5 text-center font-bold text-[#0446A7] transition hover:bg-[#0446A7] hover:text-white"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl bg-[#EA4B45] px-4 py-2.5 text-center font-bold text-white transition hover:bg-[#D93D38]"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}