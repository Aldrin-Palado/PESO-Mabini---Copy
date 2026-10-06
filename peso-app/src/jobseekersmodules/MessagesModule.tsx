import React, { useMemo, useState } from "react";

type Seeker = {
  job_seeker_id: string;
  full_name?: string | null;
  email?: string | null;
};

type JobSeekerPage =
  | "Home"
  | "Jobs"
  | "Applications"
  | "Messages"
  | "Profile";

type Conversation = {
  id: number;
  name: string;
  company: string;
  message: string;
  time: string;
  unread: number;
};

type Props = {
  seeker: Seeker;
  onNavigate: (page: JobSeekerPage) => void;
};

const conversations: Conversation[] = [
  {
    id: 1,
    name: "ABC Technology Solutions",
    company: "Employer",
    message: "Thank you for your application.",
    time: "10:30 AM",
    unread: 2,
  },
  {
    id: 2,
    name: "PESO Mabini",
    company: "PESO",
    message: "There is a new job fair announcement.",
    time: "Yesterday",
    unread: 1,
  },
];

export default function MessagesModule({
  seeker,
  onNavigate,
}: Props) {
  const [selected, setSelected] = useState<Conversation | null>(
    conversations[0]
  );

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [sentMessages, setSentMessages] = useState<
    { conversationId: number; text: string; time: string }[]
  >([]);

  const filteredConversations = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return conversations;
    }

    return conversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(keyword) ||
        conversation.company.toLowerCase().includes(keyword) ||
        conversation.message.toLowerCase().includes(keyword)
    );
  }, [search]);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !selected) {
      return;
    }

    setSentMessages((current) => [
      ...current,
      {
        conversationId: selected.id,
        text: trimmedMessage,
        time: "Just now",
      },
    ]);

    setMessage("");
  };

  const selectedSentMessages = selected
    ? sentMessages.filter(
        (item) => item.conversationId === selected.id
      )
    : [];

  const firstName =
    seeker.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="mx-auto max-w-5xl">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Messages
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Communicate with employers and PESO.
        </p>

        <p className="mt-2 text-sm text-blue-700">
          Hello, {firstName}. You can communicate with employers and PESO here.
        </p>
      </div>

      {/* Messenger Container */}
      <div className="flex h-[600px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* Conversations */}
        <div className="w-full border-r border-gray-200 md:w-80">

          {/* Search */}
          <div className="border-b border-gray-200 p-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Conversation List */}
          <div>

            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-3xl">
                  💬
                </div>

                <p className="mt-2 text-sm font-medium text-gray-700">
                  No conversations found
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Try another search.
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelected(conversation)}
                  className={`flex w-full gap-3 border-b border-gray-100 p-4 text-left transition hover:bg-blue-50 ${
                    selected?.id === conversation.id
                      ? "bg-blue-50"
                      : ""
                  }`}
                >

                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                    {conversation.name.charAt(0)}
                  </div>

                  {/* Conversation Information */}
                  <div className="min-w-0 flex-1">

                    <div className="flex justify-between gap-2">

                      <p className="truncate text-sm font-semibold text-gray-900">
                        {conversation.name}
                      </p>

                      <span className="shrink-0 text-xs text-gray-400">
                        {conversation.time}
                      </span>

                    </div>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {conversation.message}
                    </p>

                  </div>

                  {/* Unread Count */}
                  {conversation.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1.5 text-[10px] font-bold text-white">
                      {conversation.unread}
                    </span>
                  )}

                </button>
              ))
            )}

          </div>
        </div>

        {/* Chat */}
        <div className="hidden flex-1 flex-col md:flex">

          {selected ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                    {selected.name.charAt(0)}
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selected.name}
                    </h2>

                    <p className="text-xs text-gray-500">
                      {selected.company}
                    </p>
                  </div>

                </div>

              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5">

                {/* Incoming Message */}
                <div className="flex">
                  <div className="max-w-md rounded-2xl rounded-tl-none bg-white p-3 shadow-sm">

                    <p className="text-sm text-gray-700">
                      {selected.message}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-400">
                      {selected.time}
                    </p>

                  </div>
                </div>

                {/* Existing Reply */}
                <div className="flex justify-end">
                  <div className="max-w-md rounded-2xl rounded-tr-none bg-blue-700 p-3 text-white">

                    <p className="text-sm">
                      Thank you for reaching out.
                    </p>

                    <p className="mt-1 text-[10px] text-blue-100">
                      10:35 AM
                    </p>

                  </div>
                </div>

                {/* Newly Sent Messages */}
                {selectedSentMessages.map((sent, index) => (
                  <div
                    key={`${sent.conversationId}-${index}`}
                    className="flex justify-end"
                  >
                    <div className="max-w-md rounded-2xl rounded-tr-none bg-blue-700 p-3 text-white">

                      <p className="text-sm">
                        {sent.text}
                      </p>

                      <p className="mt-1 text-[10px] text-blue-100">
                        {sent.time}
                      </p>

                    </div>
                  </div>
                ))}

              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">

                <div className="flex gap-2">

                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="rounded-xl bg-blue-700 px-5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>

                </div>

              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              Select a conversation
            </div>
          )}

        </div>
      </div>

      {/* Profile Reminder */}
      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">

        <div className="flex items-center justify-between gap-4">

          <div>
            <h3 className="font-semibold text-blue-900">
              Keep your profile updated
            </h3>

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

      </div>

    </div>
  );
}