import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DERIV_API_URL = 'wss://ws.derivws.com/websockets/v3';

interface DerivMessage {
  authorize?: { loginid: string; email: string; balance: number; currency: string; is_virtual: number };
  balance?: { balance: number; currency: string };
  transfer_between_accounts?: { accounts: Array<{ loginid: string; balance: number }> };
  error?: { message: string; code: string };
  msg_type?: string;
}

async function connectToDeriv(apiToken: string, appId: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${DERIV_API_URL}?app_id=${appId}`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ authorize: apiToken }));
    };
    
    ws.onmessage = (event) => {
      const data: DerivMessage = JSON.parse(event.data);
      if (data.authorize) {
        resolve(ws);
      } else if (data.error) {
        reject(new Error(data.error.message));
      }
    };
    
    ws.onerror = (error) => {
      reject(error);
    };
    
    setTimeout(() => reject(new Error('Connection timeout')), 10000);
  });
}

async function sendDerivCommand(ws: WebSocket, command: object): Promise<DerivMessage> {
  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      const data: DerivMessage = JSON.parse(event.data);
      ws.removeEventListener('message', handler);
      if (data.error) {
        reject(new Error(data.error.message));
      } else {
        resolve(data);
      }
    };
    
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify(command));
    
    setTimeout(() => {
      ws.removeEventListener('message', handler);
      reject(new Error('Command timeout'));
    }, 10000);
  });
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const derivApiToken = Deno.env.get('DERIV_API_TOKEN')!;
    const derivAppId = Deno.env.get('DERIV_APP_ID')!;
    
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
    
    // Connect to Deriv WebSocket
    let ws: WebSocket | null = null;
    
    try {
      ws = await connectToDeriv(derivApiToken, derivAppId);
      
      switch (action) {
        case 'get_accounts': {
          // Get account info
          const balanceData = await sendDerivCommand(ws, { balance: 1, subscribe: 0 });
          
          return new Response(JSON.stringify({
            success: true,
            balance: balanceData.balance?.balance || 0,
            currency: balanceData.balance?.currency || 'USD',
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
          // Withdraw from Deriv to IMCH
          if (!amount_imch || amount_imch <= 0) {
            throw new Error('Invalid amount');
          }
          
          const amount_usd = amount_imch * IMCH_TO_USD_RATE;
          
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
    } finally {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
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
