import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amountCents, email, description } = await req.json();

    console.log('Processing Stripe payout:', { amountCents, email, description });

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      throw new Error('Stripe not configured');
    }

    if (!amountCents || amountCents <= 0) {
      throw new Error('Invalid amount');
    }

    if (!email) {
      throw new Error('Email is required');
    }

    // Create a PaymentIntent for the payout simulation
    // In production, you would use Stripe Connect to transfer funds to connected accounts
    // For now, we'll create a payment link or simulate the payout process
    
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'amount': amountCents.toString(),
        'currency': 'eur',
        'payment_method_types[]': 'card',
        'description': description || `Payout to ${email}`,
        'metadata[recipient_email]': email,
        'metadata[type]': 'game_payout',
      }).toString(),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Stripe API error:', data.error);
      throw new Error(data.error.message || 'Stripe API error');
    }

    console.log('Stripe PaymentIntent created:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: data.id,
        clientSecret: data.client_secret,
        amount: amountCents,
        currency: 'eur',
        status: data.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process payout';
    console.error('Error in stripe-payout function:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
