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
  status?: string;
  created_at?: string;
  [key: string]: any;
};

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
  onDelete: (employerId: string) => Promise<void>;

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
  is_verified: boolean;
};

export default function EmployersModule({
  employers,
  loadError,
  search,
  setSearch,
  loading,
  onRefresh,
  onUpdate,
  onDelete,
  ModuleHeader,
  LoadingMessage,
  EmptyMessage,
}: Props) {
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
  const [formValues, setFormValues] = useState<EmployerFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");

  const visibleEmployers = employers.filter((employer) => {
    if (appliedStatusFilter === "all") return true;
    return appliedStatusFilter === "verified"
      ? employer.is_verified === true
      : employer.is_verified !== true;
  });
  const verifiedCount = employers.filter((employer) => employer.is_verified).length;
  const pendingCount = employers.length - verifiedCount;

  const startEditing = (employer: Employer) => {
    setActionError("");
    setEditingEmployer(employer);
    setFormValues({
      name: employer.name || employer.company_name || employer.business_name || "",
      email: employer.email || "",
      contact_person: employer.contact_person || "",
      contact_no: employer.contact_no || employer.phone || "",
      address: employer.address || "",
      is_verified: Boolean(employer.is_verified),
    });
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

  const deleteEmployer = async (employer: Employer) => {
    const employerId = employer.employer_id;
    if (!employerId) return;
    const name =
      employer.name ||
      employer.company_name ||
      employer.business_name ||
      "this employer";
    const confirmed = window.confirm(
      `Delete ${name}'s profile? This permanently deletes their job posts and applications. Their sign-in account may remain active.`,
    );
    if (!confirmed) return;

    setDeletingId(employerId);
    setActionError("");
    try {
      await onDelete(employerId);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to delete employer.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const renderActions = (employer: Employer) => (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => startEditing(employer)}
        disabled={!employer.employer_id || deletingId === employer.employer_id}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
      >
        <AppIcon name="wrench" className="h-3.5 w-3.5" />
        Edit
      </button>
      <button
        type="button"
        onClick={() => void deleteEmployer(employer)}
        disabled={!employer.employer_id || deletingId === employer.employer_id}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
      >
        <AppIcon name="x" className="h-3.5 w-3.5" />
        {deletingId === employer.employer_id ? "Deleting..." : "Delete"}
      </button>
    </div>
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

      <section aria-label="Employer statistics" className="grid gap-3 sm:grid-cols-3">
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
            label: "Pending verification",
            value: pendingCount,
            icon: "clock" as const,
            color: "bg-amber-50 text-amber-700",
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
            Search company and contact details, or filter by verification.
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
          Verification status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending verification</option>
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
                const status =
                  employer.status ||
                  (employer.is_verified ? "Verified" : "Pending verification");

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
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            employer.is_verified
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-800"
                          }`}>
                            <AppIcon name={employer.is_verified ? "check" : "clock"} className="h-3.5 w-3.5" />
                            {status}
                          </span>
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

                    const status =
                      employer.status ||
                      (employer.is_verified ? "Verified" : "Pending verification");

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
                          <span title={status} className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
                            employer.is_verified
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            <AppIcon name={employer.is_verified ? "check" : "clock"} className="h-3.5 w-3.5 shrink-0" />
                            {status}
                          </span>
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

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formValues.is_verified}
                onChange={(event) => setFormValues({ ...formValues, is_verified: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              Verified employer
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