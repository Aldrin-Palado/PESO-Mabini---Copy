import React, { useState, type FormEvent } from "react";
import { supabase } from "../services/supabase";

type VerificationDocument = {
  label: string;
  file_name: string;
  storage_path: string;
};

type Employer = {
  id?: string;
  employer_id?: string;
  user_id?: string | null;
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
  updated_at?: string;
  logo_url?: string | null;
  verification_documents?: VerificationDocument[] | null;
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
  const [documentsEmployer, setDocumentsEmployer] = useState<Employer | null>(null);
  const [signedDocuments, setSignedDocuments] = useState<
    Array<VerificationDocument & { url: string }>
  >([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const visibleEmployers = employers.filter((employer) => {
    if (appliedStatusFilter === "all") return true;
    return appliedStatusFilter === "verified"
      ? employer.is_verified === true
      : employer.is_verified !== true;
  });

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

  const viewVerificationDocuments = async (employer: Employer) => {
    const documents = employer.verification_documents ?? [];
    setDocumentsEmployer(employer);
    setSignedDocuments([]);
    setDocumentsLoading(true);
    setActionError("");

    try {
      const signed = await Promise.all(
        documents.map(async (document) => {
          const { data, error } = await supabase.storage
            .from("employer-verification-documents")
            .createSignedUrl(document.storage_path, 300);
          if (error) {
            throw new Error(`Could not open ${document.label}: ${error.message}`);
          }
          return { ...document, url: data.signedUrl };
        }),
      );
      setSignedDocuments(signed);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Employer documents could not be opened.",
      );
    } finally {
      setDocumentsLoading(false);
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

  return (
    <div className="space-y-4">

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

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(180px,1fr)_auto] lg:items-end">
        <label className="block text-[11px] font-semibold text-slate-600">
          Search (Name / Email / Phone)
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, email, or phone..."
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="block text-[11px] font-semibold text-slate-600">
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-normal text-slate-800"
          >
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending verification</option>
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setAppliedStatusFilter("all");
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setAppliedStatusFilter(statusFilter)}
            className="rounded-md border border-blue-200 px-3 py-2 text-xs font-semibold text-[#0759AE] hover:bg-blue-50"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md bg-[#0759AE] px-3 py-2 text-xs font-bold text-white hover:bg-[#064A91]"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800">Employers</h2>
          <span className="text-[11px] text-slate-400">
            {visibleEmployers.length} record{visibleEmployers.length === 1 ? "" : "s"}
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed xl:min-w-0">
              <thead className="bg-slate-50 text-left">
                <tr>
                  {[
                    ["Company", "w-[22%] xl:w-[19%]"],
                    ["Email", "w-[24%] xl:w-[18%]"],
                    ["Contact Person", "hidden w-[14%] xl:table-cell"],
                    ["Phone", "w-[14%] xl:w-[13%]"],
                    ["Location", "w-[18%] xl:w-[15%]"],
                    ["Status", "w-[10%]"],
                    ["Actions", "w-[12%] xl:w-[11%]"],
                  ].map(([label, width]) => (
                    <th key={label} className={`${width} px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500`}>
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
                        className="align-middle hover:bg-slate-50"
                      >
                        <td className="truncate px-2 py-2 text-[11px] font-semibold text-slate-800" title={name}>
                          {name}
                        </td>
                        <td className="truncate px-2 py-2 text-[10px] text-slate-600" title={employer.email || ""}>
                          {employer.email || "-"}
                        </td>
                        <td className="hidden truncate px-2 py-2 text-[10px] text-slate-600 xl:table-cell" title={employer.contact_person || ""}>
                          {employer.contact_person || "-"}
                        </td>
                        <td className="truncate px-2 py-2 text-[10px] text-slate-600">
                          {employer.contact_no || employer.phone || "-"}
                        </td>
                        <td className="truncate px-2 py-2 text-[10px] text-slate-600" title={employer.address || ""}>
                          {employer.address || "-"}
                        </td>
                        <td className="px-2 py-2">
                          <span title={status} className={`inline-flex max-w-full truncate rounded-full px-2 py-1 text-[10px] font-semibold ${
                            employer.is_verified
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditing(employer)}
                              disabled={!employer.employer_id || deletingId === employer.employer_id}
                              className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void viewVerificationDocuments(employer)}
                              disabled={documentsLoading}
                              className="rounded-md border border-blue-200 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteEmployer(employer)}
                              disabled={!employer.employer_id || deletingId === employer.employer_id}
                              className="rounded-md border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === employer.employer_id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

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

      {documentsEmployer && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDocumentsEmployer(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="employer-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="employer-details-title" className="text-lg font-bold text-slate-900">
                  Employer details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {documentsEmployer.name || documentsEmployer.company_name || "Employer"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDocumentsEmployer(null)}
                aria-label="Close verification documents"
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <section aria-labelledby="employer-profile-details" className="mt-5">
              <h3 id="employer-profile-details" className="text-sm font-bold text-slate-800">
                Company and contact information
              </h3>
              <dl className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                {[
                  ["Company name", documentsEmployer.name || documentsEmployer.company_name || documentsEmployer.business_name || documentsEmployer.full_name],
                  ["Employer ID", documentsEmployer.employer_id],
                  ["Company email", documentsEmployer.email],
                  ["Owner / representative", documentsEmployer.contact_person],
                  ["Contact number", documentsEmployer.contact_no || documentsEmployer.phone],
                  ["Business address", documentsEmployer.address],
                  ["Verification status", documentsEmployer.is_verified ? "Verified" : "Pending verification"],
                  ["Registered on", documentsEmployer.created_at ? new Date(documentsEmployer.created_at).toLocaleString("en-PH") : null],
                  ["Last updated", documentsEmployer.updated_at ? new Date(documentsEmployer.updated_at).toLocaleString("en-PH") : null],
                ].map(([label, value]) => (
                  <div key={label} className={label === "Business address" ? "sm:col-span-2" : ""}>
                    <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words text-sm text-slate-800">{value || "Not provided"}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section aria-labelledby="employer-verification-documents" className="mt-6">
              <h3 id="employer-verification-documents" className="text-sm font-bold text-slate-800">
                Verification attachments
              </h3>
            {documentsLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">Preparing secure document links...</p>
            ) : signedDocuments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No verification documents have been uploaded.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-slate-100">
                {signedDocuments.map((document) => (
                  <li
                    key={document.storage_path}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{document.label}</p>
                      <p className="truncate text-xs text-slate-500">{document.file_name}</p>
                    </div>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Open file
                    </a>
                  </li>
                ))}
              </ul>
            )}
            </section>
            {actionError && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </p>
            )}
          </section>
        </div>
      )}

    </div>
  );
}