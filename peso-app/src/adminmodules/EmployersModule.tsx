import React, { useState, type FormEvent } from "react";
import AppIcon from "../components/AppIcon";

type Employer = {
  id?: string;
  employer_id?: string;
  company_name?: string;
  business_name?: string;
  full_name?: string;
  name?: string;
  contact_person?: string;
  email?: string;
  contact_no?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
  is_verified?: boolean;
  verification_status?: EmployerVerificationStatus;
  created_at?: string;
  [key: string]: any;
};

export type EmployerVerificationStatus =
  | "pending"
  | "verified"
  | "not_approved";

type Props = {
  employers: Employer[];
  loadError?: string;
  search: string;
  setSearch: (value: string) => void;

  loading: boolean;
  onRefresh: () => void;
  onUpdate: (
    employerId: string,
    values: EmployerFormValues,
  ) => Promise<void>;
  onUpdateStatus: (
    employerId: string,
    status: EmployerVerificationStatus,
  ) => Promise<void>;
  onToggleActive: (employerId: string, isActive: boolean) => Promise<void>;

  ModuleHeader: React.ComponentType<{
    title: string;
    description: string;
    onRefresh?: () => void;
  }>;

  LoadingMessage: React.ComponentType;

  EmptyMessage: React.ComponentType<{
    message: string;
  }>;
};

export type EmployerFormValues = {
  name: string;
  email: string;
  contact_person: string;
  contact_no: string;
  address: string;
};

function getVerificationStatus(employer: Employer): EmployerVerificationStatus {
  if (employer.verification_status) return employer.verification_status;
  return employer.is_verified ? "verified" : "pending";
}

function isEmployerVerificationStatus(
  status: string,
): status is EmployerVerificationStatus {
  return (
    status === "pending" ||
    status === "verified" ||
    status === "not_approved"
  );
}

function formatDetailLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function EmployersModule({
  employers,
  loadError,
  search,
  setSearch,
  loading,
  onRefresh,
  onUpdate,
  onUpdateStatus,
  onToggleActive,
  ModuleHeader,
  LoadingMessage,
  EmptyMessage,
}: Props) {
  const [detailsEmployer, setDetailsEmployer] = useState<Employer | null>(null);
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
  const [formValues, setFormValues] = useState<EmployerFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingActiveId, setUpdatingActiveId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");

  const visibleEmployers = employers.filter((employer) => {
    if (appliedStatusFilter === "all") return true;
    return getVerificationStatus(employer) === appliedStatusFilter;
  });
  const verifiedCount = employers.filter(
    (employer) => getVerificationStatus(employer) === "verified",
  ).length;
  const pendingCount = employers.filter(
    (employer) => getVerificationStatus(employer) === "pending",
  ).length;
  const notApprovedCount = employers.filter(
    (employer) => getVerificationStatus(employer) === "not_approved",
  ).length;

  const startEditing = (employer: Employer) => {
    setActionError("");
    setEditingEmployer(employer);
    setFormValues({
      name: employer.name || employer.company_name || employer.business_name || "",
      email: employer.email || "",
      contact_person: employer.contact_person || "",
      contact_no: employer.contact_no || employer.phone || "",
      address: employer.address || "",
    });
  };

  const updateVerificationStatus = async (
    employer: Employer,
    status: EmployerVerificationStatus,
  ) => {
    if (!employer.employer_id) return;
    setUpdatingStatusId(employer.employer_id);
    setActionError("");
    try {
      await onUpdateStatus(employer.employer_id, status);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update employer verification status.",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };
  const saveEmployer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const employerId = editingEmployer?.employer_id;
    if (!employerId || !formValues) return;

    setSaving(true);
    setActionError("");
    try {
      await onUpdate(employerId, formValues);
      setEditingEmployer(null);
      setFormValues(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update employer.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleEmployerActive = async (employer: Employer) => {
    const employerId = employer.employer_id;
    if (!employerId) return;
    const name =
      employer.name ||
      employer.company_name ||
      employer.business_name ||
      "this employer";
    const nextIsActive = employer.is_active === false;
    const confirmed = window.confirm(
      `${nextIsActive ? "Activate" : "Deactivate"} ${name}'s account? ${
        nextIsActive
          ? "They will be able to access their employer account."
          : "They will no longer be able to access their employer account."
      }`,
    );
    if (!confirmed) return;

    setUpdatingActiveId(employerId);
    setActionError("");
    try {
      await onToggleActive(employerId, nextIsActive);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update employer account status.",
      );
    } finally {
      setUpdatingActiveId(null);
    }
  };

  const renderActions = (employer: Employer) => (
    <details className="group relative inline-block text-left">
      <summary
        aria-label="Show employer actions"
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 [&::-webkit-details-marker]:hidden"
      >
        <span
          aria-hidden="true"
          className="transition group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="absolute right-0 z-30 mt-2 min-w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
            setDetailsEmployer(employer);
          }}
          className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Details
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
            startEditing(employer);
          }}
          disabled={
            !employer.employer_id ||
            updatingActiveId === employer.employer_id
          }
          className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
            void toggleEmployerActive(employer);
          }}
          disabled={
            !employer.employer_id ||
            updatingActiveId === employer.employer_id
          }
          className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition disabled:opacity-50 ${
            employer.is_active === false
              ? "text-emerald-700 hover:bg-emerald-50"
              : "text-amber-700 hover:bg-amber-50"
          }`}
        >
          {updatingActiveId === employer.employer_id
            ? "Updating..."
            : employer.is_active === false
              ? "Activate"
              : "Deactivate"}
        </button>
      </div>
    </details>
  );

  return (
    <div className="space-y-5">

      <ModuleHeader
        title="Employers"
        description="View and manage registered employers of PESO Mabini."
        onRefresh={onRefresh}
      />

      {loadError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {loadError}
        </p>
      )}

      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {actionError}
        </p>
      )}

      <section aria-label="Employer statistics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total employers",
            value: employers.length,
            icon: "building" as const,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Verified",
            value: verifiedCount,
            icon: "check" as const,
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Pending",
            value: pendingCount,
            icon: "clock" as const,
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Not approved",
            value: notApprovedCount,
            icon: "x" as const,
            color: "bg-red-50 text-red-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
              <AppIcon name={stat.icon} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">Find employers</h2>
          <p className="mt-1 text-xs text-slate-500">
            Search company and contact details, or filter by verification status.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
        <label className="block text-xs font-semibold text-slate-600">
          Search employers
          <span className="relative mt-1.5 block">
            <AppIcon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, email, or phone..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
          </span>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Account status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="not_approved">Not approved</option>
          </select>
        </label>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setAppliedStatusFilter("all");
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setAppliedStatusFilter(statusFilter)}
            className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-xs font-semibold text-[#0759AE] transition hover:bg-blue-50"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0759AE] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#064A91]"
          >
            Refresh
          </button>
        </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered employers</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Company profiles and verification status
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Showing {visibleEmployers.length} of {employers.length}
          </span>
        </div>
        {loading ? (
          <LoadingMessage />
        ) : employers.length === 0 ? (
          <EmptyMessage message="No employers found." />
        ) : visibleEmployers.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No employers match these filters.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 2xl:hidden">
              {visibleEmployers.map((employer, index) => {
                const name =
                  employer.name ||
                  employer.company_name ||
                  employer.business_name ||
                  employer.full_name ||
                  "Unnamed Employer";
                const status = getVerificationStatus(employer);

                return (
                  <article
                    key={employer.employer_id || employer.id || index}
                    className="p-4 transition hover:bg-slate-50/80 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1766B4]">
                        <AppIcon name="building" className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-bold text-slate-900">
                            {name}
                          </h3>
                          <select
                            aria-label={`Verification status for ${name}`}
                            value={status}
                            onChange={(event) => {
                              const nextStatus = event.target.value;
                              if (isEmployerVerificationStatus(nextStatus)) {
                                void updateVerificationStatus(employer, nextStatus);
                              }
                            }}
                            disabled={
                              !employer.employer_id ||
                              updatingStatusId === employer.employer_id
                            }
                            className={`max-w-full rounded-full border-0 px-2.5 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${
                              status === "verified"
                                ? "bg-emerald-50 text-emerald-700"
                                : status === "not_approved"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="not_approved">Not approved</option>
                          </select>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <p className="flex min-w-0 items-center gap-2">
                            <AppIcon name="mail" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{employer.email || "Email not provided"}</span>
                          </p>
                          <p className="flex min-w-0 items-center gap-2">
                            <AppIcon name="user" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{employer.contact_person || "Contact person not provided"}</span>
                          </p>
                          <p className="flex min-w-0 items-center gap-2">
                            <AppIcon name="phone" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{employer.contact_no || employer.phone || "Phone not provided"}</span>
                          </p>
                          <p className="flex min-w-0 items-start gap-2 sm:col-span-2">
                            <AppIcon name="mapPin" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="line-clamp-2">{employer.address || "Location not provided"}</span>
                          </p>
                        </div>
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          {renderActions(employer)}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto 2xl:block">
            <table className="w-full min-w-[1040px] table-fixed">
              <thead className="bg-gradient-to-r from-[#1766B4] to-[#124A91] text-left">
                <tr>
                  {[
                    ["Company", "w-[16%]"],
                    ["Email", "w-[16%]"],
                    ["Contact Person", "w-[13%]"],
                    ["Phone", "w-[11%]"],
                    ["Location", "w-[14%]"],
                    ["Status", "w-[10%]"],
                    ["Actions", "w-[20%]"],
                  ].map(([label, width]) => (
                    <th key={label} className={`${width} px-3 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleEmployers.map((employer, index) => {

                    const name =
                      employer.name ||
                      employer.company_name ||
                      employer.business_name ||
                      employer.full_name ||
                      "Unnamed Employer";

                    const status = getVerificationStatus(employer);

                    return (
                      <tr
                        key={
                          employer.id ||
                          employer.employer_id ||
                          index
                        }
                        className={`align-middle transition-colors hover:bg-blue-50/70 ${
                          index % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                        }`}
                      >
                        <td className="px-3 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1766B4]">
                              <AppIcon name="building" className="h-5 w-5" />
                            </span>
                            <span className="truncate text-sm font-bold text-slate-900" title={name}>
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="truncate px-3 py-3 text-xs text-slate-700" title={employer.email || ""}>
                          {employer.email || "-"}
                        </td>
                        <td className="truncate px-3 py-3 text-xs text-slate-700" title={employer.contact_person || ""}>
                          {employer.contact_person || "-"}
                        </td>
                        <td className="truncate px-3 py-3 text-xs text-slate-700">
                          {employer.contact_no || employer.phone || "-"}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-700" title={employer.address || ""}>
                          <span className="flex items-start gap-2">
                            <AppIcon name="mapPin" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1766B4]" />
                            <span className="line-clamp-2">{employer.address || "-"}</span>
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            aria-label={`Verification status for ${name}`}
                            value={status}
                            onChange={(event) => {
                              const nextStatus = event.target.value;
                              if (isEmployerVerificationStatus(nextStatus)) {
                                void updateVerificationStatus(employer, nextStatus);
                              }
                            }}
                            disabled={
                              !employer.employer_id ||
                              updatingStatusId === employer.employer_id
                            }
                            className={`max-w-full rounded-full border-0 px-2.5 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${
                              status === "verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : status === "not_approved"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="not_approved">Not approved</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          {renderActions(employer)}
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}

      </section>

      {detailsEmployer && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employer-details-title"
          onClick={() => setDetailsEmployer(null)}
        >
          <section
            className="my-4 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#203F8B]">
                  Employer Details
                </p>
                <h2
                  id="employer-details-title"
                  className="mt-1 truncate text-lg font-bold text-slate-900"
                >
                  {detailsEmployer.name ||
                    detailsEmployer.company_name ||
                    detailsEmployer.business_name ||
                    detailsEmployer.full_name ||
                    "Unnamed Employer"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailsEmployer(null)}
                aria-label="Close employer details"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </header>
            <dl className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {Object.entries(detailsEmployer).map(([key, value]) => {
                const formattedValue = formatDetailValue(value);
                const isExternalUrl =
                  typeof value === "string" &&
                  /^https?:\/\//i.test(value);

                return (
                  <div
                    key={key}
                    className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <dt className="text-xs font-semibold text-slate-500">
                      {formatDetailLabel(key)}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                      {isExternalUrl ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-700 underline"
                        >
                          {formattedValue}
                        </a>
                      ) : (
                        formattedValue
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </div>
      )}

      {editingEmployer && formValues && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-employer-title"
            onSubmit={(event) => void saveEmployer(event)}
            className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div>
              <h2 id="edit-employer-title" className="text-lg font-bold text-slate-900">
                Update Employer
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update the employer profile information. Changing this email does not change sign-in credentials.
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Company / Employer Name
              <input
                required
                value={formValues.name}
                onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={formValues.email}
                onChange={(event) => setFormValues({ ...formValues, email: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Contact Person
              <input
                value={formValues.contact_person}
                onChange={(event) => setFormValues({ ...formValues, contact_person: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Contact Number
              <input
                value={formValues.contact_no}
                onChange={(event) => setFormValues({ ...formValues, contact_no: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Address
              <textarea
                rows={2}
                value={formValues.address}
                onChange={(event) => setFormValues({ ...formValues, address: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingEmployer(null);
                  setFormValues(null);
                }}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#203F8B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}