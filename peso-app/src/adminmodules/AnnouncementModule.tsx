import React from "react";

type Announcement = {
  id: number;
  title: string;
  message: string;
  created_at: string;
};

type Props = {
  title: string;
  setTitle: (value: string) => void;

  message: string;
  setMessage: (value: string) => void;

  announcements: Announcement[];

  onCreate: () => void;
  onDelete: (id: number) => void;

  ModuleHeader: React.ComponentType<{
    title: string;
    description: string;
    onRefresh?: () => void;
  }>;

  EmptyMessage: React.ComponentType<{
    message: string;
  }>;

  formatDate: (date?: string) => string;
};

export default function AnnouncementModule({
  title,
  setTitle,
  message,
  setMessage,
  announcements,
  onCreate,
  onDelete,
  ModuleHeader,
  EmptyMessage,
  formatDate,
}: Props) {
  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Announcement"
        description="Create and manage PESO-Hub announcements."
      />

      {/* CREATE ANNOUNCEMENT */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h4 className="text-lg font-bold text-slate-800">
          Create Announcement
        </h4>

        <div className="mt-5 space-y-4">

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Announcement title"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Write your announcement..."
            rows={5}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <button
            onClick={onCreate}
            className="rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Publish Announcement
          </button>

        </div>

      </div>

      {/* ANNOUNCEMENT LIST */}
      <div className="space-y-4">

        <h4 className="text-lg font-bold text-slate-800">
          Announcements
        </h4>

        {announcements.length === 0 ? (

          <EmptyMessage
            message="No announcements have been created."
          />

        ) : (

          announcements.map(
            (announcement) => (

              <div
                key={announcement.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h5 className="font-bold text-slate-800">
                      {announcement.title}
                    </h5>

                    <p className="mt-2 text-sm text-slate-600">
                      {announcement.message}
                    </p>

                    <p className="mt-3 text-xs text-slate-400">
                      {formatDate(
                        announcement.created_at
                      )}
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      onDelete(
                        announcement.id
                      )
                    }
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>

                </div>

              </div>

            )
          )

        )}

      </div>

    </div>
  );
}