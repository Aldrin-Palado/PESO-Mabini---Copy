import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

type EmploymentPost = {
  id: number;
  content: string;
  image?: string;
  date: string;
  likes: number;
  comments: number;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  date: string;
};

// =====================================================
// EMPLOYMENT POSTS
// Keep empty until posts are retrieved from the database.
// =====================================================

const employmentPosts: EmploymentPost[] = [];

// =====================================================
// ANNOUNCEMENTS
// Keep empty until announcements are retrieved.
// =====================================================

const announcements: Announcement[] = [];

function Home() {
  const [likedPosts, setLikedPosts] = useState<number[]>([]);

  const handleLike = (postId: number) => {
    setLikedPosts((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      <Navbar />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

        {/* Philippine-inspired accent */}
        <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

          {/* LOGO */}

          <a
            href="#home"
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
              href="#home"
              className="font-semibold text-sky-600 transition hover:text-sky-700"
            >
              Home
            </a>

            <a
              href="#about"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              About Us
            </a>

            <a
              href="#jobs"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              Job Vacancies
            </a>

            <Link
  to="/employers"
  className="font-medium text-slate-600 transition hover:text-sky-600"
>
  Employers
</Link>

            <a
              href="#contact"
              className="font-medium text-slate-600 transition hover:text-sky-600"
            >
              Contact Us
            </a>

          </nav>


          {/* LOGIN / REGISTER */}

          <div className="flex items-center gap-2">

            <button
              className="hidden rounded-lg px-4 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 sm:block"
            >
              Log In
            </button>

            <button
              className="rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 hover:shadow-md"
            >
              Register
            </button>

          </div>

        </div>
      </header>


      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section
        id="home"
        className="relative min-h-[620px] overflow-hidden bg-slate-950"
      >

        {/* Background image */}

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/peso-bg.jpg')",
          }}
        />

        {/* Overlay */}

        <div className="absolute inset-0 bg-slate-950/65" />

        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/50 to-transparent" />


        {/* Hero content */}

        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-5 py-20 lg:px-8">

          <div className="max-w-3xl text-white">

            {/* Label */}

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-sm">

              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />

              <span className="text-sm font-semibold">
                Public Employment Service Office
              </span>

            </div>


            {/* Heading */}

            <h2 className="text-5xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">

              Connecting People

              <span className="block text-sky-300">
                to Opportunities
              </span>

            </h2>


            {/* Description */}

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">

              PESO-Hub provides accessible employment services
              connecting job seekers, employers, and the
              Public Employment Service Office in one platform.

            </p>


            {/* Hero buttons */}

            <div className="mt-9 flex flex-wrap gap-4">

              <a
                href="#jobs"
                className="rounded-xl bg-yellow-400 px-7 py-3.5 font-bold text-slate-900 shadow-lg transition hover:-translate-y-1 hover:bg-yellow-300"
              >
                Find a Job
                <span className="ml-2">
                  →
                </span>
              </a>

              <Link
  to="/employers"
  className="rounded-xl border border-white/50 bg-white/10 px-7 py-3.5 font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-sky-700"
>
  For Employers
</Link>

            </div>


            {/* Small information */}

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-300">

              <div className="flex items-center gap-2">
                <span className="text-yellow-400">
                  ✓
                </span>
                Employment Assistance
              </div>

              <div className="flex items-center gap-2">
                <span className="text-yellow-400">
                  ✓
                </span>
                Job Opportunities
              </div>

              <div className="flex items-center gap-2">
                <span className="text-yellow-400">
                  ✓
                </span>
                Employer Services
              </div>

            </div>

          </div>

        </div>


        {/* Bottom accent */}

        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-sky-400 via-yellow-400 to-red-500" />

      </section>


      {/* =====================================================
          EMPLOYMENT FEED + ANNOUNCEMENTS
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8">

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">


          {/* =================================================
              EMPLOYMENT POSTING FEED
          ================================================= */}

          <section>

            {/* Section heading */}

            <div className="mb-7">

              <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                Employment Updates
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-900">
                Employment Postings
              </h2>

              <p className="mt-2 text-slate-500">
                Latest employment opportunities and job-related
                postings from PESO.
              </p>

            </div>


            {/* =================================================
                NO POSTS
            ================================================= */}

            {employmentPosts.length === 0 ? (

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* Accent */}

                <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

                <div className="px-6 py-20 text-center">

                  {/* Icon */}

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-50">

                    <svg
                      className="h-9 w-9 text-sky-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M7 8h10M7 12h6M7 16h4"
                      />

                    </svg>

                  </div>


                  <h3 className="mt-6 text-2xl font-bold text-slate-800">
                    No employment postings yet
                  </h3>

                  <p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">
                    There are currently no employment postings
                    available. Please check back later for new
                    job opportunities.
                  </p>

                  <div className="mx-auto mt-6 flex w-fit gap-1.5">

                    <span className="h-1.5 w-8 rounded-full bg-sky-400" />

                    <span className="h-1.5 w-4 rounded-full bg-yellow-400" />

                    <span className="h-1.5 w-3 rounded-full bg-red-400" />

                  </div>

                </div>

              </div>

            ) : (

              /* =================================================
                 FACEBOOK-STYLE FEED
              ================================================== */

              <div className="space-y-6">

                {employmentPosts.map((post) => {

                  const isLiked = likedPosts.includes(post.id);

                  return (

                    <article
                      key={post.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                    >

                      {/* Post header */}

                      <div className="flex items-center justify-between p-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 font-bold text-white">
                            P
                          </div>

                          <div>

                            <h3 className="font-bold text-slate-900">
                              PESO-Hub
                            </h3>

                            <p className="text-sm text-slate-500">
                              Public Employment Service Office ·{" "}
                              {post.date}
                            </p>

                          </div>

                        </div>

                        <button className="rounded-full px-3 py-2 text-xl text-slate-500 hover:bg-slate-100">
                          ⋮
                        </button>

                      </div>


                      {/* Post content */}

                      <div className="px-5 pb-5">

                        <p className="whitespace-pre-line leading-7 text-slate-700">
                          {post.content}
                        </p>

                      </div>


                      {/* Post image */}

                      {post.image && (

                        <div className="max-h-[500px] overflow-hidden bg-slate-100">

                          <img
                            src={post.image}
                            alt="Employment posting"
                            className="h-full w-full object-cover"
                          />

                        </div>

                      )}


                      {/* Counts */}

                      <div className="flex justify-between px-5 py-3 text-sm text-slate-500">

                        <span>
                          👍 {post.likes + (isLiked ? 1 : 0)} Likes
                        </span>

                        <span>
                          {post.comments} Comments
                        </span>

                      </div>


                      {/* Actions */}

                      <div className="mx-5 border-t border-slate-100">

                        <div className="grid grid-cols-3">

                          <button
                            onClick={() => handleLike(post.id)}
                            className={`py-3 font-semibold transition hover:bg-sky-50 ${
                              isLiked
                                ? "text-sky-600"
                                : "text-slate-600"
                            }`}
                          >
                            👍 Like
                          </button>

                          <button className="py-3 font-semibold text-slate-600 transition hover:bg-sky-50 hover:text-sky-600">
                            💬 Comment
                          </button>

                          <button className="py-3 font-semibold text-slate-600 transition hover:bg-sky-50 hover:text-sky-600">
                            ↗ Share
                          </button>

                        </div>

                      </div>

                    </article>

                  );

                })}

              </div>

            )}

          </section>


          {/* =================================================
              ANNOUNCEMENTS SIDEBAR
          ================================================== */}

          <aside>

            <div className="sticky top-28">

              <div className="mb-6">

                <p className="text-sm font-bold uppercase tracking-widest text-red-500">
                  Important
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Announcements
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Stay informed about PESO programs,
                  activities, and important updates.
                </p>

              </div>


              {/* No announcements */}

              {announcements.length === 0 ? (

                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">

                    <svg
                      className="h-7 w-7 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M15 17h5l-1.5-2.5V10a6.5 6.5 0 00-13 0v4.5L4 17h5"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M10 20h4"
                      />

                    </svg>

                  </div>

                  <h3 className="mt-5 font-bold text-slate-800">
                    No announcements yet
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    There are currently no announcements
                    available.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {announcements.map((announcement) => (

                    <article
                      key={announcement.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >

                      <div className="flex items-center justify-between">

                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                          Announcement
                        </span>

                        <span className="text-xs text-slate-400">
                          {announcement.date}
                        </span>

                      </div>

                      <h3 className="mt-4 font-bold text-slate-900">
                        {announcement.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {announcement.content}
                      </p>

                      <button className="mt-4 text-sm font-semibold text-sky-600 hover:text-sky-700">
                        Read More →
                      </button>

                    </article>

                  ))}

                </div>

              )}

            </div>

          </aside>

        </div>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        id="contact"
        className="bg-slate-950 text-slate-400"
      >

        {/* Accent */}

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

                  <h3 className="font-bold text-white">
                    PESO-Hub
                  </h3>

                  <p className="text-xs">
                    Public Employment Service Office
                  </p>

                </div>

              </div>

              <p className="mt-4 max-w-md text-sm leading-6">
                Connecting job seekers, employers, and
                employment services through one accessible
                platform.
              </p>

            </div>


            {/* Quick Links */}

            <div>

              <h3 className="font-bold text-white">
                Quick Links
              </h3>

              <div className="mt-4 space-y-2 text-sm">

                <a
                  href="#home"
                  className="block transition hover:text-sky-400"
                >
                  Home
                </a>

                <a
                  href="#about"
                  className="block transition hover:text-sky-400"
                >
                  About Us
                </a>

                <a
                  href="#jobs"
                  className="block transition hover:text-sky-400"
                >
                  Job Vacancies
                </a>

                <a
                  href="#employers"
                  className="block transition hover:text-sky-400"
                >
                  Employers
                </a>

              </div>

            </div>


            {/* Contact */}

            <div>

              <h3 className="font-bold text-white">
                Contact Us
              </h3>

              <div className="mt-4 space-y-3 text-sm">

                <p>
                  📍 Public Employment Service Office
                </p>

                <p>
                  📍 Mabini, Batangas
                </p>

                <p>
                  📞 Contact information
                </p>

                <p>
                  ✉️ PESO email address
                </p>

              </div>

            </div>

          </div>


          {/* Copyright */}

          <div className="mt-10 border-t border-slate-800 pt-6 text-xs">
            © 2026 PESO-Hub. All rights reserved.
          </div>

        </div>

      </footer>

    </div>
  );
}

export default Home;
