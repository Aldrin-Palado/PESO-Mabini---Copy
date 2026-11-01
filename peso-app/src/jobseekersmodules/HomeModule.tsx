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

export default function HomeModule({
  seeker,
  onNavigate,
}: Props) {
  const [pesoPosts, setPesoPosts] = useState<PESOPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const firstName =
    seeker.full_name?.trim().split(" ")[0] || "Job Seeker";

  useEffect(() => {
    let active = true;

    const loadPESOPosts = async () => {
      const { data, error } = await supabase
        .from("peso_posts")
        .select("id, title, content, category, image_url, created_at")
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
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-5">

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
            onClick={() => onNavigate("Jobs")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <AppIcon name="briefcase" className="h-5 w-5" />
            Find Jobs
          </button>

          <div className="w-px bg-gray-200" />

          <button
            type="button"
            onClick={() =>
              document.getElementById("job-seeker-peso-updates")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <AppIcon name="bell" className="h-5 w-5" />
            PESO Updates
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
              const expanded = expandedPostId === post.id;
              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt=""
                      loading="lazy"
                      className="h-48 w-full bg-slate-50 object-cover"
                    />
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
                    <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 ${expanded ? "" : "line-clamp-4"}`}>
                      {post.content}
                    </p>
                    {post.content.length > 220 && (
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setExpandedPostId(expanded ? null : post.id)}
                        className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
                      >
                        {expanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
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

    </div>
  );
}
import AppIcon from "../components/AppIcon";
