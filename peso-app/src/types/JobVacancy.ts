export interface OpenJobVacancyRow {
  job_vacancy_id: string;
  position_title: string;
  description: string | null;
  requirements: string | null;
  location: string;
  employment_type: string;
  salary_min: number | string | null;
  salary_max: number | string | null;
  vacancies_available: number;
  date_posted: string;
  deadline: string | null;
  image_url: string | null;
  employer_name: string | null;
  job_classification: "local" | "international";
}

export interface PublicJobVacancyPreviewRow {
  job_vacancy_id: string;
  position_title: string;
  employer_name: string | null;
  job_classification: "local" | "international";
}

export interface JobVacancy {
  job_vacancy_id: string;
  position_title: string;
  location?: string;
  employment_type?: string;
  salary?: string;
  description?: string;
  requirements?: string;
  vacancies_available?: number;
  deadline?: string;
  date_posted?: string;
  image_url?: string | null;
  job_classification?: "local" | "international";

  employer?: {
    name?: string;
  };
}