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

  employer?: {
    name?: string;
  };
}