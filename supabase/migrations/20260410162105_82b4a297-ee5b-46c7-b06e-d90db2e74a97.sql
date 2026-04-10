DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (customer_email = auth.email());