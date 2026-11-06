CREATE UNIQUE INDEX idx_peso_staff_email_lower_unique
ON public.peso_staff (lower(btrim(email)));
