import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../services/supabase";
import { invokePesoAI } from "../services/pesoAi";

type VacancyOption = {
  job_vacancy_id: string;
  position_title: string;
};

type ScreeningResult = {
  summary: string;
  relevant_skills: string[];
  relevant_experience: string[];
  qualifications_evidence: string[];
  gaps_or_unverified: string[];
  match_score: number | null;
  review_notes: string[];
};

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

export default function ResumeScreeningPanel() {
  const [vacancies, setVacancies] = useState<VacancyOption[]>([]);
  const [jobVacancyId, setJobVacancyId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loadingVacancies, setLoadingVacancies] = useState(true);
  const [screening, setScreening] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScreeningResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadVacancies = async () => {
      const { data, error: queryError } = await supabase
        .from("job_vacancy")
        .select("job_vacancy_id, position_title")
        .eq("status", "open")
        .order("date_posted", { ascending: false });

      if (cancelled) return;
      if (queryError) {
        console.error("Resume screening vacancy query failed:", queryError);
        setError(`Unable to load open vacancies: ${queryError.message}`);
      } else {
        setVacancies(data ?? []);
      }
      setLoadingVacancies(false);
    };

    void loadVacancies();
    return () => {
      cancelled = true;
    };
  }, []);

  const screenResume = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !jobVacancyId || !authorized) return;

    setScreening(true);
    setError("");
    setResult(null);

    try {
      if (file.size > 1_000_000) {
        throw new Error("Resume PDF must be 1 MB or smaller.");
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
        throw new Error("The selected file is not a valid PDF document.");
      }

      const response = await invokePesoAI<{
        result: ScreeningResult;
        disclaimer: string;
      }>("resume-screening", {
        jobVacancyId,
        resumeBase64: toBase64(bytes),
      });
      setResult(response.result);
    } catch (screeningError) {
      console.error("Resume screening failed:", screeningError);
      setError(
        screeningError instanceof Error
          ? screeningError.message
          : "Unable to screen this resume. Please try again.",
      );
    } finally {
      setScreening(false);
    }
  };

  return (
    <section className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0759AE]">
          Gemini AI · Staff review aid
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">
          Resume screening
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Compare a candidate&apos;s PDF resume with an open vacancy. The document is sent
          to Google Gemini through the PESO AI Edge Function for analysis and is not stored
          by this screening feature.
        </p>
      </div>

      <form onSubmit={screenResume} className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Vacancy
          <select
            value={jobVacancyId}
            onChange={(event) => setJobVacancyId(event.target.value)}
            required
            disabled={loadingVacancies || vacancies.length === 0 || screening}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0759AE] disabled:bg-slate-100"
          >
            <option value="">
              {loadingVacancies ? "Loading vacancies..." : "Select an open vacancy"}
            </option>
            {vacancies.map((vacancy) => (
              <option key={vacancy.job_vacancy_id} value={vacancy.job_vacancy_id}>
                {vacancy.position_title}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Candidate resume (PDF, up to 1 MB)
          <input
            type="file"
            accept="application/pdf,.pdf"
            required
            disabled={screening}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-sm file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2.5 file:font-semibold file:text-slate-700"
          />
        </label>

        <label className="flex items-start gap-2.5 text-xs leading-5 text-slate-600 lg:col-span-2">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(event) => setAuthorized(event.target.checked)}
            required
            disabled={screening}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#0759AE]"
          />
          <span>
            I am authorized to submit this resume to Google Gemini for AI-assisted review.
            I understand the result is advisory only, and a PESO staff member must review
            the original resume and make all decisions.
          </span>
        </label>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={
              screening ||
              loadingVacancies ||
              vacancies.length === 0 ||
              !file ||
              !jobVacancyId ||
              !authorized
            }
            className="rounded-lg bg-[#0759AE] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {screening ? "Reviewing resume..." : "Screen resume"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">AI review summary</h3>
            {result.match_score !== null && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-[#0759AE]">
                {result.match_score}% estimated match
              </span>
            )}
          </div>
          <p className="text-sm leading-6 text-slate-700">{result.summary}</p>
          <ResultList title="Relevant skills" items={result.relevant_skills} />
          <ResultList title="Relevant experience" items={result.relevant_experience} />
          <ResultList title="Qualifications evidence" items={result.qualifications_evidence} />
          <ResultList title="Gaps or unverified information" items={result.gaps_or_unverified} />
          <ResultList title="Review notes" items={result.review_notes} />
          <p className="border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
            AI-generated review aid only. Review the original resume; do not use this result
            as an automatic hiring or rejection decision.
          </p>
        </div>
      )}
    </section>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-600">
        {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}
