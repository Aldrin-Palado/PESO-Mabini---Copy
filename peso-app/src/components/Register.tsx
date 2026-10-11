import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import { supabase } from "../services/supabase";

function Register() {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState("jobseeker");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

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

      const fullName =
        `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      /*
       * STEP 1
       * Create the Supabase Auth account
       */
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: fullName,
            role: accountType,
          },
        },
      });

      if (error) {
        console.error("Supabase Auth registration error:", error);
        alert(error.message);
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        console.error("Registration succeeded but no user ID was returned.");

        alert(
          "The account was created, but Supabase did not return a user ID. Please try again."
        );

        return;
      }

      /*
       * STEP 2
       * Create the corresponding profile
       */
      if (accountType === "jobseeker") {
        const { error: profileError } = await supabase
          .from("job_seeker")
          .insert({
            user_id: userId,
            full_name: fullName,
            email,
            is_active: true,
          });

        if (profileError) {
          console.error(
            "Job seeker profile error:",
            profileError
          );

          alert(
            `Account created, but failed to create job seeker profile.\n\nReason: ${profileError.message}`
          );

          return;
        }
      }

      if (accountType === "employer") {
        const { error: profileError } = await supabase
          .from("employer")
          .insert({
            user_id: userId,
            full_name: fullName,
            email,
            contact_person: fullName,
            is_active: true,
          });

        if (profileError) {
          console.error(
            "Employer profile error:",
            profileError
          );

          alert(
            `Account created, but failed to create employer profile.\n\nReason: ${profileError.message}`
          );

          return;
        }
      }

      /*
       * STEP 3
       * Everything succeeded
       */
      alert(
        "Account created successfully! Please check your email to confirm your account, then log in."
      );

      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error occurred.";

      alert(
        `Something went wrong while creating your account.\n\nReason: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <main className="grid min-h-screen lg:grid-cols-2">
          <AuthSideImage variant="register" />

          <section className="flex flex-col justify-center bg-[#F3F6FB] px-5 py-9 sm:px-10 lg:min-h-screen lg:px-12 xl:px-16 2xl:px-20">
          <div className="mx-auto w-full max-w-[38rem]">

            {/* Header */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-[#3156A2]">
                Join your local employment network
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#102A4C] sm:text-4xl">
                Create your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Join PESO-Hub and access employment services in Mabini.
              </p>
            </div>

            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >

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
                    onClick={() =>
                      setAccountType("jobseeker")
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      accountType === "jobseeker"
                        ? "border-[#315FEA] bg-[#EEF3FF] shadow-sm ring-2 ring-[#315FEA]/10"
                        : "border-[#D5DEEB] bg-white hover:border-[#315FEA]/50 hover:bg-blue-50/40"
                    }`}
                  >
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold tracking-wide ${
                      accountType === "jobseeker"
                        ? "bg-[#315FEA] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      JS
                    </div>

                    <h3 className="font-bold text-[#102A4C]">
                      Job Seeker
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Find jobs and submit applications
                    </p>
                  </button>

                  {/* Employer */}
                  <button
                    type="button"
                    aria-pressed={accountType === "employer"}
                    onClick={() =>
                      setAccountType("employer")
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      accountType === "employer"
                        ? "border-[#315FEA] bg-[#EEF3FF] shadow-sm ring-2 ring-[#315FEA]/10"
                        : "border-[#D5DEEB] bg-white hover:border-[#315FEA]/50 hover:bg-blue-50/40"
                    }`}
                  >
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold tracking-wide ${
                      accountType === "employer"
                        ? "bg-[#315FEA] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      EMP
                    </div>

                    <h3 className="font-bold text-[#102A4C]">
                      Employer
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Post vacancies and find applicants
                    </p>
                  </button>

                </div>
              </div>

              {/* First and Last Name */}
              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />
                </div>

              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Email address
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

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-[#315FEA]"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
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
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={
                      formData.confirmPassword
                    }
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-[#315FEA]"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
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
                  I agree to the PESO-Hub terms and
                  conditions and understand that my
                  information will be used for
                  employment services.
                </p>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(49,95,234,0.75)] transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
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
            <span aria-hidden="true">←</span>
            Return to Home
          </Link>
          </div>
          </section>
      </main>
    </div>
  );
}

export default Register;