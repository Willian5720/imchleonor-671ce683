-- Drop old tables that we're replacing
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.stripe_connected_accounts CASCADE;

-- Create new IMCH system tables

-- Settings table for admin configuration
CREATE TABLE public.imch_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL UNIQUE,
  transfer_threshold_usdt numeric(20, 2) NOT NULL DEFAULT 500,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- IMCH Coins balance table
CREATE TABLE public.imch_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL UNIQUE,
  coins numeric(20, 8) NOT NULL DEFAULT 0,
  last_mining_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Transfer history table
CREATE TABLE public.imch_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  amount_usdt numeric(20, 2) NOT NULL,
  coins_transferred numeric(20, 8) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  bybit_transfer_id text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imch_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imch_transfers ENABLE ROW LEVEL SECURITY;

-- Public read/write for settings (only edge function will access with service key)
CREATE POLICY "Allow edge function access to settings"
ON public.imch_settings
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow edge function access to balances"
ON public.imch_balances
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow edge function access to transfers"
ON public.imch_transfers
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_imch_settings_updated_at
BEFORE UPDATE ON public.imch_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imch_balances_updated_at
BEFORE UPDATE ON public.imch_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();