import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Paquetes de créditos disponibles
const CREDIT_PACKAGES = {
  "20": {
    priceId: "price_1SqI9yDyc9gdi6M6fGqlwie4",
    credits: 20,
    amount: 2400, // $2,400 MXN
  },
  "50": {
    priceId: "price_1SqIANDyc9gdi6M6ELpuPILO",
    credits: 50,
    amount: 5580, // $5,580 MXN (7% desc)
  },
  "100": {
    priceId: "price_1SqIAjDyc9gdi6M6ligvQEt7",
    credits: 100,
    amount: 10800, // $10,800 MXN (10% desc)
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Get request body
    const { packageSize, walletType } = await req.json();
    logStep("Request params", { packageSize, walletType });

    if (!packageSize || !CREDIT_PACKAGES[packageSize as keyof typeof CREDIT_PACKAGES]) {
      throw new Error(`Invalid package size: ${packageSize}. Valid options: 20, 50, 100`);
    }

    if (!walletType || !["empresa", "reclutador"].includes(walletType)) {
      throw new Error(`Invalid wallet type: ${walletType}. Valid options: empresa, reclutador`);
    }

    const selectedPackage = CREDIT_PACKAGES[packageSize as keyof typeof CREDIT_PACKAGES];
    logStep("Selected package", selectedPackage);

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ 
      email: user.email!, 
      limit: 1 
    });
    
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    // Build success URL with metadata for credit assignment
    const origin = req.headers.get("origin") || "https://recluta-insight.lovable.app";
    const successUrl = new URL(`${origin}/payment-success`);
    successUrl.searchParams.set("credits", selectedPackage.credits.toString());
    successUrl.searchParams.set("wallet_type", walletType);
    successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price: selectedPackage.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl.toString(),
      cancel_url: `${origin}/wallet-${walletType === "empresa" ? "empresa" : "reclutador"}?canceled=true`,
      metadata: {
        user_id: user.id,
        wallet_type: walletType,
        credits: selectedPackage.credits.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
