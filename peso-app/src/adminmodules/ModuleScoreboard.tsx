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
      className="overflow-hidden rounded-2xl border border-[#DCE5F2] bg-white shadow-[0_8px_24px_-18px_rgba(32,63,139,0.55)]"
    >
      <header className="relative flex items-center gap-3 border-b border-blue-100 bg-gradient-to-r from-[#203F8B] to-[#0759AE] px-4 py-4 text-white sm:px-5">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[#FACC15]" />
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#FACC15]">
          <AppIcon name={design.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold">{title}</h2>
          <p className="mt-0.5 text-xs text-blue-100">{design.description}</p>
        </div>
        <span className="ml-auto hidden rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white sm:inline-flex">
          Scoreboard
        </span>
      </header>
      <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="relative flex min-h-24 flex-col justify-between overflow-hidden rounded-xl border border-[#DFE7F2] bg-white p-4 shadow-[0_2px_8px_-6px_rgba(32,63,139,0.5)] transition hover:-translate-y-0.5 hover:border-[#9DB7E3] hover:shadow-md"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#FACC15]"
            />
            <p className="pl-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 pl-2 text-3xl font-black leading-none tracking-tight text-[#203F8B]">
              {metric.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
