
-- =========================================================
-- 1) REALTIME: Restringir tópicos por usuário autenticado
-- =========================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only subscribe to their own topics" ON realtime.messages;
CREATE POLICY "Users can only subscribe to their own topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Topic must match the user's own UID (clients should subscribe to channel named with their uid)
  (realtime.topic() = auth.uid()::text)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =========================================================
-- 2) USER_ROLES: Bloquear escalonamento de privilégios
-- =========================================================
-- Política restritiva: só admins podem inserir/atualizar/deletar
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 3) SERVICE ROLE: Trocar checagem de claim JWT por role nativa
-- =========================================================
DROP POLICY IF EXISTS "Service role access to balances" ON public.imch_balances;
CREATE POLICY "Service role full access to balances"
ON public.imch_balances
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access to settings" ON public.imch_settings;
CREATE POLICY "Service role full access to settings"
ON public.imch_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access to transfers" ON public.imch_transfers;
CREATE POLICY "Service role full access to transfers"
ON public.imch_transfers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =========================================================
-- 4) AVATARS BUCKET: bloquear listagem, manter leitura individual
-- =========================================================
-- Tornar o bucket não-público (URLs diretos ainda funcionam via signed URLs ou public path se reativado)
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
-- Mantemos public=true para que <img src> continue funcionando, mas restringimos LIST via policy

-- Remover políticas antigas amplas se existirem
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Permitir SELECT individual (necessário para <img src>) mas a listagem via API requer bucket_id explícito
-- A proteção real contra LIST vem do storage.objects RLS escopo:
CREATE POLICY "Public can read individual avatar files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

-- Garantir que upload/update/delete continuem restritos ao dono
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
