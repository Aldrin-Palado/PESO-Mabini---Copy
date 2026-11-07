import { useEffect, useMemo, useState } from "react";
import AppIcon from "../components/AppIcon";
import {
  employerDocumentRequirements,
  getEmployerDocumentMimeType,
  isEmployerDocumentFile,
  maxEmployerDocumentSize,
  maxJobAdFiles,
  type EmployerDocumentType,
  type EmployerVerificationDocument,
} from "../services/employerRegistration";
import { supabase } from "../services/supabase";

type Props = {
  employerId: string;
  userId: string;
  registrationDetails: unknown;
  verificationDocuments: unknown;
  onDocumentsSaved: (documents: EmployerVerificationDocument[]) => void;
};

function isVerificationDocument(value: unknown): value is EmployerVerificationDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Record<string, unknown>;
  return (
    typeof document.id === "string" &&
    typeof document.document_type === "string" &&
    typeof document.label === "string" &&
    typeof document.file_name === "string" &&
    typeof document.storage_path === "string" &&
    typeof document.status === "string" &&
    typeof document.uploaded_at === "string"
  );
}

function getDocuments(value: unknown): EmployerVerificationDocument[] {
  return Array.isArray(value) ? value.filter(isVerificationDocument) : [];
}

function isNewRegistrant(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return (value as Record<string, unknown>).establishment_status === "New Registrant";
}

function statusClass(status: EmployerVerificationDocument["status"]) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-800";
}

