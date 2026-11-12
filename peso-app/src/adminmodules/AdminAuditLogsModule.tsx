import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export type AdminAuditLog = {
  log_id: string;
  admin_id?: string | null;
  peso_staff_id?: string | null;
  actor_name?: string;
  actor_role?: string;
  action: string;
  details: unknown;
  created_at: string;
};

function getAuditLogErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const databaseError = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const message =
      typeof databaseError.message === "string"
        ? databaseError.message
        : "An unknown error occurred.";
    const code =
      typeof databaseError.code === "string" ? ` (${databaseError.code})` : "";
    const details =
      typeof databaseError.details === "string" && databaseError.details
        ? ` ${databaseError.details}`
        : "";
    const hint =
      typeof databaseError.hint === "string" && databaseError.hint
        ? ` ${databaseError.hint}`
        : "";
    return `${message}${code}${details}${hint}`;
  }
  return "An unknown error occurred.";
}

export function useAdminAuditLogs(enabled: boolean, activePage: string) {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    const loadAuditLogs = async () => {
      setLoadError("");
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          if (active) {
            setLogs([]);
            setLoadError(
              "Your sign-in session has expired. Sign in again to view audit logs.",
            );
          }
          return;
        }

        const logsResult = await supabase
          .from("admin_activity_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);

        if (logsResult.error) {
          console.error("Audit log query error:", logsResult.error);
          if (active) {
            setLogs([]);
            setLoadError(
              `Audit logs could not be loaded: ${getAuditLogErrorMessage(logsResult.error)}`,
            );
          }
          return;
        }

        const [adminsResult, staffResult] = await Promise.all([
          supabase.from("peso_admin").select("admin_id, full_name"),
          supabase.from("peso_staff").select("peso_staff_id, full_name"),
        ]);

        if (adminsResult.error) {
          console.error("Audit log admin names error:", adminsResult.error);
        }
        if (staffResult.error) {
          console.error("Audit log staff names error:", staffResult.error);
        }

        const adminNames = new Map(
          (adminsResult.data ?? []).map((admin) => [
            admin.admin_id,
            admin.full_name,
          ]),
        );
        const staffNames = new Map(
          (staffResult.data ?? []).map((staff) => [
            staff.peso_staff_id,
            staff.full_name,
          ]),
        );

        const loadedLogs = ((logsResult.data ?? []) as Omit<
          AdminAuditLog,
          "actor_name" | "actor_role"
        >[]).map((log) => {
          const details =
            log.details &&
            typeof log.details === "object" &&
            !Array.isArray(log.details)
              ? (log.details as Record<string, unknown>)
              : {};
          const detailActorName =
            typeof details.actor_name === "string"
              ? details.actor_name
              : undefined;
          const detailActorRole =
            typeof details.actor_role === "string"
              ? details.actor_role
              : undefined;

          return {
            ...log,
            actor_name:
              (log.peso_staff_id
                ? staffNames.get(log.peso_staff_id)
                : undefined) ||
              detailActorName ||
              (log.admin_id ? adminNames.get(log.admin_id) : undefined) ||
              "Admin",
            actor_role:
              detailActorRole || (log.peso_staff_id ? "Staff" : "Admin"),
          };
        });

        if (active) {
          setLogs(loadedLogs);
          if (adminsResult.error || staffResult.error) {
            setLoadError(
              "Audit log records loaded, but some actor names could not be resolved.",
            );
          }
        }
      } catch (error) {
        console.error("Audit log loading error:", error);
        if (active) {
          setLogs([]);
          setLoadError(
            `Audit logs could not be loaded: ${getAuditLogErrorMessage(error)}`,
          );
        }
      }
    };

    void loadAuditLogs();
    return () => {
      active = false;
    };
  }, [activePage, enabled]);

  return { logs, loadError };
}

