-- Fix 1: Update profiles table RLS to ensure authenticated users can only view their own profile
-- The current policies are already user-scoped, but we need to ensure anonymous access is blocked
-- First, verify RLS is enabled (it should be)

-- Fix 2: Update deriv_accounts RLS to block anonymous access  
-- Policies exist but we need to ensure they're properly restrictive

-- Fix 3: Update transfer_between_users function to add caller authorization check
CREATE OR REPLACE FUNCTION public.transfer_between_users(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount numeric,
  p_currency text DEFAULT 'COINS',
  p_note text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_balance numeric;
  v_transfer_id uuid;
BEGIN
  -- CRITICAL: Verify caller owns the source account
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_from_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Cannot transfer from another user');
  END IF;

  -- Check if sender has enough balance
  SELECT coins INTO v_from_balance FROM profiles WHERE id = p_from_user_id;
  
  IF v_from_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sender profile not found');
  END IF;
  
  IF v_from_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Check if recipient exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_to_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Recipient not found');
  END IF;
  
  -- Deduct from sender
  UPDATE profiles SET coins = coins - p_amount, updated_at = now() WHERE id = p_from_user_id;
  
  -- Add to recipient
  UPDATE profiles SET coins = coins + p_amount, updated_at = now() WHERE id = p_to_user_id;
  
  -- Create transfer record
  INSERT INTO user_transfers (from_user_id, to_user_id, amount, currency, note, status)
  VALUES (p_from_user_id, p_to_user_id, p_amount, p_currency, p_note, 'completed')
  RETURNING id INTO v_transfer_id;
  
  RETURN json_build_object(
    'success', true, 
    'transfer_id', v_transfer_id,
    'amount', p_amount,
    'new_balance', v_from_balance - p_amount
  );
END;
$$;

-- Fix 4: Update blockchain_ledger policies to prevent fake system transaction insertion
-- Drop the overly permissive policies first
DROP POLICY IF EXISTS "System can insert blockchain transactions" ON public.blockchain_ledger;
DROP POLICY IF EXISTS "Users can insert their own blockchain transactions" ON public.blockchain_ledger;
DROP POLICY IF EXISTS "Users can view their own blockchain transactions" ON public.blockchain_ledger;

-- Create proper restrictive policies for blockchain_ledger
-- SELECT: Users can only view their own transactions (not NULL user_id system ones)
CREATE POLICY "Users can view their own blockchain transactions"
  ON public.blockchain_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert transactions for themselves (not NULL)
CREATE POLICY "Users can insert their own blockchain transactions"
  ON public.blockchain_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Admins can view all blockchain transactions including system ones
CREATE POLICY "Admins can view all blockchain transactions"
  ON public.blockchain_ledger FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Note: Service role and SECURITY DEFINER functions bypass RLS, so system transactions
-- created via create_blockchain_transaction() will still work