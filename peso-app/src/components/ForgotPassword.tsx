import { useState } from "react";
import { Link } from "react-router-dom";
import AuthSideImage from "../components/AuthSideImage";
import PesoLogo from "../components/PesoLogo";
import { supabase } from "../services/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setRequestSent(true);
    } catch (error) {
      console.error("Password reset request error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to request a password reset. Please try again.",
      );
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
                Forgot your password?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Enter the email address associated with your account and we’ll
                send you a link to reset your password.
              </p>
            </div>

            {requestSent ? (
              <div
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-800"
                role="status"
              >
                If an account exists for that email, a password reset link will
                be sent. Check your inbox and follow the link to choose a new
                password.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-2 block text-sm font-medium text-slate-800"
                  >
                    Email address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10 disabled:bg-slate-100"
                  />
                </div>

                {errorMessage && (
                  <p
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(49,95,234,0.75)] transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending Reset Link…" : "Send Reset Link"}
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-slate-500">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#315FEA] underline decoration-[#315FEA]/40 underline-offset-4 transition hover:text-[#123B70]"
              >
                Return to sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
