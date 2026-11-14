export type JobPostEmployerSummary = {
  employer_id: string;
  name: string;
  logo_url: string | null;
};

export type JobSeekerApplicationCount = {
  job_seeker_id: string;
  application_count: number;
};

export type StaffDashboardOverviewCounts = {
  job_posts: number | null;
  applications: number | null;
  employers: number | null;
  job_seekers: number | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Supabase returned an invalid dashboard data row.");
  }

  return value as Record<string, unknown>;
}

function parseCount(value: unknown, nullable = false): number | null {
  if (nullable && value === null) return null;

  const count =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("Supabase returned an invalid dashboard count.");
  }

  return count;
}

export function parseJobPostEmployerSummaries(
  value: unknown,
): JobPostEmployerSummary[] {
  if (!Array.isArray(value)) {
    throw new Error("Supabase returned invalid job post employer summaries.");
  }

  return value.map((item) => {
    const row = asRecord(item);
    if (
      typeof row.employer_id !== "string" ||
      typeof row.name !== "string" ||
      (row.logo_url !== null && typeof row.logo_url !== "string")
    ) {
      throw new Error("Supabase returned an invalid job post employer summary.");
    }

    return {
      employer_id: row.employer_id,
      name: row.name,
      logo_url: row.logo_url,
    };
  });
}

export function parseJobSeekerApplicationCounts(
  value: unknown,
): JobSeekerApplicationCount[] {
  if (!Array.isArray(value)) {
    throw new Error("Supabase returned invalid job seeker application counts.");
  }

  return value.map((item) => {
    const row = asRecord(item);
    if (typeof row.job_seeker_id !== "string") {
      throw new Error("Supabase returned an invalid job seeker application count.");
    }

    return {
      job_seeker_id: row.job_seeker_id,
      application_count: parseCount(row.application_count) ?? 0,
    };
  });
}

export function parseStaffDashboardOverviewCounts(
  value: unknown,
): StaffDashboardOverviewCounts {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("The dashboard overview returned no counts.");
  }

  const row = asRecord(value[0]);
  return {
    job_posts: parseCount(row.job_posts, true),
    applications: parseCount(row.applications, true),
    employers: parseCount(row.employers, true),
    job_seekers: parseCount(row.job_seekers, true),
  };
}
