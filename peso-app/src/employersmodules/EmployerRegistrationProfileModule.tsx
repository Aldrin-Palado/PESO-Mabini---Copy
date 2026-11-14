import { useEffect, useState, type FormEvent } from "react";
import ESignatureInput from "../components/ESignatureInput";
import AutoResizeTextarea from "../components/AutoResizeTextarea";
import VerificationDocumentsModule from "./VerificationDocumentsModule";
import {
  employerDocumentRequirements,
  establishmentStatuses,
  establishmentTypes,
  getEmployerRegistrationChecklist,
  industryOptions,
  workforceOptions,
  type EmployerVerificationDocument,
} from "../services/employerRegistration";
import FilterDropdown from "../components/FilterDropdown";

type RegistrationDetails = {
  acronym: string;
  establishment_status: string;
  tin: string;
  establishment_type: string;
  other_establishment_type: string;
  workforce: string;
  mabini_residents: string;
  non_mabini_residents: string;
  total_employees: string;
  other_industry: string;
  industries: string[];
  hr_manager_name: string;
  hr_manager_position: string;
  hr_manager_contact: string;
  hr_staff_name: string;
  hr_staff_position: string;
  address_house_street: string;
  address_barangay: string;
  address_city: string;
  telephone: string;
  mobile: string;
  facebook_page: string;
  website: string;
  email: string;
  authorized_representative_signature: string;
  remarks: string;
};

type EmployerProfile = {
  employer_id: string;
  user_id: string;
  name: string;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  contact_no: string | null;
  industry: string | null;
  website: string | null;
};

type Props = {
  profile: EmployerProfile;
  registrationDetails: unknown;
  verificationDocuments: unknown;
  onSave: (details: Record<string, unknown>) => Promise<void>;
  onDocumentsSaved: (documents: EmployerVerificationDocument[]) => void;
  isEditing: boolean;
  onEditComplete: () => void;
};

