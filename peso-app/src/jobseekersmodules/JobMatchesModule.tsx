import { useState, type FormEvent } from "react";
import { invokePesoAI } from "../services/pesoAi";

type JobMatch = {
  job: {
    id: string;
    title: string;
    employer: string;
    location: string;
    type: string;
    salary: string;
    description: string;
  };
  match_score: number;
  reasons: string[];
  skill_gaps: string[];
};

export default function JobMatchesModule() {
  const [profileText, setProfileText] = useState("");
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const findMatches = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setHasSearched(false);

    try {
      const result = await invokePesoAI<{ matches: JobMatch[] }>(
        "job-matches",
        { profileText },
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#0759AE]">
          Personalized recommendations
        </p>
        <h2 className="mt-1 text-2xl font-black text-[#123B70]">AI Job Matching</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Share your skills and experience to compare your profile with currently open
          vacancies. The information you enter is sent to Google Gemini to generate
          suggestions; matches are not hiring decisions.
        </p>
      </header>

      <form onSubmit={findMatches} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label htmlFor="job-match-profile" className="text-sm font-bold text-slate-800">
          Skills, experience, qualifications, and preferred work
        </label>
        <textarea
          id="job-match-profile"
          value={profileText}
          onChange={(event) => setProfileText(event.target.value)}
          minLength={10}
          maxLength={6000}
          required
          rows={6}
          placeholder="For example: Two years of customer service experience, Microsoft Office, bookkeeping NC II, looking for full-time work near Mabini..."
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#0759AE] focus:ring-2 focus:ring-[#0759AE]/15"
        />
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            Do not include your name, address, contact information, or other sensitive details.
          </p>
          <button
            type="submit"
            disabled={loading || profileText.trim().length < 10}
            className="shrink-0 rounded-xl bg-[#0759AE] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? "Finding matches..." : "Find my matches"}
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
          more detail about your skills or experience.
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
