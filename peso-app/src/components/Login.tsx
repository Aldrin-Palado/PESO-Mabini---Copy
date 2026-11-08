import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import PesoLogo from "./PesoLogo";
import { supabase } from "../services/supabase";
import AppIcon from "./AppIcon";

const googleLogo = new URL("../assets/images/google.png", import.meta.url).href;

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
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState("");

  const signInWithGoogle = async () => {
    setOauthError("");
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setOauthError(error.message);
      setOauthLoading(false);
    }
  };

  const routeAuthenticatedUser = async (user: { id: string }) => {
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
      const returnToPath =
        state &&
        typeof state === "object" &&
        "returnTo" in state &&
        typeof state.returnTo === "string"
          ? state.returnTo
          : "";
      const returnTo =
        returnToPath.startsWith("/jobs") ||
        /^\/jobseeker\?job=[0-9a-f-]{36}$/i.test(returnToPath)
          ? returnToPath
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
  };

  useEffect(() => {
    let isMounted = true;

    const checkStoredSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted || !session?.user) {
        return;
      }

      try {
        await routeAuthenticatedUser(session.user);
      } catch (error) {
        console.error("Session redirect error:", error);
        await supabase.auth.signOut();
      }
    };

    void checkStoredSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void routeAuthenticatedUser(session.user).catch(async () => {
          await supabase.auth.signOut();
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.state]);

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

      await routeAuthenticatedUser(user);
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
                Your session expired after 30 minutes of inactivity. Please sign
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
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-medium text-slate-800"
                >
                  Password
                </label>

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

                <div className="mt-2 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-[#315FEA] transition hover:text-[#123B70]"
                  >
                    Forgot Password?
                  </Link>
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
                disabled={loading || oauthLoading}
                className="w-full rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(49,95,234,0.75)] transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

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
                onClick={() => void signInWithGoogle()}
                disabled={loading || oauthLoading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 text-base font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              >
                <img src={googleLogo} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
                {oauthLoading ? "Opening Google..." : "Continue with Google"}
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
