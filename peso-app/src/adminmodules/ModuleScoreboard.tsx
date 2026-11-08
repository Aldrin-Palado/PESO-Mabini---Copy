export type ScoreboardMetric = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  metrics: ScoreboardMetric[];
};

export default function ModuleScoreboard({ title, metrics }: Props) {
  if (metrics.length === 0) return null;

  return (
    <section
      aria-label={`${title} scoreboard`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-[#0759AE] to-[#123B70] px-4 py-3.5 text-white sm:px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-black">
          {title.charAt(0)}
        </span>
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="mt-0.5 text-xs text-blue-100">Status overview</p>
        </div>
      </header>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <article
            key={metric.label}
            className={`relative overflow-hidden rounded-xl border p-4 ${
              index === 0
                ? "border-blue-100 bg-blue-50/70"
                : "border-slate-200 bg-slate-50/70"
            }`}
          >
            <span aria-hidden="true" className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#2D66B3]" />
            <p className="pl-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 pl-2 text-2xl font-black tracking-tight text-[#123B70]">
              {metric.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
