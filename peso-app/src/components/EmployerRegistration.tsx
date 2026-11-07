import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppIcon from "./AppIcon";
import AuthSideImage from "./AuthSideImage";
import PesoLogo from "./PesoLogo";
import {
  employerDocumentRequirements,
  employerJobCategories,
  establishmentStatuses,
  establishmentTypes,
  getEmployerDocumentMimeType,
  industryOptions,
  isEmployerDocumentFile,
  maxEmployerDocumentSize,
  maxJobAdFiles,
  workforceOptions,
  type EmployerDocumentType,
  type EmployerVerificationDocument,
} from "../services/employerRegistration";
import { supabase } from "../services/supabase";

type EmployerRegistrationProps = {
  onBack: () => void;
};

const registrationSteps = [
  { title: "Establishment", detail: "Company information" },
  { title: "Employment", detail: "Workforce and industry" },
  { title: "Contacts", detail: "Representatives and account" },
  { title: "Documents", detail: "Verification requirements" },
  { title: "Certification", detail: "Review and submit" },
];

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0759AE] focus:ring-2 focus:ring-[#0759AE]/15";

const requiredMark = <span className="text-red-600"> *</span>;

const emptyForm = {
  companyName: "",
  acronym: "",
  establishmentStatus: "",
  tin: "",
  establishmentType: "",
  otherEstablishmentType: "",
  workforce: "",
  mabiniResidents: "",
  nonMabiniResidents: "",
  totalEmployees: "",
  otherIndustry: "",
  managerName: "",
  managerPosition: "",
  managerContact: "",
  staffName: "",
  staffPosition: "",
  houseStreet: "",
  barangay: "",
  city: "",
  telephone: "",
  mobile: "",
  facebookPage: "",
  email: "",
  website: "",
  password: "",
  confirmPassword: "",
  signature: "",
  remarks: "",
};

type FormFields = typeof emptyForm;

const requiredUploadTypes = employerDocumentRequirements
  .filter((requirement) => requirement.id !== "company_profile")
  .map((requirement) => requirement.id);

function EmployerRegistration({ onBack }: EmployerRegistrationProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [industries, setIndustries] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [otherJobTypes, setOtherJobTypes] = useState("");
  const [files, setFiles] = useState<Partial<Record<EmployerDocumentType, File>>>({});
  const [jobAdFiles, setJobAdFiles] = useState<File[]>([]);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError("");
  };

  const toggleValue = (
    values: string[],
    value: string,
    setter: (next: string[]) => void,
  ) => {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
    setError("");
  };

  const getSelectedJobTypes = () => [
    ...jobTypes.filter((jobType) => jobType !== "Other"),
    ...(jobTypes.includes("Other")
      ? otherJobTypes
          .split(/[,\n]/)
          .map((jobType) => jobType.trim())
          .filter(Boolean)
      : []),
  ];

  const getTotalEmployeeCount = () =>
    Number(form.mabiniResidents || 0) + Number(form.nonMabiniResidents || 0);

  const validateDocuments = () => {
    for (const documentType of requiredUploadTypes) {
      if (!files[documentType]) {
        const label = employerDocumentRequirements.find(
          (requirement) => requirement.id === documentType,
        )?.label;
        setError(`Upload the required ${label || "registration document"}.`);
        return false;
      }
    }

    if (
      form.establishmentStatus === "New Registrant" &&
      !files.company_profile
    ) {
      setError("A Company Profile is required for new registrants.");
      return false;
    }

    if (jobAdFiles.length === 0) {
      setError("Upload at least one Job Vacancy Ad (PNG or JPG).");
      return false;
    }

    return true;
  };

  const continueToNextStep = () => {
    setError("");
    const formElement = document.getElementById(
      "employer-registration-form",
    ) as HTMLFormElement | null;
    if (!formElement?.reportValidity()) return;

    if (step === 1) {
      if (getTotalEmployeeCount() !== Number(form.totalEmployees)) {
        setError("Total employees must equal Mabini residents plus non-Mabini residents.");
        return;
      }
      if (industries.length === 0) {
        setError("Select at least one industry.");
        return;
      }
      if (industries.includes("Others") && !form.otherIndustry.trim()) {
        setError("Specify the other industry.");
        return;
      }
      if (jobTypes.length === 0) {
        setError("Select at least one job category.");
        return;
      }
      if (jobTypes.includes("Other") && !otherJobTypes.trim()) {
        setError("Specify the other job categories.");
        return;
      }
    }

    if (step === 3 && !validateDocuments()) return;

    setStep((current) => Math.min(current + 1, registrationSteps.length - 1));
  };

  const getFormAddress = () =>
    [form.houseStreet.trim(), form.barangay.trim(), form.city.trim()]
      .filter(Boolean)
      .join(", ");

  const uploadRegistrationDocuments = async (
    userId: string,
  ): Promise<void> => {
    const selectedFiles: {
      documentType: EmployerDocumentType;
      label: string;
      file: File;
    }[] = employerDocumentRequirements.flatMap((requirement) => {
      const file = files[requirement.id];
      return file ? [{
        documentType: requirement.id,
        label: requirement.label,
        file,
      }] : [];
    });

    selectedFiles.push(
      ...jobAdFiles.map((file, index) => ({
        documentType: "job_vacancy_ads" as const,
        label: `Job Vacancy Ad ${index + 1}`,
        file,
      })),
    );

    const uploadedPaths: string[] = [];
    const documents: EmployerVerificationDocument[] = [];

    try {
      for (const selected of selectedFiles) {
        const safeFileName = selected.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${userId}/${selected.documentType}/${crypto.randomUUID()}-${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from("employer-verification-documents")
          .upload(storagePath, selected.file, {
            cacheControl: "3600",
            contentType: getEmployerDocumentMimeType(selected.file),
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`${selected.label} upload failed: ${uploadError.message}`);
        }

        uploadedPaths.push(storagePath);
        documents.push({
          id: crypto.randomUUID(),
          document_type: selected.documentType,
          label: selected.label,
          file_name: selected.file.name,
          storage_path: storagePath,
          mime_type: getEmployerDocumentMimeType(selected.file),
          size: selected.file.size,
          status: "pending",
          uploaded_at: new Date().toISOString(),
        });
      }

      const { error: updateError } = await supabase
        .from("employer")
        .update({ verification_documents: documents })
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Could not save uploaded document records: ${updateError.message}`);
      }
    } catch (uploadError) {
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from("employer-verification-documents")
          .remove(uploadedPaths);
        if (cleanupError) {
          console.error("Could not remove incomplete registration uploads:", cleanupError);
        }
      }
      throw uploadError;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!privacyAccepted) {
      setError("Accept the certification and data privacy declaration to continue.");
      return;
    }
    if (!form.signature.trim()) {
      setError("Enter the authorized representative's electronic signature.");
      return;
    }
    if (!validateDocuments()) {
      setStep(3);
      return;
    }

    setLoading(true);
    const certificationDate = new Date().toISOString();
    const registrationDetails = {
      acronym: form.acronym.trim(),
      establishment_status: form.establishmentStatus,
      tin: form.tin.trim(),
      establishment_type:
        form.establishmentType === "Other"
          ? form.otherEstablishmentType.trim()
          : form.establishmentType,
      workforce: form.workforce,
      mabini_residents: Number(form.mabiniResidents),
      non_mabini_residents: Number(form.nonMabiniResidents),
      total_employees: Number(form.totalEmployees),
      industries: industries.map((industry) =>
        industry === "Others" ? form.otherIndustry.trim() : industry,
      ),
      hr_manager_name: form.managerName.trim(),
      hr_manager_position: form.managerPosition.trim(),
      hr_manager_contact: form.managerContact.trim(),
      hr_staff_name: form.staffName.trim(),
      hr_staff_position: form.staffPosition.trim(),
      address_house_street: form.houseStreet.trim(),
      address_barangay: form.barangay.trim(),
      address_city: form.city.trim(),
      telephone: form.telephone.trim(),
      mobile: form.mobile.trim(),
      facebook_page: form.facebookPage.trim(),
      website: form.website.trim(),
      job_posting_categories: getSelectedJobTypes(),
      remarks: form.remarks.trim(),
      certification: {
        declaration:
          "I hereby certify that the above information provided is true and correct to the best of my knowledge and I allow the Mabini PESO to include and use the Company profile in the PESO Employment Information System (PEIS). The information herein shall be treated as confidential in Compliance with the Data Privacy Act of 2012.",
        consent_accepted: true,
        consent_accepted_at: certificationDate,
        authorized_representative_signature: form.signature.trim(),
        certification_date: certificationDate,
      },
    };

    try {
      const email = form.email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            role: "employer",
            company_name: form.companyName.trim(),
            business_address: getFormAddress(),
            contact_person: form.managerName.trim(),
            contact_no: form.mobile.trim(),
            full_name: form.managerName.trim(),
            employer_registration_details: registrationDetails,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user?.id) {
        throw new Error(
          "Supabase did not return a user ID. Please check your email confirmation settings and try again.",
        );
      }

      let documentMessage =
        "Check your email to confirm your account. After signing in, open Verification Documents if any uploads need to be completed.";
      if (data.session) {
        try {
          await uploadRegistrationDocuments(data.user.id);
          documentMessage = "Your registration documents were uploaded and are pending PESO review.";
        } catch (uploadError) {
          console.error("Employer registered but document upload failed:", uploadError);
          documentMessage =
            `Your account was created, but documents could not be uploaded: ${
              uploadError instanceof Error ? uploadError.message : "Unexpected upload error."
            } Sign in and retry from Verification Documents.`;
        }
      }

      window.alert(`Employer registration submitted. ${documentMessage}`);
      navigate("/login", { replace: true });
    } catch (submitError) {
      console.error("Employer registration error:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit employer registration. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectDocument = (
    documentType: EmployerDocumentType,
    file: File | null,
    imagesOnly = false,
  ) => {
    if (!file) return;
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
    setError("");
    if (documentType === "job_vacancy_ads") {
      if (jobAdFiles.length >= maxJobAdFiles) {
        setError(`You can upload up to ${maxJobAdFiles} Job Vacancy Ads.`);
        return;
      }
      setJobAdFiles((current) => [...current, file]);
    } else {
      setFiles((current) => ({ ...current, [documentType]: file }));
    }
  };

  const progress = ((step + 1) / registrationSteps.length) * 100;
  const certificationDateLabel = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="whirl-page-background min-h-screen text-slate-800">
      <main className="grid min-h-screen lg:grid-cols-2">
        <AuthSideImage variant="register" />

        <section className="min-w-0 bg-white/85 px-5 py-7 backdrop-blur-sm sm:px-10 sm:py-9 lg:px-12 xl:px-16 2xl:px-20">
          <div className="mx-auto w-full max-w-[46rem]">
            <div className="mb-6">
              <PesoLogo
                size="sm"
                showName
                subtitle="Employer Portal"
                linkTo={null}
              />
            </div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Step {step + 1} of {registrationSteps.length}</span>
              <span>{registrationSteps[step].title}</span>
            </div>
            <div
              className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-label="Registration progress"
              aria-valuemin={1}
              aria-valuemax={registrationSteps.length}
              aria-valuenow={step + 1}
            >
              <div
                className="h-full rounded-full bg-[#0759AE] transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <nav aria-label="Employer registration progress" className="mb-6">
              <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {registrationSteps.map((registrationStep, index) => {
                  const isCurrent = index === step;
                  const isComplete = index < step;
                  return (
                    <li key={registrationStep.title}>
                      <button
                        type="button"
                        disabled={index > step || loading}
                        onClick={() => setStep(index)}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`flex w-full items-start gap-2 rounded-lg border p-2 text-left transition ${
                          isCurrent
                            ? "border-[#0759AE] bg-blue-50 text-[#123B70]"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 disabled:cursor-default"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isCurrent || isComplete
                              ? "border-[#0759AE] bg-[#0759AE] text-white"
                              : "border-slate-300 text-slate-500"
                          }`}
                        >
                          {isComplete ? <AppIcon name="check" className="h-4 w-4" /> : index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.68rem] font-bold sm:text-xs">
                            {registrationStep.title}
                          </span>
                          <span className="mt-0.5 hidden text-[0.65rem] leading-4 text-slate-500 md:block">
                            {registrationStep.detail}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <form
              id="employer-registration-form"
              onSubmit={(event) => void handleSubmit(event)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            >
              {error && (
                <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}

              {step === 0 && (
                <section aria-labelledby="establishment-heading">
                  <h1 id="establishment-heading" className="text-lg font-bold text-slate-900">
                    Establishment information
                  </h1>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                      Name of Establishment{requiredMark}
                      <input name="companyName" value={form.companyName} onChange={updateForm} required maxLength={200} autoComplete="organization" className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Acronym{requiredMark}
                      <input name="acronym" value={form.acronym} onChange={updateForm} required maxLength={40} className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Status{requiredMark}
                      <select name="establishmentStatus" value={form.establishmentStatus} onChange={updateForm} required className={fieldClassName}>
                        <option value="">Select status</option>
                        {establishmentStatuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Company TIN{requiredMark}
                      <input name="tin" value={form.tin} onChange={updateForm} required maxLength={30} autoComplete="off" className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Establishment Type{requiredMark}
                      <select name="establishmentType" value={form.establishmentType} onChange={updateForm} required className={fieldClassName}>
                        <option value="">Select establishment type</option>
                        {establishmentTypes.map((type) => <option key={type}>{type}</option>)}
                      </select>
                    </label>
                    {form.establishmentType === "Other" && (
                      <label className="text-sm font-semibold text-slate-700">
                        Specify establishment type{requiredMark}
                        <input name="otherEstablishmentType" value={form.otherEstablishmentType} onChange={updateForm} required className={fieldClassName} />
                      </label>
                    )}
                    <label className="text-sm font-semibold text-slate-700">
                      Workforce{requiredMark}
                      <select name="workforce" value={form.workforce} onChange={updateForm} required className={fieldClassName}>
                        <option value="">Select workforce size</option>
                        {workforceOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </label>
                  </div>
                </section>
              )}

              {step === 1 && (
                <section aria-labelledby="employment-heading">
                  <h1 id="employment-heading" className="text-lg font-bold text-slate-900">
                    Employment information
                  </h1>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <label className="text-sm font-semibold text-slate-700">
                      Mabini Residents{requiredMark}
                      <input type="number" min="0" step="1" name="mabiniResidents" value={form.mabiniResidents} onChange={updateForm} required className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Non-Mabini Residents{requiredMark}
                      <input type="number" min="0" step="1" name="nonMabiniResidents" value={form.nonMabiniResidents} onChange={updateForm} required className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Total Number of Employees{requiredMark}
                      <input type="number" min="0" step="1" name="totalEmployees" value={form.totalEmployees} onChange={updateForm} required className={fieldClassName} />
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        Should equal the sum of Mabini and non-Mabini residents ({getTotalEmployeeCount()}).
                      </span>
                    </label>
                  </div>
                  <fieldset className="mt-6">
                    <legend className="text-sm font-semibold text-slate-700">
                      Industry{requiredMark} <span className="font-normal text-slate-500">(select all that apply)</span>
                    </legend>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {industryOptions.map((industry) => (
                        <label key={industry} className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                          <input type="checkbox" checked={industries.includes(industry)} onChange={() => toggleValue(industries, industry, setIndustries)} className="mt-0.5 h-4 w-4 accent-[#0759AE]" />
                          {industry}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {industries.includes("Others") && (
                    <label className="mt-3 block text-sm font-semibold text-slate-700">
                      Specify other industry{requiredMark}
                      <input name="otherIndustry" value={form.otherIndustry} onChange={updateForm} required className={fieldClassName} />
                    </label>
                  )}
                  <fieldset className="mt-6">
                    <legend className="text-sm font-semibold text-slate-700">
                      Job posting categories{requiredMark} <span className="font-normal text-slate-500">(select all that apply)</span>
                    </legend>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {employerJobCategories.map((category) => (
                        <label key={category} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                          <input type="checkbox" checked={jobTypes.includes(category)} onChange={() => toggleValue(jobTypes, category, setJobTypes)} className="h-4 w-4 accent-[#0759AE]" />
                          {category}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {jobTypes.includes("Other") && (
                    <label className="mt-3 block text-sm font-semibold text-slate-700">
                      Specify other job categories{requiredMark}
                      <textarea value={otherJobTypes} onChange={(event) => setOtherJobTypes(event.target.value)} required rows={2} className={fieldClassName} />
                    </label>
                  )}
                </section>
              )}

              {step === 2 && (
                <section aria-labelledby="contact-heading">
                  <h1 id="contact-heading" className="text-lg font-bold text-slate-900">
                    Contact details
                  </h1>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <h2 className="text-sm font-bold text-[#123B70] sm:col-span-2">
                      HR / Recruitment / Operations Manager
                    </h2>
                    <label className="text-sm font-semibold text-slate-700">
                      Name{requiredMark}
                      <input name="managerName" value={form.managerName} onChange={updateForm} required autoComplete="name" className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Position{requiredMark}
                      <input name="managerPosition" value={form.managerPosition} onChange={updateForm} required className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                      Contact No.{requiredMark}
                      <input type="tel" name="managerContact" value={form.managerContact} onChange={updateForm} required autoComplete="tel" className={fieldClassName} />
                    </label>

                    <h2 className="mt-2 text-sm font-bold text-[#123B70] sm:col-span-2">
                      HR / Recruitment Staff
                    </h2>
                    <label className="text-sm font-semibold text-slate-700">
                      Name{requiredMark}
                      <input name="staffName" value={form.staffName} onChange={updateForm} required className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Position{requiredMark}
                      <input name="staffPosition" value={form.staffPosition} onChange={updateForm} required className={fieldClassName} />
                    </label>

                    <h2 className="mt-2 text-sm font-bold text-[#123B70] sm:col-span-2">
                      Office address
                    </h2>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                      House No. / Bldg. / Street{requiredMark}
                      <input name="houseStreet" value={form.houseStreet} onChange={updateForm} required autoComplete="street-address" className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Barangay{requiredMark}
                      <input name="barangay" value={form.barangay} onChange={updateForm} required className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      City / Municipality{requiredMark}
                      <input name="city" value={form.city} onChange={updateForm} required placeholder="Mabini, Batangas" className={fieldClassName} />
                    </label>

                    <h2 className="mt-2 text-sm font-bold text-[#123B70] sm:col-span-2">
                      Other contact information
                    </h2>
                    <label className="text-sm font-semibold text-slate-700">
                      Telephone No.{requiredMark}
                      <input type="tel" name="telephone" value={form.telephone} onChange={updateForm} required className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Mobile No.{requiredMark}
                      <input type="tel" name="mobile" value={form.mobile} onChange={updateForm} required autoComplete="tel" className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Facebook Page{requiredMark}
                      <input type="url" name="facebookPage" value={form.facebookPage} onChange={updateForm} required placeholder="https://facebook.com/..." className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Contact and account email{requiredMark}
                      <input type="email" name="email" value={form.email} onChange={updateForm} required autoComplete="email" className={fieldClassName} />
                    </label>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                      Company Website{requiredMark}
                      <input type="url" name="website" value={form.website} onChange={updateForm} required placeholder="https://example.com" className={fieldClassName} />
                    </label>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section aria-labelledby="documents-heading">
                  <h1 id="documents-heading" className="text-lg font-bold text-slate-900">
                    Requirements and document uploads
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Upload each applicable document for PESO review. Uploading a file does not mark a requirement as verified.
                    PDF, DOC, DOCX, JPG, or PNG; maximum 1 GB per file.
                  </p>
                  <div className="mt-5 space-y-3">
                    {employerDocumentRequirements.map((requirement) => {
                      const conditional = requirement.id === "company_profile";
                      if (conditional && form.establishmentStatus !== "New Registrant") return null;
                      return (
                        <label key={requirement.id} className="block rounded-xl border border-slate-200 p-4 text-sm">
                          <span className="font-semibold text-slate-800">
                            {requirement.label}
                            {!conditional && requiredMark}
                            {conditional && <span className="ml-1 text-xs font-normal text-slate-500">(required for new registrants)</span>}
                          </span>
                          <input
                            type="file"
                            accept={requirement.accept}
                            onChange={(event) => {
                              selectDocument(requirement.id, event.target.files?.[0] ?? null);
                              event.currentTarget.value = "";
                            }}
                            className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-[#0759AE]"
                          />
                          {files[requirement.id] && (
                            <span className="mt-2 block break-all text-xs text-emerald-700">
                              Selected: {files[requirement.id]?.name}
                            </span>
                          )}
                        </label>
                      );
                    })}
                    <div className="rounded-xl border border-slate-200 p-4 text-sm">
                      <label className="font-semibold text-slate-800">
                        Job Vacancy Ads{requiredMark}
                        <span className="ml-1 text-xs font-normal text-slate-500">(PNG or JPG; up to 10 files)</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                          multiple
                          onChange={(event) => {
                            const selected = Array.from(event.target.files ?? []);
                            event.currentTarget.value = "";
                            for (const file of selected) {
                              selectDocument("job_vacancy_ads", file, true);
                            }
                          }}
                          className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-[#0759AE]"
                        />
                      </label>
                      {jobAdFiles.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-slate-600">
                          {jobAdFiles.map((file, index) => (
                            <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                              <span className="truncate">{file.name}</span>
                              <button type="button" onClick={() => setJobAdFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="shrink-0 font-semibold text-red-700">
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
                    <h2 className="font-bold text-[#123B70]">Applicable license</h2>
                    <ul className="mt-2 list-inside list-disc text-xs">
                      <li>DOLE Registry of Establishment (Direct Companies)</li>
                      <li>D.O. 174 Certificate of Registration (Local Manpower)</li>
                      <li>DMW Licensed (Overseas Manpower)</li>
                      <li>CDA Membership (Cooperative)</li>
                    </ul>
                    <p className="mt-2 text-xs">
                      The license upload above accepts one applicable license. Additional supporting documents may be submitted later in Verification Documents.
                    </p>
                  </div>
                </section>
              )}

              {step === 4 && (
                <section aria-labelledby="certification-heading">
                  <h1 id="certification-heading" className="text-lg font-bold text-slate-900">
                    Certification and account setup
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the registration and set the email and password used to sign in.
                  </p>
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                      <p><span className="font-semibold">Establishment:</span> {form.companyName} ({form.acronym})</p>
                      <p><span className="font-semibold">Status:</span> {form.establishmentStatus}</p>
                      <p><span className="font-semibold">Employees:</span> {form.totalEmployees}</p>
                      <p className="sm:col-span-2"><span className="font-semibold">Industries:</span> {industries.map((industry) => industry === "Others" ? form.otherIndustry : industry).join(", ")}</p>
                      <p className="sm:col-span-2"><span className="font-semibold">Office address:</span> {getFormAddress()}</p>
                      <p><span className="font-semibold">HR Manager:</span> {form.managerName}, {form.managerPosition}</p>
                      <p><span className="font-semibold">HR Staff:</span> {form.staffName}, {form.staffPosition}</p>
                      <p><span className="font-semibold">Contact/account email:</span> {form.email}</p>
                      <p><span className="font-semibold">Documents selected:</span> {Object.values(files).filter(Boolean).length + jobAdFiles.length}</p>
                    </div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Remarks <span className="font-normal text-slate-500">(optional)</span>
                      <textarea name="remarks" value={form.remarks} onChange={updateForm} rows={3} maxLength={2000} className={fieldClassName} />
                    </label>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
                      <h2 className="font-bold text-[#123B70]">Certification and consent</h2>
                      <p className="mt-2">
                        I hereby certify that the above information provided is true and correct to the best of my knowledge and I allow the Mabini PESO to include and use the Company profile in the PESO Employment Information System (PEIS). The information herein shall be treated as confidential in Compliance with the Data Privacy Act of 2012.
                      </p>
                      <p className="mt-2 text-xs text-slate-500">Certification date: {certificationDateLabel} (generated on submission)</p>
                    </div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Authorized Representative's Electronic Signature{requiredMark}
                      <input name="signature" value={form.signature} onChange={updateForm} required autoComplete="name" placeholder="Type your full legal name" className={fieldClassName} />
                    </label>
                    <label className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                      <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} required className="mt-1 h-4 w-4 shrink-0 accent-[#0759AE]" />
                      <span>I certify that the information is true and correct and consent to the declaration above.{requiredMark}</span>
                    </label>
                    <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Account email{requiredMark}
                        <input type="email" name="email" value={form.email} onChange={updateForm} required autoComplete="email" className={fieldClassName} />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Password{requiredMark}
                        <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={updateForm} required minLength={8} autoComplete="new-password" className={fieldClassName} />
                      </label>
                      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                        Confirm password{requiredMark}
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={updateForm} required minLength={8} autoComplete="new-password" className={`${fieldClassName} pr-20`} />
                          <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#0759AE]">
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </label>
                    </div>
                  </div>
                </section>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => step === 0 ? onBack() : setStep((current) => current - 1)}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <AppIcon name="arrowLeft" className="mr-1 inline h-4 w-4" />
                  {step === 0 ? "Back to account type" : "Back"}
                </button>
                {step < registrationSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={continueToNextStep}
                    disabled={loading}
                    className="rounded-full bg-[#0759AE] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:opacity-60"
                  >
                    Continue <AppIcon name="arrowRight" className="ml-1 inline h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !privacyAccepted}
                    className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Submitting..." : "Create Account & Submit"}
                  </button>
                )}
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 lg:hidden">
              Already have an employer account?{" "}
              <Link to="/login" className="font-semibold text-[#0759AE] underline">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EmployerRegistration;
