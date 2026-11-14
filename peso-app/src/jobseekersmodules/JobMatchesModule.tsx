import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { invokePesoAI } from "../services/pesoAi";

const maxResumeBytes = 500_000;

function isResumeFileTypeValid(file: File, bytes: Uint8Array) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    return new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  }
  if (extension === "doc") {
    return bytes.subarray(0, 8).join(",") === "208,207,17,224,161,177,26,225";
  }
  return extension === "docx" && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

type PublicJob = {
    id: string;
    title: string;
    employer: string;
    location: string;
    type: string;
    salary: string;
    description: string;
    requirements: string;
};

type JobMatch = {
  job: PublicJob;
  match_score: number;
  reasons: string[];
  skill_gaps: string[];
};

// Documents are verification requirements, not skills to improve.
const employmentDocumentPattern = /\b(?:NBI(?:\s+clearance)?|SSS|PhilHealth|TIN|Pag[- ]?IBIG|police clearance|barangay clearance|government[- ]issued ID|birth certificate)\b/i;

function isPublicJob(value: unknown): value is PublicJob {
  if (!value || typeof value !== "object") return false;
  const job = value as Partial<PublicJob>;
  return typeof job.id === "string" && job.id.length > 0 && typeof job.title === "string";
}

function isJobMatch(value: unknown): value is JobMatch {
  if (!value || typeof value !== "object") return false;
  const match = value as Partial<JobMatch>;
  return Boolean(match.job && typeof match.job.id === "string" && match.job.id &&
    typeof match.job.title === "string" && typeof match.match_score === "number" &&
    Number.isFinite(match.match_score));
}

