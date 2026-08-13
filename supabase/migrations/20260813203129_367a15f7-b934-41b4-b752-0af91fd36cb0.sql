-- 1. Column-level protection: hide profiles.phone from regular authenticated reads
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, full_name, avatar_url, user_type, kyc_status, verified, created_at, updated_at)
  ON public.profiles TO authenticated;
GRANT UPDATE, INSERT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Owner can still read their own phone through this definer function
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.profiles WHERE id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.get_my_phone() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;

-- 2. Restrict reviews visibility
DROP POLICY IF EXISTS "Reviews are publicly readable by authed users" ON public.reviews;
CREATE POLICY "Involved parties and admins can view reviews"
ON public.reviews FOR SELECT TO authenticated
USING (
  from_user_id = auth.uid()
  OR to_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.shipments s
    WHERE s.id = reviews.shipment_id
      AND (s.customer_id = auth.uid() OR s.assigned_transporter_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role
  )
);