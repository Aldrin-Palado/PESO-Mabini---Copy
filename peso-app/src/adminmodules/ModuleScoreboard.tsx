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
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 className="mb-3 text-sm font-bold text-slate-900">{title} overview</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#123B70]">
              {metric.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
