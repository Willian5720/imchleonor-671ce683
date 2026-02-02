-- Drop and recreate add_balance_with_conversion with authorization check
DROP FUNCTION IF EXISTS public.add_balance_with_conversion(uuid, numeric, text, text);

CREATE OR REPLACE FUNCTION public.add_balance_with_conversion(
  p_user_id UUID,
  p_amount NUMERIC,
  p_from_currency TEXT,
  p_to_currency TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC;
  v_converted_amount NUMERIC;
BEGIN
  -- SECURITY CHECK: Verify the caller is the user being modified
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: You can only modify your own balance'
    );
  END IF;

  -- Buscar taxa de câmbio
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_from_currency AND to_currency = p_to_currency;
  
  IF v_rate IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Exchange rate not found');
  END IF;
  
  v_converted_amount := p_amount * v_rate;
  
  -- Atualizar saldo baseado na moeda de destino
  IF p_to_currency = 'IMCH' THEN
    UPDATE profiles SET coins = coins + v_converted_amount::integer WHERE id = p_user_id;
  ELSIF p_to_currency = 'AOA' THEN
    UPDATE profiles SET balance_aoa = balance_aoa + v_converted_amount WHERE id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'original_amount', p_amount,
    'from_currency', p_from_currency,
    'converted_amount', v_converted_amount,
    'to_currency', p_to_currency,
    'rate', v_rate
  );
END;
$$;