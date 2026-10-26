import { useState } from "react";
import Navbar from "../components/Navbar";

const recommendations = [
  {
    icon: "🎓",
    title: "Entry-Level Opportunities",
    description:
      "Help fresh graduates and first-time job seekers begin their careers by posting entry-level positions.",
    examples: "Office assistant, sales associate, service crew",
  },
  {
    icon: "🛠️",
    title: "Skilled and Technical Jobs",
    description:
      "Find applicants with specific skills, training, or experience for your business needs.",
    examples: "Electrician, technician, machine operator",
  },
  {
    icon: "💼",
    title: "Professional Positions",
    description:
      "Share openings that require specialized knowledge, qualifications, or professional experience.",
    examples: "Accountant, HR staff, supervisor",
  },
  {
    icon: "⏰",
    title: "Part-Time and Temporary Work",
    description:
      "Offer flexible or short-term opportunities for applicants looking for alternative work arrangements.",
    examples: "Seasonal staff, part-time cashier, project assistant",
  },
  {
    icon: "🏭",
    title: "Local and Community Jobs",
    description:
      "Post vacancies available in Mabini and nearby areas to connect with local job seekers.",
    examples: "Retail staff, hospitality staff, production worker",
  },
  {
    icon: "📈",
    title: "Career Growth Opportunities",
    description:
      "Promote positions where applicants can develop their skills and grow within your organization.",
    examples: "Trainee, junior staff, team leader",
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
              Find the Right Talent. <span className="text-sky-300">Post a Job.</span>
            </h1>

            <p className="hero-lead mt-6 max-w-2xl text-slate-300">
              PESO Mabini helps employers connect with job seekers. Explore these
              job posting ideas and share your opportunities with the local
              community.
            </p>

            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Post a Job <span className="ml-2" aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-sky-400 via-yellow-400 to-red-500" />
      </section>

      {/* Job posting recommendations */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-14 lg:px-8 lg:py-16">
        <section>
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-sky-600">
              Job Posting Ideas
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              What kind of job can you post?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Choose the type of opportunity your business needs. These are ideas
              to help you prepare a clear and useful job announcement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-2xl">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Examples
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{item.examples}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="mt-5 inline-flex items-center text-sm font-bold text-sky-700 transition hover:text-sky-900"
                >
                  Post Now <span className="ml-1" aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* Helpful posting tips */}
        <section className="mt-12 overflow-hidden rounded-2xl bg-slate-950 p-6 text-white sm:mt-16 sm:p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-yellow-300">
                Before you post
              </p>
              <h2 className="mt-2 text-xl font-black sm:text-2xl">
                Make your job announcement clear
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Include the position title, job responsibilities, qualifications,
                work location, employment type, salary or benefits, and application
                deadline. Clear details help job seekers understand if the position
                is right for them.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-yellow-300"
            >
              Post Now <span className="ml-2" aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </main>

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
                💼
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                aria-label="Close dialog"
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <h2 id="employer-auth-title" className="mt-5 text-xl font-black text-slate-900">
              Ready to post a job?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Please log in to your employer account or create one to continue
              posting job opportunities through PESO Mabini.
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
                Create Employer Account
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              Employers must have an account before posting a vacancy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
