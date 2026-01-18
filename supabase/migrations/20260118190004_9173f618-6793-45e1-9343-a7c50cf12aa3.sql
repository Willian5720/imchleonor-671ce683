-- Fix profiles table RLS policies to be PERMISSIVE (correct type)
-- First drop the restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;

-- Create proper PERMISSIVE policies (default type)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Verify RLS is enabled on imch_settings (it should already be)
ALTER TABLE public.imch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imch_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imch_transfers ENABLE ROW LEVEL SECURITY;