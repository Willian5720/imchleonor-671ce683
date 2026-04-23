-- Prevent two different users from being approved with the same document_number
CREATE UNIQUE INDEX IF NOT EXISTS uniq_kyc_approved_document_number
ON public.kyc_verifications (document_number)
WHERE status = 'approved' AND document_number IS NOT NULL;

-- Index to speed up duplicate lookups during verification
CREATE INDEX IF NOT EXISTS idx_kyc_document_number
ON public.kyc_verifications (document_number)
WHERE document_number IS NOT NULL;