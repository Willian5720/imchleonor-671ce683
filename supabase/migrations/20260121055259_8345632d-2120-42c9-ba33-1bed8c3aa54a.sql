-- Corrigir função generate_wallet_address com search_path
CREATE OR REPLACE FUNCTION public.generate_wallet_address(p_prefix TEXT DEFAULT 'imch')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_address TEXT;
  v_random_part TEXT;
BEGIN
  -- Gerar parte aleatória usando SHA-256
  v_random_part := encode(
    digest(
      gen_random_uuid()::text || now()::text || random()::text,
      'sha256'
    ),
    'hex'
  );
  
  -- Formatar endereço baseado no prefixo
  CASE p_prefix
    WHEN 'eth' THEN
      v_address := '0x' || substring(v_random_part from 1 for 40);
    WHEN 'imch' THEN
      v_address := 'IMCH' || substring(v_random_part from 1 for 36);
    ELSE
      v_address := upper(p_prefix) || substring(v_random_part from 1 for 36);
  END CASE;
  
  RETURN v_address;
END;
$$;