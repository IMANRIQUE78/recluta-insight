import { supabase } from "@/integrations/supabase/client";

const COSTO_PUBLICACION = 10;

interface ResultadoConsumo {
  success: boolean;
  error?: string;
  origen_pago?: "reclutador" | "heredado_empresa";
  creditos_consumidos?: number;
}

/**
 * Consume créditos para publicar una vacante.
 * Usa créditos heredados de la empresa de la vacante (obligatorio).
 * La vacante DEBE tener empresa_id para poder publicarse.
 */
export async function consumirCreditosPublicacion(
  userId: string,
  reclutadorId: string,
  vacanteId: string,
  empresaId: string | null
): Promise<ResultadoConsumo> {
  try {
    // VALIDACIÓN: La vacante debe tener empresa_id
    if (!empresaId) {
      return { 
        success: false, 
        error: "La vacante debe estar asociada a una empresa para poder publicarla." 
      };
    }

    // 1. Obtener wallet de la empresa
    const { data: walletEmpresa, error: walletEmpresaError } = await supabase
      .from("wallet_empresa")
      .select("*")
      .eq("empresa_id", empresaId)
      .single();

    if (walletEmpresaError || !walletEmpresa) {
      return { success: false, error: "No se encontró la wallet de la empresa. La empresa debe tener créditos disponibles." };
    }

    // 2. Verificar que la empresa tenga créditos suficientes
    if (walletEmpresa.creditos_disponibles < COSTO_PUBLICACION) {
      return { 
        success: false, 
        error: `Créditos insuficientes en la empresa. Se necesitan ${COSTO_PUBLICACION} créditos. La empresa tiene ${walletEmpresa.creditos_disponibles} créditos disponibles.` 
      };
    }

    // 3. Obtener wallet del reclutador para auditoría
    const { data: walletReclutador } = await supabase
      .from("wallet_reclutador")
      .select("id")
      .eq("reclutador_id", reclutadorId)
      .single();

    // 4. Descontar créditos de la wallet de la empresa
    const creditosAntes = walletEmpresa.creditos_disponibles;
    const creditosDespues = creditosAntes - COSTO_PUBLICACION;

    const { error: updateWalletError } = await supabase
      .from("wallet_empresa")
      .update({
        creditos_disponibles: creditosDespues
      })
      .eq("id", walletEmpresa.id);

    if (updateWalletError) {
      console.error("Error actualizando wallet empresa:", updateWalletError);
      return { success: false, error: "Error al descontar créditos de la empresa" };
    }

    // 5. Si el reclutador tenía créditos heredados de esta empresa, también actualizarlos
    const { data: creditoHeredado } = await supabase
      .from("creditos_heredados_reclutador")
      .select("*")
      .eq("reclutador_id", reclutadorId)
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (creditoHeredado && creditoHeredado.creditos_disponibles >= COSTO_PUBLICACION) {
      // Descontar de los créditos heredados del reclutador
      await supabase
        .from("creditos_heredados_reclutador")
        .update({
          creditos_disponibles: creditoHeredado.creditos_disponibles - COSTO_PUBLICACION
        })
        .eq("id", creditoHeredado.id);

      // Actualizar el total en wallet_reclutador
      const { data: walletRec } = await supabase
        .from("wallet_reclutador")
        .select("creditos_heredados")
        .eq("reclutador_id", reclutadorId)
        .single();

      if (walletRec) {
        await supabase
          .from("wallet_reclutador")
          .update({
            creditos_heredados: Math.max(0, walletRec.creditos_heredados - COSTO_PUBLICACION)
          })
          .eq("reclutador_id", reclutadorId);
      }
    }

    // 6. Registrar movimiento de créditos (auditoría completa)
    const { error: movError } = await supabase
      .from("movimientos_creditos")
      .insert({
        origen_pago: "empresa" as any,
        wallet_empresa_id: walletEmpresa.id,
        wallet_reclutador_id: walletReclutador?.id || null,
        empresa_id: empresaId,
        reclutador_user_id: userId,
        vacante_id: vacanteId,
        tipo_accion: "publicacion_vacante" as any,
        metodo: "manual" as any,
        creditos_cantidad: -COSTO_PUBLICACION,
        creditos_antes: creditosAntes,
        creditos_despues: creditosDespues,
        descripcion: `Publicación de vacante al marketplace (${COSTO_PUBLICACION} créditos)`
      });

    if (movError) {
      console.error("Error registrando movimiento:", movError);
      // No fallamos por esto, el consumo ya se hizo
    }

    return { 
      success: true, 
      origen_pago: "heredado_empresa", 
      creditos_consumidos: COSTO_PUBLICACION 
    };

  } catch (error: any) {
    console.error("Error en consumirCreditosPublicacion:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}

/**
 * Verifica si hay suficientes créditos para publicar.
 * Primero verifica los créditos heredados del reclutador desde esa empresa,
 * luego verifica la wallet de la empresa directamente.
 */
export async function verificarCreditosDisponibles(
  reclutadorId: string,
  empresaId: string | null
): Promise<{ 
  suficientes: boolean; 
  creditosEmpresa: number; 
  creditosHeredados: number;
  nombreEmpresa: string | null;
  origenDisponible: "heredado" | "empresa" | null;
}> {
  try {
    // VALIDACIÓN: Debe haber empresa_id
    if (!empresaId) {
      return { suficientes: false, creditosEmpresa: 0, creditosHeredados: 0, nombreEmpresa: null, origenDisponible: null };
    }

    // 1. Primero verificar créditos heredados del reclutador desde esa empresa
    const { data: creditoHeredado } = await supabase
      .from("creditos_heredados_reclutador")
      .select("creditos_disponibles")
      .eq("reclutador_id", reclutadorId)
      .eq("empresa_id", empresaId)
      .maybeSingle();

    const creditosHeredados = creditoHeredado?.creditos_disponibles || 0;

    // 2. Obtener wallet de la empresa
    const { data: walletEmpresa, error: walletError } = await supabase
      .from("wallet_empresa")
      .select("creditos_disponibles, empresas(nombre_empresa)")
      .eq("empresa_id", empresaId)
      .single();

    if (walletError || !walletEmpresa) {
      // Si no hay wallet de empresa pero hay créditos heredados, aún se puede publicar
      if (creditosHeredados >= COSTO_PUBLICACION) {
        return {
          suficientes: true,
          creditosEmpresa: 0,
          creditosHeredados,
          nombreEmpresa: null,
          origenDisponible: "heredado"
        };
      }
      return { suficientes: false, creditosEmpresa: 0, creditosHeredados: 0, nombreEmpresa: null, origenDisponible: null };
    }

    const nombreEmpresa = (walletEmpresa.empresas as any)?.nombre_empresa || null;
    const creditosEmpresa = walletEmpresa.creditos_disponibles;

    // Determinar si hay suficientes créditos y de dónde
    // Prioridad: créditos heredados primero, luego wallet de empresa
    let suficientes = false;
    let origenDisponible: "heredado" | "empresa" | null = null;

    if (creditosHeredados >= COSTO_PUBLICACION) {
      suficientes = true;
      origenDisponible = "heredado";
    } else if (creditosEmpresa >= COSTO_PUBLICACION) {
      suficientes = true;
      origenDisponible = "empresa";
    }

    return {
      suficientes,
      creditosEmpresa,
      creditosHeredados,
      nombreEmpresa,
      origenDisponible
    };
  } catch (error) {
    console.error("Error verificando créditos:", error);
    return { suficientes: false, creditosEmpresa: 0, creditosHeredados: 0, nombreEmpresa: null, origenDisponible: null };
  }
}

export { COSTO_PUBLICACION };
