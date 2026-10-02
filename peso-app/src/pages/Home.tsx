import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import HeroBackground from "../components/HeroBackground";
import Navbar from "../components/Navbar";

const backgroundImage = new URL(
  "../assets/images/bg-image.png",
  import.meta.url,
).href;

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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">

      <Navbar />

      <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section
        id="home"
        className="hero-shell relative isolate overflow-hidden bg-slate-950"
      >

        {/* Background image — scaled to any viewport, focal point shifts per
            breakpoint so the photo survives tall, narrow phone screens. */}

        <HeroBackground src={backgroundImage} priority />

        {/* Overlay */}

        {/* Mobile needs a stronger wash than desktop: on a small screen the
            text sits on top of the busiest part of the photo. */}

        <div className="absolute inset-0 bg-slate-950/35 sm:bg-slate-950/50 lg:bg-slate-950/65" />

        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/70 via-sky-950/40 to-transparent" />


        {/* Hero content */}

        <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">

          <div className="max-w-3xl text-white">

            {/* Label */}

            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">

              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />

              <span className="text-xs font-semibold sm:text-sm">
                Public Employment Service Office
              </span>

            </div>


            {/* Heading */}

            <h2 className="hero-heading font-black text-white">

              Connecting People

              <span className="block text-sky-300">
                to Opportunities
              </span>

            </h2>


            {/* Description */}

            <p className="hero-lead mt-6 max-w-2xl text-slate-200 sm:mt-7">

              PESO-Hub provides accessible employment services
              connecting job seekers, employers, and the
              Public Employment Service Office in one platform.

            </p>


            {/* Hero buttons */}

            <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:gap-4 sm:mt-9">

              <a
                href="#jobs"
                className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3.5 text-center font-bold text-slate-900 shadow-lg transition hover:-translate-y-1 hover:bg-yellow-300 sm:px-7"
              >
                Find a Job
                <span className="ml-2">
                  →
                </span>
              </a>

              <Link
                to="/employers"
                className="inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/10 px-6 py-3.5 text-center font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-sky-700 sm:px-7 sm:hover:-translate-y-1"
>
                For Employers
              </Link>

            </div>


            {/* Small information */}

            <div className="mt-8 flex flex-col gap-y-3 text-xs text-slate-300 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:text-sm">

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

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-14 lg:px-8 lg:py-16">

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">


          {/* =================================================
              EMPLOYMENT POSTING FEED
          ================================================= */}

          <section>

            {/* Section heading */}

            <div className="mb-7">

              <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                Employment Updates
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
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

                <div className="px-4 py-14 text-center sm:px-6 sm:py-20">

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
                            loading="lazy"
                            decoding="async"
                            className="h-full max-h-[500px] w-full object-cover"
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

                <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                  Announcements
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Stay informed about PESO programs,
                  activities, and important updates.
                </p>

              </div>


              {/* No announcements */}

              {announcements.length === 0 ? (

                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">

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

      <Footer />

    </div>
  );
}

export default Home;