
-- Create saved_job table
CREATE TABLE public.saved_job (
    saved_job_id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    job_seeker_id uuid NOT NULL,
    job_vacancy_id uuid NOT NULL,

    CONSTRAINT saved_job_pkey
        PRIMARY KEY (saved_job_id),

    CONSTRAINT saved_job_job_seeker_id_fkey
        FOREIGN KEY (job_seeker_id)
        REFERENCES public.job_seeker (job_seeker_id)
        ON DELETE CASCADE,

    CONSTRAINT saved_job_job_vacancy_id_fkey
        FOREIGN KEY (job_vacancy_id)
        REFERENCES public.job_vacancy (job_vacancy_id)
        ON DELETE CASCADE,

    CONSTRAINT saved_job_job_seeker_id_job_vacancy_id_key
        UNIQUE (job_seeker_id, job_vacancy_id)
);

-- Create index for job seeker lookups
CREATE INDEX idx_saved_job_job_seeker
ON public.saved_job USING btree (job_seeker_id);

-- Enable Row Level Security
ALTER TABLE public.saved_job ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own saved jobs
CREATE POLICY "Users can view their saved jobs"
ON public.saved_job
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.job_seeker AS js
        WHERE js.job_seeker_id = saved_job.job_seeker_id
          AND js.user_id = (SELECT auth.uid())
    )
);

-- Allow users to save jobs to their own account
CREATE POLICY "Users can save their own jobs"
ON public.saved_job
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.job_seeker AS js
        WHERE js.job_seeker_id = saved_job.job_seeker_id
          AND js.user_id = (SELECT auth.uid())
    )
);

-- Allow users to remove their own saved jobs
CREATE POLICY "Users can remove their saved jobs"
ON public.saved_job
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.job_seeker AS js
        WHERE js.job_seeker_id = saved_job.job_seeker_id
          AND js.user_id = (SELECT auth.uid())
    )
);
