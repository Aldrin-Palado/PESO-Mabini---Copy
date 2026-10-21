import { useState, type FormEvent } from "react";
import { invokePesoAI } from "../services/pesoAi";

const maxResumeBytes = 1_000_000;

type JobMatch = {
  job: {
    id: string;
    title: string;
    employer: string;
    location: string;
    type: string;
    salary: string;
    description: string;
    requirements: string;
  };
  match_score: number;
  reasons: string[];
  skill_gaps: string[];
};

export default function JobMatchesModule() {
  const [profileText, setProfileText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeAuthorized, setResumeAuthorized] = useState(false);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const runMatching = async (
    profile: string,
    resume: File | null,
    authorized = resumeAuthorized,
  ) => {
    if (loading) return;
    setLoading(true);
    setError("");
    setHasSearched(false);

    try {
      if (!resume && profile.trim().length < 10) {
        throw new Error("Enter at least 10 characters about your skills or upload a PDF resume.");
      }

      let resumeBase64: string | undefined;
      if (resume) {
        if (!authorized) {
          throw new Error("Please authorize sending your resume for AI analysis.");
        }
        if (resume.size > maxResumeBytes) {
          throw new Error("Resume PDF must be 1 MB or smaller.");
        }
        const bytes = new Uint8Array(await resume.arrayBuffer());
        if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
          throw new Error("The selected file is not a valid PDF document.");
        }
        let binary = "";
        const chunkSize = 0x8000;
        for (let index = 0; index < bytes.length; index += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
        }
        resumeBase64 = btoa(binary);
      }

      const result = await invokePesoAI<{ matches: JobMatch[] }>(
        "job-matches",
        resumeBase64 ? { resumeBase64 } : { profileText: profile },
      );
      setMatches(result.matches);
      setHasSearched(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to find job matches right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  const findMatches = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runMatching(profileText, resumeFile);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#0759AE]">
          Personalized recommendations
        </p>
        <h2 className="mt-1 text-2xl font-black text-[#123B70]">AI Job Matching</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Upload a PDF resume or describe your skills to compare your profile with open
          vacancies and the requirements employers submitted. Resume files are sent to
          Google Gemini for this analysis and are not stored. Recommendations are not hiring
          decisions.
        </p>
      </header>

      <form onSubmit={findMatches} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label htmlFor="job-match-resume" className="text-sm font-bold text-slate-800">
          Upload resume (PDF, up to 1 MB)
        </label>
        <input
          id="job-match-resume"
          type="file"
          accept="application/pdf,.pdf"
          disabled={loading}
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            setResumeFile(selectedFile);
            setResumeAuthorized(false);
            setMatches([]);
            setHasSearched(false);
            setError("");
          }}
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white text-sm file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2.5 file:font-semibold file:text-slate-700"
        />
        {resumeFile && (
          <div className="mt-3 space-y-2">
            <label className="flex items-start gap-2.5 text-xs leading-5 text-slate-600">
              <input
                type="checkbox"
                checked={resumeAuthorized}
                onChange={(event) => {
                  const authorized = event.target.checked;
                  setResumeAuthorized(authorized);
                  if (authorized && resumeFile) {
                    void runMatching(profileText, resumeFile, true);
                  }
                }}
                disabled={loading}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#0759AE]"
              />
              <span>
                I authorize sending this resume to Google Gemini for AI-assisted job matching.
                I understand it will not be stored and the recommendations are advisory only.
              </span>
            </label>
            <p role="status" aria-live="polite" className="text-xs font-semibold text-[#0759AE]">
              {loading
                ? "AI is scanning your resume against employer-submitted job requirements..."
                : hasSearched && resumeAuthorized
                  ? "Resume scan complete. Review the matching jobs and their employer requirements below."
                  : "Your resume will be scanned automatically after you authorize AI analysis."}
            </p>
          </div>
        )}

        <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          Or enter your details
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <label htmlFor="job-match-profile" className="text-sm font-bold text-slate-800">
          Skills, experience, qualifications, and preferred work
        </label>
        <textarea
          id="job-match-profile"
          value={profileText}
          onChange={(event) => setProfileText(event.target.value)}
          maxLength={6000}
          rows={6}
          disabled={loading || Boolean(resumeFile)}
          placeholder="For example: Two years of customer service experience, Microsoft Office, bookkeeping NC II, looking for full-time work near Mabini..."
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#0759AE] focus:ring-2 focus:ring-[#0759AE]/15"
        />
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            {resumeFile
              ? "Your resume is scanned after you authorize AI analysis. Use the button to scan it again."
              : "Upload a PDF resume or enter at least 10 characters. For manual entry, do not include your name, address, contact information, or other sensitive details."}
          </p>
          <button
            type="submit"
            disabled={
              loading ||
              (!resumeFile && profileText.trim().length < 10) ||
              (Boolean(resumeFile) && !resumeAuthorized)
            }
            className="shrink-0 rounded-xl bg-[#0759AE] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? "Scanning..." : resumeFile ? "Scan resume again" : "Find my matches"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {hasSearched && matches.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No suitable open vacancies were found from the information provided. Try adding
          more detail about your skills or experience, or review the employer-posted requirements.
        </p>
      )}

      <div className="space-y-4">
        {matches.map((match) => (
          <article
            key={match.job.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{match.job.title}</h3>
                <p className="mt-1 text-sm font-semibold text-[#0759AE]">{match.job.employer}</p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-[#0759AE]">
                {match.match_score}% match
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {match.job.location} · {match.job.type} · {match.job.salary}
            </p>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-slate-800">Employer-provided requirements</h4>
              {match.job.requirements.trim() ? (
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-600">
                  {match.job.requirements
                    .split(/\r?\n/)
                    .map((requirement) => requirement.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
                    .filter(Boolean)
                    .map((requirement, index) => <li key={index}>{requirement}</li>)}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  The employer did not provide specific requirements for this vacancy.
                </p>
              )}
            </div>
            {match.reasons.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-800">Why it may fit</h4>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-600">
                  {match.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
                </ul>
              </div>
            )}
            {match.skill_gaps.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-bold text-slate-800">Consider checking</h4>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-600">
                  {match.skill_gaps.map((gap, index) => <li key={index}>{gap}</li>)}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>

      <p className="text-xs leading-5 text-slate-500">
        AI-generated job recommendations may be incomplete or inaccurate. Review the original
        vacancy and contact PESO Mabini for assistance.
      </p>
    </div>
  );
}
