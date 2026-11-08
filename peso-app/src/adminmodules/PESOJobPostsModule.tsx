import { useCallback, useEffect, useState } from "react";
import MyJobPostModule from "../employersmodules/MyJobPostModule";
import { supabase } from "../services/supabase";
import ModuleScoreboard from "./ModuleScoreboard";

type JobPost = {
  job_vacancy_id: string;
  employer_id: string;
  position_title: string;
  description: string | null;
  requirements: string | null;
  location: string;
  employment_type: string;
  job_classification: "local" | "international";
  salary_min: number | null;
  salary_max: number | null;
  vacancies_available: number;
  status: string;
  date_posted: string;
  deadline: string | null;
  image_url?: string | null;
};

export default function PESOJobPostsModule() {
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [employerName, setEmployerName] = useState("PESO Mabini");
  const [employerLogoUrl, setEmployerLogoUrl] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    const { data: pesoEmployer, error: employerError } = await supabase
      .from("employer")
      .select("employer_id, name, logo_url")
      .eq("is_peso", true)
      .maybeSingle();

    if (employerError) {
      console.error("Could not load the PESO employer profile:", employerError);
      setLoadError(`PESO job posts could not be loaded: ${employerError.message}`);
      setLoading(false);
      return;
    }

    if (!pesoEmployer) {
      setLoadError(
        "The PESO job-posting profile is missing. Apply the latest Supabase migration, then try again.",
      );
      setLoading(false);
      return;
    }

    setEmployerId(pesoEmployer.employer_id);
    setEmployerName(pesoEmployer.name || "PESO Mabini");
    setEmployerLogoUrl(pesoEmployer.logo_url);

    const { data, error } = await supabase
      .from("job_vacancy")
      .select("*")
      .eq("employer_id", pesoEmployer.employer_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load PESO job posts:", error);
      setLoadError(`PESO job posts could not be loaded: ${error.message}`);
      setLoading(false);
      return;
    }

    setJobs((data ?? []) as JobPost[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  if (!employerId && loading) {
    return (
      <p role="status" className="rounded-xl bg-white p-6 text-sm text-slate-600">
        Loading PESO job posts...
      </p>
    );
  }

  if (!employerId) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-3xl font-black text-[#123B70]">PESO Job Posts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage job vacancies posted by PESO staff/admin.
          </p>
        </div>
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => void loadJobs()}
          className="rounded-xl bg-[#0759AE] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#064A91]"
        >
          Try Again
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <ModuleScoreboard
        title="PESO Job Posts"
        metrics={[
          { label: "Total job posts", value: jobs.length },
          { label: "Open", value: jobs.filter((job) => job.status.toLowerCase() === "open").length },
          { label: "Draft", value: jobs.filter((job) => job.status.toLowerCase() === "draft").length },
          { label: "Closed", value: jobs.filter((job) => job.status.toLowerCase() === "closed").length },
        ]}
      />
      {loadError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {loadError}
        </p>
      )}
      <MyJobPostModule
        jobs={jobs}
        employerId={employerId}
        employerName={employerName}
        employerLogoUrl={employerLogoUrl}
        isVerified
        onRefresh={loadJobs}
        publisherTitle="PESO Job Posts"
        publisherDescription="Create and manage job vacancies posted by PESO staff/admin."
      />
    </div>
  );
}
