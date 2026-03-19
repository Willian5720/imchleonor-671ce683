import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { image_url } = await req.json();
    if (!image_url) {
      return new Response(JSON.stringify({ error: 'image_url is required' }), {
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
              {
                type: 'image_url',
                image_url: { url: image_url },
              },
              {
                type: 'text',
                text: 'Extract the identity document data from this image. Return only JSON.',
              },
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
