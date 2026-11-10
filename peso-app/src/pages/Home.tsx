import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import HeroBackground from "../components/HeroBackground";
import Navbar from "../components/Navbar";
import AppIcon from "../components/AppIcon";
import type { PublicJobVacancyPreviewRow } from "../types/JobVacancy";
import { supabase } from "../services/supabase";

const heroImage = new URL(
  "../assets/images/image.png",
  import.meta.url,
).href;

const pageBackground = new URL(
  "../assets/images/bry-bg.png",
  import.meta.url,
).href;

type PESOPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  image_urls: string[] | null;
  video_urls: string[] | null;
  created_at: string;
};

type PESOAnnouncement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

function Home() {
  const [jobPreviews, setJobPreviews] = useState<
    PublicJobVacancyPreviewRow[]
  >([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [pesoPosts, setPesoPosts] = useState<PESOPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [selectedPESOPost, setSelectedPESOPost] = useState<PESOPost | null>(null);
  const [viewingImages, setViewingImages] = useState<string[] | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(0);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<PESOAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<PESOAnnouncement | null>(null);

  const getPostImages = (post: PESOPost) =>
    [...new Set([...(post.image_urls ?? []), ...(post.image_url ? [post.image_url] : [])])];
  const getPostVideos = (post: PESOPost) =>
    [...new Set(post.video_urls ?? [])];

  useEffect(() => {
    let cancelled = false;

    const loadJobPreviews = async () => {
      const { data, error } = await supabase
        .rpc("get_public_job_vacancy_previews")
        .order("position_title", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Could not load public job previews:", error);
        setJobsError("Job posts are temporarily unavailable. Please try again later.");
      } else {
        setJobPreviews((data ?? []) as PublicJobVacancyPreviewRow[]);
      }

      setJobsLoading(false);
    };

    void loadJobPreviews();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPESOPost && !selectedAnnouncement && !viewingImages) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (viewingImages) {
          setViewingImages(null);
        } else {
          setSelectedPESOPost(null);
          setSelectedAnnouncement(null);
        }
      } else if (viewingImages?.length && event.key === "ArrowRight") {
        setViewingImageIndex((index) => (index + 1) % viewingImages.length);
      } else if (viewingImages?.length && event.key === "ArrowLeft") {
        setViewingImageIndex(
          (index) => (index - 1 + viewingImages.length) % viewingImages.length,
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPESOPost, selectedAnnouncement, viewingImages]);

  useEffect(() => {
    let cancelled = false;

    const loadPESOPosts = async () => {
      const { data, error } = await supabase
        .from("peso_posts")
        .select("id, title, content, category, image_url, image_urls, video_urls, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(4);

      if (cancelled) return;

      if (error) {
        console.error("Could not load published PESO posts:", error);
        setPostsError("PESO updates are temporarily unavailable. Please try again later.");
      } else {
        setPesoPosts((data ?? []) as PESOPost[]);
      }

      setPostsLoading(false);
    };

    void loadPESOPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAnnouncements = async () => {
      const { data, error } = await supabase
        .from("peso_announcements")
        .select("id, title, message, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (cancelled) return;

      if (error) {
        console.error("Could not load PESO announcements:", error);
        setAnnouncementsError("Announcements are temporarily unavailable. Please try again later.");
      } else {
        setAnnouncements((data ?? []) as PESOAnnouncement[]);
      }
      setAnnouncementsLoading(false);
    };

    void loadAnnouncements();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative isolate flex min-h-screen flex-col text-slate-800">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.88)), url("${pageBackground}")`,
        }}
      />

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

        <HeroBackground
          src={heroImage}
          priority
          className="home-hero-media"
        />

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

              PESO MABINI provides accessible employment services
              connecting job seekers, employers, and the
              Public Employment Service Office in one platform.

            </p>


            {/* Hero buttons */}

            <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:gap-4 sm:mt-9">

              <Link
                to="/jobs"
                className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3.5 text-center font-bold text-slate-900 shadow-lg transition hover:-translate-y-1 hover:bg-yellow-300 sm:px-7"
              >
                Find a Job
                <AppIcon name="arrowRight" className="ml-2 h-4 w-4" />
              </Link>

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
                <AppIcon name="check" className="h-4 w-4 text-yellow-400" />
                Employment Assistance
              </div>

              <div className="flex items-center gap-2">
                <AppIcon name="check" className="h-4 w-4 text-yellow-400" />
                Job Opportunities
              </div>

              <div className="flex items-center gap-2">
                <AppIcon name="check" className="h-4 w-4 text-yellow-400" />
                Employer Services
              </div>

            </div>

          </div>

        </div>


        {/* Bottom accent */}

        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-sky-400 via-yellow-400 to-red-500" />

      </section>


      {/* =====================================================
          PESO POSTS
      ===================================================== */}

      <main className="mx-auto w-full max-w-screen-2xl px-4 py-12 sm:px-5 sm:py-14 lg:px-10 lg:py-16">

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)] xl:gap-10">
        <section aria-labelledby="public-peso-posts-heading">
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
              Official updates
            </p>
            <h2 id="public-peso-posts-heading" className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              PESO Posts
            </h2>
            <p className="mt-2 text-slate-500">
              Programs, activities, events, and announcements from PESO Mabini.
            </p>
          </div>

          {postsLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600" />
              <p className="mt-4 text-sm text-slate-500">Loading PESO posts...</p>
            </div>
          ) : postsError ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
              {postsError}
            </div>
          ) : pesoPosts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">
                There are no posts at the moment.
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Check back later for updates from PESO Mabini.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {pesoPosts.map((post) => (
                  <article
                    key={post.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-1 before:bg-gradient-to-b before:from-yellow-400 before:to-red-500 before:content-[''] hover:shadow-md"
                  >
                    {getPostImages(post).length > 0 && (
                      <div className={`grid gap-1 ${getPostImages(post).length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {getPostImages(post).slice(0, 4).map((imageUrl, index) => (
                          <button
                            key={imageUrl}
                            type="button"
                            onClick={() => {
                              setViewingImageIndex(index);
                              setViewingImages(getPostImages(post));
                            }}
                            aria-label={`View image ${index + 1} of ${getPostImages(post).length} for ${post.title}`}
                            className="group relative overflow-hidden bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600"
                          >
                            <img
                              src={imageUrl}
                              alt=""
                              loading="lazy"
                              className={`h-52 w-full object-contain transition group-hover:bg-slate-100 ${
                                index === 3 && getPostImages(post).length > 4
                                  ? "brightness-50"
                                  : ""
                              }`}
                            />
                            {index === 3 && getPostImages(post).length > 4 && (
                              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                                +{getPostImages(post).length - 4}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {getPostVideos(post).length > 0 && (
                      <div className="grid gap-1 bg-slate-950 sm:grid-cols-2">
                        {getPostVideos(post).slice(0, 2).map((videoUrl, index) => (
                          <video
                            key={videoUrl}
                            src={videoUrl}
                            controls
                            preload="metadata"
                            aria-label={`PESO post video ${index + 1} for ${post.title}`}
                            className="max-h-72 w-full bg-black object-contain"
                          />
                        ))}
                        {getPostVideos(post).length > 2 && (
                          <p className="px-3 py-2 text-xs text-white/80 sm:col-span-2">
                            +{getPostVideos(post).length - 2} more video{getPostVideos(post).length === 3 ? "" : "s"} in post
                          </p>
                        )}
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                          {post.category}
                        </span>
                        <time className="text-xs text-slate-400" dateTime={post.created_at}>
                          {new Date(post.created_at).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-900">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {post.content}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedPESOPost(post)}
                        className="mt-4 text-sm font-semibold text-sky-700 hover:text-sky-900"
                      >
                        See more
                        <AppIcon name="arrowRight" className="ml-1 inline h-4 w-4" />
                      </button>
                    </div>
                  </article>
              ))}
            </div>
          )}
        </section>

        <aside aria-labelledby="public-announcements-heading">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-widest text-red-500">
              Important
            </p>
            <h2 id="public-announcements-heading" className="mt-2 text-2xl font-black text-slate-900">
              Announcements
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Important updates from PESO Mabini.
            </p>
          </div>

          {announcementsLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-red-100 border-t-red-500" />
              <p className="mt-3 text-sm text-slate-500">Loading announcements...</p>
            </div>
          ) : announcementsError ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              {announcementsError}
            </p>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <h3 className="font-bold text-slate-800">No announcements yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Important PESO updates will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 pl-6 shadow-sm transition before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-yellow-400 before:to-red-500 before:content-[''] hover:shadow-md"
                >
                  <time className="text-xs text-slate-400" dateTime={announcement.created_at}>
                    {new Date(announcement.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <h3 className="mt-2 font-bold text-slate-900">{announcement.title}</h3>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {announcement.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Read announcement
                    <AppIcon name="arrowRight" className="ml-1 inline h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </aside>
        </div>

        <div className="hidden">

          {/* =================================================
              EMPLOYMENT POSTING FEED
          ================================================= */}

          <section>

            {/* Section heading */}

            <div className="mb-7">

              <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                Job Opportunities
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                Available Job Posts
              </h2>

              <p className="mt-2 text-slate-500">
                Browse current openings. Sign in to view full job details.
              </p>

            </div>


            {/* =================================================
                NO POSTS
            ================================================= */}

            {jobsLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600" />
                <p className="mt-4 text-sm text-slate-500">Loading job posts...</p>
              </div>
            ) : jobsError ? (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
                {jobsError}
              </div>
            ) : jobPreviews.length === 0 ? (

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
                    No job posts yet
                  </h3>

                  <p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">
                    There are currently no open job posts available. Please
                    check back later for new opportunities.
                  </p>

                  <div className="mx-auto mt-6 flex w-fit gap-1.5">

                    <span className="h-1.5 w-8 rounded-full bg-sky-400" />

                    <span className="h-1.5 w-4 rounded-full bg-yellow-400" />

                    <span className="h-1.5 w-3 rounded-full bg-red-400" />

                  </div>

                </div>

              </div>

            ) : (
              <>
                <div className="grid grid-cols-1 gap-5">
                  {jobPreviews.map((job) => (
                    <article
                      key={job.job_vacancy_id}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-8 lg:p-9"
                    >
                      <div className="flex items-start gap-4 sm:gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-bold text-sky-700 sm:h-14 sm:w-14">
                          <AppIcon name="briefcase" className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="break-words text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">
                            {job.position_title}
                          </h3>
                          <p className="mt-1 break-words text-sm text-slate-500 sm:text-base">
                            {job.employer_name || "Employer"}
                          </p>
                          {job.job_qualifications && (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                              <span className="font-semibold">Qualifications: </span>
                              {job.job_qualifications}
                            </p>
                          )}
                          <span className="mt-3 inline-flex rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold capitalize text-sky-700">
                            {job.job_classification}
                          </span>
                          {(job.location || job.employment_type) && (
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-600">
                              {job.location && (
                                <span className="inline-flex items-center gap-1.5">
                                  <AppIcon name="mapPin" className="h-3.5 w-3.5 text-slate-500" />
                                  {job.location}
                                </span>
                              )}
                              {job.employment_type && <span>{job.employment_type}</span>}
                            </div>
                          )}
                          {job.description && (
                            <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Link
                    to="/jobs"
                    className="inline-flex items-center rounded-xl bg-sky-600 px-6 py-3 font-bold text-white transition hover:bg-sky-700"
                  >
                    Browse all job posts
                    <AppIcon name="arrowRight" className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </>

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


              {postsLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600" />
                  <p className="mt-3 text-sm text-slate-500">Loading PESO updates...</p>
                </div>
              ) : postsError ? (
                <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                  {postsError}
                </p>
              ) : pesoPosts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-2xl font-black text-sky-700">
                    P
                  </div>
                  <h3 className="mt-5 font-bold text-slate-800">No updates yet</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    New PESO programs, activities, and announcements will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pesoPosts.map((post) => {
                    const expanded = expandedPostId === post.id;
                    return (
                      <article
                        key={post.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                      >
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt=""
                            loading="lazy"
                            className="h-44 w-full bg-slate-50 object-cover"
                          />
                        )}
                        <div className="p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                              {post.category}
                            </span>
                            <time className="text-xs text-slate-400" dateTime={post.created_at}>
                              {new Date(post.created_at).toLocaleDateString("en-PH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </time>
                          </div>
                          <h3 className="mt-4 font-bold text-slate-900">{post.title}</h3>
                          <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500 ${expanded ? "" : "line-clamp-4"}`}>
                            {post.content}
                          </p>
                          {post.content.length > 220 && (
                            <button
                              type="button"
                              aria-expanded={expanded}
                              onClick={() => setExpandedPostId(expanded ? null : post.id)}
                              className="mt-4 text-sm font-semibold text-sky-600 hover:text-sky-700"
                            >
                              {expanded ? "Show less" : "Read more"}
                              <AppIcon name="arrowRight" className="ml-1 inline h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

            </div>

          </aside>

        </div>

      </main>

      <Footer />

      {selectedPESOPost && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPESOPost(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="peso-announcement-title"
            className="my-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {selectedPESOPost.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPESOPost(null)}
                aria-label="Close announcement"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <AppIcon name="x" className="h-5 w-5" />
              </button>
            </div>
            {getPostImages(selectedPESOPost).length > 0 && (
              <div className="relative flex min-h-64 items-center justify-center bg-slate-950 p-3 sm:min-h-[28rem] sm:p-5">
                <img
                  src={getPostImages(selectedPESOPost)[viewingImageIndex % getPostImages(selectedPESOPost).length]}
                  alt={`${selectedPESOPost.title}, image ${(viewingImageIndex % getPostImages(selectedPESOPost).length) + 1}`}
                  className="max-h-[65vh] max-w-full object-contain"
                />
                {getPostImages(selectedPESOPost).length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setViewingImageIndex(
                          (index) =>
                            (index - 1 + getPostImages(selectedPESOPost).length) %
                            getPostImages(selectedPESOPost).length,
                        )
                      }
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                    >
                      <AppIcon name="arrowLeft" className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setViewingImageIndex(
                          (index) => (index + 1) % getPostImages(selectedPESOPost).length,
                        )
                      }
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                    >
                      <AppIcon name="arrowRight" className="h-5 w-5" />
                    </button>
                  </>
                )}
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                  {(viewingImageIndex % getPostImages(selectedPESOPost).length) + 1} / {getPostImages(selectedPESOPost).length}
                </span>
              </div>
            )}
            {getPostVideos(selectedPESOPost).length > 0 && (
              <div className="grid gap-3 bg-slate-950 p-3 sm:grid-cols-2 sm:p-5">
                {getPostVideos(selectedPESOPost).map((videoUrl, index) => (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    preload="metadata"
                    aria-label={`PESO post video ${index + 1}`}
                    className="max-h-[60vh] w-full rounded-xl bg-black object-contain"
                  />
                ))}
              </div>
            )}
            <div className="p-5 sm:p-7">
              <time className="text-sm text-slate-500" dateTime={selectedPESOPost.created_at}>
                {new Date(selectedPESOPost.created_at).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 id="peso-announcement-title" className="mt-2 text-2xl font-black text-slate-900">
                {selectedPESOPost.title}
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {selectedPESOPost.content}
              </p>
            </div>
          </section>
        </div>
      )}

      {viewingImages && viewingImages.length > 0 && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/95 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingImages(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Image ${viewingImageIndex + 1} of ${viewingImages.length}`}
        >
          <button
            type="button"
            onClick={() => setViewingImages(null)}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <AppIcon name="x" className="h-5 w-5" />
          </button>
          {viewingImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setViewingImageIndex(
                  (index) => (index - 1 + viewingImages.length) % viewingImages.length,
                )
              }
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
            >
              <AppIcon name="arrowLeft" className="h-5 w-5" />
            </button>
          )}
          <figure className="flex max-h-full max-w-full flex-col items-center gap-3">
            <img
              src={viewingImages[viewingImageIndex]}
              alt={`PESO post image ${viewingImageIndex + 1}`}
              className="max-h-[88vh] max-w-[92vw] object-contain"
            />
            <figcaption className="text-sm text-white/80">
              {viewingImageIndex + 1} / {viewingImages.length}
            </figcaption>
          </figure>
          {viewingImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setViewingImageIndex((index) => (index + 1) % viewingImages.length)
              }
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
            >
              <AppIcon name="arrowRight" className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedAnnouncement(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-announcement-title"
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                Announcement
              </span>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                aria-label="Close announcement"
                className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>
            </div>
            <div className="p-5 sm:p-7">
              <time className="text-sm text-slate-500" dateTime={selectedAnnouncement.created_at}>
                {new Date(selectedAnnouncement.created_at).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 id="public-announcement-title" className="mt-2 text-2xl font-black text-slate-900">
                {selectedAnnouncement.title}
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {selectedAnnouncement.message}
              </p>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}

export default Home;