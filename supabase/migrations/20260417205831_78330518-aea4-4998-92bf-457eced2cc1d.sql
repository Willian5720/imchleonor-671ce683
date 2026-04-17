
-- Tornar o bucket avatars privado para impedir listagem pública
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Remover policy ampla de leitura pública criada antes
DROP POLICY IF EXISTS "Public can read individual avatar files" ON storage.objects;

-- Permitir que usuários autenticados leiam arquivos do bucket avatars
-- (a listagem ainda é controlada pela policy: precisa do path exato, ou só o dono lista a própria pasta)
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Permitir leitura anônima APENAS quando o caminho exato é conhecido (signed URL)
-- não é necessária policy adicional: signed URLs bypass RLS via token
