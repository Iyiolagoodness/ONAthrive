
-- 1) Restrict profiles SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view counterparties on shared shipments"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shipments s
    WHERE (s.customer_id = auth.uid() AND s.assigned_transporter_id = profiles.id)
       OR (s.assigned_transporter_id = auth.uid() AND s.customer_id = profiles.id)
  )
  OR EXISTS (
    SELECT 1 FROM public.bids b
    JOIN public.shipments s ON s.id = b.shipment_id
    WHERE (s.customer_id = auth.uid() AND b.transporter_id = profiles.id)
       OR (b.transporter_id = auth.uid() AND s.customer_id = profiles.id)
  )
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Revoke EXECUTE on has_role from client roles; keep it usable inside SECURITY DEFINER policies via postgres owner
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
