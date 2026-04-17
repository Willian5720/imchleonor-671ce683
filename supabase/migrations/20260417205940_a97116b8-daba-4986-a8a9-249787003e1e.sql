
-- Remove insert direto de usuários no audit_logs (impede spoofing de logs)
DROP POLICY IF EXISTS "Users can create their own audit logs" ON public.audit_logs;

-- Apenas service_role e admins podem inserir logs.
-- Inserções pelos próprios usuários devem ir via RPC log_user_action (SECURITY DEFINER).
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
