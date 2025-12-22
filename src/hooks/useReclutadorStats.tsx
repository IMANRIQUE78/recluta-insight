import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ReclutadorStats {
  vacantesAsignadas: number;
  vacantesPublicadas: number;
  vacantesCerradas: number;
  promedioDiasCierre: number;
  totalEntrevistas: number;
  porcentajeExito: number;
  calificacionPromedio: number;
  totalCalificaciones: number;
  vacantesCerradasMes: number;
  entrevistasRealizadasMes: number;
}

export const useReclutadorStats = (reclutadorId: string | null) => {
  const [stats, setStats] = useState<ReclutadorStats>({
    vacantesAsignadas: 0,
    vacantesPublicadas: 0,
    vacantesCerradas: 0,
    promedioDiasCierre: 0,
    totalEntrevistas: 0,
    porcentajeExito: 0,
    calificacionPromedio: 0,
    totalCalificaciones: 0,
    vacantesCerradasMes: 0,
    entrevistasRealizadasMes: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback((
    vacantesData: any[],
    publicacionesData: any[],
    entrevistasData: any[],
    feedbacksData: any[],
    inicioMes: string,
    finMes: string
  ): ReclutadorStats => {
    const now = new Date();
    
    // Vacantes stats
    const asignadas = vacantesData.filter(v => v.estatus === "abierta").length;
    const cerradas = vacantesData.filter(v => v.estatus === "cerrada");
    
    // Vacantes cerradas este mes
    const cerradasMes = vacantesData.filter(v => 
      v.estatus === "cerrada" && 
      v.fecha_cierre && 
      new Date(v.fecha_cierre) >= new Date(inicioMes) &&
      new Date(v.fecha_cierre) <= new Date(finMes)
    ).length;

    // Promedio días de cierre
    let promedioDias = 0;
    if (cerradas.length > 0) {
      const totalDias = cerradas.reduce((sum, v) => {
        if (v.fecha_cierre && v.fecha_solicitud) {
          const dias = Math.floor(
            (new Date(v.fecha_cierre).getTime() - new Date(v.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + dias;
        }
        return sum;
      }, 0);
      promedioDias = Math.round(totalDias / cerradas.length);
    }

    // Publicaciones - filtrar por vacantes del reclutador
    const vacanteIds = vacantesData.map(v => v.id);
    const publicacionesActivas = publicacionesData.filter(p => 
      vacanteIds.includes(p.vacante_id) && p.publicada
    );

    // Entrevistas stats
    const totalEntrevistas = entrevistasData.length;
    const entrevistasRealizadasMes = entrevistasData.filter(e => 
      e.fecha_entrevista && 
      new Date(e.fecha_entrevista) >= new Date(inicioMes) &&
      new Date(e.fecha_entrevista) <= new Date(finMes) &&
      new Date(e.fecha_entrevista) <= now
    ).length;

    // Porcentaje de éxito
    const porcentajeExito = totalEntrevistas > 0 
      ? Math.round((cerradas.length / totalEntrevistas) * 100) 
      : 0;

    // Calificaciones
    const feedbacksValidos = feedbacksData.filter(f => f.puntuacion !== null);
    const totalCalificaciones = feedbacksValidos.length;
    const calificacionPromedio = totalCalificaciones > 0
      ? Math.round((feedbacksValidos.reduce((sum, f) => sum + (f.puntuacion || 0), 0) / totalCalificaciones) * 10) / 10
      : 0;

    return {
      vacantesAsignadas: asignadas,
      vacantesPublicadas: publicacionesActivas.length,
      vacantesCerradas: cerradas.length,
      promedioDiasCierre: promedioDias,
      totalEntrevistas,
      porcentajeExito,
      calificacionPromedio,
      totalCalificaciones,
      vacantesCerradasMes: cerradasMes,
      entrevistasRealizadasMes,
    };
  }, []);

  useEffect(() => {
    if (!reclutadorId) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadStats = async () => {
      try {
        setLoading(true);
        
        // Calculate month boundaries
        const now = new Date();
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        // First get user_id for the recruiter
        const { data: perfilData, error: perfilError } = await supabase
          .from("perfil_reclutador")
          .select("user_id")
          .eq("id", reclutadorId)
          .single();

        if (perfilError || abortController.signal.aborted) {
          if (!abortController.signal.aborted) {
            console.error("Error fetching perfil:", perfilError);
          }
          return;
        }

        const reclutadorUserId = perfilData?.user_id;
        if (!reclutadorUserId) return;

        // Parallel queries for all data
        const [vacantesResult, publicacionesResult, entrevistasResult, feedbacksResult] = await Promise.all([
          supabase
            .from("vacantes")
            .select("id, fecha_solicitud, fecha_cierre, estatus")
            .eq("reclutador_asignado_id", reclutadorId),
          supabase
            .from("publicaciones_marketplace")
            .select("id, vacante_id, publicada"),
          supabase
            .from("entrevistas_candidato")
            .select("id, postulacion_id, asistio, fecha_entrevista")
            .eq("reclutador_user_id", reclutadorUserId),
          supabase
            .from("feedback_candidato")
            .select("puntuacion")
            .eq("reclutador_user_id", reclutadorUserId)
        ]);

        if (abortController.signal.aborted) return;

        const calculatedStats = calculateStats(
          vacantesResult.data || [],
          publicacionesResult.data || [],
          entrevistasResult.data || [],
          feedbacksResult.data || [],
          inicioMes,
          finMes
        );

        setStats(calculatedStats);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error loading recruiter stats:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      abortController.abort();
    };
  }, [reclutadorId, calculateStats]);

  return { stats, loading };
};
