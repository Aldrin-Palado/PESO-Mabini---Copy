function About() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

        {/* Philippine-inspired accent */}
        <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

          {/* LOGO */}

          <a
            href="#top"
            className="flex items-center gap-3"
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 shadow-sm">
              <span className="text-xl font-black text-white">
                P
              </span>
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                PESO<span className="text-sky-600">-Hub</span>
              </h1>

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Public Employment Service Office
              </p>
            </div>

          </a>

          {/* NAVIGATION */}

          <nav className="hidden items-center gap-8 lg:flex">

            <a
              href="/"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              Home
            </a>

            <a
              href="#top"
              className="font-semibold text-sky-600"
            >
              About Us
            </a>

            <a
              href="#mission"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              Mission
            </a>

            <a
              href="#programs"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              Programs
            </a>

          </nav>

        </div>

      </header>

      {/* =====================================================
          ABOUT HERO
      ===================================================== */}

      <section
        id="top"
        className="relative min-h-[520px] overflow-hidden bg-slate-950"
      >

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-950/50 to-slate-950" />

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-sky-400 via-yellow-400 to-red-500" />

        <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-5 py-20 lg:px-8">

          <div className="max-w-3xl text-white">

            {/* Label */}

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-sm">

              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />

              <span className="text-sm font-semibold">
                About Us
              </span>

            </div>

            {/* Heading */}

            <h2 className="text-5xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">

              About PESO
              <span className="block text-sky-300">
                Mabini
              </span>

            </h2>

            {/* Description */}

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">

              PESO-Mabini (Public Employment Service Office) is dedicated to
              empowering jobseekers and employers by providing accessible,
              professional employment services, skills development, and local
              labor market information.

            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          MISSION / VISION / VALUES
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8">

        <div className="grid gap-8 lg:grid-cols-2">

          {/* MISSION */}

          <section
            id="mission"
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
          >

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 font-bold text-white">
              🎯
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              Our Mission
            </h3>

            <p className="mt-4 leading-7 text-slate-600">
              To connect community members to meaningful employment
              opportunities through responsive career services, employer
              engagement, and targeted programs that foster inclusive economic
              growth.
            </p>

          </section>

          {/* VISION */}

          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 font-bold text-slate-900">
              👁️
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              Our Vision
            </h3>

            <p className="mt-4 leading-7 text-slate-600">
              A thriving Mabini where every resident has the opportunity and
              support to participate in the local economy and build a
              prosperous future.
            </p>

          </section>

        </div>

        {/* CORE VALUES */}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 font-bold text-white">
            ★
          </div>

          <h3 className="text-2xl font-black text-slate-900">
            Our Core Values
          </h3>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <h4 className="font-bold text-slate-900">Integrity</h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                We act transparently and ethically.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <h4 className="font-bold text-slate-900">Accessibility</h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Services that are easy to reach and use.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <h4 className="font-bold text-slate-900">Collaboration</h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Working with employers and community partners.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <h4 className="font-bold text-slate-900">Excellence</h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Delivering high-quality, client-centered support.
              </p>
            </div>

          </div>

        </section>

        {/* =================================================
            WHAT WE OFFER
        ================================================= */}

        <section id="programs" className="mt-16">

          <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
            Our Services
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-900">
            What We Offer
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <span className="text-3xl">💼</span>
              <h3 className="mt-4 font-bold text-slate-900">Job Matching</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Helping employers find qualified candidates and jobseekers find
                suitable roles.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <span className="text-3xl">🗣️</span>
              <h3 className="mt-4 font-bold text-slate-900">Career Counseling</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                One-on-one guidance, resume help, and interview preparation.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <span className="text-3xl">🎓</span>
              <h3 className="mt-4 font-bold text-slate-900">Skills Training</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Workshops and trainings aligned with local market needs.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <span className="text-3xl">🤝</span>
              <h3 className="mt-4 font-bold text-slate-900">Employer Services</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Recruitment support, labor market information, and partnership
                opportunities.
              </p>
            </div>

          </div>

        </section>

        {/* CTA */}

        <section className="mt-16 overflow-hidden rounded-2xl bg-slate-950 text-white">

          <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

          <div className="flex flex-col items-start justify-between gap-6 px-8 py-12 md:flex-row md:items-center">

            <div>
              <h2 className="text-3xl font-black">
                Get Involved
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-300">
                Whether you're an employer seeking talent or a jobseeker looking
                for support, PESO-Mabini is here to help.
              </p>
            </div>

            <a
              href="/JobVacancies"
              className="rounded-xl bg-yellow-400 px-7 py-3.5 font-bold text-slate-900 shadow-lg transition hover:-translate-y-1 hover:bg-yellow-300"
            >
              View Job Vacancies →
            </a>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-slate-950 text-slate-400">

        <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">

          <div className="grid gap-10 md:grid-cols-3">

            {/* Brand */}

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
                Connecting job seekers, employers, and employment services
                through one accessible platform.
              </p>

            </div>

            {/* Quick Links */}

            <div>

              <h3 className="font-bold text-white">Quick Links</h3>

              <div className="mt-4 space-y-2 text-sm">

                <a href="/" className="block transition hover:text-sky-400">Home</a>
                <a href="#top" className="block transition hover:text-sky-400">About Us</a>
                <a href="/JobVacancies" className="block transition hover:text-sky-400">Job Vacancies</a>

              </div>

            </div>

            {/* Contact */}

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

    </div>
  );
}

export default About;