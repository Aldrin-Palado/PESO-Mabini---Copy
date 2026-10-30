import React, { useState, type FormEvent } from "react";

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

  TableHeader: React.ComponentType<{
    children: React.ReactNode;
  }>;

  TableCell: React.ComponentType<{
    children: React.ReactNode;
    bold?: boolean;
  }>;

  StatusBadge: React.ComponentType<{
    status: string;
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
  TableHeader,
  TableCell,
  StatusBadge,
  LoadingMessage,
  EmptyMessage,
}: Props) {
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
  const [formValues, setFormValues] = useState<EmployerFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

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

  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Employers"
        description="View registered employers and their information."
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

      {/* SEARCH */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search employers..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        />

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {loading ? (
          <LoadingMessage />
        ) : employers.length === 0 ? (
          <EmptyMessage message="No employers found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <TableHeader>
                    Company / Employer
                  </TableHeader>

                  <TableHeader>
                    Email
                  </TableHeader>

                  <TableHeader>
                    Contact Person
                  </TableHeader>

                  <TableHeader>
                    Contact
                  </TableHeader>

                  <TableHeader>
                    Address
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader>
                    Actions
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {employers.map(
                  (employer, index) => {

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
                        className="hover:bg-slate-50"
                      >

                        <TableCell bold>
                          {name}
                        </TableCell>

                        <TableCell>
                          {employer.email || "-"}
                        </TableCell>

                        <TableCell>
                          {employer.contact_person || "-"}
                        </TableCell>

                        <TableCell>
                          {employer.contact_no ||
                            employer.phone ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          {employer.address || "-"}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={status}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(employer)}
                              disabled={!employer.employer_id || deletingId === employer.employer_id}
                              className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteEmployer(employer)}
                              disabled={!employer.employer_id || deletingId === employer.employer_id}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === employer.employer_id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </TableCell>

                      </tr>
                    );
                  }
                )}

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

    </div>
  );
}