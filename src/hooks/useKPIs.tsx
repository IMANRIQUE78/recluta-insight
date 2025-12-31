import { useState, useEffect, useCallback, useRef } from "react";
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateKPIs = useCallback(async () => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Construir query con filtros aplicados
      let query = supabase
        .from("vacantes")
        .select("id, estatus, fecha_solicitud, fecha_cierre")
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

      const { data: vacantes, error } = await query;

      if (error) {
        console.error("Error fetching vacantes:", error);
        throw error;
      }

      // Calcular tiempo promedio de cobertura (solo vacantes cerradas dentro del filtro)
      const vacantesCerradas = vacantes?.filter(v => 
        v.estatus === "cerrada" && v.fecha_cierre
      ) || [];
      
      let tiempoPromedio = 0;
      if (vacantesCerradas.length > 0) {
        const totalDias = vacantesCerradas.reduce((sum, v) => {
          const inicio = new Date(v.fecha_solicitud);
          const fin = new Date(v.fecha_cierre!);
          const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, dias);
        }, 0);
        tiempoPromedio = Math.round(totalDias / vacantesCerradas.length);
      }

      const totalVacantes = vacantes?.length || 0;
      const abiertas = vacantes?.filter((v) => v.estatus === "abierta").length || 0;
      const cerradas = vacantes?.filter((v) => v.estatus === "cerrada").length || 0;
      const canceladas = vacantes?.filter((v) => v.estatus === "cancelada").length || 0;

      // Calcular tasas
      const tasaExito = totalVacantes > 0 ? Math.round((cerradas / totalVacantes) * 100) : 0;
      const tasaCancel = totalVacantes > 0 ? Math.round((canceladas / totalVacantes) * 100) : 0;

      // Inicializar valores por defecto
      let totalEntrevistados = 0;
      let totalContratados = 0;
      let promedioSatisfaccion = 0;

      // Solo hacer queries adicionales si hay vacantes
      if (vacantes && vacantes.length > 0) {
        const vacantesIds = vacantes.map(v => v.id);
        
        const { data: publicaciones } = await supabase
          .from("publicaciones_marketplace")
          .select("id, vacante_id")
          .in("vacante_id", vacantesIds);

        if (publicaciones && publicaciones.length > 0) {
          const publicacionIds = publicaciones.map(p => p.id);

          // Ejecutar en paralelo
          const [postulacionesResult, feedbacksResult] = await Promise.all([
            supabase
              .from("postulaciones")
              .select("id, estado")
              .in("publicacion_id", publicacionIds),
            supabase
              .from("feedback_candidato")
              .select("puntuacion, postulacion_id")
              .not("puntuacion", "is", null)
          ]);

          const postulaciones = postulacionesResult.data;

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

            // Filtrar feedbacks por postulaciones válidas
            const feedbacks = feedbacksResult.data?.filter(f => 
              postulacionIds.includes(f.postulacion_id)
            ) || [];

            if (feedbacks.length > 0) {
              const totalFeedbackScore = feedbacks.reduce((sum, f) => sum + (f.puntuacion || 0), 0);
              promedioSatisfaccion = Number((totalFeedbackScore / feedbacks.length).toFixed(1));
            }
          }
        }
      }

      const ratio = `${totalEntrevistados}:${totalContratados}`;
      const tasaRot = totalVacantes > 0 && cerradas > 0
        ? Math.round((canceladas / (cerradas + canceladas)) * 100)
        : 0;

      setKpis({
        tiempoPromedioCobertura: tiempoPromedio,
        tasaExitoCierre: tasaExito,
        tasaCancelacion: tasaCancel,
        vacantesAbiertas: abiertas,
        costoPromedioContratacion: 0,
        satisfaccionCliente: promedioSatisfaccion,
        tasaRotacion: tasaRot,
        entrevistadosVsContratados: ratio,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Error calculating KPIs:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCliente, selectedReclutador, selectedEstatus]);

  useEffect(() => {
    calculateKPIs();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refreshTrigger, calculateKPIs]);

  return { kpis, loading };
};
