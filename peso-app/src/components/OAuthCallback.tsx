import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const completeSignIn = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error("Google sign-in was not completed. Please try again.");
      }

      const userId = session.user.id;
      const [admin, staff, jobSeeker, employer] = await Promise.all([
        supabase.from("peso_admin").select("user_id").eq("user_id", userId).maybeSingle(),
        supabase.from("peso_staff").select("user_id").eq("user_id", userId).maybeSingle(),
        supabase.from("job_seeker").select("user_id").eq("user_id", userId).maybeSingle(),
        supabase.from("employer").select("user_id").eq("user_id", userId).maybeSingle(),
      ]);
      const profileError = admin.error ?? staff.error ?? jobSeeker.error ?? employer.error;
      if (profileError) {
        await supabase.auth.signOut();
        throw new Error(
          "Google sign-in succeeded, but PESO could not verify your existing account. Please try again or contact the Admin.",
        );
      }
      if (!active) return;

      if (admin.data || staff.data || jobSeeker.data || employer.data) {
        navigate("/login", { replace: true });
      } else {
        await supabase.auth.signOut();
        if (active) {
          setError(
            "Google sign-in is available only for accounts already registered with PESO. Please register first or use an existing account.",
          );
        }
      }
    };

    void completeSignIn().catch((signInError) => {
      if (active) {
        setError(
          signInError instanceof Error
            ? signInError.message
            : "Google sign-in could not be completed.",
        );
      }
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-[#102A4C]">Google sign-in</h1>
        {error ? (
          <>
            <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>
            <Link
              to="/login"
              className="mt-5 inline-flex rounded-lg bg-[#315FEA] px-5 py-3 text-sm font-semibold text-white"
            >
              Return to sign in
            </Link>
          </>
        ) : (
          <p role="status" className="mt-3 text-sm text-slate-600">
            Completing your sign-in...
          </p>
        )}
      </section>
    </main>
  );
}