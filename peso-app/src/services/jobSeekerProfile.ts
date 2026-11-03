type RegistrationDetails = Record<string, unknown>;

export const JOB_SEEKER_PROFILE_SECTION_TITLES = [
  "I. Personal Information",
  "II. Employment Information",
  "III. Language / Dialect Proficiency",
  "IV. Educational Background",
  "V. Technical / Vocational and Other Training",
  "VI. Eligibility / Professional License",
  "VII. Work Experience",
  "VIII. Other Skills Acquired Without Certificate",
  "IX. History of SPES / GIP Engagement",
  "Certification / Authorization",
] as const;

function parseRegistrationDetails(value: unknown): RegistrationDetails {
  let details = value;
  if (typeof details === "string") {
    try {
      details = JSON.parse(details);
    } catch {
      return {};
    }
  }
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }
  return details as RegistrationDetails;
}

function hasValue(details: RegistrationDetails, key: string): boolean {
  const value = details[key];
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function getIncompleteJobSeekerProfileSections(
  value: unknown,
): string[] {
  const details = parseRegistrationDetails(value);
  const incomplete: string[] = [];
  const hasAll = (keys: string[]) => keys.every((key) => hasValue(details, key));

  if (
    !hasAll([
      "middleName",
      "dateOfBirth",
      "sex",
      "contactNumber",
      "presentAddress",
      "permanentAddress",
      "civilStatus",
      "fatherName",
      "motherName",
      "parentsCivilStatus",
      "governmentIdType",
      "governmentIdNumber",
      "heightCm",
      "weightKg",
      "disability",
    ]) ||
    details.privacyConsent !== true
  ) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[0]);
  }

  if (
    !hasAll([
      "employmentStatus",
      "isOfw",
      "isFormerOfw",
      "is4PsBeneficiary",
      "preferredOccupation",
      "companyApplyingFor",
      "preferredWorkLocation",
    ]) ||
    ((details.employmentStatus === "Unemployed" ||
      details.employmentStatus === "N/A") &&
      !hasAll(["unemploymentDurationMonths", "unemploymentReason"])) ||
    (details.preferredWorkLocation === "Other" &&
      !hasValue(details, "otherWorkLocation"))
  ) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[1]);
  }

  if (
    !(Array.isArray(details.languages) && details.languages.length > 0) &&
    !hasValue(details, "otherLanguage")
  ) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[2]);
  }

  if (
    !hasAll([
      "educationLevel",
      "elementaryEducation",
      "secondaryEducation",
      "tertiaryEducation",
    ])
  ) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[3]);
  }

  if (!hasAll(["training1", "training2", "training3"])) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[4]);
  }

  if (!hasAll(["eligibility1", "eligibility2"])) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[5]);
  }

  if (details.noWorkExperience !== true && !hasValue(details, "workExperience1")) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[6]);
  }

  if (!hasValue(details, "otherSkills")) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[7]);
  }

  if (
    !hasValue(details, "spesGipHistory") ||
    (details.spesGipHistory === "Yes" &&
      !hasAll(["engagementPeriod", "spesGipId"]))
  ) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[8]);
  }

  if (!hasAll(["signature", "signatureDate"])) {
    incomplete.push(JOB_SEEKER_PROFILE_SECTION_TITLES[9]);
  }

  return incomplete;
}

export function areJobSeekerProfileSectionsComplete(
  registrationDetails: unknown,
): boolean {
  return getIncompleteJobSeekerProfileSections(registrationDetails).length === 0;
}

export function isJobSeekerProfileComplete(
  registrationDetails: unknown,
  resumeUrl: string | null | undefined,
): boolean {
  return (
    areJobSeekerProfileSectionsComplete(registrationDetails) &&
    Boolean(resumeUrl?.trim())
  );
}
