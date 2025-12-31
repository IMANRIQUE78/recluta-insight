import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COSTO_DESBLOQUEO = 2;

interface ResultadoDesbloqueo {
  success: boolean;
  error?: string;
  yaDesbloqueado?: boolean;
}

export const useDesbloquearIdentidad = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Verifica si el reclutador ya tiene desbloqueada la identidad de un candidato
   */
  const verificarAccesoDesbloqueado = async (
    reclutadorId: string,
    candidatoUserId: string
  ): Promise<boolean> => {
    const { data } = await supabase
      .from("acceso_identidad_candidato")
      .select("id")
      .eq("reclutador_id", reclutadorId)
      .eq("candidato_user_id", candidatoUserId)
      .maybeSingle();

    return !!data;
  };

  /**
   * Obtiene los créditos disponibles del reclutador (propios + heredados)
   */
  const obtenerCreditosDisponibles = async (reclutadorId: string) => {
    // Obtener wallet del reclutador
    const { data: wallet } = await supabase
      .from("wallet_reclutador")
      .select("id, creditos_propios, creditos_heredados")
      .eq("reclutador_id", reclutadorId)
      .maybeSingle();

    if (!wallet) {
      return { total: 0, propios: 0, heredados: 0, walletId: null };
    }

    return {
      total: (wallet.creditos_propios || 0) + (wallet.creditos_heredados || 0),
      propios: wallet.creditos_propios || 0,
      heredados: wallet.creditos_heredados || 0,
      walletId: wallet.id,
    };
  };

  /**
   * Desbloquea la identidad de un candidato cobrando 2 créditos
   */
  const desbloquearIdentidad = async (
    reclutadorId: string,
    reclutadorUserId: string,
    candidatoUserId: string,
    empresaId?: string | null
  ): Promise<ResultadoDesbloqueo> => {
    setLoading(true);

    try {
      // 1. Verificar si ya está desbloqueado
      const yaDesbloqueado = await verificarAccesoDesbloqueado(reclutadorId, candidatoUserId);
      if (yaDesbloqueado) {
        return { success: true, yaDesbloqueado: true };
      }

      // 2. Obtener créditos disponibles
      const creditos = await obtenerCreditosDisponibles(reclutadorId);
      
      if (creditos.total < COSTO_DESBLOQUEO) {
        return {
          success: false,
          error: `Créditos insuficientes. Tienes ${creditos.total} créditos y necesitas ${COSTO_DESBLOQUEO}.`,
        };
      }

      // 3. Determinar origen de pago
      let origenPago: "reclutador" | "empresa" = "reclutador";
      let empresaIdUsada: string | null = null;
      let walletEmpresaId: string | null = null;

      // Si el reclutador tiene créditos heredados y una empresa asociada, usar esos primero
      if (creditos.heredados >= COSTO_DESBLOQUEO && empresaId) {
        // Buscar créditos heredados de la empresa
        const { data: creditosHeredados } = await supabase
          .from("creditos_heredados_reclutador")
          .select("id, creditos_disponibles, empresa_id")
          .eq("reclutador_id", reclutadorId)
          .eq("empresa_id", empresaId)
          .gte("creditos_disponibles", COSTO_DESBLOQUEO)
          .maybeSingle();

        if (creditosHeredados) {
          origenPago = "empresa";
          empresaIdUsada = empresaId;
          
          // Obtener wallet de empresa
          const { data: walletEmpresa } = await supabase
            .from("wallet_empresa")
            .select("id")
            .eq("empresa_id", empresaId)
            .maybeSingle();
          
          walletEmpresaId = walletEmpresa?.id || null;

          // Descontar de créditos heredados
          await supabase
            .from("creditos_heredados_reclutador")
            .update({ 
              creditos_disponibles: creditosHeredados.creditos_disponibles - COSTO_DESBLOQUEO,
              updated_at: new Date().toISOString()
            })
            .eq("id", creditosHeredados.id);

          // Actualizar wallet del reclutador
          await supabase
            .from("wallet_reclutador")
            .update({ 
              creditos_heredados: creditos.heredados - COSTO_DESBLOQUEO,
              updated_at: new Date().toISOString()
            })
            .eq("reclutador_id", reclutadorId);
        }
      }

      // Si no se usaron créditos heredados, usar créditos propios
      if (origenPago === "reclutador") {
        if (creditos.propios < COSTO_DESBLOQUEO) {
          return {
            success: false,
            error: `No tienes suficientes créditos propios. Tienes ${creditos.propios} créditos propios.`,
          };
        }

        // Descontar de créditos propios
        await supabase
          .from("wallet_reclutador")
          .update({ 
            creditos_propios: creditos.propios - COSTO_DESBLOQUEO,
            updated_at: new Date().toISOString()
          })
          .eq("reclutador_id", reclutadorId);
      }

      // 4. Registrar el desbloqueo
      const { error: insertError } = await supabase
        .from("acceso_identidad_candidato")
        .insert({
          reclutador_id: reclutadorId,
          candidato_user_id: candidatoUserId,
          creditos_consumidos: COSTO_DESBLOQUEO,
          empresa_id: empresaIdUsada,
          origen_pago: origenPago,
        });

      if (insertError) throw insertError;

      // 5. Registrar movimiento en auditoría
      const { data: perfil } = await supabase
        .from("perfil_candidato")
        .select("nombre_completo")
        .eq("user_id", candidatoUserId)
        .maybeSingle();

      await supabase.rpc("registrar_movimiento_creditos", {
        p_origen_pago: origenPago === "empresa" ? "heredado_empresa" : "reclutador",
        p_wallet_empresa_id: walletEmpresaId,
        p_wallet_reclutador_id: creditos.walletId,
        p_empresa_id: empresaIdUsada,
        p_reclutador_user_id: reclutadorUserId,
        p_tipo_accion: "contacto_candidato",
        p_creditos_cantidad: -COSTO_DESBLOQUEO,
        p_descripcion: `Desbloqueo de identidad: ${perfil?.nombre_completo || "Candidato"}`,
        p_candidato_user_id: candidatoUserId,
        p_metodo: "manual",
      });

      toast({
        title: "Identidad desbloqueada",
        description: `Se han descontado ${COSTO_DESBLOQUEO} créditos. Ahora puedes ver los datos de contacto.`,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error desbloqueando identidad:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo desbloquear la identidad",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    desbloquearIdentidad,
    verificarAccesoDesbloqueado,
    obtenerCreditosDisponibles,
    loading,
    costoDesbloqueo: COSTO_DESBLOQUEO,
  };
};
