
-- Add columns for exchange profile avatars
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bybit_avatar_url text,
ADD COLUMN IF NOT EXISTS deriv_avatar_url text,
ADD COLUMN IF NOT EXISTS binance_avatar_url text,
ADD COLUMN IF NOT EXISTS redotpay_avatar_url text,
ADD COLUMN IF NOT EXISTS bybit_profile_link text,
ADD COLUMN IF NOT EXISTS deriv_profile_link text,
ADD COLUMN IF NOT EXISTS binance_profile_link text,
ADD COLUMN IF NOT EXISTS redotpay_profile_link text;
