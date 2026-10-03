import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PesoLogo from "./PesoLogo";
import AuthBackground from "./AuthBackground";
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

    if (
      formData.password !==
      formData.confirmPassword
    ) {
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
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-[#073B73] via-[#087CB4] to-[#13AAB4]">

      <AuthBackground />

      {/* Top Accent */}
      <div className="relative z-10 h-1 bg-gradient-to-r from-sky-300 via-yellow-300 to-red-400" />

      <div className="relative z-10 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl">

          {/* Logo */}
          <div className="mb-8 text-center">
            <PesoLogo
              size="md"
              showName
              tone="light"
              subtitle="Public Employment Service"
            />
          </div>

          {/* Registration Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8 lg:p-10">

            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-slate-900">
                Create an Account
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Join PESO-Hub and access employment services
              </p>
            </div>

            <form
              onSubmit={handleRegister}
              className="space-y-6"
            >

              {/* Account Type */}
              <div>
                <label className="mb-3 block text-sm font-bold text-slate-700">
                  I am registering as
                </label>

                <div className="grid gap-3 sm:grid-cols-2">

                  {/* Job Seeker */}
                  <button
                    type="button"
                    onClick={() =>
                      setAccountType("jobseeker")
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      accountType === "jobseeker"
                        ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                        : "border-slate-200 hover:border-sky-300"
                    }`}
                  >
                    <div className="mb-2 text-2xl">
                      👤
                    </div>

                    <h3 className="font-bold text-slate-900">
                      Job Seeker
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Find jobs and submit applications
                    </p>
                  </button>

                  {/* Employer */}
                  <button
                    type="button"
                    onClick={() =>
                      setAccountType("employer")
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      accountType === "employer"
                        ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                        : "border-slate-200 hover:border-sky-300"
                    }`}
                  >
                    <div className="mb-2 text-2xl">
                      🏢
                    </div>

                    <h3 className="font-bold text-slate-900">
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
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 transition hover:text-sky-600"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 transition hover:text-sky-600"
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
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
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
                className="w-full rounded-xl bg-sky-600 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-sky-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>

            {/* Login */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-sky-600 transition hover:text-sky-700"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mx-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
            >
              <span>←</span>
              Back
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;