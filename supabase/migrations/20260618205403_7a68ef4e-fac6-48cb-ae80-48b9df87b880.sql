CREATE TABLE public.bot_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  signal text NOT NULL,
  price numeric,
  estimated_value numeric,
  estimated_amount numeric,
  reasons jsonb DEFAULT '[]'::jsonb,
  executed boolean NOT NULL DEFAULT false,
  rejection_reason text,
  order_id text,
  timeframe text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bot_analyses TO authenticated;
GRANT ALL ON public.bot_analyses TO service_role;

ALTER TABLE public.bot_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own analyses"
ON public.bot_analyses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX bot_analyses_user_time_idx ON public.bot_analyses(user_id, created_at DESC);
CREATE INDEX bot_analyses_symbol_idx ON public.bot_analyses(symbol);