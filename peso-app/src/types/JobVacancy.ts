export interface JobVacancy {
  job_vacancy_id: string;
  position_title: string;
  location?: string;
  employment_type?: string;
  salary?: string;
  description?: string;
  date_posted?: string;

  employer?: {
    name?: string;
  };
}