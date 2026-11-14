import AppIcon, { type AppIconName } from "./AppIcon";

const moduleIconNames: Record<string, AppIconName> = {
  Home: "home",
  Dashboard: "home",
  "Dashboard Overview": "home",
  Jobs: "briefcase",
  "Job Post": "briefcase",
  "Job Posts": "briefcase",
  "My Job Posts": "briefcase",
  "Saved Jobs": "bookmark",
  Application: "file",
  Applications: "file",
  "Job Application": "file",
  Messages: "message",
  "AI Job Matches": "sparkles",
  "AI Assistant": "lightbulb",
  Profile: "user",
  "My Profile": "user",
  "Company Profile": "building",
  Employers: "building",
  "Job Seekers": "users",
  Analytics: "chart",
  "Analytics & Reports": "chart",
  Announcement: "megaphone",
  "PESO Posts": "megaphone",
  "Admin Accounts": "users",
  "Admin Audit Logs": "file",
};

type Props = {
  module: string;
  className?: string;
};

export default function ModuleIcon({
  module,
  className = "h-5 w-5",
}: Props) {
  return (
    <AppIcon
      name={moduleIconNames[module] ?? "file"}
      className={className}
    />
  );
}
