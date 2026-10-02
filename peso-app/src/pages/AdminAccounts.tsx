import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type Staff = {
  peso_staff_id: string;
  user_id: string;
  admin_id: string;
  full_name: string;
  email: string;
  contact_no: string;
  is_active: boolean;
};

type Permissions = {
  peso_staff_id: string;
  dashboard_overview: boolean;
  analytics: boolean;
  job_posts: boolean;
  job_application: boolean;
  employers: boolean;
  job_seekers: boolean;
  notifications: boolean;
};

const permissionList = [
  {
    key: "dashboard_overview",
    label: "Dashboard",
  },
  {
    key: "analytics",
    label: "Analytics & Reports",
  },
  {
    key: "job_posts",
    label: "Job Post",
  },
  {
    key: "job_application",
    label: "Applications",
  },
  {
    key: "employers",
    label: "Employers",
  },
  {
    key: "job_seekers",
    label: "Job Seekers",
  },
  {
    key: "notifications",
    label: "Announcement",
  },
] as const;

type PermissionKey = keyof Omit<Permissions, "peso_staff_id">;

export default function AdminAccounts() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStaff, setSelectedStaff] =
    useState<Staff | null>(null);

  const [permissions, setPermissions] =
    useState<Permissions | null>(null);

  const [saving, setSaving] = useState(false);

  // CREATE STAFF STATES
  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    contact_no: "",
    password: "",
  });

  /* =====================================================
     LOAD STAFF
  ===================================================== */

  const loadStaff = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("peso_staff")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);

      alert(
        `Failed to load staff accounts: ${error.message}`
      );

      setLoading(false);
      return;
    }

    setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  /* =====================================================
     CREATE STAFF ACCOUNT
  ===================================================== */

  const createStaffAccount = async () => {
    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.password.trim()
    ) {
      alert(
        "Please enter the staff name, email, and password."
      );
      return;
    }

    if (form.password.length < 8) {
      alert(
        "Password must contain at least 8 characters."
      );
      return;
    }

    setCreating(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "create-staff-account",
          {
            body: {
              full_name: form.full_name.trim(),
              email: form.email.trim().toLowerCase(),
              password: form.password,
              contact_no:
                form.contact_no.trim() || null,
            },
          }
        );

      if (error) {
        console.error(
          "Create staff function error:",
          error
        );

        alert(
          `Failed to create staff account: ${error.message}`
        );

        setCreating(false);
        return;
      }

      if (!data?.success) {
        alert(
          data?.message ||
            "Failed to create staff account."
        );

        setCreating(false);
        return;
      }

      alert(
        "PESO Staff account created successfully."
      );

      // Clear form
      setForm({
        full_name: "",
        email: "",
        contact_no: "",
        password: "",
      });

      setShowCreateModal(false);

      // Reload staff list
      await loadStaff();
    } catch (error) {
      console.error(error);

      alert(
        "An unexpected error occurred while creating the staff account."
      );
    }

    setCreating(false);
  };

  /* =====================================================
     LOAD PERMISSIONS
  ===================================================== */

  const openPermissions = async (
    staffAccount: Staff
  ) => {
    setSelectedStaff(staffAccount);

    const { data, error } = await supabase
      .from("staff_permissions")
      .select("*")
      .eq(
        "peso_staff_id",
        staffAccount.peso_staff_id
      )
      .maybeSingle();

    if (error) {
      console.error(error);

      alert(
        `Failed to load permissions: ${error.message}`
      );

      return;
    }

    if (data) {
      setPermissions(data);
    } else {
      // Default permissions for a new staff account
      setPermissions({
        peso_staff_id:
          staffAccount.peso_staff_id,

        dashboard_overview: false,
        analytics: false,
        job_posts: false,
        job_application: false,
        employers: false,
        job_seekers: false,
        notifications: false,
      });
    }
  };

  /* =====================================================
     TOGGLE PERMISSION
  ===================================================== */

  const togglePermission = (
    key: PermissionKey
  ) => {
    if (!permissions) return;

    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  /* =====================================================
     SAVE PERMISSIONS
  ===================================================== */

  const savePermissions = async () => {
    if (!permissions || !selectedStaff) {
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("staff_permissions")
      .upsert(
        {
          peso_staff_id:
            selectedStaff.peso_staff_id,

          dashboard_overview:
            permissions.dashboard_overview,

          analytics:
            permissions.analytics,

          job_posts:
            permissions.job_posts,

          job_application:
            permissions.job_application,

          employers:
            permissions.employers,

          job_seekers:
            permissions.job_seekers,

          notifications:
            permissions.notifications,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "peso_staff_id",
        }
      );

    if (error) {
      console.error(error);

      alert(
        `Failed to save permissions: ${error.message}`
      );

      setSaving(false);
      return;
    }

    alert(
      "Permissions saved successfully."
    );

    setSaving(false);

    setSelectedStaff(null);
    setPermissions(null);
  };

  /* =====================================================
     CLOSE CREATE MODAL
  ===================================================== */

  const closeCreateModal = () => {
    if (creating) return;

    setShowCreateModal(false);

    setForm({
      full_name: "",
      email: "",
      contact_no: "",
      password: "",
    });
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="font-semibold text-slate-500">
          Loading admin accounts...
        </p>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-black text-[#123B70]">
            Admin Accounts
          </h1>

          <p className="mt-1 text-slate-500">
            Manage PESO Staff accounts and their module access.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          + Create Staff
        </button>

      </div>

      {/* =================================================
          STAFF LIST
      ================================================= */}

      <div className="space-y-4">

        {staff.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-10">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              👤
            </div>

            <p className="font-bold text-slate-600">
              No PESO Staff accounts found.
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Create your first staff account.
            </p>

          </div>
        ) : (
          staff.map((account) => (
            <div
              key={account.peso_staff_id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                {/* STAFF INFORMATION */}

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 font-black text-[#0446A7]">
                    {account.full_name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <h2 className="font-black text-slate-800">
                      {account.full_name}
                    </h2>

                    <p className="text-sm text-slate-500">
                      {account.email}
                    </p>

                    {account.contact_no && (
                      <p className="text-sm text-slate-400">
                        {account.contact_no}
                      </p>
                    )}

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        account.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {account.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>

                </div>

                {/* MANAGE */}

                <button
                  onClick={() =>
                    openPermissions(account)
                  }
                  className="rounded-xl bg-[#FED442] px-5 py-3 text-sm font-bold text-[#123B70] transition hover:bg-yellow-400"
                >
                  Manage Access
                </button>

              </div>

            </div>
          ))
        )}

      </div>

      {/* =================================================
          CREATE STAFF MODAL
      ================================================= */}

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="border-b border-slate-200 p-6">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-2xl font-black text-[#123B70]">
                    Create PESO Staff
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Create a new staff account.
                  </p>
                </div>

                <button
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500"
                >
                  ×
                </button>

              </div>

            </div>

            {/* FORM */}

            <div className="space-y-4 p-6">

              {/* FULL NAME */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              {/* CONTACT */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Contact Number
                </label>

                <input
                  type="text"
                  value={form.contact_no}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact_no: e.target.value,
                    })
                  }
                  placeholder="Enter contact number"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              {/* PASSWORD */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Temporary Password
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />

                <p className="mt-1 text-xs text-slate-400">
                  The staff member can use this password to log in.
                </p>
              </div>

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">

              <button
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>

              <button
                onClick={createStaffAccount}
                disabled={creating}
                className="rounded-xl bg-[#0446A7] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create Staff"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          PERMISSION MODAL
      ================================================= */}

      {selectedStaff && permissions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="border-b border-slate-200 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-2xl font-black text-[#123B70]">
                    Manage Access
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedStaff.full_name}
                  </p>

                </div>

                <button
                  onClick={() => {
                    setSelectedStaff(null);
                    setPermissions(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500"
                >
                  ×
                </button>

              </div>

            </div>

            {/* PERMISSIONS */}

            <div className="grid gap-3 p-6 sm:grid-cols-2">

              {permissionList.map(
                (permission) => {
                  const checked =
                    permissions[
                      permission.key
                    ];

                  return (
                    <button
                      key={permission.key}
                      onClick={() =>
                        togglePermission(
                          permission.key
                        )
                      }
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        checked
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200"
                      }`}
                    >

                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm font-black ${
                          checked
                            ? "border-[#0446A7] bg-[#0446A7] text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>

                      <span className="text-sm font-bold text-slate-700">
                        {permission.label}
                      </span>

                    </button>
                  );
                }
              )}

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">

              <button
                onClick={() => {
                  setSelectedStaff(null);
                  setPermissions(null);
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>

              <button
                onClick={savePermissions}
                disabled={saving}
                className="rounded-xl bg-[#0446A7] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Permissions"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}