import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    logStep("Session ID received", { sessionId });

    // Authenticate user
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
    logStep("User authenticated", { userId: user.id });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { 
      status: session.payment_status, 
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify user matches
    if (session.metadata?.user_id !== user.id) {
      throw new Error("User mismatch - unauthorized access");
    }

    const walletType = session.metadata?.wallet_type;
    const credits = parseInt(session.metadata?.credits || "0");

    if (!credits || credits <= 0) {
      throw new Error("Invalid credit amount in session metadata");
    }

    logStep("Processing credit assignment", { walletType, credits });

    if (walletType === "reclutador") {
      // Get recruiter profile
      const { data: perfil, error: perfilError } = await supabaseAdmin
        .from("perfil_reclutador")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (perfilError || !perfil) {
        throw new Error("Recruiter profile not found");
      }

      // Get or create wallet
      let { data: wallet, error: walletError } = await supabaseAdmin
        .from("wallet_reclutador")
        .select("*")
        .eq("reclutador_id", perfil.id)
        .single();

      if (walletError && walletError.code === "PGRST116") {
        const { data: newWallet, error: createError } = await supabaseAdmin
          .from("wallet_reclutador")
          .insert({ reclutador_id: perfil.id })
          .select()
          .single();
        
        if (createError) throw createError;
        wallet = newWallet;
      } else if (walletError) {
        throw walletError;
      }

      if (!wallet) {
        throw new Error("Could not get or create wallet");
      }

      // Update wallet
      const newCreditos = wallet.creditos_propios + credits;
      const newTotal = wallet.creditos_totales_comprados + credits;

      const { error: updateError } = await supabaseAdmin
        .from("wallet_reclutador")
        .update({
          creditos_propios: newCreditos,
          creditos_totales_comprados: newTotal
        })
        .eq("id", wallet.id);

      if (updateError) throw updateError;

      // Record movement
      const { error: movError } = await supabaseAdmin
        .from("movimientos_creditos")
        .insert({
          origen_pago: "reclutador",
          wallet_reclutador_id: wallet.id,
          reclutador_user_id: user.id,
          tipo_accion: "compra_creditos",
          metodo: "automatico_ia",
          creditos_cantidad: credits,
          creditos_antes: wallet.creditos_propios,
          creditos_despues: newCreditos,
          descripcion: `Compra de ${credits} créditos vía Stripe`,
          metadata: { stripe_session_id: sessionId }
        });

      if (movError) {
        logStep("Warning: Failed to record movement", { error: movError });
      }

      logStep("Recruiter credits updated successfully", { newCreditos });

    } else if (walletType === "empresa") {
      // Get company from user role
      const { data: userRole, error: roleError } = await supabaseAdmin
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .single();

      if (roleError || !userRole?.empresa_id) {
        throw new Error("Company not found for user");
      }

      // Get or create wallet
      let { data: wallet, error: walletError } = await supabaseAdmin
        .from("wallet_empresa")
        .select("*")
        .eq("empresa_id", userRole.empresa_id)
        .single();

      if (walletError && walletError.code === "PGRST116") {
        const { data: newWallet, error: createError } = await supabaseAdmin
          .from("wallet_empresa")
          .insert({ empresa_id: userRole.empresa_id })
          .select()
          .single();
        
        if (createError) throw createError;
        wallet = newWallet;
      } else if (walletError) {
        throw walletError;
      }

      if (!wallet) {
        throw new Error("Could not get or create wallet");
      }

      // Update wallet
      const newCreditos = wallet.creditos_disponibles + credits;
      const newTotal = wallet.creditos_totales_comprados + credits;

      const { error: updateError } = await supabaseAdmin
        .from("wallet_empresa")
        .update({
          creditos_disponibles: newCreditos,
          creditos_totales_comprados: newTotal
        })
        .eq("id", wallet.id);

      if (updateError) throw updateError;

      // Record movement using RPC
      const { error: movError } = await supabaseAdmin.rpc("registrar_movimiento_creditos", {
        p_origen_pago: "empresa",
        p_wallet_empresa_id: wallet.id,
        p_wallet_reclutador_id: null,
        p_empresa_id: userRole.empresa_id,
        p_reclutador_user_id: user.id,
        p_tipo_accion: "compra_creditos",
        p_creditos_cantidad: credits,
        p_descripcion: `Compra de ${credits} créditos vía Stripe`,
        p_metodo: "automatico_ia",
        p_metadata: { stripe_session_id: sessionId }
      });

      if (movError) {
        logStep("Warning: Failed to record movement via RPC", { error: movError });
      }

      logStep("Company credits updated successfully", { newCreditos });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      credits,
      message: `${credits} créditos agregados exitosamente` 
    }), {
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
