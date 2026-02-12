-- Fix: appointments SELECT policies - need at least one PERMISSIVE policy
-- Drop the restrictive admin select and recreate as permissive
DROP POLICY IF EXISTS "Admins can view appointments" ON public.appointments;
CREATE POLICY "Admins can view appointments"
  ON public.appointments
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix: appointments UPDATE
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
CREATE POLICY "Admins can update appointments"
  ON public.appointments
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix: appointments DELETE
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
  ON public.appointments
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix: appointments INSERT - make permissive
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
CREATE POLICY "Anyone can create appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (true);

-- Fix: services SELECT policies
DROP POLICY IF EXISTS "Admins can select all services" ON public.services;
CREATE POLICY "Admins can select all services"
  ON public.services
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services"
  ON public.services
  FOR SELECT
  USING (active = true);

-- Fix: services management policies
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
CREATE POLICY "Admins can insert services"
  ON public.services
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update services" ON public.services;
CREATE POLICY "Admins can update services"
  ON public.services
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services"
  ON public.services
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix: barbers policies
DROP POLICY IF EXISTS "Admins can manage barbers" ON public.barbers;
CREATE POLICY "Admins can manage barbers"
  ON public.barbers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view active barbers" ON public.barbers;
CREATE POLICY "Anyone can view active barbers"
  ON public.barbers
  FOR SELECT
  USING (active = true);

-- Fix: business_settings policies
DROP POLICY IF EXISTS "Admins can manage settings" ON public.business_settings;
CREATE POLICY "Admins can manage settings"
  ON public.business_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view settings" ON public.business_settings;
CREATE POLICY "Anyone can view settings"
  ON public.business_settings
  FOR SELECT
  USING (true);

-- Fix: coupons policies
DROP POLICY IF EXISTS "Admins can manage coupons select" ON public.coupons;
CREATE POLICY "Admins can manage coupons select"
  ON public.coupons
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
CREATE POLICY "Anyone can read active coupons"
  ON public.coupons
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
CREATE POLICY "Admins can insert coupons"
  ON public.coupons
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
CREATE POLICY "Admins can update coupons"
  ON public.coupons
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
CREATE POLICY "Admins can delete coupons"
  ON public.coupons
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix: user_roles policies
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
CREATE POLICY "Admins can view roles"
  ON public.user_roles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "No direct role inserts" ON public.user_roles;
CREATE POLICY "No direct role inserts"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "No role updates" ON public.user_roles;
CREATE POLICY "No role updates"
  ON public.user_roles
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));