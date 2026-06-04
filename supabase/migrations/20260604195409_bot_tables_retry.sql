CREATE TABLE IF NOT EXISTS public.bot_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  max_order_usdt numeric NOT NULL DEFAULT 10,
  max_pct_balance numeric NOT NULL DEFAULT 5,
  stop_loss_pct numeric NOT NULL DEFAULT 2,
  take_profit_pct numeric NOT NULL DEFAULT 4,
  daily_loss_limit numeric NOT NULL DEFAULT 50,
  weekly_loss_limit numeric NOT NULL DEFAULT 200,
  assets text[] NOT NULL DEFAULT ARRAY['BTC/USDT','ETH/USDT','SOL/USDT'],
  timeframe text NOT NULL DEFAULT '1h',
  use_rsi boolean NOT NULL DEFAULT true,
  use_macd boolean NOT NULL DEFAULT true,
  use_ema boolean NOT NULL DEFAULT true,
  use_bollinger boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_settings TO authenticated;
GRANT ALL ON public.bot_settings TO service_role;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_settings_select" ON public.bot_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own_settings_insert" ON public.bot_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own_settings_update" ON public.bot_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.bot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  emoji text,
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bot_logs_user_created_idx ON public.bot_logs(user_id, created_at DESC);
GRANT SELECT ON public.bot_logs TO authenticated;
GRANT ALL ON public.bot_logs TO service_role;
ALTER TABLE public.bot_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_logs_select" ON public.bot_logs FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.bot_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  severity text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bot_notifications_user_idx ON public.bot_notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.bot_notifications TO authenticated;
GRANT ALL ON public.bot_notifications TO service_role;
ALTER TABLE public.bot_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_notif_select" ON public.bot_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own_notif_update" ON public.bot_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
