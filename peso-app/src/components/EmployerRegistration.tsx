import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import PesoLogo from "./PesoLogo";
import { supabase } from "../services/supabase";

type EmployerRegistrationProps = {
  onBack: () => void;
};

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10";
const labelClassName = "block text-sm font-medium text-slate-800";

export default function EmployerRegistration({
  onBack,
}: EmployerRegistrationProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    address: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    website: "",
    description: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
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

    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const contactPerson = form.contactPerson.trim();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            role: "employer",
            company_name: form.companyName.trim(),
            business_address: form.address.trim(),
            contact_person: contactPerson,
            full_name: contactPerson,
            contact_no: form.contactNumber.trim(),
            employer_registration_details: {
              industries: form.industry.trim() ? [form.industry.trim()] : [],
              industry: form.industry.trim(),
              website: form.website.trim(),
              company_description: form.description.trim(),
            },
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) {
        throw new Error("Supabase did not return a user account. Please try again.");
      }

      window.alert(
        "Account created. Please check your email to confirm it, then sign in and complete your PESO registration paperwork in the employer portal.",
      );
      navigate("/login", { replace: true });
    } catch (submitError) {
      console.error("Employer account registration failed:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create the employer account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whirl-page-background min-h-screen">
      <main className="grid min-h-screen lg:grid-cols-2">
        <AuthSideImage variant="register" />
        <section className="flex flex-col justify-center bg-white/85 px-5 py-9 backdrop-blur-sm sm:px-10 lg:min-h-screen lg:px-12 xl:px-16 2xl:px-20">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-8">
              <PesoLogo
                size="sm"
                showName
                subtitle="Employer Registration"
                linkTo={null}
                className="mb-6"
              />
              <p className="text-sm font-semibold text-[#3156A2]">
                Employer Registration
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102A4C] sm:text-4xl">
                Create your account
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Enter your company details and account credentials. You can
                complete the PESO registration and submit paperwork after signing in.
              </p>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClassName}>
                  Company Name <span className="text-red-600">*</span>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    autoComplete="organization"
                    maxLength={200}
                    required
                    className={fieldClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Industry
                  <input
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    placeholder="e.g. Retail, Manufacturing"
                    maxLength={150}
                    className={fieldClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Company Email <span className="text-red-600">*</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter company email"
                    autoComplete="email"
                    maxLength={254}
                    required
                    className={fieldClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Contact Number <span className="text-red-600">*</span>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    autoComplete="tel"
                    maxLength={30}
                    required
                    className={fieldClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Contact Person <span className="text-red-600">*</span>
                  <input
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleChange}
                    placeholder="Enter contact person"
                    autoComplete="name"
                    maxLength={150}
                    required
                    className={fieldClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Company Website
                  <input
                    type="url"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    maxLength={2048}
                    className={fieldClassName}
                  />
                </label>
                <label className={`${labelClassName} sm:col-span-2`}>
                  Company Address <span className="text-red-600">*</span>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter company address"
                    autoComplete="street-address"
                    maxLength={500}
                    rows={3}
                    required
                    className={fieldClassName}
                  />
                </label>
                <label className={`${labelClassName} sm:col-span-2`}>
                  Company Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Tell job seekers about your company"
                    maxLength={2000}
                    rows={4}
                    className={fieldClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Password <span className="text-red-600">*</span>
                  <span className="relative mt-2 block">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className={`${fieldClassName} mt-0 pr-20`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#0759AE]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </span>
                </label>
                <label className={labelClassName}>
                  Confirm Password <span className="text-red-600">*</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className={fieldClassName}
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={loading}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Back to account type
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#0759AE] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create Employer Account"}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
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
