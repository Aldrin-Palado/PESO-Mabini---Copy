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

type StaffPermissionValues = Omit<Permissions, "peso_staff_id">;

const defaultStaffPermissions: StaffPermissionValues = {
  dashboard_overview: true,
  analytics: false,
  job_posts: false,
  job_application: false,
  employers: false,
  job_seekers: false,
  notifications: false,
};

export default function AdminAccounts() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStaff, setSelectedStaff] =
    useState<Staff | null>(null);

  const [permissions, setPermissions] =
    useState<Permissions | null>(null);

  const [saving, setSaving] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  // CREATE STAFF STATES
  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    contact_no: "",
    password: "",
    confirm_password: "",
  });
  const [createPermissions, setCreatePermissions] =
    useState<StaffPermissionValues>(defaultStaffPermissions);
  const [createError, setCreateError] = useState("");

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
    loadCurrentAdmin();
  }, []);

  const loadCurrentAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: admin } = await supabase
        .from("peso_admin")
        .select("admin_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      if (admin) setAdminId(admin.admin_id);
    } catch (e) {
      console.error(e);
    }
  };

  /* =====================================================
     CREATE STAFF ACCOUNT
  ===================================================== */

  const createStaffAccount = async () => {
    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.confirm_password.trim()
    ) {
      alert(
        "Please enter the staff name, email, password, and password confirmation."
      );
      return;
    }

    if (form.password !== form.confirm_password) {
      setCreateError("The passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      alert(
        "Password must contain at least 8 characters."
      );
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const email = form.email.trim().toLowerCase();
      const { data, error } =
        await supabase.functions.invoke(
          "create-staff-account",
          {
            body: {
              full_name: form.full_name.trim(),
              email,
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

      const { data: staffAccount, error: staffLookupError } = await supabase
        .from("peso_staff")
        .select("peso_staff_id")
        .eq("email", email)
        .maybeSingle();

      if (staffLookupError || !staffAccount) {
        console.error(
          "Created staff account lookup error:",
          staffLookupError,
        );
        setCreateError(
          `The account was created, but its permissions could not be assigned. ${
            staffLookupError?.message || "The new account could not be found."
          } Use Manage Access to configure permissions.`,
        );
        await loadStaff();
        setCreating(false);
        return;
      }

      const { error: permissionError } = await supabase
        .from("staff_permissions")
        .upsert(
          {
            peso_staff_id: staffAccount.peso_staff_id,
            ...createPermissions,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "peso_staff_id" },
        );

      if (permissionError) {
        console.error("New staff permissions save error:", permissionError);
        setCreateError(
          `The account was created, but permissions could not be saved: ${permissionError.message}. Use Manage Access to configure permissions.`,
        );
        await loadStaff();
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
        confirm_password: "",
      });
      setCreatePermissions(defaultStaffPermissions);

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

    // Log to admin activity log
    if (adminId) {
      let metadataErrorMessage = "";
      let metadata: {
        ip_address?: string | null;
        user_agent?: string | null;
      } | null = null;
      try {
        const result = await supabase.functions.invoke("audit-metadata", {
          body: {},
        });
        if (result.error) {
          console.error("Audit metadata collection error:", result.error);
          metadataErrorMessage = result.error.message;
        } else {
          metadata = result.data;
        }
      } catch (error) {
        console.error("Audit metadata collection error:", error);
        metadataErrorMessage =
          error instanceof Error ? error.message : "Unexpected metadata error.";
      }

      const details = {
        area: "Admin Accounts",
        staff: {
          full_name: selectedStaff.full_name,
          email: selectedStaff.email,
        },
        permissions,
        ip_address: metadata?.ip_address ?? null,
        user_agent:
          metadata?.user_agent ??
          (typeof navigator !== "undefined" ? navigator.userAgent : null),
        device:
          typeof navigator !== "undefined"
            ? navigator.platform
            : null,
      };

      try {
        const { error: logError } = await supabase
          .from("admin_activity_log")
          .insert({
            admin_id: adminId,
            peso_staff_id: selectedStaff.peso_staff_id,
            action: "Updated staff permissions",
            details,
          });
        if (logError) throw logError;
      } catch (logError) {
        console.error("Audit log error:", logError);
        alert(
          `Permissions were saved, but the audit log could not be recorded: ${
            logError instanceof Error ? logError.message : "Unexpected error."
          }`,
        );
        setSaving(false);
        setSelectedStaff(null);
        setPermissions(null);
        return;
      }

      if (!metadata?.ip_address && !metadataErrorMessage) {
        metadataErrorMessage = "The server did not provide an IP address.";
      }

      alert(
        metadataErrorMessage
          ? `Permissions saved and logged. Device information was recorded, but the IP address could not be collected: ${metadataErrorMessage}`
          : "Permissions saved and audit log recorded.",
      );
    } else {
      alert(
        "Permissions were saved, but the audit log could not be recorded because the admin account could not be identified.",
      );
    }

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
      confirm_password: "",
    });
    setCreatePermissions(defaultStaffPermissions);
    setCreateError("");
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
    <div className="space-y-5">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-xl font-black text-[#123B70]">
            Admin Accounts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage PESO Staff accounts and their module access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showCreateModal) {
              closeCreateModal();
            } else {
              setCreateError("");
              setShowCreateModal(true);
            }
          }}
          className="rounded-lg bg-[#0759AE] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91]"
        >
          {showCreateModal ? "Cancel" : "+ Add Admin"}
        </button>

      </div>

      {showCreateModal && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void createStaffAccount();
          }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <AppIcon name="user" className="h-4 w-4 text-[#0759AE]" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                New Admin Account
              </h2>
              <p className="text-xs text-slate-500">
                Create a PESO Staff account and choose its dashboard access.
              </p>
            </div>
          </div>

          {createError && (
            <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {createError}
            </p>
          )}

          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              Full Name
              <input
                type="text"
                required
                maxLength={120}
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                placeholder="Enter full name"
                disabled={creating}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Email / Username
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="Enter sign-in email"
                disabled={creating}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
              <span className="mt-1 block text-[10px] font-normal text-slate-400">
                Email address is used as the username.
              </span>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Password
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                disabled={creating}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Confirm Password
              <input
                type="password"
                required
                minLength={8}
                value={form.confirm_password}
                onChange={(event) => setForm({ ...form, confirm_password: event.target.value })}
                placeholder="Re-enter password"
                autoComplete="new-password"
                disabled={creating}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Role
              <input
                value="PESO Staff"
                readOnly
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-500"
              />
              <span className="mt-1 block text-[10px] font-normal text-slate-400">
                Super Admin access cannot be assigned from this form.
              </span>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Contact Number
              <input
                type="tel"
                maxLength={30}
                value={form.contact_no}
                onChange={(event) => setForm({ ...form, contact_no: event.target.value })}
                placeholder="Optional"
                disabled={creating}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </label>
          </div>

          <fieldset className="mt-4 border-t border-slate-100 pt-4">
            <legend className="text-xs font-semibold text-slate-700">
              Accessible Sidebar Sections
            </legend>
            <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {permissionList.map((permission) => (
                <label
                  key={permission.key}
                  className="flex items-center gap-2 text-xs text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={createPermissions[permission.key]}
                    disabled={creating}
                    onChange={() =>
                      setCreatePermissions((previous) => ({
                        ...previous,
                        [permission.key]: !previous[permission.key],
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-[#0759AE]"
                  />
                  {permission.label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              These settings control which parts of the dashboard this staff account can access.
            </p>
          </fieldset>

          <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
            >
              {creating ? "Creating..." : "Save Admin"}
            </button>
          </div>
        </form>
      )}

      {/* =================================================
          STAFF LIST
      ================================================= */}

      <div className="space-y-4">

        {staff.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-10">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <AppIcon name="user" className="h-7 w-7" />
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
                        {checked && <AppIcon name="check" className="h-4 w-4" />}
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
import AppIcon from "../components/AppIcon";
