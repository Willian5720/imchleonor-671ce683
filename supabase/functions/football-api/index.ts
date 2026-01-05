import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS configuration - restrict to allowed origins
const allowedOrigins = [
  'https://ohrlarphhjfrclrogyqm.lovableproject.com',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const FOOTBALL_API_KEY = Deno.env.get('FOOTBALL_API_KEY');
const API_BASE = 'https://v3.football.api-sports.io';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    console.log(`Football API action: ${action}`, params);

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
    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': FOOTBALL_API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Response received, ${data.results || 0} results`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Football API error:', error);
    const corsHeaders = getCorsHeaders(req.headers.get('origin'));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      response: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});