export default function VerificationDocumentsModule({
  employerId,
  userId,
  registrationDetails,
  verificationDocuments,
  onDocumentsSaved,
}: Props) {
  const [documents, setDocuments] = useState(
    () => getDocuments(verificationDocuments),
  );
  const [uploadingType, setUploadingType] = useState<EmployerDocumentType | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setDocuments(getDocuments(verificationDocuments));
  }, [verificationDocuments]);

  const newRegistrant = isNewRegistrant(registrationDetails);
  const requiredDocuments = useMemo(
    () => employerDocumentRequirements.filter(
      (requirement) => requirement.id !== "company_profile" || newRegistrant,
    ),
    [newRegistrant],
  );
  const jobAdCount = documents.filter(
    (document) => document.document_type === "job_vacancy_ads",
  ).length;

  const uploadDocument = async (
    documentType: EmployerDocumentType,
    label: string,
    file: File,
    imagesOnly = false,
  ) => {
    setError("");
    setSuccess("");

    if (!isEmployerDocumentFile(file, imagesOnly)) {
      setError(
        imagesOnly
          ? "Job Vacancy Ads must be PNG or JPG images."
          : "Choose a PDF, DOC, DOCX, JPG, or PNG file.",
      );
      return;
    }
    if (file.size > maxEmployerDocumentSize) {
      setError("Each document must be 1 GB or smaller.");
      return;
    }
    if (
      documentType === "job_vacancy_ads" &&
      jobAdCount >= maxJobAdFiles
    ) {
      setError(`You can upload up to ${maxJobAdFiles} Job Vacancy Ads.`);
      return;
    }

    setUploadingType(documentType);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath =
      `${userId}/${documentType}/${crypto.randomUUID()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from("employer-verification-documents")
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: getEmployerDocumentMimeType(file),
        upsert: false,
      });

    if (uploadError) {
      console.error("Employer verification document upload failed:", uploadError);
      setError(`Upload failed: ${uploadError.message}`);
      setUploadingType(null);
      return;
    }

    const replacement: EmployerVerificationDocument = {
      id: crypto.randomUUID(),
      document_type: documentType,
      label,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: getEmployerDocumentMimeType(file),
      size: file.size,
      status: "pending",
      uploaded_at: new Date().toISOString(),
    };
    const nextDocuments = [...documents, replacement];

    const { data, error: saveError } = await supabase
      .from("employer")
      .update({ verification_documents: nextDocuments })
      .eq("employer_id", employerId)
      .eq("user_id", userId)
      .select("employer_id")
      .maybeSingle();

    if (saveError || !data) {
      const { error: cleanupError } = await supabase.storage
        .from("employer-verification-documents")
        .remove([storagePath]);
      if (cleanupError) {
        console.error("Could not remove an unsaved verification document:", cleanupError);
      }
      console.error("Could not save employer verification document:", saveError);
      setError(
        saveError
          ? `Document uploaded but its record could not be saved: ${saveError.message}`
          : "Document record could not be saved. Please sign in again and retry.",
      );
      setUploadingType(null);
      return;
    }

    setDocuments(nextDocuments);
    onDocumentsSaved(nextDocuments);
    setSuccess(`${label} uploaded and submitted for PESO review.`);
    setUploadingType(null);
  };

  const openDocument = async (document: EmployerVerificationDocument) => {
    setError("");
    const { data, error: signedUrlError } = await supabase.storage
      .from("employer-verification-documents")
      .createSignedUrl(document.storage_path, 60);
    if (signedUrlError) {
      console.error("Could not create document preview link:", signedUrlError);
      setError(`Could not open ${document.file_name}: ${signedUrlError.message}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#0759AE]">
          Employer profile
        </p>
        <h1 className="mt-1 text-2xl font-black text-[#123B70]">
          Registration Paperwork
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Upload the paperwork needed for your PESO employer registration here.
          Files remain private and stay pending until PESO staff reviews them.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {success}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Required documents</h2>
        <p className="mt-1 text-xs text-slate-500">
          PDF, DOC, DOCX, JPG, or PNG; up to 1 GB per file, subject to your Supabase project's upload limit.
        </p>
        <div className="mt-4 divide-y divide-slate-100">
          {requiredDocuments.map((requirement) => {
            const existing = [...documents].reverse().find(
              (document) => document.document_type === requirement.id,
            );
            const busy = uploadingType === requirement.id;
            return (
              <div key={requirement.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {requirement.label}
                    <span className="ml-1 text-red-600">*</span>
                  </p>
                  {existing ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => void openDocument(existing)}
                        className="max-w-full truncate font-semibold text-blue-700 hover:underline"
                      >
                        {existing.file_name}
                      </button>
                      <span className={`rounded-full px-2 py-1 font-semibold capitalize ${statusClass(existing.status)}`}>
                        {existing.status}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-amber-700">Not uploaded</p>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  <AppIcon name="arrowRight" className="h-3.5 w-3.5" />
                  {busy ? "Uploading..." : existing ? "Replace file" : "Upload file"}
                  <input
                    type="file"
                    accept={requirement.accept}
                    disabled={uploadingType !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.currentTarget.value = "";
                      if (file) void uploadDocument(requirement.id, requirement.label, file);
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Job Vacancy Ads <span className="text-red-600">*</span>
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                PNG or JPG images, up to {maxJobAdFiles} files ({jobAdCount}/{maxJobAdFiles} uploaded).
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              {uploadingType === "job_vacancy_ads" ? "Uploading..." : "Add ad"}
              <input
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                disabled={uploadingType !== null || jobAdCount >= maxJobAdFiles}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (file) {
                    void uploadDocument(
                      "job_vacancy_ads",
                      `Job Vacancy Ad ${jobAdCount + 1}`,
                      file,
                      true,
                    );
                  }
                }}
                className="sr-only"
              />
            </label>
          </div>
          <ul className="mt-3 space-y-2">
            {documents
              .filter((document) => document.document_type === "job_vacancy_ads")
              .map((document) => (
                <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => void openDocument(document)}
                    className="truncate font-semibold text-blue-700 hover:underline"
                  >
                    {document.file_name}
                  </button>
                  <span className={`rounded-full px-2 py-1 font-semibold capitalize ${statusClass(document.status)}`}>
                    {document.status}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        If a reviewer rejects a file, upload a corrected replacement. Replacing a file resets its review status to pending.
      </p>
    </div>
  );
}