export default function AdminAuditLogsModule({
  logs,
  loadError,
}: {
  logs: AdminAuditLog[];
  loadError: string;
}) {
  const defaultFilters = {
    dateFrom: "",
    dateTo: "",
    admin: "all",
    keyword: "",
    area: "all",
    action: "all",
  };
  const [filters, setFilters] = useState(defaultFilters);

  const getDetails = (details: unknown): Record<string, unknown> => {
    if (!details || typeof details !== "object" || Array.isArray(details)) {
      return {};
    }
    return details as Record<string, unknown>;
  };

  const formatDetailValue = (value: unknown, field: string) => {
    if (value === null || value === undefined) return "—";
    if (field === "is_active" && typeof value === "boolean") {
      return value ? "Active" : "Deactivated";
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
    return JSON.stringify(value);
  };

  const renderLogDetails = (log: AdminAuditLog) => {
    const details = getDetails(log.details);
    const summary =
      typeof details.summary === "string" ? details.summary : "";
    const changes =
      details.changes &&
      typeof details.changes === "object" &&
      !Array.isArray(details.changes)
        ? (details.changes as Record<string, unknown>)
        : {};
    const changeEntries = Object.entries(changes);

    if (!summary) {
      return log.details
        ? typeof log.details === "string"
          ? log.details
          : JSON.stringify(log.details)
        : "-";
    }

    return (
      <div className="space-y-1">
        <p className="font-medium text-slate-700">{summary}</p>
        {changeEntries.length > 0 && (
          <ul className="list-inside list-disc text-slate-500">
            {changeEntries.map(([field, value]) => {
              const change =
                value && typeof value === "object" && !Array.isArray(value)
                  ? (value as Record<string, unknown>)
                  : {};
              return (
                <li key={field}>
                  {field.replace(/_/g, " ")}: {formatDetailValue(change.from, field)}
                  {" → "}
                  {formatDetailValue(change.to, field)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  const getArea = (log: AdminAuditLog) => {
    const details = getDetails(log.details);
    const recordedArea =
      details.area || details.section || details.module;
    if (typeof recordedArea === "string" && recordedArea.trim()) {
      return recordedArea.replace(/^section:\s*/i, "").replace(/_/g, " ");
    }

    const action = log.action.toLowerCase();
    if (action.includes("permission") || action.includes("staff")) {
      return "Admin Accounts";
    }
    if (action.includes("job seeker")) return "Job Seekers";
    if (action.includes("employer")) return "Employers";
    if (action.includes("application")) return "Applications";
    if (action.includes("job")) return "Job Posts";
    if (action.includes("login") || action.includes("dashboard")) {
      return "Admin Portal";
    }
    return "Admin Portal";
  };

  const getIpDevice = (log: AdminAuditLog) => {
    const details = getDetails(log.details);
    const ip = details.ip_address || details.ip || details.ipAddress;
    const device = typeof details.device === "string" ? details.device : "";
    const userAgent =
      typeof details.user_agent === "string"
        ? details.user_agent
        : typeof details.userAgent === "string"
          ? details.userAgent
          : "";
    const deviceDetails = [device, userAgent].filter(Boolean).join(" · ");
    const values = [
      typeof ip === "string" ? `IP: ${ip}` : "",
      deviceDetails ? `Device: ${deviceDetails}` : "",
    ].filter(Boolean);
    return values.join(" · ") || "Not recorded";
  };

  const areas = [...new Set(logs.map(getArea))].sort();
  const actions = [...new Set(logs.map((log) => log.action))].sort();
  const admins = [...new Set(logs.map((log) => log.actor_name || "Admin"))].sort();
  const filteredLogs = logs.filter((log) => {
    const date = log.created_at.slice(0, 10);
    const keyword = filters.keyword.trim().toLowerCase();
    const detailsText =
      typeof log.details === "string"
        ? log.details
        : JSON.stringify(log.details ?? "");
    const matchesKeyword =
      !keyword ||
      `${log.actor_name || ""} ${getArea(log)} ${log.action} ${detailsText} ${getIpDevice(log)}`
        .toLowerCase()
        .includes(keyword);

    return (
      (!filters.dateFrom || date >= filters.dateFrom) &&
      (!filters.dateTo || date <= filters.dateTo) &&
      (filters.admin === "all" ||
        (log.actor_name || "Admin") === filters.admin) &&
      (filters.area === "all" || getArea(log) === filters.area) &&
      (filters.action === "all" || log.action === filters.action) &&
      matchesKeyword
    );
  });

  return (
    <div className="space-y-4">
      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{loadError}</p>
          {loadError.includes("session has expired") && (
            <a
              href="/login"
              className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-2 text-center text-xs font-bold text-red-700 hover:bg-red-100"
            >
              Sign in again
            </a>
          )}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-[11px] font-semibold text-slate-600">
            Date From
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                setFilters({ ...filters, dateFrom: event.target.value })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            />
          </label>
          <label className="block text-[11px] font-semibold text-slate-600">
            Date To
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters({ ...filters, dateTo: event.target.value })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            />
          </label>
          <label className="block text-[11px] font-semibold text-slate-600">
            Admin
            <select
              value={filters.admin}
              onChange={(event) =>
                setFilters({ ...filters, admin: event.target.value })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            >
              <option value="all">All admins</option>
              {admins.map((admin) => (
                <option key={admin} value={admin}>
                  {admin}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-semibold text-slate-600">
            Keyword
            <input
              type="search"
              value={filters.keyword}
              onChange={(event) =>
                setFilters({ ...filters, keyword: event.target.value })
              }
              placeholder="Area, action, details..."
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800 placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-[11px] font-semibold text-slate-600">
            Area
            <select
              value={filters.area}
              onChange={(event) =>
                setFilters({ ...filters, area: event.target.value })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            >
              <option value="all">All areas</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
          <label className="block flex-1 text-[11px] font-semibold text-slate-600">
            Action
            <select
              value={filters.action}
              onChange={(event) =>
                setFilters({ ...filters, action: event.target.value })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-normal text-slate-800"
            >
              <option value="all">All actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
          Results update automatically as you change the filters.
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800">Logs</h2>
          <span className="text-[11px] text-slate-400">
            {filteredLogs.length} record{filteredLogs.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed">
            <thead className="bg-slate-50 text-left">
              <tr>
                {[
                  ["Date / Time", "w-[14%]"],
                  ["Actor", "w-[14%]"],
                  ["Area", "w-[13%]"],
                  ["Action", "w-[14%]"],
                  ["Details", "w-[25%]"],
                  ["IP / Device", "w-[20%]"],
                ].map(([label, width]) => (
                  <th
                    key={label}
                    className={`${width} px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    {loadError
                      ? "Audit log records are unavailable until the error above is resolved."
                      : logs.length === 0
                        ? "No audit logs found."
                        : "No logs match these filters."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.log_id} className="align-top hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 text-[10px] text-slate-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-medium text-slate-700">
                      {log.actor_name || "Admin"}
                      {log.actor_role ? ` (${log.actor_role})` : ""}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-600">
                      {getArea(log)}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-medium text-slate-700">
                      {log.action}
                    </td>
                    <td className="break-words px-3 py-2.5 text-[10px] leading-4 text-slate-600">
                      {renderLogDetails(log)}
                    </td>
                    <td className="break-words px-3 py-2.5 text-[10px] leading-4 text-slate-500">
                      {getIpDevice(log)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
