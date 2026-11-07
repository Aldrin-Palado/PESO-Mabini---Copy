import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import EmployerRegistration from "./EmployerRegistration";
import PesoLogo from "./PesoLogo";
import { supabase } from "../services/supabase";

const fieldClassName =
  "w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10";

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accountType, setAccountType] = useState(
    searchParams.get("role") === "employer" ? "employer" : "jobseeker",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  if (accountType === "employer") {
    return <EmployerRegistration onBack={() => setAccountType("jobseeker")} />;
  }

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      alert("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      const fullName = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            role: "jobseeker",
            registration_details: {},
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
        "Account created successfully! Please check your email to confirm your account, then sign in and complete your profile setup before applying for jobs.",
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
                Create your PESO MABINI account now. Complete your job seeker
                profile after signing in to get ready to apply.
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
                    className="rounded-2xl border border-[#315FEA] bg-[#EEF3FF] p-4 text-left shadow-sm ring-2 ring-[#315FEA]/10"
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
                    className="rounded-2xl border border-[#D5DEEB] bg-white p-4 text-left transition hover:border-[#315FEA]/50 hover:bg-blue-50/40"
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
                  className={`${fieldClassName} mt-2`}
                />
              </label>

              <label className="block text-sm font-medium text-slate-800">
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
              </label>

              <label className="block text-sm font-medium text-slate-800">
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
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#315FEA] focus:ring-[#315FEA]"
                />
                <span className="text-sm text-slate-500">
                  I agree to the PESO MABINI terms and conditions and understand
                  that my information will be used for employment services.
                </span>
              </label>

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

            <Link
              to="/"
              className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-[#D5DEEB] bg-white px-6 py-3 text-sm font-semibold text-[#3156A2] shadow-sm transition hover:border-[#315FEA]/40 hover:text-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA]"
            >
              Return to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Register;
