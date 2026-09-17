-- =========================================================================
-- إعداد قاعدة بيانات متجر هاشم للطيب (HASHEM LELTEEB)
-- الصق هذا الكود بالكامل في Supabase SQL Editor واضغط Run
-- =========================================================================

-- 1. تعريف الـ ENUMs
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','customer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending','processing','shipped','delivered','cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. جدول profiles وتحديثه
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- في حال كان الجدول موجوداً مسبقاً، نضيف الحقول الناقصة:
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'customer';
EXCEPTION
  WHEN others THEN null;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- دالة التحقق من دور الأدمن
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role);
$$;

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- دالة إنشاء الملف الشخصي تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.raw_user_meta_data->>'phone',''), 'customer')
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. جدول الأقسام categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories public read" ON public.categories;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories admin write" ON public.categories;
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. جدول المنتجات products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price NUMERIC(12,3) NOT NULL DEFAULT 0,
  cost_price NUMERIC(12,3) NOT NULL DEFAULT 0,
  discount_price NUMERIC(12,3),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products public read" ON public.products;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "products admin write" ON public.products;
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 5. جدول الطلبات orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  map_url TEXT,
  total_amount NUMERIC(12,3) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12,3) NOT NULL DEFAULT 0,
  total_profit NUMERIC(12,3) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders own read" ON public.orders;
CREATE POLICY "orders own read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "orders own insert" ON public.orders;
CREATE POLICY "orders own insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders admin update" ON public.orders;
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 6. جدول عناصر الطلب order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(12,3) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order items read" ON public.order_items;
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

DROP POLICY IF EXISTS "order items insert" ON public.order_items;
CREATE POLICY "order items insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- 7. جدول التنبيهات notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'new_order',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications admin read" ON public.notifications;
CREATE POLICY "notifications admin read" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "notifications insert any auth" ON public.notifications;
CREATE POLICY "notifications insert any auth" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications admin update" ON public.notifications;
CREATE POLICY "notifications admin update" ON public.notifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 8. جدول الفيديوهات الترويجية promotional_videos
CREATE TABLE IF NOT EXISTS public.promotional_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  target_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  cta_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotional_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotional_videos TO authenticated;
GRANT ALL ON public.promotional_videos TO service_role;
ALTER TABLE public.promotional_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo videos public read" ON public.promotional_videos;
CREATE POLICY "promo videos public read" ON public.promotional_videos FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "promo videos admin write" ON public.promotional_videos;
CREATE POLICY "promo videos admin write" ON public.promotional_videos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- دالة تخفيض المخزون
CREATE OR REPLACE FUNCTION public.decrement_stock(_product_id uuid, _qty integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p RECORD;
BEGIN
  UPDATE public.products SET stock_quantity = GREATEST(stock_quantity - _qty, 0) WHERE id = _product_id
  RETURNING * INTO p;
  IF p.id IS NOT NULL AND p.stock_quantity <= p.low_stock_threshold THEN
    INSERT INTO public.notifications (title, message, type)
    VALUES ('Low stock', p.name_en || ' has only ' || p.stock_quantity || ' left in stock.', 'low_stock');
  END IF;
END; $$;

-- سياسات التخزين Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('promo-videos', 'promo-videos', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product images public read" ON storage.objects;
CREATE POLICY "product images public read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product images admin write" ON storage.objects;
CREATE POLICY "product images admin write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "product images admin update" ON storage.objects;
CREATE POLICY "product images admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "product images admin delete" ON storage.objects;
CREATE POLICY "product images admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "promo videos storage read" ON storage.objects;
CREATE POLICY "promo videos storage read" ON storage.objects FOR SELECT USING (bucket_id = 'promo-videos');

DROP POLICY IF EXISTS "promo videos storage insert" ON storage.objects;
CREATE POLICY "promo videos storage insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'promo-videos' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "promo videos storage update" ON storage.objects;
CREATE POLICY "promo videos storage update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'promo-videos' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "promo videos storage delete" ON storage.objects;
CREATE POLICY "promo videos storage delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'promo-videos' AND public.has_role(auth.uid(),'admin'));

-- 9. إدخال الأقسام الأولية (إذا لم تكن موجودة)
INSERT INTO public.categories (name_ar, name_en, slug, image_url) VALUES
 ('عطور فاخرة','Fine Fragrances','fragrances','https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=80'),
 ('بخور ولبان','Incense & Luban','incense','https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200&q=80')
ON CONFLICT (slug) DO NOTHING;

-- 10. إدخال منتجات تجريبية فاخرة
INSERT INTO public.products (name_ar, name_en, description_ar, description_en, price, cost_price, discount_price, stock_quantity, category_id, images, is_featured)
SELECT 
 'عود ملكي فاخر',
 'Royal Oud Elixir',
 'عطر شرقي فخم بلمسات العود المعتق والعنبر والورد الطائفي.',
 'An opulent oriental blend of aged oud, amber and royal rose.',
 129.900, 54.000, 109.900, 12,
 (SELECT id FROM public.categories WHERE slug='fragrances' LIMIT 1),
 ARRAY['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=80'],
 true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name_en = 'Royal Oud Elixir');

INSERT INTO public.products (name_ar, name_en, description_ar, description_en, price, cost_price, discount_price, stock_quantity, category_id, images, is_featured)
SELECT 
 'لبان حوجري ملكي',
 'Royal Hojari Luban',
 'لبان حوجري فاخر منتقى بعناية من أجود أشجار ظفار.',
 'Finest premium Royal Hojari Luban sourced directly from Dhofar.',
 45.000, 18.000, NULL, 25,
 (SELECT id FROM public.categories WHERE slug='incense' LIMIT 1),
 ARRAY['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200&q=80'],
 true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name_en = 'Royal Hojari Luban');

