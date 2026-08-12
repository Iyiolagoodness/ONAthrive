CREATE TABLE public.admin_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

CREATE INDEX admin_audit_logs_created_at_idx ON public.admin_audit_logs (created_at DESC);