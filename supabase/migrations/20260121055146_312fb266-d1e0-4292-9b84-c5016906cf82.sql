-- Tabela para taxas de câmbio em tempo real
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

-- Inserir taxas padrão
INSERT INTO public.exchange_rates (from_currency, to_currency, rate) VALUES
  ('AOA', 'IMCH', 0.001),  -- 1 Kwanza = 0.001 IMCH (1000 AOA = 1 IMCH)
  ('IMCH', 'AOA', 1000),   -- 1 IMCH = 1000 Kwanza
  ('IMCH', 'USD', 0.01),   -- 1 IMCH = 0.01 USD
  ('USD', 'IMCH', 100),    -- 1 USD = 100 IMCH
  ('IMCH', 'ETH', 0.000003), -- 1 IMCH ≈ 0.000003 ETH
  ('ETH', 'IMCH', 333333)  -- 1 ETH ≈ 333333 IMCH
ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = now();

-- Habilitar RLS na tabela
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública das taxas
CREATE POLICY "Exchange rates are publicly readable"
  ON public.exchange_rates FOR SELECT
  USING (true);

-- Apenas admins podem modificar taxas
CREATE POLICY "Admins can manage exchange rates"
  ON public.exchange_rates FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Tabela para endereços de carteira do usuário
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL DEFAULT 'imch', -- 'imch', 'ethereum', 'deriv'
  address TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, wallet_type, address)
);

-- Habilitar RLS na tabela de carteiras
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Políticas para carteiras
CREATE POLICY "Users can view their own wallets"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wallets"
  ON public.user_wallets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Função para gerar endereços únicos no estilo blockchain
CREATE OR REPLACE FUNCTION public.generate_wallet_address(p_prefix TEXT DEFAULT 'imch')
RETURNS TEXT
LANGUAGE plpgsql
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

-- Função para criar endereço de transação único
CREATE OR REPLACE FUNCTION public.generate_transaction_address(p_user_id UUID, p_type TEXT DEFAULT 'deposit')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_address TEXT;
BEGIN
  v_address := generate_wallet_address('imch');
  
  -- Inserir ou retornar endereço existente
  INSERT INTO user_wallets (user_id, wallet_type, address, label, is_primary)
  VALUES (p_user_id, 'imch_' || p_type, v_address, p_type || ' address', false)
  ON CONFLICT (user_id, wallet_type, address) DO NOTHING;
  
  RETURN v_address;
END;
$$;

-- Adicionar coluna para saldo em Kwanza no perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS balance_aoa NUMERIC NOT NULL DEFAULT 0;

-- Função para converter e adicionar saldo
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
  v_result JSONB;
BEGIN
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
  
  v_result := jsonb_build_object(
    'success', true,
    'original_amount', p_amount,
    'from_currency', p_from_currency,
    'converted_amount', v_converted_amount,
    'to_currency', p_to_currency,
    'rate', v_rate
  );
  
  RETURN v_result;
END;
$$;