CREATE TABLE public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type public.user_type NOT NULL DEFAULT 'customer',
  nin TEXT NOT NULL,
  driver_license_number TEXT,
  vehicle_reg_number TEXT,
  plate_number TEXT,
  license_path TEXT,
  vehicle_reg_path TEXT,
  portrait_path TEXT,
  selfie_path TEXT NOT NULL,
  face_match_score NUMERIC,
  face_check_passed BOOLEAN NOT NULL DEFAULT false,
  status public.kyc_status NOT NULL DEFAULT 'submitted',
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX kyc_submissions_user_id_idx ON public.kyc_submissions(user_id);
CREATE INDEX kyc_submissions_status_idx ON public.kyc_submissions(status);

GRANT SELECT ON public.kyc_submissions TO authenticated;
GRANT ALL ON public.kyc_submissions TO service_role;

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own KYC submissions"
ON public.kyc_submissions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all KYC submissions"
ON public.kyc_submissions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER trg_kyc_submissions_updated_at
BEFORE UPDATE ON public.kyc_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();