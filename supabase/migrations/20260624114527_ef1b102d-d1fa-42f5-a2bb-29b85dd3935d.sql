
-- 1) Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon, grant only where needed
DO $$
DECLARE
  fn text;
  user_callable text[] := ARRAY[
    'has_role(uuid, app_role)',
    'transfer_between_users(uuid, uuid, numeric, text, text)',
    'withdraw_imch(uuid, numeric, text)',
    'get_user_balance(uuid)',
    'add_balance_with_conversion(uuid, numeric, text, text)',
    'create_blockchain_transaction(uuid, text, numeric, text, text, text, text, jsonb)',
    'generate_transaction_address(uuid, text)',
    'log_user_action(uuid, text, text, text, jsonb)'
  ];
  internal_only text[] := ARRAY[
    'handle_new_user()',
    'handle_new_user_role()',
    'update_updated_at_column()',
    'protect_financial_columns()',
    'generate_block_hash(integer, text, jsonb)',
    'generate_wallet_address(text)'
  ];
BEGIN
  FOREACH fn IN ARRAY user_callable LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', fn);
  END LOOP;
  FOREACH fn IN ARRAY internal_only LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
  END LOOP;
END $$;

-- 2) Remove sensitive financial tables from the realtime publication so users cannot
--    subscribe to other users' transaction streams via the realtime channel.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'blockchain_ledger'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.blockchain_ledger';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'deriv_transactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.deriv_transactions';
  END IF;
END $$;
