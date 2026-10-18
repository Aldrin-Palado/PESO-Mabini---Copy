import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import AuthSideImage from "./AuthSideImage";

type EmployerRegistrationProps = {
  onBack: () => void;
};

const registrationSteps = [
  {
    title: "Company & Account",
    detail: "Enter company, representative, and sign-in details.",
  },
  {
    title: "Job Posting Info",
    detail: "Choose the kinds of positions your company expects to post.",
  },
  {
    title: "Privacy & Preferences",
    detail: "Add a contact number and review the data privacy notice.",
  },
  {
    title: "Review & Submit",
    detail: "Check your details, confirm the notice, and submit.",
  },
];

const jobCategories = [
  "Administrative and clerical",
  "Agriculture and fisheries",
  "Customer service and sales",
  "Hospitality and food service",
  "Manufacturing and production",
  "Professional and technical",
  "Other",
];

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-[#D5DEEB] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-2 focus:ring-[#315FEA]/10";

function EmployerRegistration({ onBack }: EmployerRegistrationProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [otherJobTypes, setOtherJobTypes] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    businessAddress: "",
    contactPerson: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
  });

  const updateForm = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const toggleJobType = (jobType: string) => {
    setJobTypes((current) =>
      current.includes(jobType)
        ? current.filter((type) => type !== jobType)
        : [...current, jobType],
    );
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

  const continueToNextStep = () => {
    const formElement = document.getElementById(
      "employer-registration-form",
    ) as HTMLFormElement | null;

    if (!formElement?.reportValidity()) return;

    if (step === 0) {
      if (form.password.length < 8) {
        alert("Password must contain at least 8 characters.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
    }

    if (step === 1 && jobTypes.length === 0) {
      alert("Select at least one type of job your company may post.");
      return;
    }
    if (step === 1 && jobTypes.includes("Other") && !otherJobTypes.trim()) {
      alert("List the other job types your company needs.");
      return;
    }

    setStep((current) => Math.min(current + 1, registrationSteps.length - 1));
  };

  const navigateToStep = (targetStep: number) => {
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }

    for (let index = step; index < targetStep; index += 1) {
      if (index === 0) {
        const requiredAccountDetails = [
          form.companyName,
          form.businessAddress,
          form.contactPerson,
          form.email,
          form.password,
          form.confirmPassword,
        ];
        const emailInput = document.createElement("input");
        emailInput.type = "email";
        emailInput.value = form.email.trim();

        if (
          requiredAccountDetails.some((value) => !value.trim()) ||
          !emailInput.checkValidity()
        ) {
          alert("Complete the required company, representative, and account details before continuing.");
          setStep(0);
          return;
        }
        if (form.password.length < 8) {
          alert("Password must contain at least 8 characters.");
          setStep(0);
          return;
        }
        if (form.password !== form.confirmPassword) {
          alert("Passwords do not match.");
          setStep(0);
          return;
        }
      }

      if (index === 1 && jobTypes.length === 0) {
        alert("Select at least one type of job your company may post.");
        setStep(1);
        return;
      }
      if (index === 1 && jobTypes.includes("Other") && !otherJobTypes.trim()) {
        alert("List the other job types your company needs.");
        setStep(1);
        return;
      }
      if (index === 2 && !form.contactNumber.trim()) {
        alert("Enter a company contact number before continuing.");
        setStep(2);
        return;
      }
    }

    setStep(targetStep);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      setStep(0);
      return;
    }
    if (!privacyAccepted) {
      alert("Please accept the data privacy notice to continue.");
      return;
    }

    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();
      const contactPerson = form.contactPerson.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            role: "employer",
            company_name: form.companyName.trim(),
            contact_person: contactPerson,
            job_posting_categories: getSelectedJobTypes(),
          },
        },
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) {
        throw new Error(
          "Supabase did not return a user ID. Please check your email confirmation settings and try again.",
        );
      }

      const { error: profileError } = await supabase
        .from("employer")
        .insert({
          user_id: userId,
          name: form.companyName.trim(),
          address: form.businessAddress.trim(),
          contact_person: contactPerson,
          contact_no: form.contactNumber.trim(),
          email,
        });

      if (profileError) {
        console.error("Employer profile creation error:", profileError);
        throw new Error(
          `Your login was created, but we couldn't save the company profile: ${profileError.message}`,
        );
      }

      alert(
        "Employer registration submitted. Please check your email to confirm your account. PESO Mabini will review your company details before verification.",
      );
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Employer registration error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to submit employer registration. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / registrationSteps.length) * 100;

  return (
    <div className="min-h-screen bg-[#F3F6FB] text-slate-800">
      <main className="grid min-h-screen lg:grid-cols-2">
        <AuthSideImage variant="register" />

        <section className="min-w-0 bg-[#F3F6FB] px-5 py-7 sm:px-10 sm:py-9 lg:px-12 xl:px-16 2xl:px-20">
          <div className="mx-auto w-full max-w-[38rem]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="inline-flex items-center rounded-full border border-[#D5DEEB] bg-white px-4 py-2 text-sm font-semibold text-[#3156A2] transition hover:border-[#315FEA] hover:bg-[#EEF3FF] hover:text-[#102A4C] disabled:opacity-60"
              >
                ← Change account type
              </button>
              <Link
                to="/"
                className="inline-flex items-center rounded-full border border-[#D5DEEB] bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#315FEA] hover:bg-[#EEF3FF] hover:text-[#3156A2]"
              >
                Back to home
              </Link>
            </div>

            <header className="mb-6">
              <p className="text-sm font-semibold text-[#3156A2]">
                PESO Mabini Employer Portal
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102A4C] sm:text-4xl">
                Employer registration
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Provide your company details to connect with local job seekers.
                PESO Mabini will review your account.
              </p>
            </header>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950">
            <p className="font-bold">Employer verification requirements</p>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              You may upload these documents later, or PESO Mabini may request
              them before your account is marked as verified:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-900">
              <li>DTI or SEC business registration</li>
              <li>Mayor&apos;s / Business Permit</li>
              <li>(Optional) BIR Certificate of Registration (Form 2303)</li>
              <li>Valid government ID of the owner / authorized representative</li>
              <li>Authorization letter, if the representative is not the owner</li>
            </ul>
          </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
              <span>Step {step + 1} of 4</span>
              <span>{registrationSteps[step].title}</span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-label="Registration progress"
              aria-valuemin={1}
              aria-valuemax={4}
              aria-valuenow={step + 1}
            >
              <div
                className="h-full rounded-full bg-[#315FEA] transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <nav aria-label="Employer registration steps" className="mt-4">
              <ol className="grid w-full grid-cols-4 justify-items-center">
                {registrationSteps.map((registrationStep, index) => {
                  const isCurrent = index === step;
                  const isComplete = index < step;

                  return (
                    <li key={registrationStep.title} className="w-full">
                      <button
                        type="button"
                        onClick={() => navigateToStep(index)}
                        disabled={loading}
                        aria-current={isCurrent ? "step" : undefined}
                        title={`${registrationStep.title}: ${registrationStep.detail}`}
                        aria-label={`Step ${index + 1}: ${registrationStep.title}. ${registrationStep.detail}. ${
                          isCurrent
                            ? "Current step."
                            : isComplete
                              ? "Completed. Select to go back."
                              : "Not started. Select to go to this step; required earlier steps will be checked."
                        }`}
                        className={`flex w-full flex-col items-center gap-2 rounded-xl p-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315FEA] focus-visible:ring-offset-2 ${
                          isCurrent
                            ? "bg-[#EEF3FF] ring-1 ring-[#315FEA]/20"
                            : isComplete
                              ? "hover:bg-[#EEF3FF]"
                              : "cursor-pointer hover:bg-slate-100"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${
                            isCurrent
                              ? "border-[#315FEA] bg-[#315FEA] text-white"
                              : isComplete
                                ? "border-[#315FEA] bg-white text-[#315FEA]"
                                : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {isComplete ? "✓" : index + 1}
                        </span>
                        <span className="block text-[0.65rem] font-bold leading-4 text-[#102A4C] sm:text-xs">
                          {registrationStep.title}
                        </span>
                        <span className="block text-[0.6rem] leading-4 text-slate-500 sm:text-[0.7rem]">
                          {registrationStep.detail}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <form
              id="employer-registration-form"
              onSubmit={handleSubmit}
              className="mt-6"
            >
            {step === 0 && (
              <section aria-labelledby="company-account-heading">
                <h2
                  id="company-account-heading"
                  className="text-lg font-bold text-slate-900"
                >
                  Company and account details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the company information and sign-in details for the
                  authorized representative.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                    Company / business name <span className="text-red-600">*</span>
                    <input
                      name="companyName"
                      value={form.companyName}
                      onChange={updateForm}
                      autoComplete="organization"
                      required
                      className={fieldClassName}
                      placeholder="Registered company name"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                    Business address <span className="text-red-600">*</span>
                    <textarea
                      name="businessAddress"
                      value={form.businessAddress}
                      onChange={updateForm}
                      autoComplete="street-address"
                      required
                      rows={2}
                      className={fieldClassName}
                      placeholder="Street, barangay, municipality, province"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                    Owner / authorized representative{" "}
                    <span className="text-red-600">*</span>
                    <input
                      name="contactPerson"
                      value={form.contactPerson}
                      onChange={updateForm}
                      autoComplete="name"
                      required
                      className={fieldClassName}
                      placeholder="Full name"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Company email address <span className="text-red-600">*</span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={updateForm}
                      autoComplete="email"
                      required
                      className={fieldClassName}
                      placeholder="name@company.com"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Password <span className="text-red-600">*</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={updateForm}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className={fieldClassName}
                      placeholder="At least 8 characters"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                    Confirm password <span className="text-red-600">*</span>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={updateForm}
                        autoComplete="new-password"
                        minLength={8}
                        required
                        className={`${fieldClassName} pr-20`}
                        placeholder="Enter the password again"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#0759AE]"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>
                </div>
              </section>
            )}

            {step === 1 && (
              <section aria-labelledby="job-posting-heading">
                <h2
                  id="job-posting-heading"
                  className="text-lg font-bold text-slate-900"
                >
                  Job posting information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select the types of positions your company expects to post.
                  You can update this later.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {jobCategories.map((jobType) => (
                    <label
                      key={jobType}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                        jobTypes.includes(jobType)
                          ? "border-[#0759AE] bg-blue-50 text-[#123B70]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={jobTypes.includes(jobType)}
                        onChange={() => toggleJobType(jobType)}
                        className="h-4 w-4 rounded border-slate-300 accent-[#0759AE]"
                      />
                      {jobType}
                    </label>
                  ))}
                </div>
                {jobTypes.includes("Other") && (
                  <label className="mt-4 block max-w-2xl text-sm font-semibold text-slate-700">
                    List the other positions your company needs{" "}
                    <span className="text-red-600">*</span>
                    <textarea
                      value={otherJobTypes}
                      onChange={(event) =>
                        setOtherJobTypes(event.target.value)
                      }
                      required
                      rows={3}
                      className={fieldClassName}
                      placeholder="For example: delivery drivers, welders, machine operators. Separate multiple positions with commas or new lines."
                    />
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      Add one or more job positions, separated by commas or new
                      lines.
                    </span>
                  </label>
                )}
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="privacy-heading">
                <h2
                  id="privacy-heading"
                  className="text-lg font-bold text-slate-900"
                >
                  Privacy and contact preferences
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a company contact number PESO Mabini can use for account
                  review and employment coordination.
                </p>
                <label className="mt-5 block max-w-xl text-sm font-semibold text-slate-700">
                  Company contact number <span className="text-red-600">*</span>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={updateForm}
                    autoComplete="tel"
                    required
                    className={fieldClassName}
                    placeholder="e.g. 0917 123 4567"
                  />
                </label>
                <div className="mt-5 max-w-2xl rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
                  <h3 className="font-bold text-[#123B70]">Data privacy</h3>
                  <p className="mt-1">
                    Your company and representative information will be used by
                    PESO Mabini to review this registration, coordinate
                    employment services, and support job posting and recruitment.
                    It will be handled in accordance with applicable data
                    privacy policies.
                  </p>
                </div>
              </section>
            )}

            {step === 3 && (
              <section aria-labelledby="review-heading">
                <h2
                  id="review-heading"
                  className="text-lg font-bold text-slate-900"
                >
                  Review and submit
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Check your details before submitting your company registration.
                </p>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-sm font-bold text-amber-950">
                    Before you submit
                  </h3>
                  <p className="mt-1 text-xs text-amber-900">
                    Keep these documents available. PESO Mabini may request them
                    during verification:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-900">
                    <li>DTI / SEC registration and current business permit</li>
                    <li>Valid ID of the owner or authorized representative</li>
                    <li>Authorization letter when the representative is not the owner</li>
                    <li>Optional BIR Certificate of Registration (Form 2303)</li>
                  </ul>
                </div>

                <dl className="mt-5 grid gap-x-6 gap-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Company
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {form.companyName}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Business address
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {form.businessAddress}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Owner / representative
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {form.contactPerson}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact number
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {form.contactNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Company email
                    </dt>
                    <dd className="mt-1 break-all text-sm text-slate-900">
                      {form.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Password
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      ••••••••
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Job categories
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {getSelectedJobTypes().join(", ")}
                    </dd>
                  </div>
                </dl>

                <label className="mt-5 flex items-start gap-2.5 text-xs leading-5 text-slate-600">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(event) =>
                      setPrivacyAccepted(event.target.checked)
                    }
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#0759AE]"
                  />
                  <span>
                    I confirm that the details provided are accurate and agree
                    that PESO Mabini may use this information for employer
                    verification, job posting, and employment facilitation in
                    accordance with applicable data privacy policies.
                  </span>
                </label>
              </section>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  step === 0 ? onBack() : setStep((current) => current - 1)
                }
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                ← {step === 0 ? "Back to account type" : "Back"}
              </button>

              {step < registrationSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={continueToNextStep}
                  disabled={loading}
                  className="rounded-full bg-[#315FEA] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#244BCC] disabled:opacity-60"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !privacyAccepted}
                  className="rounded-full bg-[#315FEA] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#244BCC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Submitting..." : "Submit Registration"}
                </button>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an employer account?{" "}
            <Link to="/login" className="font-semibold text-[#3156A2] underline">
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
