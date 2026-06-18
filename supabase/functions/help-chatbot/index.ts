import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o assistente virtual oficial do IMCHLEONOR Exchange, uma plataforma angolana de troca de criptomoedas. Responda sempre em português, de forma amigável e clara.

INFORMAÇÕES DO SISTEMA:

🏦 SOBRE A PLATAFORMA:
- Nome: IMCHLEONOR Exchange
- Moeda nativa: IMCH Coin (1 IMCH = 1 USD)
- Conversão: 1000 AOA = 1 IMCH
- Taxas: ZERO taxas em todas as operações
- Email de suporte: imchleonor@gmail.com
- Contacto: 943 723 434

📱 FUNCIONALIDADES PRINCIPAIS:
1. **Início (/)**: Mercados de criptomoedas em tempo real, gráficos e trading
2. **Perfil (/profile)**: Dados pessoais, avatares de outras corretoras (Binance, Bybit, Deriv, Redotpay), KYC
3. **Carteira (/wallet)**: Saldo em IMCH e AOA, endereços de carteiras, depósitos
4. **Enviar (/send)**: Transferências entre usuários, saques cripto (ERC20), transferências para corretoras
5. **Histórico (/history)**: Todas as transações realizadas
6. **Configurações (/settings)**: Tema (claro/escuro), preferências, sair

🔐 SEGURANÇA E KYC:
- Verificação obrigatória do documento de identidade antes de transferir
- Upload de foto frente, verso e selfie
- Verificação automática por IA
- Apenas usuários verificados podem fazer transferências

💰 INTEGRAÇÕES:
- **Deriv**: Conectar conta para trading
- **Bybit**: Transferências para subconta
- **Binance, Redotpay**: Links de perfil

💳 GATEWAYS DE PAGAMENTO ANGOLANOS:
- Multicaixa Express, Unitel Money, BAI Direto, Express, Atlántico

🎮 ÁREA ADMIN (apenas admin):
- Blockchain Explorer (ledger interno)
- IMCHLEONOR (jogo de mineração)
- Auditoria

REGRAS:
- Nunca invente informação. Se não souber, sugira contactar imchleonor@gmail.com ou 943 723 434.
- Seja conciso (máx 4-5 frases por resposta).
- Use emojis com moderação.
- Para problemas técnicos sérios, sempre direcione para o suporte humano.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authentication to prevent anonymous AI credit abuse
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Input validation: prevent prompt injection / token abuse
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return new Response(
        JSON.stringify({ error: "Mensagens inválidas (limite de 20 turnos)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const safeMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const m of messages) {
      if (!m || typeof m !== "object") {
        return new Response(JSON.stringify({ error: "Formato de mensagem inválido." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (m.role !== "user" && m.role !== "assistant") {
        return new Response(JSON.stringify({ error: "Função de mensagem não permitida." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof m.content !== "string" || m.content.length === 0 || m.content.length > 2000) {
        return new Response(JSON.stringify({ error: "Conteúdo da mensagem inválido (máx 2000 caracteres)." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      safeMessages.push({ role: m.role, content: m.content });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...safeMessages,
        ],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Muitas mensagens. Aguarde um momento." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos esgotados. Contacte o administrador." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("Erro AI:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no assistente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("help-chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
