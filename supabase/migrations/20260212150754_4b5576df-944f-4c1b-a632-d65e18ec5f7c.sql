
-- Create barbers table
CREATE TABLE public.barbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active barbers" ON public.barbers
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage barbers" ON public.barbers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create business_settings table
CREATE TABLE public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.business_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.business_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seed default settings
INSERT INTO public.business_settings (key, value) VALUES
  ('business_name', 'Barbearia Premium'),
  ('whatsapp_number', '5511999999999'),
  ('opening_time', '09:00'),
  ('closing_time', '19:00'),
  ('lunch_start', '12:00'),
  ('lunch_end', '13:00'),
  ('days_off', '0'),
  ('address', 'Rua Exemplo, 123 - São Paulo, SP');

-- Seed default barbers
INSERT INTO public.barbers (name, specialty, sort_order) VALUES
  ('Carlos', 'Cortes clássicos', 1),
  ('Rafael', 'Degradê e fade', 2),
  ('Lucas', 'Barba artística', 3);

-- Triggers
CREATE TRIGGER update_barbers_updated_at
  BEFORE UPDATE ON public.barbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
