import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { encode as encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BYBIT_API_KEY = Deno.env.get('BYBIT_API_KEY');
const BYBIT_SECRET_KEY = Deno.env.get('BYBIT_SECRET_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Generate HMAC signature for Bybit API
async function generateSignature(params: Record<string, string>, timestamp: string, recvWindow: string): Promise<string> {
  const queryString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const preSign = `${timestamp}${BYBIT_API_KEY}${recvWindow}${queryString}`;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(BYBIT_SECRET_KEY);
  const messageData = encoder.encode(preSign);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  const hexBytes = encodeHex(new Uint8Array(signature));
  return new TextDecoder().decode(hexBytes);
}

// Transfer USDT to Bybit funding account
async function transferToFunding(amount: string): Promise<{ success: boolean; transferId?: string; error?: string }> {
  try {
    const timestamp = Date.now().toString();
    const recvWindow = "5000";
    
    // Internal transfer parameters
    const params: Record<string, string> = {
      transferId: crypto.randomUUID(),
      coin: "USDT",
      amount: amount,
      fromAccountType: "UNIFIED",
      toAccountType: "FUND",
    };
    
    const signature = await generateSignature(params, timestamp, recvWindow);
    
    const response = await fetch("https://api.bybit.com/v5/asset/transfer/inter-transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BAPI-API-KEY": BYBIT_API_KEY!,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": recvWindow,
        "X-BAPI-SIGN": signature,
      },
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log("Bybit transfer response:", data);
    
    if (data.retCode === 0) {
      return { success: true, transferId: data.result?.transferId || params.transferId };
    } else {
      return { success: false, error: data.retMsg || "Transfer failed" };
    }
  } catch (error) {
    console.error("Bybit transfer error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const body = await req.json();
    const { action, coins, threshold } = body;
    
    console.log("Request received:", { action, coins, threshold });
    
    // Validate admin email is configured
    if (!ADMIN_EMAIL) {
      throw new Error("ADMIN_EMAIL not configured");
    }
    
    if (!BYBIT_API_KEY || !BYBIT_SECRET_KEY) {
      throw new Error("Bybit API credentials not configured");
    }

    if (action === "get_balance") {
      // Get current balance
      const { data, error } = await supabase
        .from('imch_balances')
        .select('coins')
        .eq('admin_email', ADMIN_EMAIL)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return new Response(JSON.stringify({
        success: true,
        coins: data?.coins || 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === "add_coins") {
      const coinsToAdd = Number(coins) || 1;
      
      // Upsert balance
      const { data: existing } = await supabase
        .from('imch_balances')
        .select('coins')
        .eq('admin_email', ADMIN_EMAIL)
        .single();
      
      const newBalance = (Number(existing?.coins) || 0) + coinsToAdd;
      
      const { error } = await supabase
        .from('imch_balances')
        .upsert({
          admin_email: ADMIN_EMAIL,
          coins: newBalance,
          last_mining_at: new Date().toISOString(),
        }, { onConflict: 'admin_email' });
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        coins: newBalance,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === "get_settings") {
      const { data, error } = await supabase
        .from('imch_settings')
        .select('transfer_threshold_usdt')
        .eq('admin_email', ADMIN_EMAIL)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return new Response(JSON.stringify({
        success: true,
        threshold: data?.transfer_threshold_usdt || 500,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === "update_settings") {
      const newThreshold = Number(threshold);
      if (isNaN(newThreshold) || newThreshold <= 0) {
        throw new Error("Invalid threshold value");
      }
      
      const { error } = await supabase
        .from('imch_settings')
        .upsert({
          admin_email: ADMIN_EMAIL,
          transfer_threshold_usdt: newThreshold,
        }, { onConflict: 'admin_email' });
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        threshold: newThreshold,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === "get_transfers") {
      const { data, error } = await supabase
        .from('imch_transfers')
        .select('*')
        .eq('admin_email', ADMIN_EMAIL)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        transfers: data || [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === "check_and_transfer" || action === "manual_transfer") {
      const isManual = action === "manual_transfer";
      
      // Get current balance
      const { data: balanceData } = await supabase
        .from('imch_balances')
        .select('coins')
        .eq('admin_email', ADMIN_EMAIL)
        .single();
      
      const currentCoins = Number(balanceData?.coins) || 0;
      
      // 1 IMCH = 100 USDT
      const usdtValue = currentCoins * 100;
      
      if (currentCoins <= 0) {
        return new Response(JSON.stringify({
          success: false,
          status: "failed",
          message: "Saldo insuficiente para transferência",
          coins: currentCoins,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Only check threshold for automatic transfers
      if (!isManual) {
        // Get threshold
        const { data: settingsData } = await supabase
          .from('imch_settings')
          .select('transfer_threshold_usdt')
          .eq('admin_email', ADMIN_EMAIL)
          .single();
        
        const thresholdValue = Number(settingsData?.transfer_threshold_usdt) || 500;
        
        if (usdtValue < thresholdValue) {
          return new Response(JSON.stringify({
            success: true,
            status: "waiting",
            message: `Aguardando saldo mínimo de ${thresholdValue} USDT (atual: ${usdtValue.toFixed(2)} USDT)`,
            coins: currentCoins,
            threshold: thresholdValue,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
      
      // Create pending transfer record
      const { data: transferRecord, error: insertError } = await supabase
        .from('imch_transfers')
        .insert({
          admin_email: ADMIN_EMAIL,
          amount_usdt: usdtValue,
          coins_transferred: currentCoins,
          status: 'processing',
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Execute Bybit transfer
      const transferResult = await transferToFunding(usdtValue.toString());
      
      if (transferResult.success) {
        // Update transfer record with success
        await supabase
          .from('imch_transfers')
          .update({
            status: 'success',
            bybit_transfer_id: transferResult.transferId,
          })
          .eq('id', transferRecord.id);
        
        // Reset balance
        await supabase
          .from('imch_balances')
          .update({ coins: 0 })
          .eq('admin_email', ADMIN_EMAIL);
        
        return new Response(JSON.stringify({
          success: true,
          status: "completed",
          message: `Transferência de ${usdtValue.toFixed(2)} USDT realizada com sucesso para a conta Bybit`,
          transferId: transferResult.transferId,
          coins: 0,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else {
        // Update transfer record with failure
        await supabase
          .from('imch_transfers')
          .update({
            status: 'failed',
            error_message: transferResult.error,
          })
          .eq('id', transferRecord.id);
        
        return new Response(JSON.stringify({
          success: false,
          status: "failed",
          message: transferResult.error,
          coins: currentCoins,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: "Unknown action",
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
