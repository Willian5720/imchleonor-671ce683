DROP POLICY IF EXISTS "Users can insert their own blockchain transactions" ON public.blockchain_ledger;
DROP POLICY IF EXISTS "Anon can insert security events" ON public.security_events;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
CREATE POLICY "Users can view their own avatar files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);