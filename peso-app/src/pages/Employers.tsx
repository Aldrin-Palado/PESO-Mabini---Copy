import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AppIcon, { type AppIconName } from "../components/AppIcon";
import jobseeker1 from "../assets/images/jobseeker1.jfif";
import jobseeker2 from "../assets/images/jobseeker2.jfif";
import jobseeker3 from "../assets/images/jobseeker3.jfif";

const recommendations: {
  icon: AppIconName;
  title: string;
  description: string;
  examples: string;
}[] = [
  {
    icon: "graduationCap",
    title: "Entry-Level Roles",
    description:
      "Reach recent graduates and candidates beginning their careers with clear, accessible entry-level openings.",
    examples: "Office Assistant, Sales Associate, Service Crew",
  },
  {
    icon: "wrench",
    title: "Skilled and Technical Roles",
    description:
      "Connect with applicants whose technical training and practical experience match your workforce needs.",
    examples: "Electrician, Technician, Machine Operator",
  },
  {
    icon: "briefcase",
    title: "Professional Positions",
    description:
      "Promote opportunities requiring specialized knowledge, professional credentials, or relevant experience.",
    examples: "Accountant, HR Staff, Supervisor",
  },
  {
    icon: "clock",
    title: "Flexible and Fixed-Term Work",
    description:
      "Make temporary, seasonal, and part-time openings visible to candidates seeking flexible arrangements.",
    examples: "Seasonal Staff, Part-Time Cashier, Project Assistant",
  },
  {
    icon: "factory",
    title: "Local Opportunities",
    description:
      "Prioritize local recruitment by sharing vacancies available in Mabini and nearby communities.",
    examples: "Retail Staff, Hospitality Staff, Production Worker",
  },
  {
    icon: "chart",
    title: "Career Development Roles",
    description:
      "Highlight positions that offer structured learning, increased responsibility, and room to progress.",
    examples: "Trainee, Junior Staff, Team Leader",
  },
];

export default function Employers() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const goToLogin = () => {
    window.location.href = "/login";
  };

  const goToEmployerRegistration = () => {
    window.location.href = "/register?role=employer";
  };

  return (
    <div className="whirl-page-background min-h-screen">
      <Navbar />

      <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

      {/* Hero */}
      <section className="hero-shell-compact relative isolate overflow-hidden bg-slate-950">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3">
          {[jobseeker1, jobseeker2, jobseeker3].map((image) => (
            <img
              key={image}
              src={image}
              alt=""
              className="h-full w-full object-cover"
            />
          ))}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/65"
        />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sky-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="text-xs font-semibold text-white sm:text-sm">
                Public Employment Service Office
              </span>
            </div>

            <h1 className="hero-heading-compact font-black text-white">
              Connect with Local Talent.{" "}
              <span className="text-sky-300">Build Your Team.</span>
            </h1>

            <p className="hero-lead mt-6 max-w-2xl text-slate-300">
              Partner with PESO Mabini to reach job seekers and promote
              opportunities across the local community. Explore hiring
              categories and prepare a clear, effective vacancy announcement.
            </p>

            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Get Started <AppIcon name="arrowRight" className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-sky-400 via-yellow-400 to-red-500" />
      </section>

      {/* Job posting recommendations */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-14 lg:px-8 lg:py-16">
        <section>
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-sky-600">
              Hiring with PESO Mabini
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Find the right candidates for your business
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              From entry-level openings to experienced professionals, share
              opportunities that help your organization and the Mabini workforce
              grow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((item) => (
              <article
                key={item.title}
                className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                  <AppIcon name={item.icon} className="h-6 w-6 text-sky-700" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Example roles
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                    {item.examples}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Helpful posting tips */}
        <section className="mt-12 overflow-hidden rounded-2xl bg-[#062B4F] p-6 text-white shadow-lg sm:mt-16 sm:p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-yellow-300">
                Before you post
              </p>
              <h2 className="mt-2 text-xl font-black sm:text-2xl">
                Make your job announcement clear
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                A complete vacancy announcement should include the job title,
                responsibilities, qualifications, work location, employment
                type, compensation or benefits, and application deadline.
                Providing these details helps applicants make informed decisions
                and apply with confidence.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-yellow-300"
            >
              Post Now <AppIcon name="arrowRight" className="ml-2 h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />

      {/* Login / registration prompt */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employer-auth-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAuthModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-2xl">
                <AppIcon name="briefcase" className="h-6 w-6 text-sky-700" />
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                aria-label="Close dialog"
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <AppIcon name="x" className="h-5 w-5" />
              </button>
            </div>

            <h2 id="employer-auth-title" className="mt-5 text-xl font-black text-slate-900">
              Ready to connect with local talent?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sign in to your employer account or create one to share your
              vacancies with job seekers through PESO Mabini.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={goToLogin}
                className="w-full rounded-full bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                Login
              </button>
              <button
                type="button"
                onClick={goToEmployerRegistration}
                className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Create an Employer Account
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              An employer account is required to submit vacancies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
