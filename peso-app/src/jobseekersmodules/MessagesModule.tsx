import DirectMessages from "../components/DirectMessages";

type Seeker = {
  full_name?: string | null;
};

type JobSeekerPage = "Home" | "Jobs" | "Applications" | "Messages" | "Profile";

type Props = {
  seeker: Seeker;
  onNavigate: (page: JobSeekerPage) => void;
};

export default function MessagesModule({ seeker, onNavigate }: Props) {
  const firstName =
    seeker.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hello, {firstName}. Contact PESO staff, employers, and other job seekers.
        </p>
      </header>

      <DirectMessages mode="job_seeker" />

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-blue-900">
              Keep your profile updated
            </h2>
            <p className="mt-1 text-sm text-blue-700">
              Keep your contact details current so other users can reach you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("Profile")}
            className="shrink-0 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            My Profile
          </button>
        </div>
      </section>
    </div>
  );
}
