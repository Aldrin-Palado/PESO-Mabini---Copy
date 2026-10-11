import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import AuthPageHeader from "./AuthPageHeader";
import { supabase } from "../services/supabase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      /* =========================================
         1. LOGIN USING SUPABASE AUTH
      ========================================= */

      const {
        data: { user },
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        alert(loginError.message);
        return;
      }

      if (!user) {
        alert("Login failed. No user was found.");
        return;
      }

      console.log("Logged in user:", user.id);

      /* =========================================
         2. CHECK SUPERADMIN
      ========================================= */

      const {
        data: admin,
        error: adminError,
      } = await supabase
        .from("peso_admin")
        .select(
          "admin_id, user_id, full_name, email, is_active"
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (adminError) {
        console.error(
          "Superadmin check error:",
          adminError
        );
      }

      /* =========================================
         3. IF SUPERADMIN → ADMIN DASHBOARD
      ========================================= */

      if (admin) {
        console.log("Superadmin detected:", admin);

        navigate("/superadmin");
        return;
      }

      /* =========================================
         4. CHECK PESO STAFF
      ========================================= */

      const {
        data: staff,
        error: staffError,
      } = await supabase
        .from("peso_staff")
        .select(
          "peso_staff_id, user_id, full_name, email, is_active"
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (staffError) {
        console.error(
          "Staff check error:",
          staffError
        );
      }

      /* =========================================
         5. IF STAFF → STAFF DASHBOARD
      ========================================= */

      if (staff) {
        console.log("PESO Staff detected:", staff);

        navigate("/staff");
        return;
      }

      /* =========================================
         6. CHECK JOB SEEKER
      ========================================= */

      const {
        data: jobseeker,
        error: jobseekerError,
      } = await supabase
        .from("job_seeker")
        .select(
          "job_seeker_id, user_id, full_name, email, is_active"
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (jobseekerError) {
        console.error(
          "Jobseeker check error:",
          jobseekerError
        );
      }

      if (jobseeker) {
        console.log("Job Seeker detected:", jobseeker);

        navigate("/jobseeker");
        return;
      }

      /* =========================================
         7. CHECK EMPLOYER
      ========================================= */

      const {
        data: employer,
        error: employerError,
      } = await supabase
        .from("employer")
        .select(
          "employer_id, user_id, full_name, email, is_active"
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (employerError) {
        console.error(
          "Employer check error:",
          employerError
        );
      }

      if (employer) {
        console.log("Employer detected:", employer);

        navigate("/employer");
        return;
      }

      /* =========================================
         8. NOT AUTHORIZED
      ========================================= */

      await supabase.auth.signOut();

      alert(
        "Your account is not registered as a PESO Superadmin, Staff, Job Seeker, or Employer."
      );

      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Something went wrong while logging in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(22,138,155,0.08),_transparent_38%),#f4f6f9]">
      <AuthPageHeader />

      <main className="flex min-h-[calc(100dvh-5.5rem)] items-center px-4 py-10 sm:px-6 xl:px-0 xl:py-0">
        <div className="mx-auto grid w-full items-center gap-10 xl:min-h-[calc(100dvh-5.5rem)] xl:grid-cols-[minmax(0,1fr)_minmax(25rem,34rem)] xl:items-stretch xl:gap-0">
          <AuthSideImage />

          <div className="w-full max-w-md justify-self-center px-0 sm:px-2 xl:max-w-none xl:justify-self-stretch xl:self-center xl:px-12 xl:py-10 2xl:px-20">
          <div className="rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_24px_70px_-28px_rgba(18,59,112,0.25)] ring-1 ring-slate-900/[0.04] sm:p-9">

            {/* Header */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#168A9B]">
                Secure account access
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#102A4C]">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to your PESO-Hub account
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-6"
            >

              {/* Email */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#168A9B] focus:bg-white focus:ring-4 focus:ring-[#168A9B]/10 disabled:bg-slate-100"
                />

              </div>

              {/* Password */}
              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-semibold text-[#147D8A] transition hover:text-[#123B70]"
                  >
                    Forgot Password?
                  </button>

                </div>

                <div className="relative">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-3.5 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#168A9B] focus:bg-white focus:ring-4 focus:ring-[#168A9B]/10 disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 transition hover:text-[#147D8A]"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">

                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />

                <label
                  htmlFor="remember"
                  className="text-sm text-slate-600"
                >
                  Remember me
                </label>

              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#123B70] px-5 py-3.5 font-bold text-white shadow-lg shadow-[#123B70]/15 transition hover:bg-[#0D315F] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168A9B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </button>

            </form>

            <div className="mt-7 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#147D8A] transition hover:text-[#123B70]"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-slate-500">
            Your information is protected and used only to provide employment
            services.
          </p>
          <Link
            to="/"
            className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#123B70]/30 hover:bg-slate-50 hover:text-[#123B70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123B70]"
          >
            <span aria-hidden="true">←</span>
            Return to Home
          </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;