import React from 'react';

const contactMethods = [
  {
    title: 'Office Address',
    detail: 'PESO Mabini, Public Employment Service Office\nMabini, Batangas, Philippines',
    accent: 'bg-sky-100 text-sky-700',
    label: 'Visit Us',
  },
  {
    title: 'Email Us',
    detail: 'peso.mabini@province.gov.ph',
    accent: 'bg-amber-100 text-amber-700',
    label: 'Send Email',
  },
  {
    title: 'Call Us',
    detail: '(043) 754-XXXX\nMon to Fri • 8:00 AM – 5:00 PM',
    accent: 'bg-emerald-100 text-emerald-700',
    label: 'Call Office',
  },
];

const officeHours = [
  'Monday to Friday',
  '8:00 AM – 5:00 PM',
  'Closed on weekends and holidays',
];

const quickLinks = [
  'Job placement assistance',
  'Employer registration support',
  'Career guidance and referral',
  'Skills and livelihood programs',
];

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.18),transparent_25%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-sky-100 backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              Public Employment Service Office
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
              Contact <span className="text-sky-300">PESO Mabini</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              We are here to support job seekers, employers, and community partners with responsive,
              people-focused employment services and livelihood assistance.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="mailto:peso.mabini@province.gov.ph"
                className="rounded-lg bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                Email the Office
              </a>
              <a
                href="tel:+6343754XXXX"
                className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {contactMethods.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className={`mb-5 inline-flex rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${item.accent}`}>
                {item.label}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-600">Send a message</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">We’d love to hear from you</h2>
            </div>

            <form className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  placeholder="How can we help?"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
                <textarea
                  rows={6}
                  placeholder="Tell us more about your inquiry..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                Send Message
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-600">Office hours</p>
              <div className="mt-5 space-y-4">
                {officeHours.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Quick Services</p>
              <ul className="mt-5 space-y-4">
                {quickLinks.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-200">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-gradient-to-r from-sky-50 to-white p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-600">Visit our office</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">Located in the heart of the community</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                PESO Mabini is committed to making public employment services accessible, transparent,
                and responsive to the needs of residents, employers, and local partners.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-56 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_#e0f2fe_0%,_#f8fafc_100%)] text-center text-slate-700">
                <div>
                  <div className="text-5xl">📍</div>
                  <p className="mt-3 text-lg font-semibold">PESO Mabini</p>
                  <p className="text-sm text-slate-500">Mabini, Batangas, Philippines</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
