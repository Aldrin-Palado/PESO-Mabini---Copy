import { useState } from "react";

type Employer = {
  id: number;
  companyName: string;
  industry: string;
  location: string;
  description: string;
};

type JobPost = {
  id: number;
  employerId: number;
  title: string;
  location: string;
  employmentType: string;
  salary: string;
  description: string;
};

// Temporary data for UI development
const employers: Employer[] = [];

const jobPosts: JobPost[] = [];

export default function Employers() {
  const [selectedEmployer, setSelectedEmployer] =
    useState<Employer | null>(null);

  const selectedJobs = selectedEmployer
    ? jobPosts.filter(
        (job) => job.employerId === selectedEmployer.id
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Employers
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Explore employers and their available job opportunities.
              </p>
            </div>

            <div className="rounded-full bg-sky-50 px-4 py-2">
              <span className="text-sm font-semibold text-sky-600">
                Public Employment Service
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Employers List */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Employers
              </h2>

              <p className="text-sm text-slate-500">
                Registered employers
              </p>
            </div>

            {employers.length === 0 ? (

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
                  <span className="text-2xl">🏢</span>
                </div>

                <h3 className="font-semibold text-slate-800">
                  No employers yet
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  There are currently no approved employers to display.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {employers.map((employer) => (

                  <button
                    key={employer.id}
                    onClick={() => setSelectedEmployer(employer)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedEmployer?.id === employer.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                    }`}
                  >

                    <div className="flex items-start gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                        🏢
                      </div>

                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {employer.companyName}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {employer.industry}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          📍 {employer.location}
                        </p>
                      </div>

                    </div>

                  </button>

                ))}

              </div>

            )}

          </section>

          {/* Employer Details + Job Posts */}
          <section className="lg:col-span-2">

            {!selectedEmployer ? (

              <div className="flex min-h-[500px] items-center justify-center rounded-2xl bg-white p-8 shadow-sm">

                <div className="text-center">

                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sky-50">
                    <span className="text-4xl">💼</span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Select an Employer
                  </h2>

                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Select an employer from the list to view their
                    company information and available job vacancies.
                  </p>

                </div>

              </div>

            ) : (

              <div className="space-y-6">

                {/* Employer Profile */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

                  <div className="h-2 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

                  <div className="p-6">

                    <div className="flex items-start gap-5">

                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-3xl">
                        🏢
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                          {selectedEmployer.companyName}
                        </h2>

                        <p className="mt-1 text-sm font-medium text-sky-600">
                          {selectedEmployer.industry}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          📍 {selectedEmployer.location}
                        </p>
                      </div>

                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-5">

                      <h3 className="font-semibold text-slate-900">
                        About the Employer
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {selectedEmployer.description}
                      </p>

                    </div>

                  </div>

                </div>

                {/* Job Posts */}
                <div>

                  <div className="mb-4 flex items-center justify-between">

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Job Vacancies
                      </h2>

                      <p className="text-sm text-slate-500">
                        Available opportunities from this employer
                      </p>
                    </div>

                  </div>

                  {selectedJobs.length === 0 ? (

                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50">
                        <span className="text-2xl">📋</span>
                      </div>

                      <h3 className="font-semibold text-slate-800">
                        No job posts yet
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        This employer currently has no available
                        job vacancies.
                      </p>

                    </div>

                  ) : (

                    <div className="space-y-4">

                      {selectedJobs.map((job) => (

                        <article
                          key={job.id}
                          className="rounded-2xl bg-white p-6 shadow-sm"
                        >

                          <div className="flex items-start justify-between gap-4">

                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                {job.title}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                📍 {job.location}
                              </p>
                            </div>

                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                              Active
                            </span>

                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">

                            <span className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                              {job.employmentType}
                            </span>

                            <span className="rounded-lg bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-700">
                              {job.salary}
                            </span>

                          </div>

                          <p className="mt-4 text-sm leading-6 text-slate-600">
                            {job.description}
                          </p>

                          <button
                            className="mt-5 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                          >
                            View Job
                          </button>

                        </article>

                      ))}

                    </div>

                  )}

                </div>

              </div>

            )}

          </section>

        </div>

      </main>

    </div>
  );
}