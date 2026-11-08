import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import PesoLogo from "./PesoLogo";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import { supabase } from "../services/supabase";

const googleLogo = new URL("../assets/images/google.png", import.meta.url).href;

const fieldClassName =
  "w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10";
const pendingOAuthRegistrationKey = "peso.oauth.registration";

type OAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accountType, setAccountType] = useState(
    searchParams.get("role") === "employer" ? "employer" : "jobseeker",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthUser, setOauthUser] = useState<OAuthUser | null>(null);
  const [oauthError, setOauthError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    industry: "",
    companyAddress: "",
    contactPerson: "",
    contactNumber: "",
    website: "",
    description: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isOAuthReturn = searchParams.get("oauth") === "1";

  useEffect(() => {
    if (!isOAuthReturn) return;
    let active = true;

    try {
      const savedRegistration = sessionStorage.getItem(pendingOAuthRegistrationKey);
      if (savedRegistration) {
        const draft = JSON.parse(savedRegistration) as {
          accountType?: string;
          formData?: typeof formData;
        };
        if (draft.accountType === "employer" || draft.accountType === "jobseeker") {
          setAccountType(draft.accountType);
        }
        if (draft.formData) setFormData((current) => ({ ...current, ...draft.formData }));
      }
    } catch (error) {
      console.error("Could not restore OAuth registration details:", error);
      sessionStorage.removeItem(pendingOAuthRegistrationKey);
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user) return;
      const user = session.user as OAuthUser;
      const fullName = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "");
      const [firstName = "", ...lastNameParts] = fullName.trim().split(/\s+/);
      setOauthUser(user);
      setFormData((current) => ({
        ...current,
        email: user.email ?? current.email,
        firstName: current.firstName || firstName,
        lastName: current.lastName || lastNameParts.join(" "),
        contactPerson: current.contactPerson || fullName,
      }));
    });

    return () => {
      active = false;
    };
  }, [isOAuthReturn]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!termsAccepted) {
      alert("Please accept the Terms and Conditions to continue.");
      return;
    }

    if (!oauthUser && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!oauthUser && formData.password.length < 8) {
      alert("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const isEmployer = accountType === "employer";
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      const fullName = isEmployer
        ? formData.contactPerson.trim()
        : `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

      if (oauthUser) {
        const email = oauthUser.email?.trim().toLowerCase();
        if (!email) throw new Error("Google did not provide an email address.");

        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            role: isEmployer ? "employer" : "jobseeker",
            full_name: fullName,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
          },
        });
        if (metadataError) throw metadataError;

        if (isEmployer) {
          const employerDetails = {
            industries: formData.industry.trim() ? [formData.industry.trim()] : [],
            industry: formData.industry.trim(),
            website: formData.website.trim(),
            company_description: formData.description.trim(),
          };
          const { error: profileError } = await supabase.from("employer").insert({
            user_id: oauthUser.id,
            name: formData.companyName.trim(),
            address: formData.companyAddress.trim(),
            contact_person: fullName,
            contact_no: formData.contactNumber.trim(),
            email,
            registration_details: employerDetails,
            industry: formData.industry.trim() || null,
            website: formData.website.trim() || null,
            company_description: formData.description.trim() || null,
          });
          if (profileError) throw profileError;
        } else {
          const { error: profileError } = await supabase.from("job_seeker").insert({
            user_id: oauthUser.id,
            full_name: fullName,
            email,
            registration_details: {},
          });
          if (profileError) throw profileError;
        }

        sessionStorage.removeItem(pendingOAuthRegistrationKey);
        navigate(isEmployer ? "/employer" : "/jobseeker", { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: fullName,
            role: isEmployer ? "employer" : "jobseeker",
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            ...(isEmployer
              ? {
                  company_name: formData.companyName.trim(),
                  business_address: formData.companyAddress.trim(),
                  contact_person: fullName,
                  contact_no: formData.contactNumber.trim(),
                  employer_registration_details: {
                    industries: formData.industry.trim()
                      ? [formData.industry.trim()]
                      : [],
                    industry: formData.industry.trim(),
                    website: formData.website.trim(),
                    company_description: formData.description.trim(),
                  },
                }
              : {
                  first_name: firstName,
                  last_name: lastName,
                  registration_details: {},
                }),
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

      alert(
        isEmployer
          ? "Account created. Please check your email to confirm it, then sign in and complete your PESO registration paperwork in the employer portal."
          : "Account created successfully! Please check your email to confirm your account, then sign in and complete your profile setup before applying for jobs.",
      );
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      const message =
        error instanceof Error ? error.message : "Unknown error occurred.";
      alert(`Something went wrong while creating your account.\n\nReason: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const registerWithGoogle = async () => {
    setOauthError("");
    sessionStorage.setItem(
      pendingOAuthRegistrationKey,
      JSON.stringify({ accountType }),
    );
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      sessionStorage.removeItem(pendingOAuthRegistrationKey);
      setOauthError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="whirl-page-background min-h-screen">
      <main className="grid min-h-screen lg:grid-cols-2">
        <AuthSideImage variant="register" />

        <section className="flex flex-col justify-center bg-white/85 px-5 py-9 backdrop-blur-sm sm:px-10 lg:min-h-screen lg:px-12 xl:px-16 2xl:px-20">
          <div className="mx-auto w-full max-w-[38rem]">
            <div className="mb-8">
              <PesoLogo
                size="sm"
                showName
                subtitle="Registration"
                linkTo={null}
                className="mb-6"
              />
              <p className="text-sm font-semibold text-[#3156A2]">
                Join your local employment network
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#102A4C] sm:text-4xl">
                Create your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Create your PESO MABINI account now. Complete your profile
                after signing in to access employment services.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Choose your account type
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={accountType === "jobseeker"}
                    onClick={() => setAccountType("jobseeker")}
                    className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                      accountType === "jobseeker"
                        ? "border-[#315FEA] bg-[#EEF3FF] ring-2 ring-[#315FEA]/10"
                        : "border-[#D5DEEB] bg-white hover:border-[#315FEA]/50 hover:bg-blue-50/40"
                    }`}
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#315FEA] text-xs font-extrabold tracking-wide text-white">
                      JS
                    </div>
                    <h3 className="font-bold text-[#102A4C]">Job Seeker</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Find jobs and submit applications
                    </p>
                  </button>

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
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-extrabold tracking-wide text-slate-600">
                      EMP
                    </div>
                    <h3 className="font-bold text-[#102A4C]">Employer</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Post vacancies and find applicants
                    </p>
                  </button>
                </div>
              </div>

              {accountType === "employer" ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-800">
                    Company Name <span className="text-red-600">*</span>
                    <input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      autoComplete="organization"
                      maxLength={200}
                      required
                      className={`${fieldClassName} mt-2`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Industry
                    <input
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="e.g. Retail, Manufacturing"
                      maxLength={150}
                      className={`${fieldClassName} mt-2`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Company Email <span className="text-red-600">*</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter company email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      readOnly={Boolean(oauthUser)}
                      className={`${fieldClassName} mt-2`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Contact Number <span className="text-red-600">*</span>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      placeholder="Enter contact number"
                      autoComplete="tel"
                      maxLength={30}
                      required
                      className={`${fieldClassName} mt-2`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Contact Person <span className="text-red-600">*</span>
                    <input
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="Enter contact person"
                      autoComplete="name"
                      maxLength={150}
                      required
                      className={`${fieldClassName} mt-2`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Company Website
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      maxLength={2048}
                      className={`${fieldClassName} mt-2`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800 sm:col-span-2">
                    Company Address <span className="text-red-600">*</span>
                    <textarea
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      placeholder="Enter company address"
                      autoComplete="street-address"
                      maxLength={500}
                      rows={3}
                      required
                      className={`${fieldClassName} mt-2`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800 sm:col-span-2">
                    Company Description
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell job seekers about your company"
                      maxLength={2000}
                      rows={4}
                      className={`${fieldClassName} mt-2`}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-800">
                      Surname <span className="text-red-600">*</span>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Enter surname"
                        required
                        className={`${fieldClassName} mt-2`}
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-800">
                      First Name <span className="text-red-600">*</span>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        required
                        className={`${fieldClassName} mt-2`}
                      />
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-slate-800">
                    Email address <span className="text-red-600">*</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      readOnly={Boolean(oauthUser)}
                      className={`${fieldClassName} mt-2`}
                    />
                  </label>
                </>
              )}

              {!oauthUser && <label className="block text-sm font-medium text-slate-800">
                Password
                <span className="relative mt-2 block">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    className={`${fieldClassName} pr-20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-[#315FEA]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </label>}

              {!oauthUser && <label className="block text-sm font-medium text-slate-800">
                Confirm Password
                <span className="relative mt-2 block">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className={`${fieldClassName} pr-20`}
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
                </span>
              </label>}

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#315FEA] focus:ring-[#315FEA]"
                />
                <span className="text-sm text-slate-500">
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="font-semibold text-[#315FEA] underline decoration-[#315FEA]/40 underline-offset-2 hover:text-[#123B70]"
                  >
                    Terms and Conditions
                  </button>{" "}
                  and understand how my personal information will be collected
                  and processed through PESO-Hub.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(49,95,234,0.75)] transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? oauthUser ? "Completing Registration..." : "Creating Account..."
                  : oauthUser ? "Complete Registration" : "Create Account"}
              </button>
              {!oauthUser && (
                <>
                  {oauthError && (
                    <p role="alert" className="text-sm text-red-700">{oauthError}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    Or
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  <button
                    type="button"
                    onClick={() => void registerWithGoogle()}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 text-base font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    <img src={googleLogo} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
                    Continue with Google
                  </button>
                </>
              )}
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

            <Link
              to="/"
              className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-[#D5DEEB] bg-white px-6 py-3 text-sm font-semibold text-[#3156A2] shadow-sm transition hover:border-[#315FEA]/40 hover:text-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA]"
            >
              Return to Home
            </Link>
          </div>
        </section>
      </main>
      {showTerms && (
        <TermsAndConditionsModal onClose={() => setShowTerms(false)} />
      )}
    </div>
  );
}

export default Register;
