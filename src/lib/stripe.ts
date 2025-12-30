import { supabase } from "@/integrations/supabase/client";

export interface StripePayoutRequest {
  amountCents: number;
  email: string;
  description?: string;
}

export interface StripePayoutResponse {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

// Call the Stripe payout edge function
export const createStripePayout = async (
  amountEuros: number,
  email: string
): Promise<StripePayoutResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-payout', {
      body: {
        amountCents: Math.round(amountEuros * 100),
        email,
        description: `Neon Miner payout - ${amountEuros.toFixed(2)} EUR`,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento',
      };
    }

    return data;
  } catch (err) {
    console.error('Stripe payout error:', err);
    return {
      success: false,
      error: 'Erro de conexão com o servidor',
    };
  }
};

// Helper to format currency
export const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
