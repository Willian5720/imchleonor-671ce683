-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow edge function access to settings" ON public.imch_settings;
DROP POLICY IF EXISTS "Allow edge function access to balances" ON public.imch_balances;
DROP POLICY IF EXISTS "Allow edge function access to transfers" ON public.imch_transfers;

-- Create service-role-only policies for imch_settings
CREATE POLICY "Service role access to settings"
ON public.imch_settings
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Create service-role-only policies for imch_balances
CREATE POLICY "Service role access to balances"
ON public.imch_balances
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Create service-role-only policies for imch_transfers
CREATE POLICY "Service role access to transfers"
ON public.imch_transfers
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');