export default function JobMatchesModule() {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeAuthorized, setResumeAuthorized] = useState(false);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [availableJobs, setAvailableJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [emptyReason, setEmptyReason] = useState("");
  const pendingRef = useRef(false);

  const runMatching = async (resume: File | null, authorized = resumeAuthorized) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setLoading(true);
    setMatches([]);
    setAvailableJobs([]);
    setEmptyReason("");
    setError("");
    setHasSearched(false);

    try {
      if (!resume) {
        throw new Error("Upload a PDF, DOC, or DOCX resume to find job matches.");
      }

      if (!authorized) {
        throw new Error("Please authorize sending your resume for AI analysis.");
      }
      if (resume.size > maxResumeBytes) {
        throw new Error("Resume files must be 500 KB or smaller.");
      }
      const bytes = new Uint8Array(await resume.arrayBuffer());
      if (!isResumeFileTypeValid(resume, bytes)) {
        throw new Error("Choose a valid PDF, DOC, or DOCX resume.");
      }
      let binary = "";
      const chunkSize = 0x8000;
      for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
      }
      const encodedResume = { fileName: resume.name, data: btoa(binary) };

      const result = await invokePesoAI<{ matches: JobMatch[]; available_jobs?: PublicJob[]; reason?: string }>(
        "job-matches",
        { resume: encodedResume },
      );
      if (!result || !Array.isArray(result.matches)) {
        throw new Error("The AI service returned an invalid matching response. Please try again.");
      }
      const validMatches = result.matches.filter(isJobMatch).map((match) => ({
        ...match,
        match_score: Math.max(0, Math.min(100, match.match_score)),
        reasons: Array.isArray(match.reasons) ? match.reasons.filter((r): r is string => typeof r === "string") : [],
        skill_gaps: Array.isArray(match.skill_gaps) ? match.skill_gaps.filter((g): g is string => typeof g === "string") : [],
      })).sort((a, b) => b.match_score - a.match_score);
      if (result.matches.length > 0 && validMatches.length === 0) {
        throw new Error("AI recommendations were returned in an unexpected format. Please try again.");
      }
      const rankedIds = new Set(validMatches.map((match) => match.job.id));
      const fallbackJobs = Array.isArray(result.available_jobs)
        ? result.available_jobs.filter(isPublicJob).filter((job) => !rankedIds.has(job.id))
        : [];
      setMatches(validMatches);
      setAvailableJobs(fallbackJobs);
      if (validMatches.length > 0 || fallbackJobs.length > 0) {
        setEmptyReason("");
      } else if (result.reason === "NO_OPEN_VACANCIES") {
        setEmptyReason("No open vacancies are currently visible to your account. Check Explore Jobs or contact PESO Mabini.");
      } else if (result.reason === "NO_CONFIRMED_MATCHES") {
        setEmptyReason("No suitable AI matches could be confirmed from your information. You can still browse vacancies in Explore Jobs.");
      } else {
        setEmptyReason("No recommendations were returned. The AI service may not have produced usable matches. Please try again or browse Explore Jobs.");
      }
      setHasSearched(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to find job matches right now.",
      );
    } finally {
      pendingRef.current = false;
      setLoading(false);
    }
  };

  const findMatches = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runMatching(resumeFile);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#0759AE]">
          Personalized recommendations
        </p>
        <h2 className="mt-1 text-2xl font-black text-[#123B70]">AI Job Matching</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Upload a PDF, DOC, or DOCX resume to compare your profile with open vacancies
          and employer-submitted requirements. Resume files are sent to Groq AI for
          this analysis and are not stored. Recommendations are not hiring decisions.
        </p>
      </header>

      <form onSubmit={findMatches} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label htmlFor="job-match-resume" className="text-sm font-bold text-slate-800">
          Upload resume (PDF, DOC, or DOCX, up to 500 KB)
        </label>
        <input
          id="job-match-resume"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={loading}
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            setResumeFile(selectedFile);
            setResumeAuthorized(false);
            setMatches([]);
            setAvailableJobs([]);
            setHasSearched(false);
            setEmptyReason("");
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

                }}
                disabled={loading}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#0759AE]"
              />
              <span>
                I authorize sending this resume to Groq AI for AI-assisted job matching.
                I understand it will not be stored and the recommendations are advisory only.
              </span>
            </label>
            <p role="status" aria-live="polite" className="text-xs font-semibold text-[#0759AE]">
              {loading
                ? "AI is scanning your resume against employer-submitted job requirements..."
                : hasSearched && resumeAuthorized
                  ? "Resume scan complete. Review the matching jobs and their employer requirements below."
                  : "After authorizing, click Scan resume to start AI analysis."}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            {resumeFile
              ? "After you authorize AI analysis, scan your resume to see matching jobs."
              : "Upload a PDF, DOC, or DOCX resume to get personalized job matches."}
          </p>
          <button
            type="submit"
            disabled={
              loading ||
              !resumeFile ||
              !resumeAuthorized
            }
            className="shrink-0 rounded-xl bg-[#0759AE] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Scan resume"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {hasSearched && matches.length === 0 && availableJobs.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {emptyReason}
        </p>
      )}

      {hasSearched && availableJobs.length > 0 && (
        <section className="space-y-3" aria-label="Currently open vacancies">
          <div>
            <h3 className="text-lg font-bold text-[#123B70]">Currently open jobs (not AI-ranked)</h3>
            <p className="mt-1 text-sm text-slate-600">
              These vacancies were returned by PESO-Hub, but Groq did not confirm an AI match.
              Review the employer requirements before applying.
            </p>
          </div>
          {availableJobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="font-bold text-slate-900">{job.title}</h4>
              <p className="mt-1 text-sm text-[#0759AE]">{job.employer || "Employer"}</p>
              <p className="mt-2 text-sm text-slate-600">
                {[job.location, job.type, job.salary].filter(Boolean).join(" · ")}
              </p>
              {job.requirements && (
                <details className="mt-3 text-sm text-slate-600">
                  <summary className="cursor-pointer font-semibold">Employer requirements</summary>
                  <p className="mt-2 whitespace-pre-line">{job.requirements}</p>
                </details>
              )}
              <button type="button"
                onClick={() => navigate(`/jobseeker?job=${encodeURIComponent(job.id)}&apply=true`)}
                className="mt-4 rounded-xl bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#064A91]">
                View job / Apply
              </button>
            </article>
          ))}
        </section>
      )}

      <div className="space-y-4">
        {matches.map((match, rank) => {
          const score = match.match_score;
          const skillGaps = match.skill_gaps.filter((gap) => !employmentDocumentPattern.test(gap));
          const scoreColor =
            score >= 75
              ? { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Strong match" }
              : score >= 50
              ? { bar: "bg-[#0759AE]", badge: "bg-blue-50 text-[#0759AE] border-blue-200", label: "Good match" }
              : score >= 25
              ? { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Partial match" }
              : { bar: "bg-slate-400", badge: "bg-slate-50 text-slate-600 border-slate-200", label: "Low match" };

          return (
            <article
              key={match.job.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Score header bar */}
              <div className="h-1.5 w-full bg-slate-100">
                <div
                  className={`h-full transition-all duration-700 ${scoreColor.bar}`}
                  style={{ width: `${score}%` }}
                />
              </div>

              <div className="p-5 sm:p-6">
                {/* Title row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {rank === 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#0759AE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          ★ Best Match
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-slate-900 truncate">{match.job.title}</h3>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#0759AE]">{match.job.employer}</p>
                  </div>

                  {/* Score badge */}
                  <div className={`flex flex-col items-center rounded-2xl border px-4 py-2 ${scoreColor.badge}`}>
                    <span className="text-2xl font-black leading-none">{score}%</span>
                    <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{scoreColor.label}</span>
                  </div>
                </div>

                {/* Score bar with label */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">Qualification match</span>
                    <span className="text-xs font-bold text-slate-700">{score} / 100</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${scoreColor.bar}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Job meta */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[match.job.location, match.job.type, match.job.salary].map((tag, i) => (
                    <span key={i} className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Why it fits */}
                {match.reasons.length > 0 && (
                  <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Why you qualify
                    </h4>
                    <ul className="mt-2 space-y-1">
                      {match.reasons.map((reason, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-emerald-800">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skill gaps */}
                {skillGaps.length > 0 && (
                  <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-3.5">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Qualifications to Improve
                    </h4>
                    <ul className="mt-2 space-y-1">
                      {skillGaps.map((gap, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements */}
                {match.job.requirements.trim() && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700 select-none list-none flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Employer requirements
                    </summary>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600 pl-1">
                      {match.job.requirements
                        .split(/\r?\n/)
                        .map((r) => r.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
                        .filter(Boolean)
                        .map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </details>
                )}

                {/* Apply button */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">AI estimate · not a hiring decision</p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/jobseeker?job=${encodeURIComponent(match.job.id)}&apply=true`)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91] active:scale-95"
                  >
                    Apply now
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-xs leading-5 text-slate-500">
        AI-generated job recommendations may be incomplete or inaccurate. Review the original
        vacancy and contact PESO Mabini for assistance.
      </p>
    </div>
  );
}
