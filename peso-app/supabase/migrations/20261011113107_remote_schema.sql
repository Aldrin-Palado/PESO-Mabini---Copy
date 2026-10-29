SET local check_function_bodies = off;

ALTER TABLE "public"."peso_admin"
  DROP COLUMN "contact_no";

ALTER TABLE "public"."job_seeker"
  ADD COLUMN "is_active" boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
  user_role text;
  user_full_name text;
  user_email text;
BEGIN

  -- Get information from Supabase Auth metadata
  user_role := NEW.raw_user_meta_data->>'role';
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    ''
  );
  user_email := NEW.email;

  -- ==========================================================
  -- JOB SEEKER
  -- ==========================================================
  IF user_role = 'jobseeker' THEN

    INSERT INTO public.job_seeker (
      user_id,
      full_name,
      email,
      is_active
    )
    VALUES (
      NEW.id,
      user_full_name,
      user_email,
      true
    );

  -- ==========================================================
  -- EMPLOYER
  -- ==========================================================
  ELSIF user_role = 'employer' THEN

    INSERT INTO public.employer (
      user_id,
      full_name,
      email,
      contact_person,
      is_active
    )
    VALUES (
      NEW.id,
      user_full_name,
      user_email,
      user_full_name,
      true
    );

  END IF;

  RETURN NEW;

END;
$function$;

CREATE UNIQUE INDEX only_one_peso_admin ON public.peso_admin USING btree ((true));

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Users can create their own job seeker profile" ON "public"."job_seeker"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can update their own job seeker profile" ON "public"."job_seeker"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can view their own job seeker profile" ON "public"."job_seeker"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