-- 11. جدول إعدادات المتجر store_settings
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo_url TEXT,
  hero_image_url TEXT,
  announcement_bar_text TEXT,
  announcement_text_ar TEXT,
  announcement_text_en TEXT,
  announcement_bar_active BOOLEAN NOT NULL DEFAULT true,
  announcement_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_number TEXT,
  instagram_handle TEXT,
  email TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_recipient_name TEXT,
  bank_phone_transfer TEXT,
  about_title_ar TEXT,
  about_title_en TEXT,
  about_description_ar TEXT,
  about_description_en TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS announcement_bar_text TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS announcement_text_ar TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS announcement_text_en TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS announcement_bar_active BOOLEAN DEFAULT true;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN DEFAULT true;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_name TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_recipient_name TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_phone_transfer TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS about_title_ar TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS about_title_en TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS about_description_ar TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS about_description_en TEXT;
  ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION
  WHEN others THEN null;
END $$;

GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store settings public read" ON public.store_settings;
CREATE POLICY "store settings public read" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "store settings admin write" ON public.store_settings;
CREATE POLICY "store settings admin write" ON public.store_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 12. جدول الفروع branches
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  city_ar TEXT NOT NULL DEFAULT 'سلطنة عمان',
  city_en TEXT NOT NULL DEFAULT 'Oman',
  address_ar TEXT NOT NULL,
  address_en TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '+96877036097',
  map_url TEXT,
  opening_hours_ar TEXT,
  opening_hours_en TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.branches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "branches public read" ON public.branches;
CREATE POLICY "branches public read" ON public.branches FOR SELECT USING (true);

DROP POLICY IF EXISTS "branches admin write" ON public.branches;
CREATE POLICY "branches admin write" ON public.branches FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 13. ترقية الحساب المطلوب إلى أدمن وجعل باقي الحسابات عملاء فقط
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'gfyhhgftyj@gmail.com');

UPDATE public.profiles
SET role = 'customer'
WHERE id NOT IN (SELECT id FROM auth.users WHERE email = 'gfyhhgftyj@gmail.com');


-- =========================================================================
-- ???? ????? ???????? (Lottery & Draw System)
-- =========================================================================

-- 14. ???? ????? ????? lottery_rounds
CREATE TABLE IF NOT EXISTS public.lottery_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  top_winner_id UUID,
  random_winner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

GRANT SELECT ON public.lottery_rounds TO anon;
GRANT SELECT ON public.lottery_rounds TO authenticated;
GRANT ALL ON public.lottery_rounds TO service_role;
ALTER TABLE public.lottery_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lottery_rounds public read" ON public.lottery_rounds;
CREATE POLICY "lottery_rounds public read" ON public.lottery_rounds FOR SELECT USING (true);

DROP POLICY IF EXISTS "lottery_rounds admin write" ON public.lottery_rounds;
CREATE POLICY "lottery_rounds admin write" ON public.lottery_rounds FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 15. ???? ???? ????? lottery_tickets
CREATE TABLE IF NOT EXISTS public.lottery_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  is_used BOOLEAN NOT NULL DEFAULT false,
  round_id UUID REFERENCES public.lottery_rounds(id) ON DELETE CASCADE,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  win_type TEXT, -- 'top', 'random'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT SELECT, UPDATE ON public.lottery_tickets TO anon;
GRANT SELECT, UPDATE ON public.lottery_tickets TO authenticated;
GRANT ALL ON public.lottery_tickets TO service_role;
ALTER TABLE public.lottery_tickets ENABLE ROW LEVEL SECURITY;

-- ?????? ?????? ?????? ?????? (??? ???? ????? ?????? ??? ????? ???? ????? ?????? ??????? ???)
DROP POLICY IF EXISTS "lottery_tickets public read" ON public.lottery_tickets;
CREATE POLICY "lottery_tickets public read" ON public.lottery_tickets FOR SELECT USING (true);

-- ?????? ?????? ?????? ????? ????? ?? (????????)
DROP POLICY IF EXISTS "lottery_tickets public update" ON public.lottery_tickets;
CREATE POLICY "lottery_tickets public update" ON public.lottery_tickets FOR UPDATE USING (true) WITH CHECK (is_used = true);

DROP POLICY IF EXISTS "lottery_tickets admin write" ON public.lottery_tickets;
CREATE POLICY "lottery_tickets admin write" ON public.lottery_tickets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ????? ??? ???? ???? ??? ?? ??? ??????
INSERT INTO public.lottery_rounds (status)
SELECT 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.lottery_rounds WHERE status = 'active');
