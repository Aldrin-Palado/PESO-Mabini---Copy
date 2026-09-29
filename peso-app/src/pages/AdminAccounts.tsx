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
  admin_accounts: boolean;
  notifications: boolean;
};

const permissionList = [
  {
    key: "dashboard_overview",
    label: "Dashboard Overview",
  },
  {
    key: "analytics",
    label: "Analytics",
  },
  {
    key: "job_posts",
    label: "Job Posts",
  },
  {
    key: "job_application",
    label: "Job Application",
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
    key: "admin_accounts",
    label: "Admin Accounts",
  },
  {
    key: "notifications",
    label: "Notifications",
  },
] as const;

export default function AdminAccounts() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStaff, setSelectedStaff] =
    useState<Staff | null>(null);

  const [permissions, setPermissions] =
    useState<Permissions | null>(null);

  const [saving, setSaving] = useState(false);

  /* =====================================================
     LOAD STAFF
  ===================================================== */

  const loadStaff = async () => {
    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("peso_staff")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
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
     LOAD PERMISSIONS
  ===================================================== */

  const openPermissions = async (
    staffAccount: Staff
  ) => {
    setSelectedStaff(staffAccount);

    const {
      data,
      error,
    } = await supabase
      .from("staff_permissions")
      .select("*")
      .eq(
        "peso_staff_id",
        staffAccount.peso_staff_id
      )
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setPermissions(data);
    } else {
      setPermissions({
        peso_staff_id:
          staffAccount.peso_staff_id,
        dashboard_overview: true,
        analytics: false,
        job_posts: false,
        job_application: false,
        employers: false,
        job_seekers: false,
        admin_accounts: false,
        notifications: true,
      });
    }
  };

  /* =====================================================
     TOGGLE PERMISSION
  ===================================================== */

  const togglePermission = (
    key: keyof Omit<
      Permissions,
      "peso_staff_id"
    >
  ) => {
    if (!permissions) return;

    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const savePermissions = async () => {
    if (!permissions || !selectedStaff) return;

    setSaving(true);

    const {
      error,
    } = await supabase
      .from("staff_permissions")
      .upsert(
        {
          ...permissions,
          peso_staff_id:
            selectedStaff.peso_staff_id,
          updated_at: new Date().toISOString(),
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

    alert("Permissions saved successfully.");

    setSaving(false);
    setSelectedStaff(null);
    setPermissions(null);
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>

        <h1 className="text-2xl font-black text-[#123B70]">
          Admin Accounts
        </h1>

        <p className="mt-1 text-slate-500">
          Manage PESO Staff accounts and their module access.
        </p>

      </div>

      {/* Staff List */}
      <div className="space-y-4">

        {staff.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">

            <p className="font-bold text-slate-600">
              No PESO Staff accounts found.
            </p>

          </div>
        ) : (
          staff.map((account) => (
            <div
              key={account.peso_staff_id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                {/* Staff */}
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

                {/* Manage */}
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

            {/* Header */}
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

            {/* Permissions */}
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

            {/* Footer */}
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