const emptyDetails: RegistrationDetails = {
  acronym: "",
  establishment_status: "",
  tin: "",
  establishment_type: "",
  other_establishment_type: "",
  workforce: "",
  mabini_residents: "",
  non_mabini_residents: "",
  total_employees: "",
  other_industry: "",
  industries: [],
  hr_manager_name: "",
  hr_manager_position: "",
  hr_manager_contact: "",
  hr_staff_name: "",
  hr_staff_position: "",
  address_house_street: "",
  address_barangay: "",
  address_city: "",
  telephone: "",
  mobile: "",
  facebook_page: "",
  website: "",
  email: "",
  authorized_representative_signature: "",
  remarks: "",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getInitialDetails(value: unknown, profile: EmployerProfile): RegistrationDetails {
  const saved = asRecord(value);
  const savedIndustries = Array.isArray(saved.industries)
    ? saved.industries.filter((industry): industry is string => typeof industry === "string")
    : [];
  const knownIndustries = savedIndustries.filter((industry) =>
    industryOptions.includes(industry as (typeof industryOptions)[number]),
  );
  const otherIndustry = asText(saved.other_industry) ||
    savedIndustries.find((industry) => !knownIndustries.includes(industry)) ||
    "";
  const certification = asRecord(saved.certification);
  const savedEstablishmentType = asText(saved.establishment_type);
  const knownEstablishmentType = establishmentTypes.includes(
    savedEstablishmentType as (typeof establishmentTypes)[number],
  );

  return {
    ...emptyDetails,
    acronym: asText(saved.acronym),
    establishment_status: asText(saved.establishment_status),
    tin: asText(saved.tin),
    establishment_type: !savedEstablishmentType
      ? ""
      : knownEstablishmentType
        ? savedEstablishmentType
        : "Other",
    other_establishment_type: knownEstablishmentType
      ? asText(saved.other_establishment_type)
      : savedEstablishmentType,
    workforce: asText(saved.workforce),
    mabini_residents: saved.mabini_residents == null ? "" : String(saved.mabini_residents),
    non_mabini_residents: saved.non_mabini_residents == null ? "" : String(saved.non_mabini_residents),
    total_employees: saved.total_employees == null ? "" : String(saved.total_employees),
    other_industry: otherIndustry,
    industries: otherIndustry ? [...knownIndustries, "Others"] : knownIndustries,
    hr_manager_name: asText(saved.hr_manager_name) || profile.contact_person || "",
    hr_manager_position: asText(saved.hr_manager_position),
    hr_manager_contact: asText(saved.hr_manager_contact) || profile.contact_no || "",
    hr_staff_name: asText(saved.hr_staff_name),
    hr_staff_position: asText(saved.hr_staff_position),
    address_house_street: asText(saved.address_house_street),
    address_barangay: asText(saved.address_barangay),
    address_city: asText(saved.address_city),
    telephone: asText(saved.telephone),
    mobile: asText(saved.mobile) || profile.contact_no || "",
    facebook_page: asText(saved.facebook_page),
    website: asText(saved.website) || profile.website || "",
    email: asText(saved.email) || profile.email || "",
    authorized_representative_signature:
      asText(certification.authorized_representative_signature) ||
      asText(saved.authorized_representative_signature),
    remarks: asText(saved.remarks),
  };
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0759AE] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
const labelClass = "block text-sm font-semibold text-slate-700";
const required = <span className="text-red-600"> *</span>;

export default function EmployerRegistrationProfileModule({
  profile,
  registrationDetails,
  verificationDocuments,
  onSave,
  onDocumentsSaved,
  isEditing,
  onEditComplete,
}: Props) {
  const [form, setForm] = useState(() =>
    getInitialDetails(registrationDetails, profile),
  );
  const [consentAccepted, setConsentAccepted] = useState(() =>
    asRecord(asRecord(registrationDetails).certification).consent_accepted === true,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registrationDetailsOpen, setRegistrationDetailsOpen] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    setForm(getInitialDetails(registrationDetails, profile));
    setConsentAccepted(
      asRecord(asRecord(registrationDetails).certification).consent_accepted === true,
    );
  }, [
    profile.contact_no,
    profile.contact_person,
    profile.email,
    profile.name,
    profile.website,
    isEditing,
    registrationDetails,
  ]);

  useEffect(() => {
    if (isEditing) {
      setRegistrationDetailsOpen(true);
    }
  }, [isEditing]);

  const savedDetails = asRecord(registrationDetails);
  const registrationChecklist = getEmployerRegistrationChecklist(
    {
      ...savedDetails,
      ...form,
      establishment_type:
        form.establishment_type === "Other"
          ? form.other_establishment_type.trim()
          : form.establishment_type,
      industries: form.industries.map((industry) =>
        industry === "Others" ? form.other_industry.trim() : industry,
      ),
      certification: {
        ...asRecord(savedDetails.certification),
        consent_accepted: consentAccepted,
        authorized_representative_signature:
          form.authorized_representative_signature.trim(),
      },
    },
    verificationDocuments,
    profile,
  );
  const completedRegistrationSteps = registrationChecklist.filter(
    (item) => item.complete,
  ).length;

  const update = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const updateScreeningField = (name: string, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const cancelChanges = () => {
    setForm(getInitialDetails(registrationDetails, profile));
    setConsentAccepted(
      asRecord(asRecord(registrationDetails).certification).consent_accepted === true,
    );
    setError("");
    setSuccess("");
    setRegistrationDetailsOpen(false);
    onEditComplete();
  };

  const toggleIndustry = (industry: string) => {
    setForm((current) => ({
      ...current,
      industries: current.industries.includes(industry)
        ? current.industries.filter((item) => item !== industry)
        : [...current.industries, industry],
    }));
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const mabiniResidents = Number(form.mabini_residents);
    const nonMabiniResidents = Number(form.non_mabini_residents);
    const totalEmployees = Number(form.total_employees);
    if (mabiniResidents + nonMabiniResidents !== totalEmployees) {
      setError("Total employees must equal Mabini residents plus non-Mabini residents.");
      return;
    }
    if (!form.establishment_status || !form.establishment_type || !form.workforce) {
      setError("Complete the establishment status, type, and workforce fields.");
      return;
    }
    if (form.industries.length === 0) {
      setError("Select at least one industry.");
      return;
    }
    if (form.industries.includes("Others") && !form.other_industry.trim()) {
      setError("Specify the other industry.");
      return;
    }
    if (!consentAccepted) {
      setError("Accept the certification and data privacy declaration to continue.");
      return;
    }
    if (!form.authorized_representative_signature.trim()) {
      setError("Draw or upload the authorized representative's e-signature.");
      return;
    }

    const savedAt = new Date().toISOString();
    const oldDetails = asRecord(registrationDetails);
    const details: Record<string, unknown> = {
      ...oldDetails,
      acronym: form.acronym.trim(),
      establishment_status: form.establishment_status,
      tin: form.tin.trim(),
      establishment_type:
        form.establishment_type === "Other"
          ? form.other_establishment_type.trim()
          : form.establishment_type,
      other_establishment_type:
        form.establishment_type === "Other"
          ? form.other_establishment_type.trim()
          : "",
      workforce: form.workforce,
      mabini_residents: mabiniResidents,
      non_mabini_residents: nonMabiniResidents,
      total_employees: totalEmployees,
      other_industry: form.other_industry.trim(),
      industries: form.industries.map((industry) =>
        industry === "Others" ? form.other_industry.trim() : industry,
      ),
      hr_manager_name: form.hr_manager_name.trim(),
      hr_manager_position: form.hr_manager_position.trim(),
      hr_manager_contact: form.hr_manager_contact.trim(),
      hr_staff_name: form.hr_staff_name.trim(),
      hr_staff_position: form.hr_staff_position.trim(),
      address_house_street: form.address_house_street.trim(),
      address_barangay: form.address_barangay.trim(),
      address_city: form.address_city.trim(),
      telephone: form.telephone.trim(),
      mobile: form.mobile.trim(),
      facebook_page: form.facebook_page.trim(),
      website: form.website.trim(),
      email: form.email.trim().toLowerCase(),
      remarks: form.remarks.trim(),
      certification: {
        ...asRecord(oldDetails.certification),
        declaration:
          "I hereby certify that the above information provided is true and correct to the best of my knowledge and I allow the Mabini PESO to include and use the Company profile in the PESO Employment Information System (PEIS). The information herein shall be treated as confidential in Compliance with the Data Privacy Act of 2012.",
        consent_accepted: true,
        consent_accepted_at: savedAt,
        authorized_representative_signature:
          form.authorized_representative_signature.trim(),
        certification_date: savedAt,
      },
    };

    setSaving(true);
    try {
      await onSave(details);
      setSuccess("Employer registration profile saved.");
      onEditComplete();
    } catch (saveError) {
      console.error("Could not save employer registration profile:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your registration profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0759AE]">
              PESO registration
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#123B70]">
              Employer Registration Details
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Complete your PESO registration and submit the required paperwork.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRegistrationDetailsOpen((open) => !open)}
            aria-expanded={registrationDetailsOpen}
            aria-controls="employer-registration-details"
            className="shrink-0 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-bold text-[#0759AE] transition hover:bg-blue-50"
          >
            {registrationDetailsOpen
              ? "Hide PESO Details"
              : "Show PESO Details"}
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#123B70]">Registration progress</h3>
            <p className="mt-1 text-xs text-slate-600">
              Complete all sections and upload the required paperwork for PESO review.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#123B70]">
            {completedRegistrationSteps}/{registrationChecklist.length} complete
          </span>
        </div>
        {registrationDetailsOpen && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {registrationChecklist.map((item) => (
              <li
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                  item.complete
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-white text-slate-600"
                }`}
              >
                <span aria-hidden="true">{item.complete ? "✓" : "○"}</span>
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}

      {registrationDetailsOpen && <div id="employer-registration-details" className="space-y-6">
      <form
        id="employer-screening-details-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-6"
      >
        <fieldset disabled={!isEditing || saving} className="space-y-6 border-0 p-0">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900">Establishment Information</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Name of Establishment
              <input value={profile.name} readOnly className={`${inputClass} bg-slate-50`} />
            </label>
            <label className={labelClass}>Acronym{required}
              <input name="acronym" value={form.acronym} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>Status{required}
              <FilterDropdown
                value={form.establishment_status}
                onChange={(value) => updateScreeningField("establishment_status", value)}
                ariaLabel="Establishment status"
                options={[
                  { value: "", label: "Select status" },
                  ...establishmentStatuses.map((status) => ({
                    value: status,
                    label: status,
                  })),
                ]}
                disabled={!isEditing || saving}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>Company TIN{required}
              <input name="tin" value={form.tin} onChange={update} required maxLength={30} className={inputClass} />
            </label>
            <label className={labelClass}>Establishment Type{required}
              <FilterDropdown
                value={form.establishment_type}
                onChange={(value) => updateScreeningField("establishment_type", value)}
                ariaLabel="Establishment type"
                options={[
                  { value: "", label: "Select type" },
                  ...establishmentTypes.map((type) => ({
                    value: type,
                    label: type,
                  })),
                ]}
                disabled={!isEditing || saving}
                className={inputClass}
              />
            </label>
            {form.establishment_type === "Other" && (
              <label className={labelClass}>Specify establishment type{required}
                <input name="other_establishment_type" value={form.other_establishment_type} onChange={update} required className={inputClass} />
              </label>
            )}
            <label className={labelClass}>Workforce{required}
              <FilterDropdown
                value={form.workforce}
                onChange={(value) => updateScreeningField("workforce", value)}
                ariaLabel="Workforce"
                options={[
                  { value: "", label: "Select workforce" },
                  ...workforceOptions.map((option) => ({
                    value: option,
                    label: option,
                  })),
                ]}
                disabled={!isEditing || saving}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900">Employment Information</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>Mabini Residents{required}
              <input type="number" min="0" name="mabini_residents" value={form.mabini_residents} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>Non-Mabini Residents{required}
              <input type="number" min="0" name="non_mabini_residents" value={form.non_mabini_residents} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>Total Employees{required}
              <input type="number" min="0" name="total_employees" value={form.total_employees} onChange={update} required className={inputClass} />
            </label>
          </div>
          <fieldset className="mt-5">
            <legend className={`${labelClass} mb-2`}>Industry (select all that apply){required}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {industryOptions.map((industry) => (
                <label key={industry} className="flex items-start gap-2 rounded-lg border border-slate-100 p-2.5 text-sm text-slate-700">
                  <input type="checkbox" checked={form.industries.includes(industry)} onChange={() => toggleIndustry(industry)} className="mt-0.5 h-4 w-4 accent-[#0759AE]" />
                  {industry}
                </label>
              ))}
            </div>
          </fieldset>
          {form.industries.includes("Others") && (
            <label className={`${labelClass} mt-4`}>Specify other industry{required}
              <input name="other_industry" value={form.other_industry} onChange={update} required className={inputClass} />
            </label>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900">Contact Details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <h4 className="font-semibold text-[#123B70] sm:col-span-2">HR / Recruitment / Operations Manager</h4>
            <label className={labelClass}>Name{required}
              <input name="hr_manager_name" value={form.hr_manager_name} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>Position{required}
              <input name="hr_manager_position" value={form.hr_manager_position} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>Contact No.{required}
              <input type="tel" name="hr_manager_contact" value={form.hr_manager_contact} onChange={update} required className={inputClass} />
            </label>
            <h4 className="mt-2 font-semibold text-[#123B70] sm:col-span-2">HR / Recruitment Staff</h4>
            <label className={labelClass}>Name{required}
              <input name="hr_staff_name" value={form.hr_staff_name} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>Position{required}
              <input name="hr_staff_position" value={form.hr_staff_position} onChange={update} required className={inputClass} />
            </label>
            <h4 className="mt-2 font-semibold text-[#123B70] sm:col-span-2">Office Address</h4>
            <label className={labelClass}>House No. / Bldg. / Street{required}
              <input name="address_house_street" value={form.address_house_street} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>Barangay{required}
              <input name="address_barangay" value={form.address_barangay} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>City / Municipality{required}
              <input name="address_city" value={form.address_city} onChange={update} required className={inputClass} />
            </label>
            <h4 className="mt-2 font-semibold text-[#123B70] sm:col-span-2">Other Contact Information</h4>
            <label className={labelClass}>Telephone No.{required}
              <input type="tel" name="telephone" value={form.telephone} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>Mobile No.{required}
              <input type="tel" name="mobile" value={form.mobile} onChange={update} required className={inputClass} />
            </label>
            <label className={labelClass}>Facebook Page{required}
              <input type="url" name="facebook_page" value={form.facebook_page} onChange={update} required placeholder="https://facebook.com/..." className={inputClass} />
            </label>
            <label className={labelClass}>Email Address{required}
              <input type="email" name="email" value={form.email} onChange={update} required className={inputClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Company Website{required}
              <input type="url" name="website" value={form.website} onChange={update} required placeholder="https://example.com" className={inputClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Remarks <span className="font-normal text-slate-500">(optional)</span>
              <AutoResizeTextarea name="remarks" value={form.remarks} onChange={update} rows={3} maxLength={2000} className={inputClass} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900">Certification and Consent</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            I hereby certify that the above information provided is true and correct to the best of my knowledge and I allow the Mabini PESO to include and use the Company profile in the PESO Employment Information System (PEIS). The information herein shall be treated as confidential in Compliance with the Data Privacy Act of 2012.
          </p>
          <div className={`${labelClass} mt-4`}>
            Authorized Representative's Electronic Signature{required}
            {form.authorized_representative_signature &&
              !form.authorized_representative_signature.startsWith("data:image/") && (
                <span className="mt-2 block rounded-lg bg-slate-50 p-3 text-sm font-normal text-slate-600">
                  Previously saved signature: {form.authorized_representative_signature}
                </span>
              )}
            <ESignatureInput
              value={form.authorized_representative_signature}
              disabled={!isEditing || saving}
              onChange={(signature) => {
                setForm((current) => ({
                  ...current,
                  authorized_representative_signature: signature,
                }));
                setError("");
                setSuccess("");
              }}
            />
          </div>
          <label className="mt-4 flex items-start gap-2.5 text-sm leading-6 text-slate-700">
            <input type="checkbox" checked={consentAccepted} onChange={(event) => setConsentAccepted(event.target.checked)} required className="mt-1 h-4 w-4 accent-[#0759AE]" />
            <span>I certify that the information is true and correct and consent to the declaration above.{required}</span>
          </label>
        </section>
        </fieldset>
      </form>

      <VerificationDocumentsModule
        employerId={profile.employer_id}
        userId={profile.user_id}
        registrationDetails={{
          ...asRecord(registrationDetails),
          establishment_status: form.establishment_status,
        }}
        verificationDocuments={verificationDocuments}
        onDocumentsSaved={onDocumentsSaved}
      />
      <p className="text-xs text-slate-500">
        Required paperwork: {employerDocumentRequirements.filter((item) =>
          item.id !== "company_profile" ||
          asText(asRecord(registrationDetails).establishment_status) === "New Registrant",
        ).length} document types, plus any applicable job vacancy ads.
      </p>
      {isEditing && (
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={cancelChanges}
          disabled={saving}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="employer-screening-details-form"
          disabled={saving}
          className="rounded-xl bg-[#0759AE] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Screening Details"}
        </button>
      </div>
      )}
      </div>}
    </div>
  );
}
