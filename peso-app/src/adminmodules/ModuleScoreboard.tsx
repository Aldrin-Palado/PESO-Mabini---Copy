import AppIcon, { type AppIconName } from "../components/AppIcon";

export type ScoreboardMetric = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  metrics: ScoreboardMetric[];
};

const sectionDesign: Record<string, { description: string; icon: AppIconName }> = {
  "Job Posts": {
    description: "Vacancy status and availability",
    icon: "briefcase",
  },
  Applications: {
    description: "Applicant progress at a glance",
    icon: "file",
  },
  Employers: {
    description: "Employer registrations and verification",
    icon: "building",
  },
  "Job Seekers": {
    description: "Job seeker registrations and activity",
    icon: "users",
  },
};

export default function ModuleScoreboard({ title, metrics }: Props) {
  if (metrics.length === 0) return null;
  const design = sectionDesign[title] ?? {
    description: "Status overview",
    icon: "chart" as AppIconName,
  };

  return (
    <section
      aria-label={`${title} scoreboard`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white px-4 py-4 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0759AE] text-white shadow-sm shadow-blue-900/10">
          <AppIcon name={design.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{design.description}</p>
        </div>
        <span className="ml-auto hidden rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#3156A2] sm:inline-flex">
          Overview
        </span>
      </header>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#2D66B3]"
            />
            <p className="pl-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 pl-2 text-3xl font-bold tracking-tight text-[#123B70]">
              {metric.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
