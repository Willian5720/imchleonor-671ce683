
-- Create KYC verifications table
CREATE TABLE public.kyc_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  document_type TEXT DEFAULT 'bilhete_identidade',
  document_number TEXT,
  full_name TEXT,
  date_of_birth TEXT,
  document_image_url TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  rejection_reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own KYC
CREATE POLICY "Users can view their own KYC"
ON public.kyc_verifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own KYC
CREATE POLICY "Users can insert their own KYC"
ON public.kyc_verifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending KYC
CREATE POLICY "Users can update their own pending KYC"
ON public.kyc_verifications FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can manage all KYC
CREATE POLICY "Admins can manage all KYC"
ON public.kyc_verifications FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_kyc_updated_at
BEFORE UPDATE ON public.kyc_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
