
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.user_type AS ENUM ('customer', 'transporter', 'both');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');
CREATE TYPE public.shipment_status AS ENUM (
  'draft', 'open', 'bidding', 'assigned', 'in_transit',
  'delivered', 'completed', 'cancelled', 'disputed'
);
CREATE TYPE public.bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE public.package_type AS ENUM (
  'document', 'parcel_small', 'parcel_medium', 'parcel_large',
  'pallet', 'fragile', 'perishable', 'vehicle', 'other'
);
CREATE TYPE public.transaction_type AS ENUM (
  'deposit', 'withdrawal', 'escrow_hold', 'escrow_release',
  'payout', 'refund', 'fee'
);
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
CREATE TYPE public.escrow_status AS ENUM ('held', 'released', 'refunded');

-- =========================================================
-- SHARED UTILITIES
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  user_type public.user_type NOT NULL DEFAULT 'customer',
  kyc_status public.kyc_status NOT NULL DEFAULT 'pending',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- USER ROLES (stored separately — never on profiles)
-- =========================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- TRANSPORTER PROFILES
-- =========================================================
CREATE TABLE public.transporter_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  bio text,
  vehicle_types text[] NOT NULL DEFAULT '{}',
  plate_number text,
  license_number text,
  service_states text[] NOT NULL DEFAULT '{}',
  base_state text,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  completed_jobs integer NOT NULL DEFAULT 0,
  insured boolean NOT NULL DEFAULT false,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.transporter_profiles TO authenticated;
GRANT ALL ON public.transporter_profiles TO service_role;
ALTER TABLE public.transporter_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporter profiles are viewable by authenticated users"
  ON public.transporter_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Transporters can manage their own profile"
  ON public.transporter_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Transporters can update their own profile"
  ON public.transporter_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER trg_transporter_profiles_updated_at
  BEFORE UPDATE ON public.transporter_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- SHIPMENTS
-- =========================================================
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  package_type public.package_type NOT NULL DEFAULT 'parcel_medium',
  weight_kg numeric(10,2),
  declared_value numeric(12,2),
  budget_ngn numeric(12,2),
  pickup_state text NOT NULL,
  pickup_city text,
  pickup_address text,
  pickup_lat numeric(9,6),
  pickup_lng numeric(9,6),
  dropoff_state text NOT NULL,
  dropoff_city text,
  dropoff_address text,
  dropoff_lat numeric(9,6),
  dropoff_lng numeric(9,6),
  pickup_date date,
  status public.shipment_status NOT NULL DEFAULT 'open',
  assigned_transporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_bid_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipments_customer ON public.shipments(customer_id);
CREATE INDEX idx_shipments_transporter ON public.shipments(assigned_transporter_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_route ON public.shipments(pickup_state, dropoff_state);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Open marketplace: any authed user can see shipments that are open for bidding.
CREATE POLICY "Open shipments are visible to authenticated users"
  ON public.shipments FOR SELECT TO authenticated
  USING (status IN ('open', 'bidding'));
CREATE POLICY "Customers can view their own shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);
CREATE POLICY "Assigned transporters can view their shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (auth.uid() = assigned_transporter_id);
CREATE POLICY "Admins can view all shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers create their own shipments"
  ON public.shipments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers update their own shipments"
  ON public.shipments FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers delete their own shipments"
  ON public.shipments FOR DELETE TO authenticated
  USING (auth.uid() = customer_id AND status IN ('draft', 'open'));

CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- BIDS
-- =========================================================
CREATE TABLE public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  transporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ngn numeric(12,2) NOT NULL,
  message text,
  eta_days integer,
  status public.bid_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shipment_id, transporter_id)
);
CREATE INDEX idx_bids_shipment ON public.bids(shipment_id);
CREATE INDEX idx_bids_transporter ON public.bids(transporter_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bids TO authenticated;
GRANT ALL ON public.bids TO service_role;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters see their own bids"
  ON public.bids FOR SELECT TO authenticated USING (auth.uid() = transporter_id);
CREATE POLICY "Customers see bids on their shipments"
  ON public.bids FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = bids.shipment_id AND s.customer_id = auth.uid()));
CREATE POLICY "Transporters create their own bids"
  ON public.bids FOR INSERT TO authenticated WITH CHECK (auth.uid() = transporter_id);
CREATE POLICY "Transporters update their own bids"
  ON public.bids FOR UPDATE TO authenticated USING (auth.uid() = transporter_id) WITH CHECK (auth.uid() = transporter_id);
CREATE POLICY "Customers can update bid status on their shipments"
  ON public.bids FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = bids.shipment_id AND s.customer_id = auth.uid()));

CREATE TRIGGER trg_bids_updated_at
  BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TRACKING EVENTS
-- =========================================================
CREATE TABLE public.tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.shipment_status NOT NULL,
  note text,
  location text,
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tracking_shipment ON public.tracking_events(shipment_id);
GRANT SELECT, INSERT ON public.tracking_events TO authenticated;
GRANT ALL ON public.tracking_events TO service_role;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties view tracking events"
  ON public.tracking_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shipments s WHERE s.id = tracking_events.shipment_id
      AND (s.customer_id = auth.uid() OR s.assigned_transporter_id = auth.uid())
  ));
CREATE POLICY "Involved parties add tracking events"
  ON public.tracking_events FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = actor_id AND EXISTS (
      SELECT 1 FROM public.shipments s WHERE s.id = tracking_events.shipment_id
        AND (s.customer_id = auth.uid() OR s.assigned_transporter_id = auth.uid())
    )
  );

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shipment_id, from_user_id, to_user_id)
);
CREATE INDEX idx_reviews_to_user ON public.reviews(to_user_id);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reviews_rating_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_reviews_rating_check
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_rating_check();

CREATE POLICY "Reviews are publicly readable by authed users"
  ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reviewers can create their own reviews"
  ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

-- =========================================================
-- WALLETS
-- =========================================================
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_ngn numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own wallet"
  ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TRANSACTIONS
-- =========================================================
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,
  type public.transaction_type NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  amount_ngn numeric(14,2) NOT NULL,
  reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_shipment ON public.transactions(shipment_id);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own transactions"
  ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- ESCROW
-- =========================================================
CREATE TABLE public.escrows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL UNIQUE REFERENCES public.shipments(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_ngn numeric(14,2) NOT NULL,
  status public.escrow_status NOT NULL DEFAULT 'held',
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.escrows TO authenticated;
GRANT ALL ON public.escrows TO service_role;
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties view escrow"
  ON public.escrows FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = transporter_id);

CREATE TRIGGER trg_escrows_updated_at
  BEFORE UPDATE ON public.escrows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- MESSAGES (chat per shipment)
-- =========================================================
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_shipment ON public.messages(shipment_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shipments s WHERE s.id = messages.shipment_id
      AND (s.customer_id = auth.uid() OR s.assigned_transporter_id = auth.uid())
  ));
CREATE POLICY "Involved parties send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.shipments s WHERE s.id = messages.shipment_id
        AND (s.customer_id = auth.uid() OR s.assigned_transporter_id = auth.uid())
    )
  );

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark their notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- NEW USER TRIGGER — auto-create profile, wallet, default role
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'customer')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
