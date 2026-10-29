SET local check_function_bodies = off;

CREATE TABLE "public"."admin_activity_log" (
  "log_id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "admin_id"       uuid                     NOT NULL,
  "peso_staff_id"  uuid,
  "job_seeker_id"  uuid,
  "employer_id"    uuid,
  "application_id" uuid,
  "action"         text                     NOT NULL,
  "details"        jsonb,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY (log_id)
);

ALTER TABLE "public"."admin_activity_log"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."application" (
  "application_id" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "employer_id"    uuid                     NOT NULL,
  "job_seeker_id"  uuid                     NOT NULL,
  "position_title" text,
  "date_applied"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "application_employer_id_job_seeker_id_position_title_key" UNIQUE (employer_id, job_seeker_id, position_title),
  CONSTRAINT "application_pkey" PRIMARY KEY (application_id)
);

ALTER TABLE "public"."application"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."employer" (
  "employer_id"    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid,
  "name"           text                     NOT NULL,
  "address"        text,
  "contact_person" text,
  "contact_no"     text,
  "email"          text,
  "is_verified"    boolean                  NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "employer_email_key" UNIQUE (email),
  CONSTRAINT "employer_pkey" PRIMARY KEY (employer_id),
  CONSTRAINT "employer_user_id_key" UNIQUE (user_id)
);

ALTER TABLE "public"."employer"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."job_seeker" (
  "job_seeker_id" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid,
  "peso_staff_id" uuid,
  "full_name"     text                     NOT NULL,
  "address"       text,
  "contact_no"    text,
  "email"         text,
  "birth_date"    date,
  "resume_url"    text,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "job_seeker_email_key" UNIQUE (email),
  CONSTRAINT "job_seeker_pkey" PRIMARY KEY (job_seeker_id),
  CONSTRAINT "job_seeker_user_id_key" UNIQUE (user_id)
);

ALTER TABLE "public"."job_seeker"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."job_vacancy" (
  "job_vacancy_id"      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "employer_id"         uuid                     NOT NULL,
  "position_title"      text                     NOT NULL,
  "description"         text,
  "requirements"        text,
  "location"            text                     NOT NULL,
  "employment_type"     text                     NOT NULL,
  "salary_min"          numeric(12,2),
  "salary_max"          numeric(12,2),
  "vacancies_available" integer                  NOT NULL DEFAULT 1,
  "status"              text                     NOT NULL DEFAULT 'open'::text,
  "date_posted"         timestamp with time zone NOT NULL DEFAULT now(),
  "deadline"            date,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "job_vacancy_pkey" PRIMARY KEY (job_vacancy_id),
  CONSTRAINT "job_vacancy_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'draft'::text]))),
  CONSTRAINT "job_vacancy_vacancies_available_check" CHECK ((vacancies_available > 0)),
  CONSTRAINT "valid_salary_range" CHECK (((salary_min IS NULL) OR (salary_max IS NULL) OR (salary_max >= salary_min)))
);

ALTER TABLE "public"."job_vacancy"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."peso_admin" (
  "admin_id"   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid,
  "full_name"  text                     NOT NULL,
  "email"      text                     NOT NULL,
  "contact_no" text,
  "is_active"  boolean                  NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "peso_admin_email_key" UNIQUE (email),
  CONSTRAINT "peso_admin_pkey" PRIMARY KEY (admin_id),
  CONSTRAINT "peso_admin_user_id_key" UNIQUE (user_id)
);

ALTER TABLE "public"."peso_admin"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."peso_staff" (
  "peso_staff_id" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid,
  "admin_id"      uuid                     NOT NULL,
  "full_name"     text                     NOT NULL,
  "email"         text                     NOT NULL,
  "contact_no"    text,
  "is_active"     boolean                  NOT NULL DEFAULT true,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "peso_staff_email_key" UNIQUE (email),
  CONSTRAINT "peso_staff_pkey" PRIMARY KEY (peso_staff_id),
  CONSTRAINT "peso_staff_user_id_key" UNIQUE (user_id)
);

ALTER TABLE "public"."peso_staff"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."staff_permissions" (
  "permission_id"      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "peso_staff_id"      uuid                     NOT NULL,
  "dashboard_overview" boolean                  NOT NULL DEFAULT false,
  "analytics"          boolean                  NOT NULL DEFAULT false,
  "job_posts"          boolean                  NOT NULL DEFAULT false,
  "job_application"    boolean                  NOT NULL DEFAULT false,
  "employers"          boolean                  NOT NULL DEFAULT false,
  "job_seekers"        boolean                  NOT NULL DEFAULT false,
  "notifications"      boolean                  NOT NULL DEFAULT false,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "staff_permissions_peso_staff_id_key" UNIQUE (peso_staff_id),
  CONSTRAINT "staff_permissions_pkey" PRIMARY KEY (permission_id)
);

ALTER TABLE "public"."staff_permissions"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."application_status" AS ENUM (
  'pending',
  'under_review',
  'interview',
  'hired',
  'rejected',
  'withdrawn'
);

