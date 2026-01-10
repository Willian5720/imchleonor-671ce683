import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { encode as encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ==================== INPUT VALIDATION SCHEMAS ====================

const ActionSchema = z.enum([
  'verify_admin',
  'get_balance', 
  'add_coins',
  'get_settings',
  'update_settings',
  'get_transfers',
  'check_and_transfer',
  'manual_transfer',
  'reset_coins'
]);

const EmailSchema = z.string().email().max(255);

const BaseRequestSchema = z.object({
  action: ActionSchema,
  userEmail: EmailSchema.optional(),
});

const AddCoinsSchema = BaseRequestSchema.extend({
  action: z.literal('add_coins'),
  coins: z.number().int().min(1).max(1000000),
  userEmail: EmailSchema,
});

const UpdateSettingsSchema = BaseRequestSchema.extend({
  action: z.literal('update_settings'),
  threshold: z.number().min(1).max(100000),
  userEmail: EmailSchema,
});

const ManualTransferSchema = BaseRequestSchema.extend({
  action: z.literal('manual_transfer'),
  coins: z.number().int().min(1).max(1000000).optional(),
  userEmail: EmailSchema,
});

const VerifyAdminSchema = BaseRequestSchema.extend({
  action: z.literal('verify_admin'),
  userEmail: EmailSchema.optional(),
});

const AuthenticatedRequestSchema = BaseRequestSchema.extend({
  userEmail: EmailSchema,
});

// ==================== CORS CONFIGURATION ====================

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
  const allowedOrigin = isAllowedOrigin(origin) ? origin : 'https://ohrlarphhjfrclrogyqm.lovableproject.com';
  return {
    'Access-Control-Allow-Origin': allowedOrigin!,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ==================== ENVIRONMENT VARIABLES ====================

const BYBIT_API_KEY = Deno.env.get('BYBIT_API_KEY');
const BYBIT_SECRET_KEY = Deno.env.get('BYBIT_SECRET_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// ==================== BYBIT API FUNCTIONS ====================

async function generateSignature(payload: string, timestamp: string, recvWindow: string): Promise<string> {
  const preSign = `${timestamp}${BYBIT_API_KEY}${recvWindow}${payload}`;
  
  console.log("Generating signature for payload length:", payload.length);
  
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

async function transferToFunding(amount: string): Promise<{ success: boolean; transferId?: string; error?: string }> {
  try {
    const timestamp = Date.now().toString();
    const recvWindow = "20000";
    
    const params = {
      transferId: crypto.randomUUID(),
      coin: "USDT",
      amount: amount,
      fromAccountType: "UNIFIED",
      toAccountType: "FUND",
    };
    
    const bodyString = JSON.stringify(params);
    const signature = await generateSignature(bodyString, timestamp, recvWindow);
    
    console.log("Making Bybit transfer request");
    
    const response = await fetch("https://api.bybit.com/v5/asset/transfer/inter-transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BAPI-API-KEY": BYBIT_API_KEY!,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": recvWindow,
        "X-BAPI-SIGN": signature,
      },
      body: bodyString,
    });
    
    const data = await response.json();
    
    if (data.retCode === 0) {
      console.log("Bybit transfer successful");
      return { success: true, transferId: data.result?.transferId || params.transferId };
    } else {
      console.error("Bybit transfer failed with code:", data.retCode);
      return { success: false, error: data.retMsg || "Transfer failed" };
    }
  } catch (error) {
    console.error("Bybit transfer error occurred");
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ==================== HELPER: Verify JWT and get user email ====================

async function getAuthenticatedUserEmail(req: Request): Promise<{ email: string | null; error: string | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { email: null, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  
  // Create a client with the user's token to verify their identity
  const userSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authHeader } }
  });
  
  try {
    // Use getClaims to verify the JWT without requiring active session
    const { data, error } = await userSupabase.auth.getClaims(token);
    
    if (error || !data?.claims) {
      // Fallback to getUser if getClaims fails (for older tokens)
      const { data: userData, error: userError } = await userSupabase.auth.getUser(token);
      
      if (userError || !userData.user) {
        return { email: null, error: 'Invalid or expired token' };
      }
      
      return { email: userData.user.email || null, error: null };
    }
    
    // Extract email from JWT claims
    const email = data.claims.email as string | undefined;
    if (!email) {
      return { email: null, error: 'Email not found in token' };
    }
    
    return { email, error: null };
  } catch {
    return { email: null, error: 'Failed to verify authentication' };
  }
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate base request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid JSON body",
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate action first
    const baseValidation = BaseRequestSchema.safeParse(body);
    if (!baseValidation.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid request parameters",
        details: baseValidation.error.issues.map(i => i.message),
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action } = baseValidation.data;
    console.log("Request received:", { action });

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Validate admin email is configured
    if (!ADMIN_EMAIL) {
      throw new Error("ADMIN_EMAIL not configured");
    }

    // Handle verify_admin - requires JWT verification
    if (action === "verify_admin") {
      // Get the authenticated user's email from JWT
      const { email: authenticatedEmail, error: authError } = await getAuthenticatedUserEmail(req);
      
      if (authError || !authenticatedEmail) {
        // Allow unauthenticated verify_admin calls, but return isAdmin: false
        console.log("Unauthenticated verify_admin request");
        return new Response(JSON.stringify({
          success: true,
          isAdmin: false,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      const isAdmin = authenticatedEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      console.log("Admin verification completed via JWT");
      return new Response(JSON.stringify({
        success: true,
        isAdmin,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // All other actions require authenticated admin - verify from JWT, not from request body
    const { email: authenticatedEmail, error: authError } = await getAuthenticatedUserEmail(req);
    
    if (authError || !authenticatedEmail) {
      console.log("Authentication failed:", authError);
      return new Response(JSON.stringify({
        success: false,
        error: "Autenticação necessária. Por favor, faça login.",
        unauthorized: true,
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify the authenticated user is the admin - using JWT email, NOT client-supplied email
    if (authenticatedEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      console.log("Access denied - user is not admin");
      return new Response(JSON.stringify({
        success: false,
        error: "Acesso negado. Apenas o administrador pode acessar este sistema.",
        unauthorized: true,
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (!BYBIT_API_KEY || !BYBIT_SECRET_KEY) {
      throw new Error("Bybit API credentials not configured");
    }

    // ==================== ACTION HANDLERS ====================

    if (action === "get_balance") {
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
      const validation = AddCoinsSchema.safeParse(body);
      if (!validation.success) {
        return new Response(JSON.stringify({
          success: false,
          error: "Invalid coins value. Must be an integer between 1 and 1,000,000.",
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      const coinsToAdd = validation.data.coins;
      
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
      const validation = UpdateSettingsSchema.safeParse(body);
      if (!validation.success) {
        return new Response(JSON.stringify({
          success: false,
          error: "Invalid threshold value. Must be a number between 1 and 100,000.",
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      const newThreshold = validation.data.threshold;
      
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

    if (action === "reset_coins") {
      const { error } = await supabase
        .from('imch_balances')
        .update({ coins: 0 })
        .eq('admin_email', ADMIN_EMAIL);
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        coins: 0,
        message: "Saldo resetado com sucesso",
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === "check_and_transfer" || action === "manual_transfer") {
      const isManual = action === "manual_transfer";
      
      let customCoins: number | null = null;
      if (isManual) {
        const validation = ManualTransferSchema.safeParse(body);
        if (!validation.success) {
          return new Response(JSON.stringify({
            success: false,
            error: "Invalid coins value for manual transfer. Must be an integer between 1 and 1,000,000.",
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        customCoins = validation.data.coins ?? null;
      }
      
      const { data: balanceData } = await supabase
        .from('imch_balances')
        .select('coins')
        .eq('admin_email', ADMIN_EMAIL)
        .single();
      
      const currentCoins = Number(balanceData?.coins) || 0;
      
      const coinsToTransfer = isManual && customCoins ? Math.min(customCoins, currentCoins) : currentCoins;
      
      // 1 IMCH = 100 USDT
      const usdtValue = coinsToTransfer * 100;
      
      if (coinsToTransfer <= 0) {
        return new Response(JSON.stringify({
          success: false,
          status: "failed",
          message: "Saldo insuficiente para transferência",
          coins: currentCoins,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Only check threshold for automatic transfers
      if (!isManual) {
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
          coins_transferred: coinsToTransfer,
          status: 'processing',
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Execute Bybit transfer
      const transferResult = await transferToFunding(usdtValue.toString());
      
      if (transferResult.success) {
        await supabase
          .from('imch_transfers')
          .update({
            status: 'success',
            bybit_transfer_id: transferResult.transferId,
          })
          .eq('id', transferRecord.id);
        
        const remainingCoins = currentCoins - coinsToTransfer;
        await supabase
          .from('imch_balances')
          .update({ coins: remainingCoins })
          .eq('admin_email', ADMIN_EMAIL);
        
        return new Response(JSON.stringify({
          success: true,
          status: "completed",
          message: `Transferência de ${usdtValue.toFixed(2)} USDT realizada com sucesso para a conta Bybit`,
          transferId: transferResult.transferId,
          coins: remainingCoins,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else {
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
    const corsHeaders = getCorsHeaders(req.headers.get('origin'));
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
