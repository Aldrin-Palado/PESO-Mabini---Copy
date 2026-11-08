import { useEffect } from "react";
import AppIcon from "./AppIcon";

export type JobDetails = {
  id: string;
  title: string;
  company: string;
  companyLogoUrl?: string | null;
  employerVerified?: boolean;
  location?: string | null;
  employmentType?: string | null;
  classification?: string | null;
  salary?: string | null;
  description?: string | null;
  requirements?: string | null;
  openings?: number | null;
  deadline?: string | null;
  datePosted?: string | null;
  imageUrl?: string | null;
};

type Props = {
  job: JobDetails;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  footerNote?: string;
};

function displayDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PH", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
}

export default function JobDetailsModal({
  job,
  onClose,
  onAction,
  actionLabel,
  footerNote,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const overviewItems = [
    {
      label: "Location",
      value: job.location || "Not specified",
      icon: "mapPin" as const,
    },
    {
      label: "Employment type",
      value: job.employmentType || "Not specified",
      icon: "briefcase" as const,
    },
    ...(job.classification
      ? [{
          label: "Classification",
          value: job.classification,
          icon: "building" as const,
        }]
      : []),
    {
      label: "Salary",
      value: job.salary || "Not specified",
      icon: "dollar" as const,
    },
    ...(job.openings != null
      ? [{
          label: "Openings",
          value: String(job.openings),
          icon: "users" as const,
        }]
      : []),
    ...(job.deadline
      ? [{
          label: "Application deadline",
          value: displayDate(job.deadline) || job.deadline,
          icon: "clock" as const,
        }]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`job-title-${job.id}`}
        className="my-auto max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div className="max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sky-50 text-lg font-black text-sky-700">
                {job.companyLogoUrl ? (
                  <img
                    src={job.companyLogoUrl}
                    alt={`${job.company} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  job.company.charAt(0).toUpperCase() || "E"
                )}
              </div>
              <div className="min-w-0">
                <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-bold text-sky-700">
                  {job.company}
                  {job.employerVerified && (
                    <span
                      title="Verified employer"
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
                    >
                      <AppIcon name="check" className="h-3 w-3" />
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {displayDate(job.datePosted) || "Recently posted"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close job details"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <AppIcon name="x" className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
            <div>
              <h2
                id={`job-title-${job.id}`}
                className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
              >
                {job.title}
              </h2>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600">
                {job.company}
                {job.employerVerified && (
                  <span
                    title="Verified employer"
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
                  >
                    <AppIcon name="check" className="h-3 w-3" />
                  </span>
                )}
              </p>
            </div>

            {job.imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src={job.imageUrl}
                  alt={`${job.title} job`}
                  className="max-h-[55vh] w-full object-contain"
                />
              </div>
            )}

            <section aria-label="Job overview">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Job overview
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                {overviewItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-start gap-3 rounded-2xl border p-4 ${
                      item.label === "Salary"
                        ? "border-sky-200 bg-gradient-to-br from-sky-50 to-white sm:col-span-2"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        item.label === "Salary"
                          ? "bg-sky-700 text-white"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      <AppIcon name={item.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        {item.label}
                      </dt>
                      <dd
                        className={`mt-1 break-words font-bold capitalize ${
                          item.label === "Salary"
                            ? "text-lg text-sky-900"
                            : "text-sm text-slate-900"
                        }`}
                      >
                        {item.value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            <div className="grid gap-4">
              <section className="rounded-2xl border border-slate-200 border-l-4 border-l-sky-600 bg-white p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Job description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {job.description || "No description provided."}
                </p>
              </section>
              <section className="rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Requirements
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {job.requirements || "No specific requirements provided."}
                </p>
              </section>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">{footerNote}</p>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {onAction && actionLabel && (
                  <button
                    type="button"
                    onClick={onAction}
                    className="rounded-xl bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91]"
                  >
                    {actionLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  Close details
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
