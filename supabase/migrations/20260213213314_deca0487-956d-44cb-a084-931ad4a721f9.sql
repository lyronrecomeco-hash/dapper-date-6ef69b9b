
-- Products table for store/marketplace
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Admins can select all products" ON public.products FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prize wheel configuration table
CREATE TABLE public.prize_wheel_slices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎁',
  discount_percent NUMERIC,
  discount_value NUMERIC,
  custom_prize TEXT,
  probability INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prize_wheel_slices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active slices" ON public.prize_wheel_slices FOR SELECT USING (active = true);
CREATE POLICY "Admins can select all slices" ON public.prize_wheel_slices FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert slices" ON public.prize_wheel_slices FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update slices" ON public.prize_wheel_slices FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete slices" ON public.prize_wheel_slices FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_prize_wheel_slices_updated_at BEFORE UPDATE ON public.prize_wheel_slices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Store enabled setting (admin toggle)
INSERT INTO public.business_settings (key, value) VALUES ('store_enabled', 'false') ON CONFLICT DO NOTHING;
INSERT INTO public.business_settings (key, value) VALUES ('prize_wheel_enabled', 'false') ON CONFLICT DO NOTHING;
