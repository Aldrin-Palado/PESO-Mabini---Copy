import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import EmployerRegistration from "./EmployerRegistration";
import PesoLogo from "./PesoLogo";
import { supabase } from "../services/supabase";

type RegistrationDetails = {
  middleName: string;
  dateOfBirth: string;
  sex: string;
  permanentAddress: string;
  civilStatus: string;
  fatherName: string;
  motherName: string;
  parentsCivilStatus: string;
  governmentIdType: string;
  governmentIdNumber: string;
  heightCm: string;
  weightKg: string;
  disability: string;
  employmentStatus: string;
  unemploymentDurationMonths: string;
  unemploymentReason: string;
  isOfw: string;
  isFormerOfw: string;
  is4PsBeneficiary: string;
  preferredOccupation: string;
  companyApplyingFor: string;
  preferredWorkLocation: string;
  otherWorkLocation: string;
  languages: string[];
  otherLanguage: string;
  educationLevel: string;
  elementaryEducation: string;
  secondaryEducation: string;
  tertiaryEducation: string;
  graduateStudies: string;
  undergraduateLevel: string;
  training1: string;
  training2: string;
  training3: string;
  eligibility1: string;
  eligibility2: string;
  workExperience1: string;
  workExperience2: string;
  workExperience3: string;
  noWorkExperience: boolean;
  otherSkills: string;
  spesGipHistory: string;
  engagementPeriod: string;
  spesGipId: string;
  signature: string;
  signatureDate: string;
};

const fieldClassName =
  "w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10";

