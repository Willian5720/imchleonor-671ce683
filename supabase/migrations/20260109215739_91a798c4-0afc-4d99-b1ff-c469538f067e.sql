-- Fix profiles table: explicitly block anonymous access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new policies that explicitly require authentication
CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Revoke all grants from anon role for profiles
REVOKE ALL ON public.profiles FROM anon;

-- Fix imch_balances: revoke access from anon and authenticated roles
REVOKE ALL ON public.imch_balances FROM anon;
REVOKE ALL ON public.imch_balances FROM authenticated;

-- Fix imch_settings: revoke access from anon and authenticated roles  
REVOKE ALL ON public.imch_settings FROM anon;
REVOKE ALL ON public.imch_settings FROM authenticated;

-- Fix imch_transfers: revoke access from anon and authenticated roles
REVOKE ALL ON public.imch_transfers FROM anon;
REVOKE ALL ON public.imch_transfers FROM authenticated;