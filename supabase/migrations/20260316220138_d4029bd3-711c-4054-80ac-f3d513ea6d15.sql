-- Fix get_user_balance: add caller authorization check
CREATE OR REPLACE FUNCTION public.get_user_balance(user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot view another user''s balance';
  END IF;
  
  RETURN COALESCE((SELECT coins FROM public.profiles WHERE id = user_id), 0);
END;
$function$;

-- Fix log_user_action: add caller authorization check
CREATE OR REPLACE FUNCTION public.log_user_action(p_user_id uuid, p_action text, p_entity_type text DEFAULT NULL::text, p_entity_id text DEFAULT NULL::text, p_details jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id uuid;
BEGIN
  -- Allow service_role (edge functions) to log for any user, but regular users can only log for themselves
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot log actions for another user';
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;