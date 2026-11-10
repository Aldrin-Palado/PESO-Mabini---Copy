type Props = {
  value: "peso" | "overall";
  pesoCount: number;
  overallCount: number;
  onChange: (scope: "peso" | "overall") => void;
};

const TABS = [
  { value: "peso", label: "PESO Applications" },
  { value: "overall", label: "Overall Applications" },
] as const;

export default function ApplicationScopeToggle({
  value,
  pesoCount,
  overallCount,
  onChange,
}: Props) {
  return (
    <div
      role="group"
      aria-label="Application scope"
      className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
    >
      {TABS.map((tab) => {
        const selected = value === tab.value;
        const count = tab.value === "peso" ? pesoCount : overallCount;

        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(tab.value)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-semibold transition sm:text-base ${
              selected
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.value === "peso" ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5 shrink-0"
              >
                <path d="M4 21h16M6 21V4h12v17M9 8h2m2 0h2m-6 4h2m2 0h2m-6 4h2m2 0h2" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5 shrink-0"
              >
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" />
              </svg>
            )}
            <span>{tab.label}</span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-slate-500">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
