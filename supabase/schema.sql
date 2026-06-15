-- PRINTBAZAAR PRODUCTION SCHEMA (SUPABASE)

-- 1. PROFILES Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'seller')),
  wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
  ai_credits INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SELLERS & VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_address TEXT,
  gstin TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seller_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  pan_number TEXT,
  aadhaar_number TEXT,
  selfie_url TEXT,
  ocr_data JSONB,
  face_match_score DECIMAL(5, 2),
  risk_score INTEGER,
  status TEXT DEFAULT 'pending_review',
  admin_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS & CATEGORIES
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.product_categories(id),
  base_price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  seller_id UUID REFERENCES public.sellers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS & PAYMENTS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  total_amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid',
  shipping_address JSONB,
  customer_email TEXT,
  customer_phone TEXT,
  cashfree_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  customization_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT, -- Cashfree Payment ID
  method TEXT,
  status TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WALLET & AI CREDITS
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')),
  purpose TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_credit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  amount INTEGER NOT NULL,
  tool TEXT,
  type TEXT CHECK (type IN ('credit', 'debit')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DESIGN SYSTEM
CREATE TABLE IF NOT EXISTS public.generated_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  design_type TEXT,
  image_url TEXT,
  prompt TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. OTP SYSTEM
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT UNIQUE NOT NULL, -- Email or Phone
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  resends INTEGER DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  type TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 9. BULK QUOTES
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  user_email TEXT,
  product TEXT,
  quantity INTEGER,
  specifications JSONB,
  location TEXT,
  estimated_cost DECIMAL(12, 2),
  tax DECIMAL(12, 2),
  shipping DECIMAL(12, 2),
  total DECIMAL(12, 2),
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'quoted', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CASHFREE ORDERS SYNC
CREATE TABLE IF NOT EXISTS public.cashfree_orders (
  order_id TEXT PRIMARY KEY,
  payment_session_id TEXT,
  customer_id TEXT,
  amount DECIMAL(12, 2),
  status TEXT,
  payment_id TEXT,
  verification_result TEXT,
  verified_at TIMESTAMPTZ,
  latest_webhook_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REFRESH TRIGGERS FOR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ATOMIC CREDIT DEDUCTION
CREATE OR REPLACE FUNCTION deduct_ai_credits(p_user_id UUID, p_cost INTEGER, p_tool TEXT)
RETURNS JSONB AS $$
DECLARE
    v_current_credits INTEGER;
    v_balance INTEGER;
BEGIN
    -- 1. Check current balance
    SELECT ai_credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    
    IF v_current_credits IS NULL THEN
        -- Auto-create profile if missing (safe fallback)
        INSERT INTO public.profiles (id, email, ai_credits) 
        SELECT id, email, 10 FROM auth.users WHERE id = p_user_id
        ON CONFLICT (id) DO NOTHING;
        SELECT ai_credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    END IF;

    IF v_current_credits < p_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'balance', v_current_credits);
    END IF;

    -- 2. Deduct
    UPDATE public.profiles SET ai_credits = ai_credits - p_cost, updated_at = NOW() WHERE id = p_user_id
    RETURNING ai_credits INTO v_balance;

    -- 3. Log
    INSERT INTO public.ai_credit_logs (user_id, amount, tool, type)
    VALUES (p_user_id, p_cost, p_tool, 'debit');

    RETURN jsonb_build_object('success', true, 'balance', v_balance);
END;
$$ LANGUAGE plpgsql;

-- ATOMIC WALLET TOPUP
CREATE OR REPLACE FUNCTION topup_wallet(p_user_id UUID, p_amount DECIMAL, p_tx_id TEXT, p_purpose TEXT)
RETURNS JSONB AS $$
DECLARE
    v_new_balance DECIMAL;
BEGIN
    UPDATE public.profiles 
    SET wallet_balance = wallet_balance + p_amount, updated_at = NOW() 
    WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

    INSERT INTO public.wallet_transactions (user_id, amount, type, purpose, reference_id)
    VALUES (p_user_id, p_amount, 'credit', p_purpose, p_tx_id);

    RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;

-- ATOMIC CREDIT TOPUP
CREATE OR REPLACE FUNCTION topup_credits(p_user_id UUID, p_credits INTEGER, p_tx_id TEXT, p_package TEXT)
RETURNS JSONB AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    UPDATE public.profiles 
    SET ai_credits = ai_credits + p_credits, updated_at = NOW() 
    WHERE id = p_user_id
    RETURNING ai_credits INTO v_new_balance;

    INSERT INTO public.ai_credit_logs (user_id, amount, tool, type)
    VALUES (p_user_id, p_credits, 'RECHARGE: ' || p_package, 'credit');

    RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
