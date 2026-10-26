
import { useState } from "react";
import { supabase } from "../services/supabase";

type JobPost = {
  job_vacancy_id: string;
  employer_id: string;
  position_title: string;
  description: string | null;
  requirements: string | null;
  location: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  vacancies_available: number;
  status: string;
  date_posted: string;
  deadline: string | null;
};

type Props = {
  jobs: JobPost[];
  employerId: string;
  onRefresh: () => Promise<void> | void;
};

type JobForm = {
  position_title: string;
  description: string;
  requirements: string;
  location: string;
  employment_type: string;
  salary_min: string;
  salary_max: string;
  vacancies_available: string;
  deadline: string;
};

const emptyForm: JobForm = {
  position_title: "",
  description: "",
  requirements: "",
  location: "",
  employment_type: "Full-time",
  salary_min: "",
  salary_max: "",
  vacancies_available: "1",
  deadline: "",
};

export default function MyJobPostModule({
  jobs,
  employerId,
  onRefresh,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const updateField = (field: keyof JobForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (job: JobPost) => {
    setEditingId(job.job_vacancy_id);

    setForm({
      position_title: job.position_title ?? "",
      description: job.description ?? "",
      requirements: job.requirements ?? "",
      location: job.location ?? "",
      employment_type: job.employment_type ?? "Full-time",
      salary_min:
        job.salary_min === null ? "" : String(job.salary_min),
      salary_max:
        job.salary_max === null ? "" : String(job.salary_max),
      vacancies_available: String(job.vacancies_available || 1),
      deadline: job.deadline
        ? job.deadline.slice(0, 10)
        : "",
    });

    setMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!employerId) {
      setMessage("Employer account not found.");
      return;
    }

    if (
      form.salary_min !== "" &&
      form.salary_max !== "" &&
      Number(form.salary_min) > Number(form.salary_max)
    ) {
      setMessage("Minimum salary cannot exceed maximum salary.");
      return;
    }

    setSaving(true);
    setMessage("");

    const jobData = {
      employer_id: employerId,
      position_title: form.position_title.trim(),
      description: form.description.trim() || null,
      requirements: form.requirements.trim() || null,
      location: form.location.trim(),
      employment_type: form.employment_type,
      salary_min:
        form.salary_min === ""
          ? null
          : Number(form.salary_min),
      salary_max:
        form.salary_max === ""
          ? null
          : Number(form.salary_max),
      vacancies_available: Math.max(
        1,
        Number(form.vacancies_available) || 1
      ),
      deadline: form.deadline || null,
    };

    const result = editingId
      ? await supabase
          .from("job_vacancy")
          .update(jobData)
          .eq("job_vacancy_id", editingId)
          .eq("employer_id", employerId)
      : await supabase
          .from("job_vacancy")
          .insert({
            ...jobData,
            status: "open",
          });

    setSaving(false);

    if (result.error) {
      setMessage(
        `Failed to save job posting: ${result.error.message}`
      );
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);

    setMessage(
      editingId
        ? "Job posting updated successfully."
        : "Job posting published successfully."
    );

    await onRefresh();
  };

  const handleDelete = async (job: JobPost) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${job.position_title}"?`
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase
      .from("job_vacancy")
      .delete()
      .eq("job_vacancy_id", job.job_vacancy_id)
      .eq("employer_id", employerId);

    if (error) {
      setMessage(`Failed to delete job: ${error.message}`);
      return;
    }

    setMessage("Job posting deleted successfully.");

    await onRefresh();
  };

  const handleStatusChange = async (
    job: JobPost,
    newStatus: string
  ) => {
    setMessage("");

    const { error } = await supabase
      .from("job_vacancy")
      .update({ status: newStatus })
      .eq("job_vacancy_id", job.job_vacancy_id)
      .eq("employer_id", employerId);

    if (error) {
      setMessage(`Failed to update status: ${error.message}`);
      return;
    }

    setMessage("Job status updated successfully.");

    await onRefresh();
  };

  const formatSalary = (job: JobPost) => {
    if (job.salary_min === null && job.salary_max === null) {
      return "Not specified";
    }

    const minimum =
      job.salary_min === null
        ? "Not specified"
        : `₱${job.salary_min.toLocaleString()}`;

    const maximum =
      job.salary_max === null
        ? "Not specified"
        : `₱${job.salary_max.toLocaleString()}`;

    return `${minimum} - ${maximum}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-black text-[#123B70]">
            My Job Posts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage your company's job vacancies.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          + Create Job Post
        </button>

      </div>

      {/* MESSAGE */}

      {message && (
        <div
          role="status"
          className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800"
        >
          {message}
        </div>
      )}

      {/* JOB POST FORM */}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-black text-[#123B70]">
              {editingId
                ? "Edit Job Posting"
                : "Create Job Posting"}
            </h2>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm font-semibold text-slate-500"
            >
              Cancel
            </button>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* JOB TITLE */}

            <label className="text-sm font-semibold text-slate-700">
              Job Title *

              <input
                required
                value={form.position_title}
                onChange={(event) =>
                  updateField(
                    "position_title",
                    event.target.value
                  )
                }
                placeholder="Enter job title"
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              />
            </label>

            {/* LOCATION */}

            <label className="text-sm font-semibold text-slate-700">
              Location *

              <input
                required
                value={form.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                placeholder="Enter job location"
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              />
            </label>

            {/* EMPLOYMENT TYPE */}

            <label className="text-sm font-semibold text-slate-700">
              Employment Type

              <select
                value={form.employment_type}
                onChange={(event) =>
                  updateField(
                    "employment_type",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
                <option value="Internship">Internship</option>
              </select>
            </label>

            {/* VACANCIES */}

            <label className="text-sm font-semibold text-slate-700">
              Available Vacancies *

              <input
                required
                type="number"
                min="1"
                value={form.vacancies_available}
                onChange={(event) =>
                  updateField(
                    "vacancies_available",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              />
            </label>

            {/* MIN SALARY */}

            <label className="text-sm font-semibold text-slate-700">
              Minimum Salary

              <input
                type="number"
                min="0"
                value={form.salary_min}
                onChange={(event) =>
                  updateField("salary_min", event.target.value)
                }
                placeholder="₱"
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              />
            </label>

            {/* MAX SALARY */}

            <label className="text-sm font-semibold text-slate-700">
              Maximum Salary

              <input
                type="number"
                min="0"
                value={form.salary_max}
                onChange={(event) =>
                  updateField("salary_max", event.target.value)
                }
                placeholder="₱"
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              />
            </label>

            {/* DESCRIPTION */}

            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Job Description *

              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Describe the responsibilities of the job"
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              />
            </label>

            {/* REQUIREMENTS */}

            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Job Requirements

              <textarea
                rows={4}
                value={form.requirements}
                onChange={(event) =>
                  updateField("requirements", event.target.value)
                }
                placeholder="Enter qualifications and requirements"
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              />
            </label>

            {/* DEADLINE */}

            <label className="text-sm font-semibold text-slate-700">
              Application Deadline

              <input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  updateField("deadline", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              />
            </label>

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#0446A7] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Save Changes"
                : "Publish Job"}
          </button>

        </form>
      )}

      {/* JOB POSTS */}

      {jobs.length === 0 ? (

        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">

          <h2 className="text-lg font-bold text-[#123B70]">
            No Job Posts Yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create your first job posting to allow job seekers
            to apply.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white"
          >
            Create Job Post
          </button>

        </div>

      ) : (

        <div className="grid gap-5">

          {jobs.map((job) => (

            <article
              key={job.job_vacancy_id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              {/* JOB HEADER */}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <h2 className="text-xl font-black text-[#123B70]">
                    {job.position_title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {job.location}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {job.employment_type}
                  </p>

                </div>

                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                  {job.status}
                </span>

              </div>

              {/* JOB DETAILS */}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    Salary
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatSalary(job)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    Available Vacancies
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {job.vacancies_available}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    Date Posted
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {formatDate(job.date_posted)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    Application Deadline
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {formatDate(job.deadline)}
                  </p>
                </div>

              </div>

              {/* DESCRIPTION */}

              {job.description && (
                <div className="mt-5">

                  <h3 className="text-sm font-bold text-slate-700">
                    Job Description
                  </h3>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {job.description}
                  </p>

                </div>
              )}

              {/* REQUIREMENTS */}

              {job.requirements && (
                <div className="mt-5">

                  <h3 className="text-sm font-bold text-slate-700">
                    Requirements
                  </h3>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {job.requirements}
                  </p>

                </div>
              )}

              {/* ACTIONS */}

              <div className="mt-6 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={() => openEditForm(job)}
                  className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-bold text-[#0446A7] hover:bg-blue-50"
                >
                  Edit
                </button>

                <select
                  aria-label={`Status for ${job.position_title}`}
                  value={job.status}
                  onChange={(event) =>
                    void handleStatusChange(job, event.target.value)
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>

                <button
                  type="button"
                  onClick={() => void handleDelete(job)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>

              </div>

            </article>

          ))}

        </div>

      )}

    </div>
  );
}
