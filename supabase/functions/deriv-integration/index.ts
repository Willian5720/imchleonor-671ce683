import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Secure CORS configuration - only allow trusted origins
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  if (origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')) {
    return true;
  }
  
  if (origin.startsWith('http://localhost:')) {
    return true;
  }
  
  return false;
}

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = isAllowedOrigin(origin) 
    ? origin 
    : 'https://id-preview--9c0d21cf-f928-4ca6-aa56-52434ef1887f.lovable.app';
  return {
    'Access-Control-Allow-Origin': allowedOrigin!,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// deno-lint-ignore no-explicit-any
async function getExchangeRate(supabaseClient: any, from: string, to: string): Promise<number> {
  const { data } = await supabaseClient
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .single();
  
  // deno-lint-ignore no-explicit-any
  return (data as any)?.rate || (from === 'IMCH' && to === 'USD' ? 0.01 : 100);
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { action, amount_imch, amount_aoa, deriv_account_id, to_address } = await req.json();
    
    // Get exchange rates
    const IMCH_TO_USD_RATE = await getExchangeRate(supabase, 'IMCH', 'USD');
    const AOA_TO_IMCH_RATE = await getExchangeRate(supabase, 'AOA', 'IMCH');
    const IMCH_TO_ETH_RATE = await getExchangeRate(supabase, 'IMCH', 'ETH');
    
    // Handle actions that DON'T require Deriv WebSocket connection
    switch (action) {
      case 'get_accounts': {
        // Return simulated/cached balance - no WebSocket needed
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .single();
        
        return new Response(JSON.stringify({
          success: true,
          balance: (profile?.coins || 0) * IMCH_TO_USD_RATE,
          currency: 'USD',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'get_exchange_rates': {
        return new Response(JSON.stringify({
          success: true,
          rates: {
            IMCH_TO_USD: IMCH_TO_USD_RATE,
            AOA_TO_IMCH: AOA_TO_IMCH_RATE,
            IMCH_TO_ETH: IMCH_TO_ETH_RATE,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'add_balance_aoa': {
        // SECURITY: Only admins can credit AOA balances
        const { data: isAdminAoa } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        if (!isAdminAoa) {
          return new Response(JSON.stringify({ error: 'Unauthorized: Admin only action' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Converter AOA para IMCH e adicionar ao saldo
        if (!amount_aoa || amount_aoa <= 0) {
          throw new Error('Invalid amount');
        }
        
        const imchAmount = amount_aoa * AOA_TO_IMCH_RATE;
        
        // Atualizar saldo do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .single();
        
        await supabase
          .from('profiles')
          .update({ coins: (profile?.coins || 0) + Math.floor(imchAmount) })
          .eq('id', user.id);
        
        // Gerar endereço de transação
        const { data: txAddress } = await supabase.rpc('generate_transaction_address', {
          p_user_id: user.id,
          p_type: 'deposit'
        });
        
        // Criar registro na blockchain
        const { data: blockchainTx } = await supabase.rpc('create_blockchain_transaction', {
          p_user_id: user.id,
          p_transaction_type: 'aoa_deposit',
          p_amount: imchAmount,
          p_currency: 'IMCH',
          p_to_address: txAddress || 'imch_wallet',
          p_metadata: { 
            amount_aoa,
            exchange_rate: AOA_TO_IMCH_RATE,
            source: 'kwanza_conversion'
          }
        });
        
        // Log audit
        await supabase.rpc('log_user_action', {
          p_user_id: user.id,
          p_action: 'aoa_deposit',
          p_entity_type: 'blockchain_transaction',
          p_entity_id: blockchainTx,
          p_details: { amount_aoa, amount_imch: imchAmount }
        });
        
        return new Response(JSON.stringify({
          success: true,
          amount_aoa,
          amount_imch: imchAmount,
          blockchain_hash: blockchainTx,
          tx_address: txAddress,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'deposit': {
        // Convert IMCH to USD and simulate deposit to Deriv
        if (!amount_imch || amount_imch <= 0) {
          throw new Error('Invalid amount');
        }
        
        const amount_usd = amount_imch * IMCH_TO_USD_RATE;
        
        // Check user balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .single();
        
        if (!profile || profile.coins < amount_imch) {
          throw new Error('Insufficient IMCH balance');
        }
        
        // Generate unique addresses for the transaction
        const { data: fromAddress } = await supabase.rpc('generate_wallet_address', { p_prefix: 'imch' });
        const { data: toAddressGen } = await supabase.rpc('generate_wallet_address', { p_prefix: 'eth' });
        
        // Deduct IMCH from user
        await supabase
          .from('profiles')
          .update({ coins: profile.coins - amount_imch })
          .eq('id', user.id);
        
        // Create blockchain transaction with addresses
        const { data: blockchainTx } = await supabase.rpc('create_blockchain_transaction', {
          p_user_id: user.id,
          p_transaction_type: 'deriv_deposit',
          p_amount: amount_imch,
          p_currency: 'IMCH',
          p_from_address: fromAddress,
          p_to_address: to_address || toAddressGen || 'deriv_main',
          p_metadata: { 
            amount_usd, 
            exchange_rate: IMCH_TO_USD_RATE,
            eth_equivalent: amount_imch * IMCH_TO_ETH_RATE
          }
        });
        
        // Record the transaction
        const { data: transaction } = await supabase
          .from('deriv_transactions')
          .insert({
            user_id: user.id,
            deriv_account_id: deriv_account_id || 'default',
            blockchain_ledger_id: blockchainTx,
            transaction_type: 'deposit',
            amount_imch,
            amount_usd,
            exchange_rate: IMCH_TO_USD_RATE,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        // Log audit
        await supabase.rpc('log_user_action', {
          p_user_id: user.id,
          p_action: 'deriv_deposit',
          p_entity_type: 'deriv_transaction',
          p_entity_id: transaction?.id,
          p_details: { amount_imch, amount_usd, from_address: fromAddress, to_address: to_address || toAddressGen }
        });
        
        return new Response(JSON.stringify({
          success: true,
          transaction_id: transaction?.id,
          amount_imch,
          amount_usd,
          blockchain_hash: blockchainTx,
          from_address: fromAddress,
          to_address: to_address || toAddressGen,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'withdraw': {
        // Withdraw from Deriv balance back to IMCH wallet.
        // SECURITY: A user can only withdraw up to the USD equivalent currently
        // credited on Deriv for their own account (tracked via deriv_transactions).
        if (!amount_imch || amount_imch <= 0) {
          throw new Error('Invalid amount');
        }

        const amount_usd = amount_imch * IMCH_TO_USD_RATE;

        // Compute available Deriv balance = sum(deposits) - sum(withdrawals)
        const { data: derivTxs } = await supabase
          .from('deriv_transactions')
          .select('transaction_type, amount_usd, status')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        const depositedUsd = (derivTxs || [])
          .filter((t) => t.transaction_type === 'deposit')
          .reduce((acc, t) => acc + Number(t.amount_usd), 0);
        const withdrawnUsd = (derivTxs || [])
          .filter((t) => t.transaction_type === 'withdrawal')
          .reduce((acc, t) => acc + Number(t.amount_usd), 0);
        const availableUsd = Math.max(0, depositedUsd - withdrawnUsd);

        if (amount_usd > availableUsd + 1e-6) {
          return new Response(JSON.stringify({
            error: `Saldo Deriv insuficiente. Disponível: $${availableUsd.toFixed(2)} USD. Faça um depósito primeiro.`,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Generate unique addresses for the transaction
        const { data: fromAddress } = await supabase.rpc('generate_wallet_address', { p_prefix: 'eth' });
        const { data: toAddressGen } = await supabase.rpc('generate_wallet_address', { p_prefix: 'imch' });
        
        // Create blockchain transaction with addresses
        const { data: blockchainTx } = await supabase.rpc('create_blockchain_transaction', {
          p_user_id: user.id,
          p_transaction_type: 'deriv_withdrawal',
          p_amount: amount_imch,
          p_currency: 'IMCH',
          p_from_address: fromAddress || 'deriv_main',
          p_to_address: to_address || toAddressGen,
          p_metadata: { 
            amount_usd, 
            exchange_rate: IMCH_TO_USD_RATE,
            eth_equivalent: amount_imch * IMCH_TO_ETH_RATE
          }
        });
        
        // Add IMCH to user
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .single();
        
        await supabase
          .from('profiles')
          .update({ coins: (profile?.coins || 0) + amount_imch })
          .eq('id', user.id);
        
        // Record the transaction
        const { data: transaction } = await supabase
          .from('deriv_transactions')
          .insert({
            user_id: user.id,
            deriv_account_id: deriv_account_id || 'default',
            blockchain_ledger_id: blockchainTx,
            transaction_type: 'withdrawal',
            amount_imch,
            amount_usd,
            exchange_rate: IMCH_TO_USD_RATE,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        // Log audit
        await supabase.rpc('log_user_action', {
          p_user_id: user.id,
          p_action: 'deriv_withdrawal',
          p_entity_type: 'deriv_transaction',
          p_entity_id: transaction?.id,
          p_details: { amount_imch, amount_usd, from_address: fromAddress, to_address: to_address || toAddressGen }
        });
        
        return new Response(JSON.stringify({
          success: true,
          transaction_id: transaction?.id,
          amount_imch,
          amount_usd,
          blockchain_hash: blockchainTx,
          from_address: fromAddress,
          to_address: to_address || toAddressGen,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'history': {
        // Get transaction history
        const { data: transactions } = await supabase
          .from('deriv_transactions')
          .select('*, blockchain_ledger(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        return new Response(JSON.stringify({
          success: true,
          transactions: transactions || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'blockchain_history': {
        // Get blockchain ledger
        const { data: blocks } = await supabase
          .from('blockchain_ledger')
          .select('*')
          .eq('user_id', user.id)
          .order('block_number', { ascending: false })
          .limit(100);
        
        return new Response(JSON.stringify({
          success: true,
          blocks: blocks || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Deriv integration error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
