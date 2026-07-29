
-- Replace policies that call has_role with inline EXISTS checks against user_roles (self-scoped, safe)

-- shipments admin view
DROP POLICY IF EXISTS "Admins can view all shipments" ON public.shipments;
CREATE POLICY "Admins can view all shipments"
ON public.shipments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role
));

-- user_roles admin view
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role
));

-- profiles admin view (replace the one we just added)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role
));
