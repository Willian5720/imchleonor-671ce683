import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify they're authenticated
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email } = await req.json();

    if (!email || typeof email !== "string" || email.length < 3) {
      return new Response(
        JSON.stringify({ error: "Email search query must be at least 3 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to search profiles (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Search for users by email - only return minimal info needed for transfers
    // Return id, display_name (masked email for privacy), and avatar_url
    const { data: profiles, error: searchError } = await serviceClient
      .from("profiles")
      .select("id, email, display_name, avatar_url")
      .ilike("email", `%${email}%`)
      .neq("id", user.id) // Exclude the searching user
      .limit(5);

    if (searchError) {
      console.error("Search error:", searchError);
      return new Response(
        JSON.stringify({ error: "Failed to search users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mask emails for privacy - NEVER return full emails to prevent enumeration attacks
    const maskedResults = (profiles || []).map((profile) => ({
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      email_hint: profile.email ? maskEmail(profile.email) : null,
      // Security: Never return full email to prevent enumeration
    }));

    return new Response(
      JSON.stringify({ users: maskedResults }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain) return "***";
  
  const maskedLocal = localPart.length > 3 
    ? localPart.substring(0, 3) + "***" 
    : localPart.substring(0, 1) + "***";
  
  return `${maskedLocal}@${domain}`;
}
