import { supabase } from "./supabase";

export const RESUME_BUCKET = "Resume Files";

export const RESUME_MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  csv: "text/csv",
};

export const RESUME_ACCEPT =
  ".pdf,.doc,.docx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv";

export const RESUME_FORMATS_LABEL = "PDF, DOC, DOCX, or CSV";

export function getResumeExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export async function getResumeUrl(resumeValue: string) {
  const trimmed = resumeValue.trim();

  if (!trimmed) {
    throw new Error("No resume has been uploaded.");
  }

  if (/^(?:https?:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  let path = trimmed.replace(/^\/+/, "");
  const bucketPrefix = `${RESUME_BUCKET}/`;

  if (path.startsWith(bucketPrefix)) {
    path = path.slice(bucketPrefix.length);
  }

  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(path, 60);

  if (error) throw error;

  return data.signedUrl;
}

export async function openStoredResume(resumeValue: string) {
  const url = await getResumeUrl(resumeValue);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
}
