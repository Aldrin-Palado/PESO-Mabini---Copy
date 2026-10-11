import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import PesoLogo from "./PesoLogo";
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
    <div className="min-h-screen bg-[#F3F6FB]">
      <main className="grid min-h-screen lg:grid-cols-2">
        <AuthSideImage />

        <section className="flex min-h-[calc(100dvh-19rem)] flex-col justify-center bg-[#F3F6FB] px-5 py-10 sm:px-10 lg:min-h-screen lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-[33rem]">
            <PesoLogo
              size="auth"
              showName
              subtitle="Municipality of Mabini, Batangas"
              className="mb-8"
            />

            {/* Header */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-[#3156A2]">
                Secure account access
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#102A4C] sm:text-4xl">
                Sign in
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Access your PESO-Hub account to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Email address
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
                  className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10 disabled:bg-slate-100"
                />

              </div>

              {/* Password */}
              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="block text-sm font-medium text-slate-800">
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-medium text-[#315FEA] transition hover:text-[#123B70]"
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
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 pr-20 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10 disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    disabled={loading}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-[#315FEA]"
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
                  className="h-4 w-4 rounded border-slate-300 accent-[#315FEA] focus:ring-[#315FEA]"
                />

                <label
                  htmlFor="remember"
                  className="text-sm text-slate-600"
                >
                  Keep me signed in
                </label>

              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(49,95,234,0.75)] transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </button>

            </form>

            <div className="mt-8 pt-2 text-center">
              <p className="text-sm text-slate-500">
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#315FEA] underline decoration-[#315FEA]/40 underline-offset-4 transition hover:text-[#123B70]"
                >
                  Create an account
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

export default Login;