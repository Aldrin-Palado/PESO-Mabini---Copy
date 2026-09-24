import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      <Navbar />

      {/* Philippine-inspired top accent */}
      <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 shadow-sm">
              <span className="text-xl font-black text-white">P</span>
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                PESO<span className="text-sky-600">-Hub</span>
              </h1>

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Public Employment Service Office
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">

            <Link
              to="/"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              Home
            </Link>

            <Link
              to="/about"
              className="font-semibold text-sky-600"
            >
              About Us
            </Link>

            <Link
              to="/jobs"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              Job Vacancies
            </Link>

            <Link
              to="/employers"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              Employers
            </Link>

            <Link
              to="/contact"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              Contact Us
            </Link>

          </nav>

          {/* Login / Register */}
          <div className="flex items-center gap-2">
            <button className="hidden rounded-lg px-4 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 sm:block">
              Log In
            </button>

            <button className="rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 hover:shadow-md">
              Register
            </button>
          </div>

        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">

        {/* Background decoration */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sky-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="text-sm font-semibold text-white">
                Public Employment Service Office
              </span>
            </div>

            <h1 className="text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
              About{" "}
              <span className="text-sky-300">
                PESO-Hub
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Learn more about PESO Mabini and our commitment to connecting
              job seekers, employers, and employment services through one
              accessible platform.
            </p>

          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-1 bg-gradient-to-r from-sky-400 via-yellow-400 to-red-500" />
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8">

        {/* Mission and Vision */}
        <section className="grid gap-8 md:grid-cols-2">

          {/* Mission */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="h-1 bg-gradient-to-r from-sky-500 to-sky-300" />

            <div className="p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-50">
                <svg
                  className="h-7 w-7 text-sky-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
                  />
                </svg>
              </div>

              <h2 className="mt-6 text-2xl font-black text-slate-900">
                Our Mission
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                To provide quality employment services and livelihood
                assistance to job seekers and employers, promoting productive
                employment and national development.
              </p>
            </div>
          </div>

          {/* Vision */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-300" />

            <div className="p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-50">
                <svg
                  className="h-7 w-7 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                  />
                </svg>
              </div>

              <h2 className="mt-6 text-2xl font-black text-slate-900">
                Our Vision
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                A center of excellence in employment and livelihood services
                that empowers individuals and contributes to economic growth
                and social stability.
              </p>
            </div>
          </div>

        </section>

        {/* Services */}
        <section className="mt-16">

          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
              What We Offer
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Our Services
            </h2>

            <p className="mt-2 max-w-2xl text-slate-500">
              PESO Mabini provides employment and livelihood services designed
              to support both job seekers and employers.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {[
              "Job Placement and Employment Services",
              "Career Counseling and Guidance",
              "Skills Training and Development Programs",
              "Livelihood Assistance and Support",
              "Employer-Employee Networking",
              "Job Referral Services",
            ].map((service, index) => (
              <div
                key={service}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    index % 3 === 0
                      ? "bg-sky-50 text-sky-600"
                      : index % 3 === 1
                      ? "bg-yellow-50 text-yellow-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  <span className="text-lg font-black">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-5 font-bold leading-6 text-slate-900 transition group-hover:text-sky-600">
                  {service}
                </h3>
              </div>
            ))}

          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mt-16 rounded-3xl bg-slate-900 p-8 md:p-12">

          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">

            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-yellow-400">
                Our Commitment
              </p>

              <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
                Why Choose PESO Mabini?
              </h2>

              <p className="mt-5 leading-7 text-slate-300">
                We aim to make employment services more accessible by
                providing support for job seekers while helping employers
                connect with potential candidates.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              {[
                "Professional and dedicated team",
                "Comprehensive employment solutions",
                "Free access to job opportunities",
                "Personalized career support",
                "Strong employer network",
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500">
                    <span className="text-sm font-black text-white">
                      ✓
                    </span>
                  </div>

                  <p className="text-sm font-semibold leading-6 text-slate-200">
                    {benefit}
                  </p>
                </div>
              ))}

            </div>

          </div>

        </section>

        {/* Contact */}
        <section className="mt-16">

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

            <div className="p-8 md:p-10">

              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">

                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-red-500">
                    Get In Touch
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-slate-900">
                    Contact PESO Mabini
                  </h2>

                  <p className="mt-3 max-w-xl leading-7 text-slate-500">
                    For employment assistance, job referrals, and other
                    employment-related services, you may contact the PESO
                    Mabini office.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-6">

                  <p className="font-bold text-slate-900">
                    PESO Mabini
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Public Employment Service Office
                  </p>

                  <p className="mt-4 text-sm text-slate-600">
                    📍 Mabini, Batangas
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    ✉️{" "}
                    <a
                      href="mailto:peso.mabini@plo.gov.ph"
                      className="font-medium text-sky-600 hover:text-sky-700"
                    >
                      peso.mabini@plo.gov.ph
                    </a>
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    📞 (02) XXXX-XXXX
                  </p>

                </div>

              </div>

            </div>
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400">

        <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h3 className="font-bold text-white">
                PESO<span className="text-sky-400">-Hub</span>
              </h3>

              <p className="mt-1 text-xs">
                Public Employment Service Office
              </p>
            </div>

            <p className="text-xs">
              © 2026 PESO-Hub. All rights reserved.
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
};

export default About;