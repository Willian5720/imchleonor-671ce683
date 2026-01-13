-- Add profile fields for user profile display
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text;

-- Create user-to-user transfers table
CREATE TABLE public.user_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USDT',
  note text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT different_users CHECK (from_user_id != to_user_id)
);

-- Enable RLS
ALTER TABLE public.user_transfers ENABLE ROW LEVEL SECURITY;

-- Users can view transfers they sent or received
CREATE POLICY "Users can view their own transfers"
ON public.user_transfers
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create transfers from their own account
CREATE POLICY "Users can create transfers from their account"
ON public.user_transfers
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_transfers_from ON public.user_transfers(from_user_id);
CREATE INDEX idx_user_transfers_to ON public.user_transfers(to_user_id);
CREATE INDEX idx_user_transfers_created ON public.user_transfers(created_at DESC);

-- Create function to get user balance (coins from profiles)
CREATE OR REPLACE FUNCTION public.get_user_balance(user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(coins, 0) FROM public.profiles WHERE id = user_id;
$$;

-- Create function to transfer between users
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