import React from "react";
import PesoLogo from "./PesoLogo";

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-slate-950 text-slate-400">
      <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

      <div className="mx-auto max-w-7xl px-4 pt-10 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] sm:px-5 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10">
          <div>
            <div className="flex items-center gap-3">
              <PesoLogo
                size="sm"
                showName
                tone="light"
                subtitle="Public Employment Service Office"
              />
            </div>

            <p className="mt-4 max-w-md text-sm leading-6">
              Connecting job seekers, employers, and employment services through one accessible platform.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-white">Quick Links</h3>
            <div className="mt-4 space-y-2 text-sm">
              <a href="#home" className="block transition hover:text-sky-400">
                Home
              </a>
              <a href="#about" className="block transition hover:text-sky-400">
                About Us
              </a>
              <a href="#jobs" className="block transition hover:text-sky-400">
                Job Vacancies
              </a>
              <a href="#employers" className="block transition hover:text-sky-400">
                Employers
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white">Contact Us</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p>📍 Public Employment Service Office</p>
              <p>📍 Mabini, Batangas</p>
              <p>📞 Contact information</p>
              <p>✉️ PESO email address</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-xs">
          © 2026 PESO-Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;