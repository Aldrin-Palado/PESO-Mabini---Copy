import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../services/supabase";
import AppIcon from "../components/AppIcon";
import ProfileAvatar from "../components/ProfileAvatar";

type Staff = {
  peso_staff_id: string;
  user_id: string;
  admin_id: string;
  full_name: string;
  email: string;
  contact_no: string;
  is_active: boolean;
};

type StaffFormValues = {
  full_name: string;
  contact_no: string;
};

type StaffStatusFilter = "all" | "active" | "deactivated";

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

async function logStaffAccountCreation(
  staffAccount: { peso_staff_id: string; full_name: string; email: string },
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("The current admin account could not be identified.");

  const { data: admin, error: adminError } = await supabase
    .from("peso_admin")
    .select("admin_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminError) throw adminError;
  if (!admin) throw new Error("The current admin record could not be found.");

  let metadata: {
    ip_address?: string | null;
    user_agent?: string | null;
  } | null = null;
  let metadataWarning = "";
  const metadataResult = await supabase.functions.invoke("audit-metadata", {
    body: {},
  });
  if (metadataResult.error) {
    console.error("Audit metadata collection error:", metadataResult.error);
    metadataWarning = metadataResult.error.message;
  } else {
    metadata = metadataResult.data;
  }

  const { error: logError } = await supabase.from("admin_activity_log").insert({
    admin_id: admin.admin_id,
    action: "Created staff account",
    details: {
      area: "Admin Accounts",
      summary: `Created staff account: "${staffAccount.full_name}"`,
      staff: {
        peso_staff_id: staffAccount.peso_staff_id,
        full_name: staffAccount.full_name,
        email: staffAccount.email,
      },
      ip_address: metadata?.ip_address ?? null,
      user_agent:
        metadata?.user_agent ??
        (typeof navigator !== "undefined" ? navigator.userAgent : null),
      device:
        typeof navigator !== "undefined" ? navigator.platform : null,
    },
  });
  if (logError) throw logError;

  return metadataWarning ||
    (!metadata?.ip_address ? "The server did not provide an IP address." : "");
}

export default function AdminAccounts() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
    confirm_password: "",
  });
  const [createPermissions, setCreatePermissions] =
    useState<StaffPermissionValues>(defaultStaffPermissions);
  const [createError, setCreateError] = useState("");
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState<StaffFormValues | null>(null);
  const [savingStaff, setSavingStaff] = useState(false);
  const [updatingStaffStatusId, setUpdatingStaffStatusId] = useState<string | null>(null);
  const [openActionsStaffId, setOpenActionsStaffId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [staffStatusFilter, setStaffStatusFilter] =
    useState<StaffStatusFilter>("all");

  const filteredStaff = staff.filter((account) => {
    if (staffStatusFilter === "active") return account.is_active;
    if (staffStatusFilter === "deactivated") return !account.is_active;
    return true;
  });

  /* =====================================================
     LOAD STAFF
  ===================================================== */

  const loadStaff = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error(
          "Your sign-in session has expired. Sign in again to view staff accounts.",
        );
      }

      const { data, error } = await supabase
        .from("peso_staff")
        .select(
          "peso_staff_id, user_id, admin_id, full_name, email, contact_no, is_active",
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setStaff(data ?? []);
    } catch (error) {
      console.error("Staff accounts loading error:", error);
      setStaff([]);
      setLoadError(
        `Staff accounts could not be loaded: ${
          error instanceof Error
            ? error.message
            : error && typeof error === "object" && "message" in error
              ? String(error.message)
              : "An unknown error occurred."
        }`,
      );
    } finally {
      setLoading(false);
    }
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

      let auditWarning = "";
      try {
        auditWarning = await logStaffAccountCreation({
          peso_staff_id: staffAccount.peso_staff_id,
          full_name: form.full_name.trim(),
          email,
        });
      } catch (error) {
        console.error("Staff account audit log error:", error);
        auditWarning =
          error instanceof Error ? error.message : "Unexpected audit log error.";
      }

      alert(
        auditWarning
          ? `PESO Staff account created, but its creation audit details could not be fully recorded: ${auditWarning}`
          : "PESO Staff account created and audit log recorded.",
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

    alert("Permissions saved and audit log recorded.");

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

  const openEditStaff = (account: Staff) => {
    setActionError("");
    setEditingStaff(account);
    setEditForm({
      full_name: account.full_name,
      contact_no: account.contact_no || "",
    });
  };

  const saveStaffProfile = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!editingStaff || !editForm) return;

    setSavingStaff(true);
    setActionError("");

    const { data, error } = await supabase
      .from("peso_staff")
      .update({
        full_name: editForm.full_name.trim(),
        contact_no: editForm.contact_no.trim() || null,
      })
      .eq("peso_staff_id", editingStaff.peso_staff_id)
      .select("peso_staff_id")
      .maybeSingle();

    if (error || !data) {
      console.error("Staff profile update error:", error);
      setActionError(
        error?.message || "The staff profile could not be updated.",
      );
      setSavingStaff(false);
      return;
    }

    setEditingStaff(null);
    setEditForm(null);
    setSavingStaff(false);
    await loadStaff();
  };

  const toggleStaffStatus = async (account: Staff) => {
    const nextIsActive = !account.is_active;
    const confirmed = window.confirm(
      `${nextIsActive ? "Activate" : "Deactivate"} ${account.full_name}'s staff account? ${
        nextIsActive
          ? "They will be able to access the staff dashboard."
          : "They will no longer be able to access the staff dashboard."
      }`,
    );
    if (!confirmed) return;

    setActionError("");
    setUpdatingStaffStatusId(account.peso_staff_id);

    const { data, error } = await supabase
      .from("peso_staff")
      .update({ is_active: nextIsActive })
      .eq("peso_staff_id", account.peso_staff_id)
      .select("peso_staff_id, is_active")
      .maybeSingle();

    if (error || !data) {
      console.error("Staff account status update error:", error);
      setActionError(
        error?.message || "The staff account status could not be updated.",
      );
      setUpdatingStaffStatusId(null);
      return;
    }

    setStaff((previous) =>
      previous.map((staffAccount) =>
        staffAccount.peso_staff_id === data.peso_staff_id
          ? { ...staffAccount, is_active: data.is_active }
          : staffAccount,
      ),
    );
    setUpdatingStaffStatusId(null);
  };

  const renderStaffActions = (account: Staff) => {
    const isOpen = openActionsStaffId === account.peso_staff_id;
    const isUpdating = updatingStaffStatusId === account.peso_staff_id;
    const closeActions = () => setOpenActionsStaffId(null);

    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          aria-label={`Show actions for ${account.full_name}`}
          aria-expanded={isOpen}
          onClick={() =>
            setOpenActionsStaffId(isOpen ? null : account.peso_staff_id)
          }
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <span
            aria-hidden="true"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {isOpen && (
          <div className="absolute right-0 z-30 mt-2 min-w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => {
                closeActions();
                void openPermissions(account);
              }}
              disabled={isUpdating}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Access
            </button>
            <button
              type="button"
              onClick={() => {
                closeActions();
                openEditStaff(account);
              }}
              disabled={isUpdating}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                closeActions();
                void toggleStaffStatus(account);
              }}
              disabled={isUpdating}
              className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition disabled:opacity-50 ${
                account.is_active
                  ? "text-amber-700 hover:bg-amber-50"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {isUpdating
                ? "Updating..."
                : account.is_active
                  ? "Deactivate"
                  : "Activate"}
            </button>
          </div>
        )}
      </div>
    );
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

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{loadError}</p>
          <div className="flex shrink-0 gap-2">
            {loadError.includes("session has expired") && (
              <a
                href="/login"
                className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                Sign in again
              </a>
            )}
            <button
              type="button"
              onClick={() => void loadStaff()}
              disabled={loading}
              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        </div>
      )}

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

      {actionError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {/* =================================================
          STAFF LIST
      ================================================= */}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor="staff-status-filter"
            className="text-sm font-bold text-slate-700"
          >
            Filter by account status
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id="staff-status-filter"
              value={staffStatusFilter}
              onChange={(event) =>
                setStaffStatusFilter(event.target.value as StaffStatusFilter)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
            >
              <option value="all">All accounts ({staff.length})</option>
              <option value="active">
                Active ({staff.filter((account) => account.is_active).length})
              </option>
              <option value="deactivated">
                Deactivated ({staff.filter((account) => !account.is_active).length})
              </option>
            </select>
            <button
              type="button"
              onClick={() => void loadStaff()}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

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
        ) : filteredStaff.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-10">
            <p className="font-bold text-slate-600">
              No {staffStatusFilter} staff accounts found.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Choose another status filter to see other accounts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[420px] table-fixed md:min-w-0">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="w-[32%] px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:w-[30%]">
                    Staff Member
                  </th>
                  <th className="w-[28%] px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:w-[27%]">
                    Email
                  </th>
                  <th className="hidden w-[15%] px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:table-cell">
                    Contact
                  </th>
                  <th className="w-[15%] px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:w-[14%]">
                    Status
                  </th>
                  <th className="w-[25%] px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:w-[29%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((account) => (
                  <tr
                    key={account.peso_staff_id}
                    className="align-middle hover:bg-slate-50"
                  >
                    <td className="px-2 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {account.user_id ? (
                          <ProfileAvatar
                            key={account.user_id}
                            userId={account.user_id}
                            fullName={account.full_name}
                            size="small"
                            showControls={false}
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-[#0446A7]">
                            {account.full_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className="truncate text-[11px] font-semibold text-slate-800"
                          title={account.full_name}
                        >
                          {account.full_name}
                        </span>
                      </div>
                    </td>
                    <td
                      className="truncate px-2 py-2 text-[10px] text-slate-600"
                      title={account.email}
                    >
                      {account.email}
                    </td>
                    <td className="hidden truncate px-2 py-2 text-[10px] text-slate-600 lg:table-cell">
                      {account.contact_no || "-"}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
                          account.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {account.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {renderStaffActions(account)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {editingStaff && editForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={(event) => void saveStaffProfile(event)}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#123B70]">
                  Edit Staff Profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the staff member's profile details.
                </p>
              </div>
              {editingStaff.user_id && (
                <ProfileAvatar
                  key={editingStaff.user_id}
                  userId={editingStaff.user_id}
                  fullName={editingStaff.full_name}
                  size="small"
                  showControls={false}
                />
              )}
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-600">
                Full Name
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={editForm.full_name}
                  onChange={(event) =>
                    setEditForm({ ...editForm, full_name: event.target.value })
                  }
                  disabled={savingStaff}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-600">
                Sign-in Email
                <input
                  type="email"
                  value={editingStaff.email}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-500"
                />
                <span className="mt-1 block text-[10px] font-normal text-slate-400">
                  Sign-in email changes must also be made in the authentication
                  account.
                </span>
              </label>

              <label className="block text-xs font-semibold text-slate-600">
                Contact Number
                <input
                  type="tel"
                  maxLength={30}
                  value={editForm.contact_no}
                  onChange={(event) =>
                    setEditForm({ ...editForm, contact_no: event.target.value })
                  }
                  disabled={savingStaff}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>

            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditingStaff(null);
                  setEditForm(null);
                }}
                disabled={savingStaff}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingStaff}
                className="rounded-lg bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {savingStaff ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
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

                <div className="flex items-center gap-3">
                  {selectedStaff.user_id && (
                    <ProfileAvatar
                      key={selectedStaff.user_id}
                      userId={selectedStaff.user_id}
                      fullName={selectedStaff.full_name}
                      size="small"
                      showControls={false}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaff(null);
                      setPermissions(null);
                    }}
                    aria-label="Close Manage Access"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500"
                  >
                    ×
                  </button>
                </div>

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
