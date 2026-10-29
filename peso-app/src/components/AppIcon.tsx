import type { ReactNode } from "react";

export type AppIconName =
  | "arrowLeft"
  | "arrowRight"
  | "bell"
  | "bookmark"
  | "briefcase"
  | "building"
  | "chart"
  | "check"
  | "chevronRight"
  | "clock"
  | "dollar"
  | "factory"
  | "file"
  | "graduationCap"
  | "lightbulb"
  | "mail"
  | "mapPin"
  | "megaphone"
  | "message"
  | "phone"
  | "search"
  | "share"
  | "sparkles"
  | "star"
  | "thumbsUp"
  | "user"
  | "users"
  | "wrench"
  | "x";

const iconPaths: Record<AppIconName, ReactNode> = {
  arrowLeft: <path d="m15 18-6-6 6-6M9 12h12" />,
  arrowRight: <path d="M3 12h18m-7-7 7 7-7 7" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  bookmark: <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4z" />,
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 21v-4h6v4M8 7h1m6 0h1M8 11h1m6 0h1" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 4 3 6-7" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  dollar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M16 8.5c-.7-.8-1.8-1.2-3.3-1.2-1.8 0-3 .8-3 2.1 0 3.2 6.6 1.3 6.6 4.6 0 1.4-1.3 2.4-3.4 2.4-1.5 0-2.8-.5-3.7-1.5M12 5.5v13" />
    </>
  ),
  factory: (
    <>
      <path d="M3 21V9l6 3V9l6 3V5h6v16z" />
      <path d="M7 17h2m3 0h2m3 0h2M16 8h1" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8m-8 4h8" />
    </>
  ),
  graduationCap: (
    <>
      <path d="m2 10 10-5 10 5-10 5z" />
      <path d="M6 12v5c3.5 2.5 8.5 2.5 12 0v-5m4-2v6" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6m-5 4h4m-2-20a7 7 0 0 0-4 12.7c.8.5 1 1.2 1 1.8h6c0-.6.2-1.3 1-1.8A7 7 0 0 0 12 2z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  mapPin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  megaphone: (
    <>
      <path d="m3 11 18-5v12L3 13z" />
      <path d="M11 15v5a2 2 0 0 1-4 0v-6m14-4v8" />
    </>
  ),
  message: (
    <>
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
    </>
  ),
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.7 10.7 6.6-4.4m-6.6 7.4 6.6 4.4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" />
      <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1zM5 2l.8 2.2L8 5l-2.2.8L5 8l-.8-2.2L2 5l2.2-.8z" />
    </>
  ),
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />,
  thumbsUp: <path d="M7 10v12H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm0 0 5-8a3 3 0 0 1 2 3l-1 5h6a3 3 0 0 1 3 3l-2 7a3 3 0 0 1-3 2H7" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.9m-1-11.9a4 4 0 0 1 0 7.8" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.4-6.4L14 13l-3-3z" />
    </>
  ),
  x: <path d="m18 6-12 12M6 6l12 12" />,
};

type AppIconProps = {
  name: AppIconName;
  className?: string;
  title?: string;
};

export default function AppIcon({
  name,
  className = "h-5 w-5",
  title,
}: AppIconProps) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {iconPaths[name]}
    </svg>
  );
}
