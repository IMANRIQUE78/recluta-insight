import { useState, useEffect } from "react";
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
  // Monthly stats for goals
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

  useEffect(() => {
    if (!reclutadorId) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        // Calculate current month boundaries
        const now = new Date();
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        // Get user_id for the recruiter profile
        const { data: perfilData } = await supabase
          .from("perfil_reclutador")
          .select("user_id")
          .eq("id", reclutadorId)
          .single();

        const reclutadorUserId = perfilData?.user_id;

        // Obtener vacantes asignadas
        const { data: vacantesAsignadas } = await supabase
          .from("vacantes")
          .select("id, fecha_solicitud, fecha_cierre, estatus")
          .eq("reclutador_asignado_id", reclutadorId);

        const asignadas = vacantesAsignadas?.filter(v => v.estatus === "abierta").length || 0;
        const cerradas = vacantesAsignadas?.filter(v => v.estatus === "cerrada") || [];
        
        // Vacantes cerradas este mes
        const cerradasMes = vacantesAsignadas?.filter(v => 
          v.estatus === "cerrada" && 
          v.fecha_cierre && 
          new Date(v.fecha_cierre) >= new Date(inicioMes) &&
          new Date(v.fecha_cierre) <= new Date(finMes)
        ).length || 0;

        // Calcular promedio de días de cierre
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

        // Obtener publicaciones
        const { data: publicaciones } = await supabase
          .from("publicaciones_marketplace")
          .select("id")
          .in("vacante_id", vacantesAsignadas?.map(v => v.id) || [])
          .eq("publicada", true);

        // Obtener entrevistas realizadas
        const { data: entrevistas } = await supabase
          .from("entrevistas_candidato")
          .select("id, postulacion_id, asistio, fecha_entrevista")
          .eq("reclutador_user_id", reclutadorUserId);

        // Entrevistas realizadas este mes (confirmadas y fecha pasada)
        const entrevistasRealizadasMes = entrevistas?.filter(e => 
          e.fecha_entrevista && 
          new Date(e.fecha_entrevista) >= new Date(inicioMes) &&
          new Date(e.fecha_entrevista) <= new Date(finMes) &&
          new Date(e.fecha_entrevista) <= now
        ).length || 0;

        // Calcular porcentaje de éxito (entrevistas que asistieron / total entrevistas)
        const totalEntrevistas = entrevistas?.length || 0;
        const porcentajeExito = totalEntrevistas > 0 ? Math.round((cerradas.length / totalEntrevistas) * 100) : 0;

        // Obtener calificaciones promedio
        const { data: feedbacks } = await supabase
          .from("feedback_candidato")
          .select("puntuacion")
          .eq("reclutador_user_id", reclutadorUserId)
          .not("puntuacion", "is", null);

        const totalCalificaciones = feedbacks?.length || 0;
        const calificacionPromedio = totalCalificaciones > 0
          ? Math.round((feedbacks.reduce((sum, f) => sum + (f.puntuacion || 0), 0) / totalCalificaciones) * 10) / 10
          : 0;

        setStats({
          vacantesAsignadas: asignadas,
          vacantesPublicadas: publicaciones?.length || 0,
          vacantesCerradas: cerradas.length,
          promedioDiasCierre: promedioDias,
          totalEntrevistas,
          porcentajeExito,
          calificacionPromedio,
          totalCalificaciones,
          vacantesCerradasMes: cerradasMes,
          entrevistasRealizadasMes,
        });
      } catch (error) {
        console.error("Error loading recruiter stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [reclutadorId]);

  return { stats, loading };
};
