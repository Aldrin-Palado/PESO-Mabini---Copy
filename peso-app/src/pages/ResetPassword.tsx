import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthSideImage from "../components/AuthSideImage";
import PesoLogo from "../components/PesoLogo";
import { supabase } from "../services/supabase";

type ResetStatus = "checking" | "ready" | "invalid";

export default function ResetPassword() {
  const [status, setStatus] = useState<ResetStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    let active = true;
    let sessionFound = false;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active || !session) return;
        sessionFound = true;
        setStatus("ready");
      },
    );

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setErrorMessage(error.message);
        setStatus("invalid");
        return;
      }

      if (data.session) {
        sessionFound = true;
        setStatus("ready");
      } else if (!sessionFound) {
        setStatus("invalid");
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || status !== "ready") return;

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setUpdated(true);
    } catch (error) {
      console.error("Password update error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your password. Please try again.",
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
                {updated ? "Password updated" : "Reset your password"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                {updated
                  ? "Your password has been changed. You can now sign in with your new password."
                  : "Choose a new password for your PESO-Hub account."}
              </p>
            </div>

            {status === "checking" ? (
              <p className="text-sm text-slate-600" role="status">
                Verifying your password reset link…
              </p>
            ) : status === "invalid" ? (
              <div className="space-y-5">
                <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
                  {errorMessage ||
                    "This password reset link is invalid or has expired. Request a new link and try again."}
                </p>
                <Link
                  to="/forgot-password"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA]"
                >
                  Request a New Reset Link
                </Link>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 text-base font-semibold text-[#3156A2] transition hover:border-[#315FEA]/40 hover:text-[#244FD4]"
                >
                  Return to Sign In
                </Link>
              </div>
            ) : updated ? (
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA]"
              >
                Continue to Sign In
              </Link>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-medium text-slate-800"
                  >
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 text-base text-slate-900 outline-none transition focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium text-slate-800"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-4 text-base text-slate-900 outline-none transition focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10 disabled:bg-slate-100"
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
                  {loading ? "Updating Password…" : "Update Password"}
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-slate-500">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#315FEA] underline decoration-[#315FEA]/40 underline-offset-4 transition hover:text-[#123B70]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