ALTER TABLE "public"."application"
  ADD COLUMN "status" public.application_status NOT NULL DEFAULT 'pending'::public.application_status;

CREATE TYPE "public"."staff_role" AS ENUM (
  'peso_head',
  'peso_staff'
);

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  AS $function$
  select exists (
    select 1 from public.peso_admin a
    where a.user_id = auth.uid() and a.is_active
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  AS $function$
  select exists (
    select 1 from public.peso_staff s
    where s.user_id = auth.uid() and s.is_active
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  AS $function$
  select public.is_admin() or public.is_staff();
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

ALTER TABLE "public"."admin_activity_log"
  ADD CONSTRAINT "admin_activity_log_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.application(application_id) ON DELETE SET NULL;

ALTER TABLE "public"."admin_activity_log"
  ADD CONSTRAINT "admin_activity_log_employer_id_fkey" FOREIGN KEY (employer_id) REFERENCES public.employer(employer_id) ON DELETE SET NULL;

ALTER TABLE "public"."application"
  ADD CONSTRAINT "application_employer_id_fkey" FOREIGN KEY (employer_id) REFERENCES public.employer(employer_id) ON DELETE CASCADE;

ALTER TABLE "public"."employer"
  ADD CONSTRAINT "employer_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."admin_activity_log"
  ADD CONSTRAINT "admin_activity_log_job_seeker_id_fkey" FOREIGN KEY (job_seeker_id) REFERENCES public.job_seeker(job_seeker_id) ON DELETE SET NULL;

ALTER TABLE "public"."application"
  ADD CONSTRAINT "application_job_seeker_id_fkey" FOREIGN KEY (job_seeker_id) REFERENCES public.job_seeker(job_seeker_id) ON DELETE CASCADE;

ALTER TABLE "public"."job_seeker"
  ADD CONSTRAINT "job_seeker_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."job_vacancy"
  ADD CONSTRAINT "job_vacancy_employer_id_fkey" FOREIGN KEY (employer_id) REFERENCES public.employer(employer_id) ON DELETE CASCADE;

ALTER TABLE "public"."admin_activity_log"
  ADD CONSTRAINT "admin_activity_log_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public.peso_admin(admin_id) ON DELETE CASCADE;

ALTER TABLE "public"."peso_admin"
  ADD CONSTRAINT "peso_admin_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."peso_staff"
  ADD CONSTRAINT "peso_staff_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public.peso_admin(admin_id) ON DELETE RESTRICT;

ALTER TABLE "public"."admin_activity_log"
  ADD CONSTRAINT "admin_activity_log_peso_staff_id_fkey" FOREIGN KEY (peso_staff_id) REFERENCES public.peso_staff(peso_staff_id) ON DELETE SET NULL;

ALTER TABLE "public"."job_seeker"
  ADD CONSTRAINT "job_seeker_peso_staff_id_fkey" FOREIGN KEY (peso_staff_id) REFERENCES public.peso_staff(peso_staff_id) ON DELETE SET NULL;

ALTER TABLE "public"."peso_staff"
  ADD CONSTRAINT "peso_staff_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."staff_permissions"
  ADD CONSTRAINT "staff_permissions_peso_staff_id_fkey" FOREIGN KEY (peso_staff_id) REFERENCES public.peso_staff(peso_staff_id) ON DELETE CASCADE;

CREATE VIEW "public"."v_application_details" AS  SELECT a.application_id,
    a.status,
    a.date_applied,
    a.position_title,
    js.job_seeker_id,
    js.full_name AS job_seeker_name,
    e.employer_id,
    e.name AS employer_name
   FROM ((public.application a
     JOIN public.job_seeker js ON ((js.job_seeker_id = a.job_seeker_id)))
     JOIN public.employer e ON ((e.employer_id = a.employer_id)));

CREATE INDEX idx_application_employer_id ON public.application USING btree (employer_id);

CREATE INDEX idx_application_job_seeker_id ON public.application USING btree (job_seeker_id);

CREATE INDEX idx_application_status ON public.application USING btree (status);

CREATE INDEX idx_job_seeker_staff_id ON public.job_seeker USING btree (peso_staff_id);

CREATE INDEX idx_log_admin_id ON public.admin_activity_log USING btree (admin_id);

CREATE INDEX idx_log_application_id ON public.admin_activity_log USING btree (application_id);

CREATE INDEX idx_log_employer_id ON public.admin_activity_log USING btree (employer_id);

CREATE INDEX idx_log_job_seeker_id ON public.admin_activity_log USING btree (job_seeker_id);

CREATE INDEX idx_log_staff_id ON public.admin_activity_log USING btree (peso_staff_id);

CREATE INDEX idx_peso_staff_admin_id ON public.peso_staff USING btree (admin_id);

CREATE TRIGGER trg_application_updated_at
  BEFORE UPDATE ON public.application
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_employer_updated_at
  BEFORE UPDATE ON public.employer
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_job_seeker_updated_at
  BEFORE UPDATE ON public.job_seeker
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_peso_admin_updated_at
  BEFORE UPDATE ON public.peso_admin
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_peso_staff_updated_at
  BEFORE UPDATE ON public.peso_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Only admin can insert activity log" ON "public"."admin_activity_log"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (public.is_admin());

CREATE POLICY "Only staff/admin can view activity log" ON "public"."admin_activity_log"
  FOR SELECT
  TO PUBLIC
  USING (public.is_staff_or_admin());

CREATE POLICY "Employer updates status of own applications" ON "public"."application"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.employer e
  WHERE ((e.employer_id = application.employer_id) AND (e.user_id = auth.uid())))));

