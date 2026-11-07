export const establishmentStatuses = ["New Registrant", "For Renewal"] as const;

export const establishmentTypes = [
  "Government",
  "Private",
  "Recruitment Agency (Local)",
  "Recruitment Agency (Overseas)",
  "Other",
] as const;

export const workforceOptions = [
  "1–9 (Micro)",
  "10–99 (Small)",
  "100–199 (Medium)",
  "200 and over",
] as const;

export const industryOptions = [
  "Agriculture, Forestry and Fishing",
  "Mining and Quarrying",
  "Manufacturing",
  "Electricity, Gas, Steam & Air Conditioning Supply",
  "Construction",
  "Wholesale and Retail Trade; Repair of Motorcycle Vehicles and Motorcycles",
  "Transportation and Storage",
  "Accommodation & Food Service Activities",
  "Information and Communication",
  "Financial & Insurance Activities",
  "Real Estate Activities",
  "Professional, Scientific, and Technical Activities",
  "Administrative and Support Service Activities",
  "Public Administration and Defense; Compulsory Social Security",
  "Education",
  "Human Health and Social Work Activities",
  "Arts, Entertainment and Recreation",
  "Others",
] as const;

export const employerJobCategories = [
  "Administrative and clerical",
  "Agriculture and fisheries",
  "Customer service and sales",
  "Hospitality and food service",
  "Manufacturing and production",
  "Professional and technical",
  "Other",
] as const;

export const employerDocumentRequirements = [
  { id: "letter_of_intent", label: "Letter of Intent", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
  { id: "business_permit", label: "Business or Mayor's Permit", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
  { id: "registration_certificate", label: "BIR Form 2303 / SEC Registration", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
  { id: "dole_no_pending_cases", label: "DOLE Certificate of No Pending Cases", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
  { id: "vacancies_and_qualifications", label: "List of Vacancies and Qualifications", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
  { id: "license", label: "Applicable License", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
  { id: "philjobnet_membership", label: "Proof of PhilJobNet Membership", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
  { id: "company_profile", label: "Company Profile", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
] as const;

export type EmployerDocumentType =
  | (typeof employerDocumentRequirements)[number]["id"]
  | "job_vacancy_ads";

export type EmployerDocumentStatus = "pending" | "approved" | "rejected";

export type EmployerVerificationDocument = {
  id: string;
  document_type: EmployerDocumentType;
  label: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  status: EmployerDocumentStatus;
  uploaded_at: string;
  reviewed_at?: string | null;
  review_note?: string | null;
};

export const maxEmployerDocumentSize = 1024 * 1024 * 1024;
export const maxJobAdFiles = 10;

const documentMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

export function isEmployerDocumentFile(
  file: File,
  imagesOnly = false,
): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const imageExtension = extension === "jpg" || extension === "jpeg" || extension === "png";
  if (imagesOnly) {
    return (
      imageExtension &&
      (!file.type || ["image/jpeg", "image/png"].includes(file.type))
    );
  }

  if (file.type) return documentMimeTypes.has(file.type);
  return ["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(extension || "");
}

export function getEmployerDocumentMimeType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}
