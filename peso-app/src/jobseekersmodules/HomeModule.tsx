import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type Seeker = {
  job_seeker_id: string;
  full_name?: string | null;
  email?: string | null;
};

type PESOPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  image_urls: string[] | null;
  created_at: string;
};

type PESOAnnouncement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

type JobSeekerPage =
  | "Home"
  | "Jobs"
  | "Applications"
  | "Messages"
  | "Profile";

type Props = {
  seeker: Seeker;
  onNavigate: (page: JobSeekerPage) => void;
};

function readSeenIds(storageKey: string): string[] {
  try {
    const storedValue = localStorage.getItem(storageKey);
    if (!storedValue) return [];
    const parsed: unknown = JSON.parse(storedValue);
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
      return parsed;
    }
    console.error(`Invalid seen-post data in local storage: ${storageKey}`);
  } catch (error) {
    console.error(`Could not read seen-post data from local storage: ${storageKey}`, error);
  }
  return [];
}

function saveSeenIds(storageKey: string, ids: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch (error) {
    console.error(`Could not save seen-post data to local storage: ${storageKey}`, error);
  }
}

export default function HomeModule({
  seeker,
  onNavigate,
}: Props) {
  const [pesoPosts, setPesoPosts] = useState<PESOPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [announcements, setAnnouncements] = useState<PESOAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [seenPostIds, setSeenPostIds] = useState<string[]>([]);
  const [seenAnnouncementIds, setSeenAnnouncementIds] = useState<string[]>([]);
  const [selectedPESOPost, setSelectedPESOPost] = useState<PESOPost | null>(null);
  const [viewingImages, setViewingImages] = useState<string[] | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(0);

  const getPostImages = (post: PESOPost) =>
    [...new Set([...(post.image_urls ?? []), ...(post.image_url ? [post.image_url] : [])])];

  const firstName =
    seeker.full_name?.trim().split(" ")[0] || "Job Seeker";

  useEffect(() => {
    let active = true;
    setSeenPostIds(
      readSeenIds(`job-seeker-seen-peso-posts-${seeker.job_seeker_id}`),
    );
    setSeenAnnouncementIds(
      readSeenIds(`job-seeker-seen-peso-announcements-${seeker.job_seeker_id}`),
    );

    const loadPESOPosts = async () => {
      const { data, error } = await supabase
        .from("peso_posts")
        .select("id, title, content, category, image_url, image_urls, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(4);

      if (!active) return;

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
      active = false;
    };
  }, [seeker.job_seeker_id]);

  useEffect(() => {
    let active = true;

    const loadAnnouncements = async () => {
      const { data, error } = await supabase
        .from("peso_announcements")
        .select("id, title, message, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!active) return;

      if (error) {
        console.error("Could not load PESO announcements:", error);
        setAnnouncementsError(
          "Announcements are temporarily unavailable. Please try again later.",
        );
      } else {
        setAnnouncements((data ?? []) as PESOAnnouncement[]);
      }

      setAnnouncementsLoading(false);
    };

    void loadAnnouncements();
    return () => {
      active = false;
    };
  }, []);

  const markPESOUpdatesSeen = () => {
    const ids = [...new Set([...seenPostIds, ...pesoPosts.map((post) => post.id)])];
    setSeenPostIds(ids);
    saveSeenIds(`job-seeker-seen-peso-posts-${seeker.job_seeker_id}`, ids);
  };

  const markAnnouncementsSeen = () => {
    const ids = [
      ...new Set([
        ...seenAnnouncementIds,
        ...announcements.map((announcement) => announcement.id),
      ]),
    ];
    setSeenAnnouncementIds(ids);
    saveSeenIds(
      `job-seeker-seen-peso-announcements-${seeker.job_seeker_id}`,
      ids,
    );
  };

  const unseenPESOUpdates = pesoPosts.filter(
    (post) => !seenPostIds.includes(post.id),
  ).length;
  const unseenAnnouncements = announcements.filter(
    (announcement) => !seenAnnouncementIds.includes(announcement.id),
  ).length;

  useEffect(() => {
    if (!selectedPESOPost && !viewingImages) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (viewingImages) setViewingImages(null);
        else setSelectedPESOPost(null);
      }
      if (viewingImages?.length) {
        if (event.key === "ArrowRight") {
          setViewingImageIndex((index) => (index + 1) % viewingImages.length);
        }
        if (event.key === "ArrowLeft") {
          setViewingImageIndex((index) =>
            (index - 1 + viewingImages.length) % viewingImages.length,
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPESOPost, viewingImages]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">

      {/* Welcome Post */}
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-7 text-white">

          <p className="mb-1 text-sm text-blue-100">
            Welcome back, {firstName}
          </p>

          <h1 className="text-2xl font-bold">
            Find opportunities that match your skills.
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-blue-100">
            Explore job opportunities, track your applications,
            communicate with employers, and keep your profile updated.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("Jobs")}
            className="mt-5 rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-blue-900 transition hover:bg-yellow-300"
          >
            Explore Jobs
          </button>

        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex">

          <button
            type="button"
            onClick={() => {
              markPESOUpdatesSeen();
              document.getElementById("job-seeker-peso-updates")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            aria-label={`PESO Updates${unseenPESOUpdates ? `, ${unseenPESOUpdates} new` : ""}`}
            className="relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <span className="relative">
              <AppIcon name="bell" className="h-5 w-5" />
              {unseenPESOUpdates > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"
                />
              )}
            </span>
            PESO Updates
          </button>

          <div className="w-px bg-gray-200" />

          <button
            type="button"
            onClick={() => {
              markAnnouncementsSeen();
              document.getElementById("job-seeker-announcements")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            aria-label={`Announcements${unseenAnnouncements ? `, ${unseenAnnouncements} new` : ""}`}
            className="relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <span className="relative">
              <AppIcon name="megaphone" className="h-5 w-5" />
              {unseenAnnouncements > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"
                />
              )}
            </span>
            Announcements
          </button>

        </div>
      </div>

      <section
        id="job-seeker-peso-updates"
        className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        aria-labelledby="job-seeker-peso-updates-heading"
      >
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            PESO Mabini
          </p>
          <h2 id="job-seeker-peso-updates-heading" className="mt-1 text-lg font-bold text-gray-900">
            PESO Posts
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Programs, activities, events, and announcements from PESO Mabini.
          </p>
        </div>

        {postsLoading ? (
          <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            Loading PESO updates...
          </p>
        ) : postsError ? (
          <p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">
            {postsError}
          </p>
        ) : pesoPosts.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            There are no posts at the moment.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pesoPosts.map((post) => {
              const postImages = getPostImages(post);
              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  {postImages.length > 0 && (
                    <div className={`grid gap-1 ${postImages.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                      {postImages.slice(0, 4).map((imageUrl, index) => (
                        <button
                          key={imageUrl}
                          type="button"
                          onClick={() => {
                            setViewingImageIndex(index);
                            setViewingImages(postImages);
                          }}
                          aria-label={`View image ${index + 1} of ${postImages.length} for ${post.title}`}
                          className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600"
                        >
                          <img
                            src={imageUrl}
                            alt=""
                            loading="lazy"
                            className={`w-full bg-slate-50 object-cover transition group-hover:scale-105 ${
                              postImages.length === 1 ? "h-48" : "h-36"
                            }`}
                          />
                          {index === 3 && postImages.length > 4 && (
                            <span className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-lg font-bold text-white">
                              +{postImages.length - 4}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {post.category}
                      </span>
                      <time
                        dateTime={post.created_at}
                        className="text-xs text-gray-400"
                      >
                        {new Date(post.created_at).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    <h3 className="mt-3 font-bold text-gray-900">{post.title}</h3>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {post.content}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedPESOPost(post)}
                      className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Read announcement
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        id="job-seeker-announcements"
        className="mx-auto max-w-4xl scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        aria-labelledby="job-seeker-announcements-heading"
      >
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">
            Important
          </p>
          <h2
            id="job-seeker-announcements-heading"
            className="mt-1 text-lg font-bold text-gray-900"
          >
            Announcements
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Important updates from PESO Mabini.
          </p>
        </div>

        {announcementsLoading ? (
          <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            Loading announcements...
          </p>
        ) : announcementsError ? (
          <p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">
            {announcementsError}
          </p>
        ) : announcements.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            There are no announcements at the moment.
          </p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <time
                  dateTime={announcement.created_at}
                  className="text-xs text-gray-400"
                >
                  {new Date(announcement.created_at).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h3 className="mt-2 font-bold text-gray-900">
                  {announcement.title}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {announcement.message}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Profile Reminder */}
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

        <div className="flex gap-3">

          <div className="text-xl">
            <AppIcon name="lightbulb" className="h-6 w-6 text-yellow-700" />
          </div>

          <div className="flex-1">

            <h3 className="font-semibold text-yellow-900">
              Keep your profile updated
            </h3>

            <p className="mt-1 text-sm leading-5 text-yellow-800">
              Employers can better understand your qualifications when
              your education, skills, experience, and contact information
              are complete.
            </p>

            <button
              type="button"
              onClick={() => onNavigate("Profile")}
              className="mt-3 text-sm font-bold text-yellow-900 underline hover:text-yellow-700"
            >
              Update My Profile <AppIcon name="arrowRight" className="ml-1 inline h-4 w-4" />
            </button>

          </div>
        </div>
      </div>

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
            aria-labelledby="job-seeker-peso-announcement-title"
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {selectedPESOPost.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPESOPost(null)}
                aria-label="Close announcement"
                className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>
            </div>
            {getPostImages(selectedPESOPost).length > 0 && (
              <div className="space-y-3 bg-slate-50 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {getPostImages(selectedPESOPost).map((imageUrl, index) => (
                    <button
                      key={imageUrl}
                      type="button"
                      onClick={() => {
                        setViewingImageIndex(index);
                        setViewingImages(getPostImages(selectedPESOPost));
                      }}
                      aria-label={`View image ${index + 1} of ${getPostImages(selectedPESOPost).length}`}
                      className="group relative overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <img
                        src={imageUrl}
                        alt={`${selectedPESOPost.title}, image ${index + 1}`}
                        className="h-32 w-full object-cover transition group-hover:scale-105 sm:h-40"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-sm font-bold text-white transition group-hover:bg-slate-950/35">
                        View
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-500">
                  Select an image to view it larger.
                </p>
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
              <h2 id="job-seeker-peso-announcement-title" className="mt-2 text-2xl font-black text-slate-900">
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
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/95 p-4"
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
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
          >
            ×
          </button>
          {viewingImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setViewingImageIndex((index) =>
                  (index - 1 + viewingImages.length) % viewingImages.length,
                )
              }
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20 sm:left-6"
            >
              ‹
            </button>
          )}
          <figure className="flex max-h-full max-w-full flex-col items-center gap-3">
            <img
              src={viewingImages[viewingImageIndex]}
              alt={`PESO post image ${viewingImageIndex + 1}`}
              className="max-h-[82vh] max-w-[85vw] object-contain"
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
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20 sm:right-6"
            >
              ›
            </button>
          )}
        </div>
      )}

    </div>
  );
}
import AppIcon from "../components/AppIcon";
