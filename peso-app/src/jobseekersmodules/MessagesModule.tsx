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
          Hello, {firstName}. Your conversations will appear here.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="text-4xl" aria-hidden="true">
          💬
        </div>
        <h2 className="mt-3 font-semibold text-gray-900">
          No messages yet
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          There are no conversations to display.
        </p>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-blue-900">
              Keep your profile updated
            </h2>
            <p className="mt-1 text-sm text-blue-700">
              Employers may use your profile information when communicating
              about your applications.
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
