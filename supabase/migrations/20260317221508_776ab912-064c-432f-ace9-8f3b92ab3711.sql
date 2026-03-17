
-- Fix 1: Revoke direct RPC access to add_balance_with_conversion from authenticated users
-- Only service_role (edge functions) should be able to call it
REVOKE EXECUTE ON FUNCTION public.add_balance_with_conversion FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_balance_with_conversion FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.add_balance_with_conversion FROM anon;

-- Fix 2: Create a trigger to prevent direct updates to coins and balance_aoa on profiles
-- Only SECURITY DEFINER functions (running as owner) can bypass this
CREATE OR REPLACE FUNCTION public.protect_financial_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  -- If coins or balance_aoa changed, block it (direct client updates)
  -- SECURITY DEFINER functions bypass RLS but this trigger runs in the session context
  -- We check if the caller is using the service_role or is the postgres/owner role
  IF (NEW.coins IS DISTINCT FROM OLD.coins OR NEW.balance_aoa IS DISTINCT FROM OLD.balance_aoa) THEN
    -- Allow if called from a SECURITY DEFINER context (service_role key or DB functions)
    IF current_setting('role', true) = 'authenticated' THEN
      RAISE EXCEPTION 'Direct modification of financial columns is not allowed. Use the proper transfer functions.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profiles_financial_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_financial_columns();

-- Fix 3: Create a secure withdraw RPC for the withdrawal flow
CREATE OR REPLACE FUNCTION public.withdraw_imch(
  p_user_id uuid,
  p_amount numeric,
  p_payment_method text DEFAULT 'bank'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance integer;
  v_rate numeric;
  v_aoa_amount numeric;
BEGIN
  -- Auth check
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- Get current balance
  SELECT coins INTO v_current_balance FROM profiles WHERE id = p_user_id;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Get exchange rate
  SELECT rate INTO v_rate FROM exchange_rates WHERE from_currency = 'IMCH' AND to_currency = 'AOA';
  v_aoa_amount := p_amount * COALESCE(v_rate, 0);

  -- Deduct balance
  UPDATE profiles SET coins = coins - p_amount::integer, updated_at = now() WHERE id = p_user_id;

  -- Log the withdrawal
  INSERT INTO audit_logs (user_id, action, entity_type, details)
  VALUES (p_user_id, 'withdraw', 'wallet', jsonb_build_object(
    'amount_imch', p_amount,
    'amount_aoa', v_aoa_amount,
    'payment_method', p_payment_method
  ));

  RETURN jsonb_build_object(
    'success', true,
    'amount_imch', p_amount,
    'amount_aoa', v_aoa_amount,
    'new_balance', v_current_balance - p_amount::integer
  );
END;
$$;
