import React from "react";

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-slate-950 text-slate-400">
      <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 font-black text-white">
                P
              </div>

              <div>
                <h3 className="font-bold text-white">PESO-Hub</h3>
                <p className="text-xs">Public Employment Service Office</p>
              </div>
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