CREATE POLICY "Employer views applications to their postings" ON "public"."application"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.employer e
  WHERE ((e.employer_id = application.employer_id) AND (e.user_id = auth.uid())))));

CREATE POLICY "Job seeker manages own applications" ON "public"."application"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.job_seeker js
  WHERE ((js.job_seeker_id = application.job_seeker_id) AND (js.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.job_seeker js
  WHERE ((js.job_seeker_id = application.job_seeker_id) AND (js.user_id = auth.uid())))));

CREATE POLICY "Staff/Admin manage all applications" ON "public"."application"
  FOR ALL
  TO PUBLIC
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "Employer inserts own profile" ON "public"."employer"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Employer manages own profile" ON "public"."employer"
  FOR UPDATE
  TO PUBLIC
  USING ((user_id = auth.uid()));

CREATE POLICY "Public can view verified employers" ON "public"."employer"
  FOR SELECT
  TO PUBLIC
  USING (((is_verified = true) OR public.is_staff_or_admin() OR (user_id = auth.uid())));

CREATE POLICY "Staff/Admin manage employers" ON "public"."employer"
  FOR ALL
  TO PUBLIC
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "Job seeker manages own profile" ON "public"."job_seeker"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Staff/Admin view & manage job seekers" ON "public"."job_seeker"
  FOR ALL
  TO PUBLIC
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "Public can view open job vacancies" ON "public"."job_vacancy"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((status = 'open'::text));

CREATE POLICY "Admins can update own record" ON "public"."peso_admin"
  FOR UPDATE
  TO PUBLIC
  USING ((user_id = auth.uid()));

CREATE POLICY "Admins can view admin records" ON "public"."peso_admin"
  FOR SELECT
  TO PUBLIC
  USING ((public.is_admin() OR (user_id = auth.uid())));

CREATE POLICY "Admins manage staff" ON "public"."peso_staff"
  FOR ALL
  TO PUBLIC
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Staff can update own record" ON "public"."peso_staff"
  FOR UPDATE
  TO PUBLIC
  USING ((user_id = auth.uid()));

CREATE POLICY "Staff/Admin can view staff records" ON "public"."peso_staff"
  FOR SELECT
  TO PUBLIC
  USING ((public.is_staff_or_admin() OR (user_id = auth.uid())));

CREATE POLICY "Staff can view own permissions" ON "public"."staff_permissions"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.peso_staff ps
  WHERE ((ps.peso_staff_id = staff_permissions.peso_staff_id) AND (ps.user_id = auth.uid())))));

CREATE POLICY "Superadmin can create staff permissions" ON "public"."staff_permissions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.peso_admin pa
  WHERE ((pa.user_id = auth.uid()) AND (pa.is_active = true)))));

CREATE POLICY "Superadmin can update staff permissions" ON "public"."staff_permissions"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.peso_admin pa
  WHERE ((pa.user_id = auth.uid()) AND (pa.is_active = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.peso_admin pa
  WHERE ((pa.user_id = auth.uid()) AND (pa.is_active = true)))));

CREATE POLICY "Superadmin can view staff permissions" ON "public"."staff_permissions"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.peso_admin pa
  WHERE ((pa.user_id = auth.uid()) AND (pa.is_active = true)))));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

COMMENT ON TABLE "public"."admin_activity_log" IS 'Audit trail of admin/staff actions across job seekers, employers, and applications.';

COMMENT ON TABLE "public"."application" IS 'Job applications linking job seekers to employers.';

COMMENT ON TABLE "public"."employer" IS 'Companies posting job openings.';

COMMENT ON TABLE "public"."job_seeker" IS 'Individuals registered as job applicants / clients of PESO.';

COMMENT ON TABLE "public"."peso_admin" IS 'PESO Head / Administrator accounts.';

COMMENT ON TABLE "public"."peso_staff" IS 'PESO staff accounts, each supervised by one admin.';

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_staff"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_staff_or_admin"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admin_activity_log" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."application" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."employer" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."job_seeker" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."job_vacancy" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."peso_admin" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."peso_staff" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."staff_permissions" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."application_status" TO "postgres";

GRANT USAGE ON TYPE "public"."staff_role" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_application_details" TO "anon", "authenticated", "postgres", "service_role";

