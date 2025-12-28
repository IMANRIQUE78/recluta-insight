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
 * Primero intenta usar créditos heredados de la empresa de la vacante.
 * Si no hay suficientes, usa créditos propios del reclutador.
 */
export async function consumirCreditosPublicacion(
  userId: string,
  reclutadorId: string,
  vacanteId: string,
  empresaId: string | null
): Promise<ResultadoConsumo> {
  try {
    // 1. Obtener wallet del reclutador
    const { data: wallet, error: walletError } = await supabase
      .from("wallet_reclutador")
      .select("*")
      .eq("reclutador_id", reclutadorId)
      .single();

    if (walletError || !wallet) {
      return { success: false, error: "No se encontró la wallet del reclutador" };
    }

    let origenPago: "reclutador" | "heredado_empresa" = "reclutador";
    let walletEmpresaId: string | null = null;
    let creditoHeredadoId: string | null = null;

    // 2. Si hay empresa_id, verificar si tiene créditos heredados de esa empresa
    if (empresaId) {
      const { data: creditoHeredado, error: heredadoError } = await supabase
        .from("creditos_heredados_reclutador")
        .select("*")
        .eq("reclutador_id", reclutadorId)
        .eq("empresa_id", empresaId)
        .single();

      if (!heredadoError && creditoHeredado && creditoHeredado.creditos_disponibles >= COSTO_PUBLICACION) {
        // Usar créditos heredados
        origenPago = "heredado_empresa";
        creditoHeredadoId = creditoHeredado.id;

        // Obtener wallet de la empresa para auditoría
        const { data: walletEmpresa } = await supabase
          .from("wallet_empresa")
          .select("id")
          .eq("empresa_id", empresaId)
          .single();

        walletEmpresaId = walletEmpresa?.id || null;

        // Descontar de créditos heredados
        const { error: updateError } = await supabase
          .from("creditos_heredados_reclutador")
          .update({
            creditos_disponibles: creditoHeredado.creditos_disponibles - COSTO_PUBLICACION
          })
          .eq("id", creditoHeredado.id);

        if (updateError) {
          return { success: false, error: "Error al descontar créditos heredados" };
        }

        // También actualizar el total en wallet_reclutador
        const { error: walletUpdateError } = await supabase
          .from("wallet_reclutador")
          .update({
            creditos_heredados: Math.max(0, wallet.creditos_heredados - COSTO_PUBLICACION)
          })
          .eq("id", wallet.id);

        if (walletUpdateError) {
          console.error("Error actualizando wallet_reclutador:", walletUpdateError);
        }
      }
    }

    // 3. Si no usamos créditos heredados, usar propios
    if (origenPago === "reclutador") {
      if (wallet.creditos_propios < COSTO_PUBLICACION) {
        return { 
          success: false, 
          error: `Créditos insuficientes. Necesitas ${COSTO_PUBLICACION} créditos para publicar. Tienes ${wallet.creditos_propios} créditos propios.` 
        };
      }

      // Descontar de créditos propios
      const { error: updateError } = await supabase
        .from("wallet_reclutador")
        .update({
          creditos_propios: wallet.creditos_propios - COSTO_PUBLICACION
        })
        .eq("id", wallet.id);

      if (updateError) {
        return { success: false, error: "Error al descontar créditos propios" };
      }
    }

    // 4. Registrar movimiento de créditos (auditoría)
    const creditosAntes = origenPago === "heredado_empresa" 
      ? wallet.creditos_heredados 
      : wallet.creditos_propios;

    const { error: movError } = await supabase
      .from("movimientos_creditos")
      .insert({
        origen_pago: origenPago as any,
        wallet_reclutador_id: wallet.id,
        wallet_empresa_id: walletEmpresaId,
        empresa_id: empresaId,
        reclutador_user_id: userId,
        vacante_id: vacanteId,
        tipo_accion: "publicacion_vacante" as any,
        metodo: "manual" as any,
        creditos_cantidad: -COSTO_PUBLICACION,
        creditos_antes: creditosAntes,
        creditos_despues: creditosAntes - COSTO_PUBLICACION,
        descripcion: origenPago === "heredado_empresa" 
          ? `Publicación de vacante (créditos empresa)` 
          : `Publicación de vacante (créditos propios)`
      });

    if (movError) {
      console.error("Error registrando movimiento:", movError);
      // No fallamos por esto, el consumo ya se hizo
    }

    return { 
      success: true, 
      origen_pago: origenPago, 
      creditos_consumidos: COSTO_PUBLICACION 
    };

  } catch (error: any) {
    console.error("Error en consumirCreditosPublicacion:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}

/**
 * Verifica si el reclutador tiene suficientes créditos para publicar.
 * Considera tanto créditos propios como heredados de la empresa.
 */
export async function verificarCreditosDisponibles(
  reclutadorId: string,
  empresaId: string | null
): Promise<{ suficientes: boolean; creditosPropios: number; creditosHeredados: number; total: number }> {
  try {
    // Obtener wallet del reclutador
    const { data: wallet, error: walletError } = await supabase
      .from("wallet_reclutador")
      .select("creditos_propios, creditos_heredados")
      .eq("reclutador_id", reclutadorId)
      .single();

    if (walletError || !wallet) {
      return { suficientes: false, creditosPropios: 0, creditosHeredados: 0, total: 0 };
    }

    let creditosHeredadosEmpresa = 0;

    // Si hay empresa, verificar créditos heredados específicos
    if (empresaId) {
      const { data: creditoHeredado } = await supabase
        .from("creditos_heredados_reclutador")
        .select("creditos_disponibles")
        .eq("reclutador_id", reclutadorId)
        .eq("empresa_id", empresaId)
        .single();

      creditosHeredadosEmpresa = creditoHeredado?.creditos_disponibles || 0;
    }

    const total = wallet.creditos_propios + creditosHeredadosEmpresa;

    return {
      suficientes: total >= COSTO_PUBLICACION,
      creditosPropios: wallet.creditos_propios,
      creditosHeredados: creditosHeredadosEmpresa,
      total
    };
  } catch (error) {
    console.error("Error verificando créditos:", error);
    return { suficientes: false, creditosPropios: 0, creditosHeredados: 0, total: 0 };
  }
}

export { COSTO_PUBLICACION };
