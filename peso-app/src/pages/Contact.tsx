import React from "react";
import { Link } from "react-router-dom";

const contactMethods = [
  {
    title: "Office Address",
    detail:
      "PESO Mabini, Public Employment Service Office\nMabini, Batangas, Philippines",
    accent: "bg-sky-50 text-sky-600",
    label: "Visit Us",
  },
  {
    title: "Email Us",
    detail: "peso.mabini@province.gov.ph",
    accent: "bg-yellow-50 text-yellow-600",
    label: "Send Email",
  },
  {
    title: "Call Us",
    detail: "(043) 754-XXXX\nMon to Fri • 8:00 AM – 5:00 PM",
    accent: "bg-red-50 text-red-500",
    label: "Call Office",
  },
];

const officeHours = [
  "Monday to Friday",
  "8:00 AM – 5:00 PM",
  "Closed on weekends and holidays",
];

const quickLinks = [
  "Job placement assistance",
  "Employer registration support",
  "Career guidance and referral",
  "Skills and livelihood programs",
];

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* Top Philippine-inspired accent */}
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
              className="font-medium text-slate-600 transition hover:text-sky-600"
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
              className="font-semibold text-sky-600"
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

        {/* Decorative background */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sky-600/20 blur-3xl" />

        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">

          <div className="max-w-3xl">

            {/* Label */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />

              <span className="text-sm font-semibold text-white">
                Public Employment Service Office
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
              Contact{" "}
              <span className="text-sky-300">
                PESO Mabini
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              We are here to support job seekers, employers, and community
              partners with responsive, people-focused employment services
              and livelihood assistance.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">

              <a
                href="mailto:peso.mabini@province.gov.ph"
                className="rounded-xl bg-sky-600 px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-sky-500"
              >
                Email the Office
              </a>

              <a
                href="tel:+6343754XXXX"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-sky-700"
              >
                Call Now
              </a>

            </div>

          </div>

        </div>

        {/* Bottom accent */}
        <div className="h-1 bg-gradient-to-r from-sky-400 via-yellow-400 to-red-500" />

      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8">

        {/* Contact Methods */}
        <section>

          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
              Get In Touch
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              How Can We Help?
            </h2>

            <p className="mt-2 max-w-2xl text-slate-500">
              Reach out to PESO Mabini through any of the available contact
              channels below.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {contactMethods.map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                {/* Card accent */}
                <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

                <div className="p-6">

                  <div
                    className={`mb-5 inline-flex rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${item.accent}`}
                  >
                    {item.label}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {item.detail}
                  </p>

                </div>

              </div>
            ))}

          </div>

        </section>

        {/* Message + Sidebar */}
        <section className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Contact Form */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

            <div className="p-6 md:p-8">

              <div className="mb-7">

                <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                  Send a Message
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  We’d Love to Hear From You
                </h2>

                <p className="mt-2 text-slate-500">
                  Have a question or need assistance? Send us a message.
                </p>

              </div>

              <form className="space-y-5">

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Full Name
                    </label>

                    <input
                      type="text"
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Subject
                  </label>

                  <input
                    type="text"
                    placeholder="How can we help?"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Message
                  </label>

                  <textarea
                    rows={6}
                    placeholder="Tell us more about your inquiry..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-6 py-3.5 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md"
                >
                  Send Message
                </button>

              </form>

            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">

            {/* Office Hours */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="h-1 bg-sky-500" />

              <div className="p-6">

                <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                  Office Hours
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-900">
                  When We're Available
                </h3>

                <div className="mt-5 space-y-4">

                  {officeHours.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />

                      <span className="text-sm leading-6 text-slate-600">
                        {item}
                      </span>
                    </div>
                  ))}

                </div>

              </div>

            </div>

            {/* Quick Services */}
            <div className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-sm">

              <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

              <div className="p-6">

                <p className="text-sm font-bold uppercase tracking-widest text-sky-300">
                  Quick Services
                </p>

                <h3 className="mt-2 text-xl font-black text-white">
                  Employment Assistance
                </h3>

                <ul className="mt-5 space-y-4">

                  {quickLinks.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400" />

                      <span className="text-sm leading-6 text-slate-300">
                        {item}
                      </span>
                    </li>
                  ))}

                </ul>

              </div>

            </div>

          </aside>

        </section>

        {/* Visit Office */}
        <section className="mt-16 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

          <div className="grid gap-0 lg:grid-cols-2">

            {/* Text */}
            <div className="p-8 md:p-10">

              <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                Visit Our Office
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-900">
                Located in the Heart of the Community
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                PESO Mabini is committed to making public employment services
                accessible, transparent, and responsive to the needs of
                residents, employers, and local partners.
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 p-5">

                <p className="font-bold text-slate-900">
                  PESO Mabini
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Public Employment Service Office
                </p>

                <p className="mt-4 text-sm text-slate-600">
                  📍 Mabini, Batangas, Philippines
                </p>

              </div>

            </div>

            {/* Map Placeholder */}
            <div className="bg-slate-100 p-5 lg:p-8">

              <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-100 via-slate-50 to-yellow-50">

                <div className="text-center">

                  <div className="text-6xl">
                    📍
                  </div>

                  <p className="mt-4 text-xl font-black text-slate-800">
                    PESO Mabini
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Mabini, Batangas, Philippines
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="mt-8 bg-slate-950 text-slate-400">

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

export default Contact;