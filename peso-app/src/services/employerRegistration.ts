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

export type EmployerRegistrationChecklistItem = {
  label: string;
  complete: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function hasValue(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0;
  if (typeof value === "boolean") return value;
  return typeof value === "string" && value.trim().length > 0;
}

export function getEmployerRegistrationChecklist(
  registrationDetailsValue: unknown,
  verificationDocumentsValue: unknown,
  employerProfileValue: unknown,
): EmployerRegistrationChecklistItem[] {
  const details = asRecord(registrationDetailsValue);
  const employer = asRecord(employerProfileValue);
  const certification = asRecord(details.certification);
  const documents = Array.isArray(verificationDocumentsValue)
    ? verificationDocumentsValue.filter(
        (document): document is Record<string, unknown> =>
          Boolean(document) && typeof document === "object" && !Array.isArray(document),
      )
    : [];
  const uploadedTypes = new Set(
    documents
      .map((document) => document.document_type)
      .filter((type): type is string => typeof type === "string"),
  );
  const establishmentStatus = details.establishment_status;
  const industries = Array.isArray(details.industries)
    ? details.industries.filter((industry) => typeof industry === "string")
    : [];
  const residentCountsPresent =
    hasValue(details.mabini_residents) &&
    hasValue(details.non_mabini_residents) &&
    hasValue(details.total_employees);
  const headcountsMatch =
    residentCountsPresent &&
    Number(details.mabini_residents) + Number(details.non_mabini_residents) ===
      Number(details.total_employees);

  const requiredDocumentTypes = employerDocumentRequirements
    .filter(
      (requirement) =>
        requirement.id !== "company_profile" ||
        establishmentStatus === "New Registrant",
    )
    .map((requirement) => requirement.id);

  return [
    {
      label: "Basic company profile",
      complete:
        hasValue(employer.name) &&
        hasValue(employer.email) &&
        hasValue(employer.contact_person) &&
        hasValue(employer.contact_no) &&
        hasValue(employer.address),
    },
    {
      label: "Establishment information",
      complete:
        hasValue(details.acronym) &&
        hasValue(establishmentStatus) &&
        hasValue(details.tin) &&
        hasValue(details.establishment_type) &&
        hasValue(details.workforce),
    },
    {
      label: "Employment information",
      complete:
        headcountsMatch &&
        industries.length > 0 &&
        (!industries.includes("Others") || hasValue(details.other_industry)),
    },
    {
      label: "Contact details",
      complete: [
        "hr_manager_name",
        "hr_manager_position",
        "hr_manager_contact",
        "hr_staff_name",
        "hr_staff_position",
        "address_house_street",
        "address_barangay",
        "address_city",
        "telephone",
        "mobile",
        "facebook_page",
        "email",
        "website",
      ].every((key) => hasValue(details[key])),
    },
    {
      label: "Certification and consent",
      complete:
        certification.consent_accepted === true &&
        hasValue(certification.authorized_representative_signature),
    },
    {
      label: "Required paperwork",
      complete:
        requiredDocumentTypes.every((type) => uploadedTypes.has(type)) &&
        uploadedTypes.has("job_vacancy_ads"),
    },
  ];
}

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
