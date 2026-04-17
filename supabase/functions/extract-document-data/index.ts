import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')) return true;
  if (origin.startsWith('http://localhost:')) return true;
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

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTH: require valid JWT ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { image_url } = await req.json();
    if (!image_url || typeof image_url !== 'string') {
      return new Response(JSON.stringify({ error: 'image_url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Validate image_url is a Supabase signed storage URL from our project ---
    let parsed: URL;
    try {
      parsed = new URL(image_url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid image_url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const projectHost = new URL(supabaseUrl).host;
    if (parsed.host !== projectHost || !parsed.pathname.includes('/storage/v1/object/sign/')) {
      return new Response(JSON.stringify({ error: 'image_url must be a signed storage URL from this project' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to extract document data from the image
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a document data extraction assistant. Extract the following information from the ID document image:
- full_name: The person's full name
- document_number: The document/ID number
- date_of_birth: Date of birth in DD/MM/YYYY format

Respond ONLY with a valid JSON object with these keys. If a field cannot be read, use null.
Example: {"full_name": "João Silva", "document_number": "123456789LA042", "date_of_birth": "15/03/1990"}`
          },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: image_url } },
              { type: 'text', text: 'Extract the identity document data from this image. Return only JSON.' },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${errorText}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';

    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch {
      extractedData = { full_name: null, document_number: null, date_of_birth: null };
    }

    return new Response(JSON.stringify({ data: extractedData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting document data:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      data: { full_name: null, document_number: null, date_of_birth: null }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
