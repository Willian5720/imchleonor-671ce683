import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// CORS configuration - allow Lovable domains and localhost
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // Allow all Lovable domains (preview and production)
  if (origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')) {
    return true;
  }
  
  // Allow localhost for development
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

const FOOTBALL_API_KEY = Deno.env.get('FOOTBALL_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');
const API_BASE = 'https://v3.football.api-sports.io';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params, userEmail } = await req.json();
    console.log("Football API request:", { action });

    // Validate admin email is configured
    if (!ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL not configured');
    }

    // Verify user is the admin
    if (!userEmail || userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      console.log("Access denied - unauthorized request");
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!FOOTBALL_API_KEY) {
      throw new Error('FOOTBALL_API_KEY not configured');
    }

    let endpoint = '';
    const queryParams = new URLSearchParams();

    switch (action) {
      case 'live':
        endpoint = '/fixtures';
        queryParams.append('live', 'all');
        break;

      case 'fixtures':
        endpoint = '/fixtures';
        if (params?.date) queryParams.append('date', params.date);
        if (params?.league) queryParams.append('league', params.league);
        if (params?.season) queryParams.append('season', params.season);
        break;

      case 'odds':
        endpoint = '/odds';
        if (params?.fixture) queryParams.append('fixture', params.fixture);
        if (params?.league) queryParams.append('league', params.league);
        if (params?.date) queryParams.append('date', params.date);
        if (params?.bookmaker) queryParams.append('bookmaker', params.bookmaker || '8'); // Bet365
        break;

      case 'odds_live':
        endpoint = '/odds/live';
        if (params?.fixture) queryParams.append('fixture', params.fixture);
        break;

      case 'leagues':
        endpoint = '/leagues';
        if (params?.current) queryParams.append('current', 'true');
        if (params?.type) queryParams.append('type', params.type);
        break;

      case 'standings':
        endpoint = '/standings';
        if (params?.league) queryParams.append('league', params.league);
        if (params?.season) queryParams.append('season', params.season);
        break;

      case 'predictions':
        endpoint = '/predictions';
        if (params?.fixture) queryParams.append('fixture', params.fixture);
        break;

      case 'head2head':
        endpoint = '/fixtures/headtohead';
        if (params?.h2h) queryParams.append('h2h', params.h2h);
        queryParams.append('last', params?.last || '10');
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const url = `${API_BASE}${endpoint}?${queryParams.toString()}`;
    console.log("Fetching football data for action:", action, "url:", endpoint);

    const response = await fetch(url, {
      headers: {
        'x-apisports-key': FOOTBALL_API_KEY,
      },
    });

    console.log("API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Football API response received, results:", data.results || 0);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Football API error:', errorMessage);
    const corsHeaders = getCorsHeaders(req.headers.get('origin'));
    return new Response(JSON.stringify({ 
      error: errorMessage,
      response: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
