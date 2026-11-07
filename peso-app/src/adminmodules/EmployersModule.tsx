import React, { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import AppIcon from "../components/AppIcon";
import { downloadCsv } from "../services/csvExport";
import { supabase } from "../services/supabase";
import type {
  EmployerDocumentStatus,
  EmployerVerificationDocument,
} from "../services/employerRegistration";
import { getEmployerRegistrationChecklist } from "../services/employerRegistration";

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
  verification_documents?: unknown;
  registration_details?: unknown;
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
  onReviewDocuments: (
    employerId: string,
    documents: EmployerVerificationDocument[],
  ) => Promise<void>;
  onToggleActive: (employerId: string, isActive: boolean) => Promise<void>;

  ModuleHeader: React.ComponentType<{
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

type ActionsPosition = {
  top: number;
  left: number;
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
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
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

function getVerificationDocuments(value: unknown): EmployerVerificationDocument[] {
  if (!Array.isArray(value)) return [];
  return value.filter((document): document is EmployerVerificationDocument => {
    if (!document || typeof document !== "object") return false;
    const item = document as Record<string, unknown>;
    return (
      typeof item.id === "string" &&
      typeof item.document_type === "string" &&
      typeof item.label === "string" &&
      typeof item.file_name === "string" &&
      typeof item.storage_path === "string" &&
      typeof item.status === "string"
    );
  });
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
  onReviewDocuments,
  onToggleActive,
  ModuleHeader,
  LoadingMessage,
  EmptyMessage,
}: Props) {
  const [openActionsEmployerId, setOpenActionsEmployerId] = useState<string | null>(null);
  const [actionsPosition, setActionsPosition] = useState<ActionsPosition | null>(null);
  const [detailsEmployer, setDetailsEmployer] = useState<Employer | null>(null);
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
  const [formValues, setFormValues] = useState<EmployerFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingActiveId, setUpdatingActiveId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [documentActionError, setDocumentActionError] = useState("");
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("all");

  useEffect(() => {
    if (!openActionsEmployerId) return;

    const closeOnViewportChange = () => {
      setOpenActionsEmployerId(null);
      setActionsPosition(null);
    };

    window.addEventListener("scroll", closeOnViewportChange, true);
    window.addEventListener("resize", closeOnViewportChange);
    return () => {
      window.removeEventListener("scroll", closeOnViewportChange, true);
      window.removeEventListener("resize", closeOnViewportChange);
    };
  }, [openActionsEmployerId]);

  const visibleEmployers = employers.filter((employer) => {
    const statusMatches =
      statusFilter === "all" || getVerificationStatus(employer) === statusFilter;
    const checklist = getEmployerRegistrationChecklist(
      employer.registration_details,
      employer.verification_documents,
      employer,
    );
    const isComplete = checklist.every((item) => item.complete);
    const completionMatches =
      completionFilter === "all" ||
      (completionFilter === "ready" && isComplete) ||
      (completionFilter === "incomplete" && !isComplete);
    return statusMatches && completionMatches;
  });
  const registrationDetails =
    detailsEmployer?.registration_details &&
    typeof detailsEmployer.registration_details === "object"
      ? detailsEmployer.registration_details as Record<string, unknown>
      : null;
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
    if (
      status === "verified" &&
      !getEmployerRegistrationChecklist(
        employer.registration_details,
        employer.verification_documents,
        employer,
      ).every((item) => item.complete)
    ) {
      setActionError(
        "Complete all company profile, registration form, certification, and paperwork steps before verifying this employer.",
      );
      return;
    }
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

  const openVerificationDocument = async (
    document: EmployerVerificationDocument,
  ) => {
    setDocumentActionError("");
    setOpeningDocumentId(document.id);
    const { data, error } = await supabase.storage
      .from("employer-verification-documents")
      .createSignedUrl(document.storage_path, 60);
    setOpeningDocumentId(null);
    if (error) {
      console.error("Could not open employer verification document:", error);
      setDocumentActionError(`Could not open ${document.file_name}: ${error.message}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const reviewVerificationDocument = async (
    employer: Employer,
    documentId: string,
    status: EmployerDocumentStatus,
  ) => {
    if (!employer.employer_id) return;
    const currentDocuments = getVerificationDocuments(employer.verification_documents);
    const documents = currentDocuments.map((document) =>
      document.id === documentId
        ? {
            ...document,
            status,
            reviewed_at: new Date().toISOString(),
          }
        : document,
    );
    setDocumentActionError("");
    try {
      await onReviewDocuments(employer.employer_id, documents);
      setDetailsEmployer((current) =>
        current?.employer_id === employer.employer_id
          ? { ...current, verification_documents: documents }
          : current,
      );
    } catch (error) {
      setDocumentActionError(
        error instanceof Error
          ? error.message
          : "Unable to update document review status.",
      );
    }
  };

  const renderActions = (employer: Employer) => {
    const actionId = employer.employer_id || employer.id || employer.email || "";
    const isOpen = openActionsEmployerId === actionId;
    const closeActions = () => {
      setOpenActionsEmployerId(null);
      setActionsPosition(null);
    };

    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          aria-label={`Show actions for ${employer.name || employer.company_name || "employer"}`}
          aria-expanded={isOpen}
          onClick={(event) => {
            if (isOpen) {
              closeActions();
              return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const menuHeight = 126;
            const menuWidth = 144;
            const openBelow =
              window.innerHeight - rect.bottom >= menuHeight + 8;
            setActionsPosition({
              top: openBelow
                ? rect.bottom + 8
                : Math.max(8, rect.top - menuHeight - 8),
              left: Math.min(
                Math.max(8, window.innerWidth - menuWidth - 8),
                Math.max(8, rect.right - menuWidth),
              ),
            });
            setOpenActionsEmployerId(actionId);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <span
            aria-hidden="true"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {isOpen && actionsPosition && createPortal(
          <div
            className="fixed z-[200] w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            style={actionsPosition}
          >
            <button
              type="button"
              onClick={() => {
                closeActions();
                setDetailsEmployer(employer);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => {
                closeActions();
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
              onClick={() => {
                closeActions();
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
          </div>,
          document.body,
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">

      <ModuleHeader onRefresh={onRefresh} />

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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">Find employers</h2>
          <p className="mt-1 text-xs text-slate-500">
            Search company and contact details, or filter by verification status.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px] lg:items-end">
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
            <option value="pending">Pending</option>
            <option value="not_approved">Not approved</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Registration progress
          <select
            value={completionFilter}
            onChange={(event) => setCompletionFilter(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">All profiles</option>
            <option value="ready">Ready for verification</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </label>
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
                const isActive = employer.is_active !== false;
                const checklist = getEmployerRegistrationChecklist(
                  employer.registration_details,
                  employer.verification_documents,
                  employer,
                );
                const completedSteps = checklist.filter((item) => item.complete).length;
                const isReady = completedSteps === checklist.length;

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
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            {isActive ? "Active" : "Deactivated"}
                          </span>
                        </div>
                        <label className="mt-3 block text-xs font-semibold text-slate-600">
                          Verification status
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
                            <option
                              value="verified"
                              disabled={
                                status !== "verified" &&
                                !checklist.every((item) => item.complete)
                              }
                            >
                              Verified
                            </option>
                            <option value="not_approved">Not approved</option>
                          </select>
                        </label>
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
                        <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          isReady
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800"
                        }`}>
                          {isReady ? "Ready for verification" : "Registration incomplete"} · {completedSteps}/{checklist.length} steps
                        </p>
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
                    ["Company", "w-[14%]"],
                    ["Email", "w-[14%]"],
                    ["Contact Person", "w-[12%]"],
                    ["Phone", "w-[10%]"],
                    ["Location", "w-[15%]"],
                    ["Account Status", "w-[12%]"],
                    ["Verification", "w-[14%]"],
                    ["Actions", "w-[9%]"],
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
                    const isActive = employer.is_active !== false;
                    const checklist = getEmployerRegistrationChecklist(
                      employer.registration_details,
                      employer.verification_documents,
                      employer,
                    );
                    const completedSteps = checklist.filter((item) => item.complete).length;
                    const isReady = completedSteps === checklist.length;

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
                          <span className={`mt-1 ml-[3.25rem] block text-[10px] font-semibold ${
                            isReady ? "text-emerald-700" : "text-amber-700"
                          }`}>
                            {isReady ? "Ready for verification" : "Registration incomplete"} · {completedSteps}/{checklist.length}
                          </span>
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
                        <td className="px-3 py-3">
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            {isActive ? "Active" : "Deactivated"}
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
                            className={`w-full max-w-full rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${
                              status === "verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : status === "not_approved"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option
                              value="verified"
                              disabled={
                                status !== "verified" &&
                                !checklist.every((item) => item.complete)
                              }
                            >
                              Verified
                            </option>
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
              <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={() => setDetailsEmployer(null)}
                    aria-label="Close employer details"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                    Close
                </button>
              </div>
            </header>
            <dl className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {Object.entries(detailsEmployer)
                .filter(([key]) => key !== "registration_details" && key !== "verification_documents")
                .map(([key, value]) => {
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
            {(() => {
              const checklist = getEmployerRegistrationChecklist(
                detailsEmployer.registration_details,
                detailsEmployer.verification_documents,
                detailsEmployer,
              );
              const completedSteps = checklist.filter((item) => item.complete).length;
              const isReady = completedSteps === checklist.length;
              return (
                <section className="border-t border-slate-200 px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Registration readiness
                    </h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isReady
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}>
                      {isReady ? "Ready for verification" : "Incomplete"} · {completedSteps}/{checklist.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Readiness confirms required form fields and uploads are present; uploaded documents still require PESO review.
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {checklist.map((item) => (
                      <li
                        key={item.label}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                          item.complete
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-900"
                        }`}
                      >
                        <span aria-hidden="true">{item.complete ? "✓" : "•"}</span>
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })()}
            {registrationDetails && (
                <section className="border-t border-slate-200 px-5 py-5 sm:px-6">
                  <h3 className="text-sm font-bold text-slate-900">
                    Registration information
                  </h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    {Object.entries(registrationDetails)
                      .filter(([key]) => key !== "certification")
                      .map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <dt className="text-xs font-semibold text-slate-500">
                            {formatDetailLabel(key)}
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                            {formatDetailValue(value)}
                          </dd>
                        </div>
                      ))}
                    {"certification" in registrationDetails && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:col-span-2">
                          <dt className="text-xs font-semibold text-slate-500">
                            Certification
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                            {formatDetailValue(
                              registrationDetails.certification,
                            )}
                          </dd>
                        </div>
                      )}
                  </dl>
                </section>
              )}
            <section className="border-t border-slate-200 px-5 py-5 sm:px-6">
              <h3 className="text-sm font-bold text-slate-900">
                Registration documents
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Review each private file and record its PESO verification status.
              </p>
              {documentActionError && (
                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {documentActionError}
                </p>
              )}
              {getVerificationDocuments(detailsEmployer.verification_documents).length === 0 ? (
                <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  No registration documents have been uploaded.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {getVerificationDocuments(detailsEmployer.verification_documents).map((document) => (
                    <li key={document.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-500">{document.label}</p>
                        <button
                          type="button"
                          onClick={() => void openVerificationDocument(document)}
                          disabled={openingDocumentId === document.id}
                          className="mt-1 block max-w-full truncate text-sm font-semibold text-blue-700 hover:underline disabled:opacity-60"
                        >
                          {openingDocumentId === document.id ? "Preparing secure link..." : document.file_name}
                        </button>
                        <p className="mt-1 text-xs text-slate-500">
                          Uploaded {new Date(document.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                      <label className="shrink-0 text-xs font-semibold text-slate-600">
                        Review status
                        <select
                          value={document.status}
                          onChange={(event) => {
                            const nextStatus = event.target.value;
                            if (
                              nextStatus === "pending" ||
                              nextStatus === "approved" ||
                              nextStatus === "rejected"
                            ) {
                              void reviewVerificationDocument(
                                detailsEmployer,
                                document.id,
                                nextStatus,
                              );
                            }
                          }}
                          className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <footer className="flex justify-end border-t border-slate-200 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    `${(detailsEmployer.name ||
                      detailsEmployer.company_name ||
                      detailsEmployer.business_name ||
                      "employer")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")}-details.csv`,
                    Object.entries(detailsEmployer)
                      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                      .map(([key, value]) => ({
                        label: formatDetailLabel(key),
                        value: formatDetailValue(value),
                      })),
                  )
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Export CSV
              </button>
            </footer>
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