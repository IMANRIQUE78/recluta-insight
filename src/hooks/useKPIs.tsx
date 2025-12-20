import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useKPIs = (
  refreshTrigger: number, 
  selectedCliente: string = "todos",
  selectedReclutador: string = "todos", 
  selectedEstatus: string = "todos"
) => {
  const [kpis, setKpis] = useState({
    tiempoPromedioCobertura: 0,
    tasaExitoCierre: 0,
    tasaCancelacion: 0,
    vacantesAbiertas: 0,
    costoPromedioContratacion: 0,
    satisfaccionCliente: 0,
    tasaRotacion: 0,
    entrevistadosVsContratados: "0:0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateKPIs();
  }, [refreshTrigger, selectedCliente, selectedReclutador, selectedEstatus]);

  const calculateKPIs = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Para tiempo de cobertura SIEMPRE usamos TODAS las vacantes cerradas del usuario
      // (sin importar filtros de cliente/reclutador/estatus)
      const { data: todasVacantesCerradas } = await supabase
        .from("vacantes")
        .select("id, fecha_solicitud, fecha_cierre")
        .eq("user_id", user.id)
        .eq("estatus", "cerrada")
        .not("fecha_cierre", "is", null);

      // Calcular tiempo promedio de cobertura
      let tiempoPromedio = 0;
      if (todasVacantesCerradas && todasVacantesCerradas.length > 0) {
        const totalDias = todasVacantesCerradas.reduce((sum, v) => {
          const inicio = new Date(v.fecha_solicitud);
          const fin = new Date(v.fecha_cierre!);
          const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, dias);
        }, 0);
        tiempoPromedio = Math.round(totalDias / todasVacantesCerradas.length);
      }

      // Query con filtros para los demás KPIs
      let query = supabase
        .from("vacantes")
        .select("*")
        .eq("user_id", user.id);

      if (selectedCliente !== "todos") {
        query = query.eq("cliente_area_id", selectedCliente);
      }
      if (selectedReclutador !== "todos") {
        query = query.eq("reclutador_asignado_id", selectedReclutador);
      }
      if (selectedEstatus !== "todos") {
        query = query.eq("estatus", selectedEstatus as "abierta" | "cerrada" | "cancelada");
      }

      const { data: vacantes, error: vacantesError } = await query;
      if (vacantesError) {
        console.error("Error fetching vacantes:", vacantesError);
        throw vacantesError;
      }

      const totalVacantes = vacantes?.length || 0;
      const abiertas = vacantes?.filter((v) => v.estatus === "abierta").length || 0;
      const cerradas = vacantes?.filter((v) => v.estatus === "cerrada").length || 0;
      const canceladas = vacantes?.filter((v) => v.estatus === "cancelada").length || 0;

      // Calcular tasas
      const tasaExito = totalVacantes > 0 ? Math.round((cerradas / totalVacantes) * 100) : 0;
      const tasaCancel = totalVacantes > 0 ? Math.round((canceladas / totalVacantes) * 100) : 0;

      // Obtener datos de entrevistas y contrataciones desde postulaciones
      let totalEntrevistados = 0;
      let totalContratados = 0;
      let totalFeedbackScore = 0;
      let feedbackCount = 0;

      if (vacantes && vacantes.length > 0) {
        const vacantesIds = vacantes.map(v => v.id);
        
        const { data: publicaciones } = await supabase
          .from("publicaciones_marketplace")
          .select("id, vacante_id")
          .in("vacante_id", vacantesIds);

        if (publicaciones && publicaciones.length > 0) {
          const publicacionIds = publicaciones.map(p => p.id);

          const { data: postulaciones } = await supabase
            .from("postulaciones")
            .select("id, estado, candidato_user_id")
            .in("publicacion_id", publicacionIds);

          if (postulaciones && postulaciones.length > 0) {
            const postulacionIds = postulaciones.map(p => p.id);
            
            totalContratados = postulaciones.filter(
              p => p.estado === "contratado" || p.estado === "aceptado"
            ).length;

            const { data: entrevistas } = await supabase
              .from("entrevistas_candidato")
              .select("id, asistio")
              .in("postulacion_id", postulacionIds)
              .eq("estado", "completada");

            totalEntrevistados = entrevistas?.filter(e => e.asistio)?.length || 0;

            const { data: feedbacks } = await supabase
              .from("feedback_candidato")
              .select("puntuacion")
              .in("postulacion_id", postulacionIds)
              .not("puntuacion", "is", null);

            if (feedbacks && feedbacks.length > 0) {
              feedbackCount = feedbacks.length;
              totalFeedbackScore = feedbacks.reduce((sum, f) => sum + (f.puntuacion || 0), 0);
            }
          }
        }
      }

      const ratio = `${totalEntrevistados}:${totalContratados}`;
      const promedioSatisfaccion = feedbackCount > 0 
        ? Number((totalFeedbackScore / feedbackCount).toFixed(1)) 
        : 0;
      const tasaRot = totalVacantes > 0 && cerradas > 0
        ? Math.round((canceladas / (cerradas + canceladas)) * 100)
        : 0;
      const costoPromedio = 0;

      setKpis({
        tiempoPromedioCobertura: tiempoPromedio,
        tasaExitoCierre: tasaExito,
        tasaCancelacion: tasaCancel,
        vacantesAbiertas: abiertas,
        costoPromedioContratacion: costoPromedio,
        satisfaccionCliente: promedioSatisfaccion,
        tasaRotacion: tasaRot,
        entrevistadosVsContratados: ratio,
      });
    } catch (error) {
      console.error("Error calculating KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  return { kpis, loading };
};
