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
        navigate("/staff", { replace: true });
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
        navigate("/jobseeker", { replace: true });
        return;
      }

      const { data: employer, error: employerError } = await supabase
        .from("employer")
        .select("employer_id, user_id, full_name, email, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (employerError) {
        console.error("Employer profile lookup error:", employerError);
        throw new Error("Your login was accepted, but we could not verify the Employer profile. Please try again.");
      }

      if (employer) {
        if (!employer.is_active) {
          await supabase.auth.signOut();
          alert("This Employer account is inactive.");
          navigate("/", { replace: true });
          return;
        }
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

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      alert("Enter your email address first, then click Forgot Password.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert("If an account exists for that email, a password reset link will be sent.");
    } catch (error) {
      console.error("Password reset request error:", error);
      alert(error instanceof Error ? error.message : "Unable to request a password reset. Please try again.");
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
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#168A9B]">Secure account access</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#102A4C]">Welcome Back</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to your PESO-Hub account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                  <input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required disabled={loading} className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#168A9B] focus:bg-white focus:ring-4 focus:ring-[#168A9B]/10 disabled:bg-slate-100" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700">Password</label>
                    <button type="button" onClick={handleForgotPassword} disabled={loading} className="text-sm font-semibold text-[#147D8A] transition hover:text-[#123B70] disabled:opacity-60">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required disabled={loading} className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-3.5 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#168A9B] focus:bg-white focus:ring-4 focus:ring-[#168A9B]/10 disabled:bg-slate-100" />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} disabled={loading} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 transition hover:text-[#147D8A]">{showPassword ? "Hide" : "Show"}</button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                  <label htmlFor="remember" className="text-sm text-slate-600">Remember me</label>
                </div>

                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#123B70] px-5 py-3.5 font-bold text-white shadow-lg shadow-[#123B70]/15 transition hover:bg-[#0D315F] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168A9B] disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">Don’t have an account?{" "}<Link to="/register" className="font-bold text-[#147D8A] transition hover:text-[#123B70]">Create an account</Link></p>
              </div>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">Your information is protected and used only to provide employment services.</p>
            <Link to="/" className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#123B70]/30 hover:bg-slate-50 hover:text-[#123B70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123B70]"><span aria-hidden="true">←</span>Return to Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
