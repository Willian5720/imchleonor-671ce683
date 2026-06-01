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
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const body = await req.json();
    const { selfie_url, bi_front_url, bi_back_url } = body as {
      selfie_url?: string;
      bi_front_url?: string;
      bi_back_url?: string;
    };

    if (!selfie_url || !bi_front_url || !bi_back_url) {
      return new Response(JSON.stringify({
        error: 'Envie as 3 fotos: selfie, BI (frente) e BI (verso).'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Validate all URLs are signed storage URLs from this project ---
    const projectHost = new URL(supabaseUrl).host;
    const validateUrl = (u: string) => {
      try {
        const p = new URL(u);
        return p.host === projectHost && p.pathname.includes('/storage/v1/object/sign/');
      } catch {
        return false;
      }
    };
    if (!validateUrl(selfie_url) || !validateUrl(bi_front_url) || !validateUrl(bi_back_url)) {
      return new Response(JSON.stringify({ error: 'URLs devem ser signed URLs deste projeto.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- AI: validate documents and extract data ---
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
            content: `You are a strict KYC verification assistant for Angolan citizens.
You receive 3 images in this order: (1) a selfie of the applicant's face, (2) the FRONT of the NEW Angolan Bilhete de Identidade (BI) — "Bilhete de Identidade de Cidadão Nacional", and (3) the BACK of the same BI.

ONLY the new biometric Angolan BI model is accepted. It MUST visually match ALL of these features:
- FRONT: title in two lines "REPÚBLICA DE ANGOLA" + "BILHETE DE IDENTIDADE DE CIDADÃO NACIONAL"; national emblem (top-left) with "ANGOLA" ribbon; small red Angola map silhouette (top-right); fields "Nome Completo", "Filiação" (with parents' names), "Bilhete de Identidade Nº:" containing a number like 020555710BA054 (9 digits + 2 letters + 3 digits); holder photo on the right with a curved golden band over "ASSINATURA DO TITULAR" and a handwritten signature; subtle wavy security background pattern.
- BACK: fields "Residência", "Natural de", "Província de", "Data de Nascimento" (DD/MM/YYYY), "Sexo", "Altura(m)", "Estado Civil", "Emitido em", "Válido até"; a signature above "DIRECTOR NACIONAL DE IDENTIFICAÇÃO"; a black FINGERPRINT, a small holder face photo, a QR code and a barcode at the bottom.

REJECT if it is the OLD paper/laminated Angolan BI, a Cartão de Eleitor, Passaporte, Carta de Condução, driver's license, foreign ID, any other document, a digital copy of a copy, a screen photo, or if any of the required features above are missing or unreadable.

Validate ALL of these conditions:
- is_selfie: image 1 must be a clear photo of a real live human face (not a card, screenshot, or photo of a photo).
- is_angolan_bi_front: image 2 must be the FRONT of the NEW Angolan BI as described above.
- is_angolan_bi_back: image 3 must be the BACK of the NEW Angolan BI as described above (QR code + fingerprint + barcode MUST be visible).
- face_match: the face in the selfie must clearly match the face printed on the BI front AND the small face on the BI back.

Then extract from the BI:
- full_name (from "Nome Completo"), document_number (from "Bilhete de Identidade Nº:"), date_of_birth (from "Data de Nascimento", format DD/MM/YYYY).

Respond ONLY with strict JSON:
{
  "is_selfie": boolean,
  "is_angolan_bi_front": boolean,
  "is_angolan_bi_back": boolean,
  "face_match": boolean,
  "full_name": string|null,
  "document_number": string|null,
  "date_of_birth": string|null,
  "rejection_reason": string|null
}

If any validation fails, set "rejection_reason" with a short explanation in Portuguese (e.g. "Apenas o novo BI angolano (com QR code e impressão digital) é aceite", "A selfie não corresponde à foto do BI", "Verso do BI sem QR code/impressão digital", "Documento não é um BI angolano válido").`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Imagem 1 — Selfie do rosto:' },
              { type: 'image_url', image_url: { url: selfie_url } },
              { type: 'text', text: 'Imagem 2 — BI angolano (frente):' },
              { type: 'image_url', image_url: { url: bi_front_url } },
              { type: 'text', text: 'Imagem 3 — BI angolano (verso):' },
              { type: 'image_url', image_url: { url: bi_back_url } },
              { type: 'text', text: 'Valide e responda apenas com o JSON especificado.' },
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

    let parsed: {
      is_selfie?: boolean;
      is_angolan_bi_front?: boolean;
      is_angolan_bi_back?: boolean;
      face_match?: boolean;
      full_name?: string | null;
      document_number?: string | null;
      date_of_birth?: string | null;
      rejection_reason?: string | null;
    };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const valid = !!(parsed.is_selfie && parsed.is_angolan_bi_front && parsed.is_angolan_bi_back && parsed.face_match);
    let rejection_reason = valid
      ? null
      : (parsed.rejection_reason
        || 'Validação falhou. Garanta que enviou uma selfie nítida e as duas faces do seu BI angolano.');

    // --- DUPLICATE DOCUMENT DETECTION (real-time) ---
    // If the document looks valid, check whether another user has already
    // submitted/been approved with the same document number.
    let isDuplicate = false;
    let finalVerified = valid;
    const documentNumber = (parsed.document_number || '').toString().trim();

    if (valid && documentNumber) {
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (serviceKey) {
        const adminClient = createClient(supabaseUrl, serviceKey);
        const { data: existing, error: dupErr } = await adminClient
          .from('kyc_verifications')
          .select('user_id, status')
          .eq('document_number', documentNumber)
          .neq('user_id', user.id)
          .in('status', ['approved', 'pending']);

        if (!dupErr && existing && existing.length > 0) {
          isDuplicate = true;
          finalVerified = false;
          rejection_reason = 'Este documento de identidade já está associado a outra conta. Cada documento só pode ser usado por um único utilizador.';

          // Log security event for fraud monitoring
          await adminClient.from('security_events').insert({
            user_id: user.id,
            event_type: 'kyc_duplicate_document_attempt',
            risk_level: 'high',
            details: {
              attempted_document_number: documentNumber,
              conflicting_user_ids: existing.map((e) => e.user_id),
            },
          });
        }
      }
    }

    return new Response(JSON.stringify({
      verified: finalVerified,
      rejection_reason,
      duplicate: isDuplicate,
      data: {
        full_name: parsed.full_name ?? null,
        document_number: parsed.document_number ?? null,
        date_of_birth: parsed.date_of_birth ?? null,
      },
      checks: {
        is_selfie: !!parsed.is_selfie,
        is_angolan_bi_front: !!parsed.is_angolan_bi_front,
        is_angolan_bi_back: !!parsed.is_angolan_bi_back,
        face_match: !!parsed.face_match,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting document data:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      verified: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
