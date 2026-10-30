import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import PesoLogo from "./PesoLogo";
import { supabase } from "../services/supabase";
import AppIcon from "./AppIcon";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired =
    location.state !== null &&
    typeof location.state === "object" &&
    "sessionExpired" in location.state &&
    location.state.sessionExpired === true;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const {
        data: { user },
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        alert(
          loginError.message === "Invalid login credentials"
            ? "Invalid email or password. Check that the account exists in this Supabase project and that the password is correct."
            : loginError.message
        );
        return;
      }

      if (!user) {
        alert("Login failed. Supabase did not return a user.");
        return;
      }

      // Admin is checked first; the database should contain only one Admin profile.
      const { data: admin, error: adminError } = await supabase
        .from("peso_admin")
        .select("admin_id, user_id, full_name, email, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        console.error("Admin profile lookup error:", adminError);
        throw new Error("Your login was accepted, but we could not verify the Admin profile. Check database permissions and try again.");
      }

      if (admin) {
        if (!admin.is_active) {
          await supabase.auth.signOut();
          alert("This Admin account is inactive. Please contact the system administrator.");
          navigate("/", { replace: true });
          return;
        }
        navigate("/superadmin", { replace: true });
        return;
      }

      const { data: staff, error: staffError } = await supabase
        .from("peso_staff")
        .select("peso_staff_id, user_id, full_name, email, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (staffError) {
        console.error("Staff profile lookup error:", staffError);
        throw new Error("Your login was accepted, but we could not verify the Staff profile. Please try again.");
      }

      if (staff) {
        if (!staff.is_active) {
          await supabase.auth.signOut();
          alert("This Staff account is inactive. Please contact the Admin.");
          navigate("/", { replace: true });
          return;
        }
        navigate("/superadmin", { replace: true });
        return;
      }

      const { data: jobSeeker, error: jobSeekerError } = await supabase
        .from("job_seeker")
        .select("job_seeker_id, user_id, full_name, email, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (jobSeekerError) {
        console.error("Job Seeker profile lookup error:", jobSeekerError);
        throw new Error("Your login was accepted, but we could not verify the Job Seeker profile. Please try again.");
      }

      if (jobSeeker) {
        if (!jobSeeker.is_active) {
          await supabase.auth.signOut();
          alert("This Job Seeker account is inactive.");
          navigate("/", { replace: true });
          return;
        }
        const state = location.state;
        const returnTo =
          state &&
          typeof state === "object" &&
          "returnTo" in state &&
          typeof state.returnTo === "string" &&
          state.returnTo.startsWith("/jobs")
            ? state.returnTo
            : "/jobseeker";
        navigate(returnTo, { replace: true });
        return;
      }

      const { data: employer, error: employerError } = await supabase
        .from("employer")
        .select("employer_id, user_id, name, email, is_verified")
        .eq("user_id", user.id)
        .maybeSingle();

      if (employerError) {
        console.error("Employer profile lookup error:", employerError);
        throw new Error("Your login was accepted, but we could not verify the Employer profile. Please try again.");
      }

      if (employer) {
        navigate("/employer", { replace: true });
        return;
      }

      await supabase.auth.signOut();
      alert("Your account is authenticated, but no PESO profile was found. Please contact the Admin.");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error
        ? error.message
        : "Something went wrong while logging in. Please try again.";
      await supabase.auth.signOut();
      alert(message);
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whirl-page-background min-h-screen">
      <main className="grid min-h-screen lg:grid-cols-2">
        <AuthSideImage />

        <section className="flex min-h-[calc(100dvh-19rem)] flex-col justify-center bg-white/85 px-5 py-10 backdrop-blur-sm sm:px-10 lg:min-h-screen lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-[33rem]">
            <PesoLogo
              size="auth"
              showName
              subtitle="Municipality of Mabini, Batangas"
              className="mb-8"
            />

            <div className="mb-8">
              <p className="text-sm font-semibold text-[#3156A2]">
                Secure account access
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#102A4C] sm:text-4xl">
                Sign in
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Access your PESO MABINI account to continue.
              </p>
            </div>

            {sessionExpired && (
              <p
                role="status"
                className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
              >
                Your session expired after 5 hours of inactivity. Please sign
                in again.
              </p>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-medium text-slate-800"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10 disabled:bg-slate-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-slate-800"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-[#315FEA] transition hover:text-[#123B70]"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 pr-20 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10 disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={loading}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-[#315FEA]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-slate-300 accent-[#315FEA] focus:ring-[#315FEA]"
                />
                <label htmlFor="remember" className="text-sm text-slate-600">
                  Keep me signed in
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(49,95,234,0.75)] transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In"}
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
              <AppIcon name="arrowLeft" className="h-4 w-4" />
              Return to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