function Register() {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState("jobseeker");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [details, setDetails] = useState<RegistrationDetails>({
    middleName: "",
    dateOfBirth: "",
    sex: "",
    permanentAddress: "",
    civilStatus: "",
    fatherName: "",
    motherName: "",
    parentsCivilStatus: "",
    governmentIdType: "",
    governmentIdNumber: "",
    heightCm: "",
    weightKg: "",
    disability: "",
    employmentStatus: "",
    unemploymentDurationMonths: "",
    unemploymentReason: "",
    isOfw: "",
    isFormerOfw: "",
    is4PsBeneficiary: "",
    preferredOccupation: "",
    companyApplyingFor: "",
    preferredWorkLocation: "",
    otherWorkLocation: "",
    languages: [],
    otherLanguage: "",
    educationLevel: "",
    elementaryEducation: "",
    secondaryEducation: "",
    tertiaryEducation: "",
    graduateStudies: "",
    undergraduateLevel: "",
    training1: "",
    training2: "",
    training3: "",
    eligibility1: "",
    eligibility2: "",
    workExperience1: "",
    workExperience2: "",
    workExperience3: "",
    noWorkExperience: false,
    otherSkills: "",
    spesGipHistory: "",
    engagementPeriod: "",
    spesGipId: "",
    signature: "",
    signatureDate: new Date().toISOString().slice(0, 10),
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const updateDetail = <K extends keyof RegistrationDetails>(
    key: K,
    value: RegistrationDetails[K],
  ) => {
    setDetails((previous) => ({ ...previous, [key]: value }));
  };

  const textField = (
    key: keyof RegistrationDetails,
    label: string,
    options: {
      required?: boolean;
      type?: "text" | "number" | "date";
      min?: string;
      max?: string;
      placeholder?: string;
    } = {},
  ) => (
    <label key={key} className="block text-sm font-medium text-slate-800">
      {label}{options.required && <span className="text-red-600"> *</span>}
      <input
        type={options.type ?? "text"}
        value={String(details[key])}
        onChange={(event) => updateDetail(key, event.target.value)}
        required={options.required}
        min={options.min}
        max={options.max}
        step={options.type === "number" ? "any" : undefined}
        placeholder={options.placeholder ?? "Enter your answer"}
        className={`${fieldClassName} mt-2`}
      />
    </label>
  );

  const selectField = (
    key: keyof RegistrationDetails,
    label: string,
    options: string[],
    required = false,
  ) => (
    <label key={key} className="block text-sm font-medium text-slate-800">
      {label}{required && <span className="text-red-600"> *</span>}
      <select
        value={String(details[key])}
        onChange={(event) => updateDetail(key, event.target.value)}
        required={required}
        className={`${fieldClassName} mt-2`}
      >
        <option value="">Choose</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );

  const sectionClassName =
    "space-y-5 rounded-2xl border border-[#D5DEEB] bg-white p-5 sm:p-6";
  const sectionHeadingClassName =
    "border-b border-slate-100 pb-3 text-lg font-bold text-[#123B70]";

  if (accountType === "employer") {
    return <EmployerRegistration onBack={() => setAccountType("jobseeker")} />;
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      alert("Password must contain at least 8 characters.");
      return;
    }

    if (!formData.contactNumber.trim()) {
      alert("Please enter your contact number.");
      return;
    }

    if (!formData.address.trim()) {
      alert("Please enter your address.");
      return;
    }

    if (details.languages.length === 0 && !details.otherLanguage.trim()) {
      alert("Select at least one language or enter a language under Other.");
      return;
    }

    if (!resumeFile) {
      alert("Please upload your resume.");
      return;
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      alert("Resume must not exceed 5 MB.");
      return;
    }

    const allowedExtensions = ["pdf", "doc", "docx"];
    const fileExtension = resumeFile.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      alert("Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    setLoading(true);

    let uploadedResumePath: string | null = null;

    try {
      const email = formData.email.trim().toLowerCase();
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      const middleName = details.middleName.trim();
      const fullName = `${firstName} ${middleName} ${lastName}`
        .replace(/\s+/g, " ")
        .trim();
      const registrationDetails = {
        ...details,
        middleName,
        dateOfBirth: details.dateOfBirth || null,
        contactNumber: formData.contactNumber.trim(),
        email,
        presentAddress: formData.address.trim(),
        permanentAddress: details.permanentAddress.trim(),
        preferredWorkLocation:
          details.preferredWorkLocation === "Other"
            ? details.otherWorkLocation.trim()
            : details.preferredWorkLocation,
        privacyConsent,
        privacyConsentAt: new Date().toISOString(),
      };

      // STEP 1: Create the Supabase Auth account.
      // The database trigger creates the initial job_seeker profile.
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            role: "jobseeker",
            contact_no: formData.contactNumber.trim(),
            address: formData.address.trim(),
            birth_date: details.dateOfBirth || null,
            registration_details: registrationDetails,
          },
        },
      });

      if (error) {
        console.error("Supabase Auth registration error:", error);
        alert(`Registration failed: ${error.message}`);
        return;
      }

      if (!data.user) {
        alert("Supabase did not return a user account. Please try again.");
        return;
      }

      if (!data.session) {
        alert(
          "Your account was created. Confirm your email and sign in, then upload your resume from My Profile.",
        );
        navigate("/login");
        return;
      }

      const userId = data.user.id;

      // STEP 2: Upload the resume to the private `resumes` bucket.
      const safeExtension = fileExtension;
      const resumePath = `${userId}/${Date.now()}.${safeExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("Resume Files")
        .upload(resumePath, resumeFile, {
          upsert: false,
          contentType: resumeFile.type || undefined,
        });

      if (uploadError) {
        console.error("Resume upload error:", uploadError);
        alert(
          `Your account was created, but the resume could not be uploaded: ${uploadError.message}. Sign in and upload it from My Profile.`,
        );
        navigate("/login");
        return;
      }

      uploadedResumePath = resumePath;

      // STEP 3: Update the profile created by the auth.users trigger.
      // Do not INSERT another job_seeker record.
      const { error: profileError } = await supabase
        .from("job_seeker")
        .update({
          contact_no: formData.contactNumber.trim(),
          address: formData.address.trim(),
          birth_date: details.dateOfBirth || null,
          registration_details: registrationDetails,
          resume_url: resumePath,
        })
        .eq("user_id", userId);

      if (profileError) {
        const missingRegistrationDetailsColumn =
          profileError.code === "PGRST204" &&
          profileError.message.includes("registration_details") &&
          profileError.message.toLowerCase().includes("schema cache");

        if (!missingRegistrationDetailsColumn) {
          console.error("Job seeker profile update error:", profileError);
          alert(
            `Account and resume were created, but your profile could not be updated: ${profileError.message}. Please contact the administrator.`,
          );
          return;
        }

        console.warn(
          "The registration_details column is not available yet. Retrying with existing profile fields; submitted registration details remain in the Auth user metadata.",
        );

        const { error: fallbackProfileError } = await supabase
          .from("job_seeker")
          .update({
            contact_no: formData.contactNumber.trim(),
            address: formData.address.trim(),
            birth_date: details.dateOfBirth || null,
            resume_url: resumePath,
          })
          .eq("user_id", userId);

        if (fallbackProfileError) {
          console.error(
            "Job seeker profile fallback update error:",
            fallbackProfileError,
          );
          alert(
            `Your account and resume were created, but your profile could not be updated: ${fallbackProfileError.message}. Your submitted details are retained with your account. Please contact the administrator.`,
          );
          return;
        }

        alert(
          "Your account and resume were created. Your registration details are saved with your account, but the profile database update is still needed. Please ask the administrator to apply the registration-details migration, then log in.",
        );
        navigate("/login");
        return;
      }

      alert(
        "Account created successfully! Please check your email to confirm your account, then log in.",
      );
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred.";
      alert(
        `Something went wrong while creating your account.\n\nReason: ${errorMessage}`,
      );

      // If profile setup failed after the upload, leave the uploaded file in
      // Storage for recovery instead of deleting a potentially needed resume.
      if (uploadedResumePath) {
        console.warn("Resume remains in Storage at:", uploadedResumePath);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="whirl-page-background min-h-screen">
      <main className="grid min-h-screen lg:grid-cols-2">
        <AuthSideImage variant="register" />

        <section className="flex flex-col justify-center bg-white/85 px-5 py-9 backdrop-blur-sm sm:px-10 lg:min-h-screen lg:px-12 xl:px-16 2xl:px-20">
          <div className="mx-auto w-full max-w-[38rem]">
            {/* Header */}
            <div className="mb-8">
              <PesoLogo
                size="sm"
                showName
                subtitle="Registration"
                linkTo={null}
                className="mb-6"
              />
              <p className="text-sm font-semibold text-[#3156A2]">
                Join your local employment network              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#102A4C] sm:text-4xl">
                Create your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Join PESO MABINI and access employment services in Mabini.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Account Type */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Choose your account type
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Job Seeker */}
                  <button
                    type="button"
                    aria-pressed={accountType === "jobseeker"}
                    onClick={() => setAccountType("jobseeker")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      accountType === "jobseeker"
                        ? "border-[#315FEA] bg-[#EEF3FF] shadow-sm ring-2 ring-[#315FEA]/10"
                        : "border-[#D5DEEB] bg-white hover:border-[#315FEA]/50 hover:bg-blue-50/40"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold tracking-wide ${
                        accountType === "jobseeker"
                          ? "bg-[#315FEA] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      JS
                    </div>
                    <h3 className="font-bold text-[#102A4C]">Job Seeker</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Find jobs and submit applications
                    </p>
                  </button>

                  {/* Employer */}
                  <button
                    type="button"
                    aria-pressed={accountType === "employer"}
                    onClick={() => setAccountType("employer")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      accountType === "employer"
                        ? "border-[#315FEA] bg-[#EEF3FF] shadow-sm ring-2 ring-[#315FEA]/10"
                        : "border-[#D5DEEB] bg-white hover:border-[#315FEA]/50 hover:bg-blue-50/40"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold tracking-wide ${
                        accountType === "employer"
                          ? "bg-[#315FEA] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      EMP
                    </div>
                    <h3 className="font-bold text-[#102A4C]">Employer</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Post vacancies and find applicants
                    </p>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Surname <span className="text-red-600">*</span>
                  </label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter surname" required className={fieldClassName} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    First Name <span className="text-red-600">*</span>
                  </label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" required className={fieldClassName} />
                </div>
                {textField("middleName", "Middle Name", { required: true })}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Email address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                />
              </div>

              {/* Job Seeker registration details and resume */}
              {accountType === "jobseeker" && (
                <>
                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>I. Personal Information</h3>
                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      <h4 className="font-bold text-slate-900">Data Privacy Statement / Consent</h4>
                      <p>
                        The Public Employment Service Office (PESO) of the Municipality of Mabini, Batangas recognizes its responsibilities under Republic Act No. 10173, the Data Privacy Act of 2012. Information collected in this form will be stored in the office&apos;s authorized information system, accessed only by authorized PESO Mabini personnel, and protected using appropriate organizational, technical, and physical safeguards.
                      </p>
                      <p>The information will be used for job application and referral services, reporting to the Department of Labor and Employment (DOLE), and Labor Market Information (LMI) data collection. PESO Mabini will not disclose personal information without consent and may retain it for up to ten years for LMI purposes.</p>
                      <label className="flex items-start gap-3 rounded-lg bg-white p-3 font-medium">
                        <input
                          type="checkbox"
                          checked={privacyConsent}
                          onChange={(event) => setPrivacyConsent(event.target.checked)}
                          required
                          className="mt-1 h-4 w-4 accent-[#315FEA]"
                        />
                        <span>I have read and agree to the Data Privacy Statement and consent to the collection, use, storage, and processing of my information for the purposes stated above. <span className="text-red-600">*</span></span>
                      </label>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      {textField("dateOfBirth", "Date of Birth", { type: "date", required: true })}
                      {selectField("sex", "Sex", ["Female", "Male", "Prefer not to say"], true)}
                      <label className="block text-sm font-medium text-slate-800">
                        Contact Number <span className="text-red-600">*</span>
                        <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Enter contact number" required className={`${fieldClassName} mt-2`} />
                      </label>
                      <label className="block text-sm font-medium text-slate-800">
                        Present Address <span className="text-red-600">*</span>
                        <textarea name="address" value={formData.address} onChange={(event) => setFormData((previous) => ({ ...previous, address: event.target.value }))} placeholder="House/Unit, street, barangay, municipality, province" required rows={2} className={`${fieldClassName} mt-2`} />
                      </label>
                      {textField("permanentAddress", "Permanent Address", { required: true })}
                      {selectField("civilStatus", "Civil Status", ["Single", "Married", "Widowed", "Separated", "Annulled", "Others"], true)}
                      {textField("fatherName", "Father's Name", { required: true })}
                      {textField("motherName", "Mother's Name", { required: true })}
                      {selectField("parentsCivilStatus", "Parents' Civil Status", ["Single", "Married", "Widowed", "Separated", "Annulled", "Others"], true)}
                      {selectField("governmentIdType", "Type of Government ID", ["Philippine Identification (PhilID)", "SSS", "GSIS", "UMID", "Driver's License", "Passport", "Voter's ID", "PRC ID", "PhilHealth", "Postal ID", "Other"], true)}
                      {textField("governmentIdNumber", "Government ID Number", { required: true })}
                      {textField("heightCm", "Height (cm)", { type: "number", min: "1", required: true })}
                      {textField("weightKg", "Weight (kg)", { type: "number", min: "1", required: true })}
                      {selectField("disability", "Disability", ["Visual", "Hearing", "Speech", "Physical", "Mental", "Other", "N/A"], true)}
                    </div>
                  </section>

                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>II. Employment Information</h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {selectField("employmentStatus", "Employment Status", ["Employed", "Wage Employed", "Self-employed", "Fisherman/Fisherfolk", "Vendor/Retailer", "Home-based Worker", "Transport", "Domestic Worker", "Freelancer", "Artisan/Craft Worker", "Unemployed", "N/A"], true)}
                      {(details.employmentStatus === "Unemployed" || details.employmentStatus === "N/A") && (
                        <>
                          {textField("unemploymentDurationMonths", "How long have you been looking for work? (months)", { type: "number", min: "0", required: true })}
                          {selectField("unemploymentReason", "Reason for unemployment", ["New entrant/Fresh graduate", "Finished contract", "Resigned", "Retired", "Terminated/Laid off due to calamity", "Terminated/Laid off (local)", "Terminated/Laid off (abroad)", "Other"], true)}
                        </>
                      )}
                      {selectField("isOfw", "Are you an OFW?", ["Yes", "No"], true)}
                      {selectField("isFormerOfw", "Are you a former OFW?", ["Yes", "No"], true)}
                      {selectField("is4PsBeneficiary", "Are you a 4Ps beneficiary?", ["Yes", "No"], true)}
                      {textField("preferredOccupation", "Preferred Occupation", { required: true })}
                      {textField("companyApplyingFor", "Company Applying For (as posted on PESO Mabini FB page)", { required: true })}
                      {selectField("preferredWorkLocation", "Preferred Work Location", ["Mabini", "Batangas Province", "Anywhere in the Philippines", "Other"], true)}
                      {details.preferredWorkLocation === "Other" && textField("otherWorkLocation", "Specify Preferred Work Location", { required: true })}
                    </div>
                  </section>

                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>III. Language / Dialect Proficiency</h3>
                    <fieldset>
                      <legend className="mb-3 text-sm font-medium text-slate-800">
                        Select all languages you can use <span className="text-red-600">*</span>
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {["Filipino", "English", "Mandarin"].map((language) => (
                          <label key={language} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                            <input
                              type="checkbox"
                              checked={details.languages.includes(language)}
                              onChange={(event) => updateDetail(
                                "languages",
                                event.target.checked
                                  ? [...details.languages, language]
                                  : details.languages.filter((item) => item !== language),
                              )}
                              className="h-4 w-4 accent-[#315FEA]"
                            />
                            {language}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    {textField("otherLanguage", "Other Language / Dialect")}
                    {details.languages.length === 0 && (
                      <p className="text-xs text-slate-500">Choose at least one language or enter one under Other.</p>
                    )}
                  </section>

                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>IV. Educational Background</h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {selectField("educationLevel", "Highest Educational Attainment", ["Elementary", "High School", "Senior High School", "Technical/Vocational", "College", "Postgraduate", "Undergraduate", "No formal education"], true)}
                      {textField("elementaryEducation", "Elementary (school / year graduated)", { required: true })}
                      {textField("secondaryEducation", "Secondary (school / K-12 / strand / year graduated)", { required: true })}
                      {textField("tertiaryEducation", "Tertiary (university / course / year graduated)", { required: true })}
                      {textField("graduateStudies", "Graduate Studies / Postgraduate (university / degree / year graduated)")}
                      {textField("undergraduateLevel", "If undergraduate (level reached / year last attended)")}
                    </div>
                  </section>

                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>V. Technical / Vocational and Other Training</h3>
                    <p className="text-sm text-slate-600">Include course, hours, training institution, skills acquired, and certificate received. Enter N/A if none.</p>
                    <div className="grid gap-5">
                      {textField("training1", "Training / Course 1", { required: true })}
                      {textField("training2", "Training / Course 2", { required: true })}
                      {textField("training3", "Training / Course 3", { required: true })}
                    </div>
                  </section>

                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>VI. Eligibility / Professional License</h3>
                    <p className="text-sm text-slate-600">Enter eligibility or license, date taken, and validity date. Enter N/A if none.</p>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {textField("eligibility1", "Eligibility / Professional License 1", { required: true })}
                      {textField("eligibility2", "Eligibility / Professional License 2", { required: true })}
                    </div>
                  </section>

                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>VII. Work Experience</h3>
                    <p className="text-sm text-slate-600">List work experience within the last 10 years, starting with the most recent. Include company/address, position, months, and employment status.</p>
                    <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                      <input type="checkbox" checked={details.noWorkExperience} onChange={(event) => updateDetail("noWorkExperience", event.target.checked)} className="mt-1 h-4 w-4 accent-[#315FEA]" />
                      I have no previous work experience.
                    </label>
                    {!details.noWorkExperience && (
                      <div className="grid gap-5">
                        {textField("workExperience1", "Most Recent Work Experience", { required: true })}
                        {textField("workExperience2", "Previous Work Experience 2")}
                        {textField("workExperience3", "Previous Work Experience 3")}
                      </div>
                    )}
                  </section>

                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>VIII. Other Skills Acquired Without Certificate</h3>
                    {textField("otherSkills", "Other Skills", { required: true })}
                  </section>

                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>IX. History of SPES / GIP Engagement</h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {selectField("spesGipHistory", "Have you participated in SPES / GIP?", ["Yes", "No"], true)}
                      {textField("engagementPeriod", "Period of Engagement (mm/yyyy)", { required: details.spesGipHistory === "Yes" })}
                      {textField("spesGipId", "SPES / GIP ID Number", { required: details.spesGipHistory === "Yes" })}
                    </div>
                  </section>

                  <section className={sectionClassName}>
                    <h3 className={sectionHeadingClassName}>Certification / Authorization</h3>
                    <p className="text-sm leading-6 text-slate-700">
                      I certify that the information I provided is true and correct to the best of my knowledge. I authorize PESO Mabini to include my profile in its employment information system and use my personal information for employment facilitation in accordance with Republic Act No. 10173. I understand that DOLE/PESO is not obligated to seek employment on my behalf.
                    </p>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {textField("signature", "Signature (type your full name)", { required: true })}
                      {textField("signatureDate", "Date Signed", { type: "date", required: true })}
                    </div>
                  </section>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      Upload Resume
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      required
                      onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#315FEA] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#244FD4]"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Accepted formats: PDF, DOC, DOCX. Maximum file size: 5 MB.
                    </p>
                    {resumeFile && (
                      <p className="mt-2 text-sm font-medium text-green-600">
                        Selected: {resumeFile.name}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-[#315FEA]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-[#315FEA]"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#315FEA] focus:ring-[#315FEA]"
                />
                <p className="text-sm text-slate-500">
                  I agree to the PESO MABINI terms and conditions and understand that
                  my information will be used for employment services.
                </p>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(49,95,234,0.75)] transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-7 pt-2 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#315FEA] underline decoration-[#315FEA]/40 underline-offset-4 transition hover:text-[#123B70]"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Your information is protected and used only to provide employment
              services.
            </p>

            <Link
              to="/"
              className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-[#D5DEEB] bg-white px-6 py-3 text-sm font-semibold text-[#3156A2] shadow-sm transition hover:border-[#315FEA]/40 hover:text-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA]"
            >
              <AppIcon name="arrowLeft" className="h-4 w-4" />
              Return to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Register;
import AppIcon from "./AppIcon";
