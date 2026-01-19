-- Create blockchain ledger table for immutable transaction history
CREATE TABLE public.blockchain_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_number SERIAL,
  previous_hash TEXT NOT NULL DEFAULT '',
  current_hash TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'mining', 'deriv_deposit', 'deriv_withdrawal')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IMCH',
  from_address TEXT,
  to_address TEXT,
  deriv_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  confirmations INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create deriv_accounts table to store user Deriv account connections
CREATE TABLE public.deriv_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deriv_account_id TEXT NOT NULL,
  deriv_email TEXT,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_virtual BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, deriv_account_id)
);

-- Create deriv_transactions table for tracking deposits/withdrawals
CREATE TABLE public.deriv_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deriv_account_id TEXT NOT NULL,
  blockchain_ledger_id UUID REFERENCES public.blockchain_ledger(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
  amount_imch NUMERIC NOT NULL,
  amount_usd NUMERIC NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  deriv_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.blockchain_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deriv_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deriv_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blockchain_ledger
CREATE POLICY "Users can view their own blockchain transactions"
  ON public.blockchain_ledger FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert blockchain transactions"
  ON public.blockchain_ledger FOR INSERT
  WITH CHECK (true);

-- RLS Policies for deriv_accounts
CREATE POLICY "Users can view their own Deriv accounts"
  ON public.deriv_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own Deriv accounts"
  ON public.deriv_accounts FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for deriv_transactions
CREATE POLICY "Users can view their own Deriv transactions"
  ON public.deriv_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Deriv transactions"
  ON public.deriv_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to generate block hash
CREATE OR REPLACE FUNCTION public.generate_block_hash(
  p_block_number INTEGER,
  p_previous_hash TEXT,
  p_transaction_data JSONB
) RETURNS TEXT
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN encode(
    sha256(
      (p_block_number::TEXT || p_previous_hash || p_transaction_data::TEXT || now()::TEXT)::BYTEA
    ),
    'hex'
  );
END;
$$;

-- Function to create a new blockchain transaction
CREATE OR REPLACE FUNCTION public.create_blockchain_transaction(
  p_user_id UUID,
  p_transaction_type TEXT,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'IMCH',
  p_from_address TEXT DEFAULT NULL,
  p_to_address TEXT DEFAULT NULL,
  p_deriv_transaction_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_previous_hash TEXT;
  v_block_number INTEGER;
  v_current_hash TEXT;
  v_new_id UUID;
BEGIN
  -- Get the last block
  SELECT current_hash, block_number INTO v_previous_hash, v_block_number
  FROM blockchain_ledger
  ORDER BY block_number DESC
  LIMIT 1;
  
  -- If no previous block, this is genesis
  IF v_previous_hash IS NULL THEN
    v_previous_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    v_block_number := 0;
  END IF;
  
  -- Generate new hash
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
  
  -- Insert new block
  INSERT INTO blockchain_ledger (
    previous_hash,
    current_hash,
    user_id,
    transaction_type,
    amount,
    currency,
    from_address,
    to_address,
    deriv_transaction_id,
    status,
    confirmations,
    metadata
  ) VALUES (
    v_previous_hash,
    v_current_hash,
    p_user_id,
    p_transaction_type,
    p_amount,
    p_currency,
    p_from_address,
    p_to_address,
    p_deriv_transaction_id,
    'confirmed',
    6,
    p_metadata
  )
  RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_deriv_accounts_updated_at
  BEFORE UPDATE ON public.deriv_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.deriv_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blockchain_ledger;