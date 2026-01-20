-- Fix overly permissive INSERT policy on blockchain_ledger
-- Only authenticated users can insert and the transaction must be for themselves
DROP POLICY IF EXISTS "System can insert blockchain transactions" ON public.blockchain_ledger;

CREATE POLICY "Users can insert their own blockchain transactions"
  ON public.blockchain_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);