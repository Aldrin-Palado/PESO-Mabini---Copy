import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PesoLogo from "./PesoLogo";
import AuthBackground from "./AuthBackground";
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
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-[#073B73] via-[#087CB4] to-[#13AAB4]">

      <AuthBackground />

      {/* Top Accent */}
      <div className="relative z-10 h-1 bg-gradient-to-r from-sky-300 via-yellow-300 to-red-400" />

      <div className="relative z-10 flex min-h-[calc(100dvh-4px)] items-center justify-center px-4 py-8 sm:px-6 sm:py-12">

        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="mb-8 text-center">

            <PesoLogo
              size="md"
              showName
              tone="light"
              subtitle="Public Employment Service"
            />

          </div>

          {/* Login Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8 lg:p-10">

            {/* Header */}
            <div className="mb-8 text-center">

              <h2 className="text-3xl font-black text-slate-900">
                Welcome Back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to your PESO-Hub account
              </p>

            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* Email */}
              <div>

                <label className="mb-2 block text-sm font-bold text-slate-700">
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
                />

              </div>

              {/* Password */}
              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="block text-sm font-bold text-slate-700">
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 transition hover:text-sky-600"
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
                className="w-full rounded-xl bg-sky-600 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-sky-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </button>

            </form>

            {/* Register */}
            <div className="mt-8 text-center">

              <p className="text-sm text-slate-500">

                Don't have an account?{" "}

                <Link
                  to="/register"
                  className="font-bold text-sky-600 transition hover:text-sky-700"
                >
                  Create an account
                </Link>

              </p>

            </div>

          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
           <button
           type="button"
           onClick={() => navigate("/")}
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

export default Login;