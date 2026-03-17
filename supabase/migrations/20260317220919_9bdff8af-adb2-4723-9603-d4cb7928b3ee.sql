
-- Fix 1: Add auth guard to create_blockchain_transaction
CREATE OR REPLACE FUNCTION public.create_blockchain_transaction(
  p_user_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_currency text DEFAULT 'IMCH'::text,
  p_from_address text DEFAULT NULL::text,
  p_to_address text DEFAULT NULL::text,
  p_deriv_transaction_id text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_previous_hash TEXT;
  v_block_number INTEGER;
  v_current_hash TEXT;
  v_new_id UUID;
BEGIN
  -- SECURITY: Only allow users to create transactions for themselves
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create blockchain transaction for another user';
  END IF;

  SELECT current_hash, block_number INTO v_previous_hash, v_block_number
  FROM blockchain_ledger
  ORDER BY block_number DESC
  LIMIT 1;

  IF v_previous_hash IS NULL THEN
    v_previous_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    v_block_number := 0;
  END IF;

  v_current_hash := generate_block_hash(
    v_block_number + 1,
    v_previous_hash,
    jsonb_build_object(
      'user_id', p_user_id,
      'type', p_transaction_type,
      'amount', p_amount,
      'currency', p_currency
    )
  );

  INSERT INTO blockchain_ledger (
    previous_hash, current_hash, user_id, transaction_type, amount, currency,
    from_address, to_address, deriv_transaction_id, status, confirmations, metadata
  ) VALUES (
    v_previous_hash, v_current_hash, p_user_id, p_transaction_type, p_amount, p_currency,
    p_from_address, p_to_address, p_deriv_transaction_id, 'confirmed', 6, p_metadata
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Fix 2: Remove direct INSERT policy on user_transfers (all inserts go through transfer_between_users RPC)
DROP POLICY IF EXISTS "Users can create transfers from their account" ON public.user_transfers;
