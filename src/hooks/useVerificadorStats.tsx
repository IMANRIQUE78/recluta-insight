import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInHours, isAfter, subDays } from "date-fns";

interface VerificadorStats {
  estudiosCompletados: number;
  estudiosEnProceso: number;
  estudiosPendientes: number;
  completados30Dias: number;
  entregasATiempo: number;
  porcentajeATiempo: number;
  tiempoRespuestaPromedioHoras: number;
  promedioCalificacion: number;
  totalCalificaciones: number;
}

export function useVerificadorStats(verificadorId: string | null | undefined) {
  // Fetch todos los estudios del verificador
  const { data: estudios = [], isLoading: loadingEstudios } = useQuery({
    queryKey: ["verificador-estudios-stats", verificadorId],
    queryFn: async () => {
      if (!verificadorId) return [];
      const { data, error } = await supabase
        .from("estudios_socioeconomicos")
        .select("id, estatus, fecha_asignacion, fecha_limite, fecha_entrega, created_at")
        .eq("verificador_id", verificadorId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!verificadorId,
  });

  // Fetch las calificaciones de los estudios entregados
  const estudiosEntregadosIds = useMemo(() => 
    estudios.filter(e => e.estatus === "entregado").map(e => e.id),
    [estudios]
  );

  const { data: calificaciones = [], isLoading: loadingCalificaciones } = useQuery({
    queryKey: ["verificador-calificaciones-stats", estudiosEntregadosIds],
    queryFn: async () => {
      if (estudiosEntregadosIds.length === 0) return [];
      const { data, error } = await supabase
        .from("calificaciones_estudio")
        .select("calificacion")
        .in("estudio_id", estudiosEntregadosIds);
      if (error) return [];
      return data || [];
    },
    enabled: estudiosEntregadosIds.length > 0,
  });

  // Calcular las estadísticas
  const stats: VerificadorStats = useMemo(() => {
    const hace30Dias = subDays(new Date(), 30);

    // Conteos básicos
    const estudiosCompletados = estudios.filter(e => e.estatus === "entregado").length;
    const estudiosEnProceso = estudios.filter(e => 
      ["en_proceso", "pendiente_carga"].includes(e.estatus)
    ).length;
    const estudiosPendientes = estudios.filter(e => 
      ["solicitado", "asignado"].includes(e.estatus)
    ).length;

    // Completados en últimos 30 días
    const completados30Dias = estudios.filter(e => {
      if (e.estatus !== "entregado" || !e.fecha_entrega) return false;
      return isAfter(new Date(e.fecha_entrega), hace30Dias);
    }).length;

    // Entregas a tiempo (fecha_entrega <= fecha_limite)
    const estudiosEntregados = estudios.filter(e => 
      e.estatus === "entregado" && e.fecha_entrega && e.fecha_limite
    );
    const entregasATiempo = estudiosEntregados.filter(e => 
      new Date(e.fecha_entrega!) <= new Date(e.fecha_limite!)
    ).length;
    const porcentajeATiempo = estudiosEntregados.length > 0 
      ? Math.round((entregasATiempo / estudiosEntregados.length) * 100) 
      : 100;

    // Tiempo de respuesta promedio (desde asignación hasta entrega)
    const tiemposRespuesta = estudios
      .filter(e => e.estatus === "entregado" && e.fecha_asignacion && e.fecha_entrega)
      .map(e => differenceInHours(new Date(e.fecha_entrega!), new Date(e.fecha_asignacion!)));
    
    const tiempoRespuestaPromedioHoras = tiemposRespuesta.length > 0
      ? Math.round(tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length)
      : 0;

    // Calificación promedio
    const totalCalificaciones = calificaciones.length;
    const promedioCalificacion = totalCalificaciones > 0
      ? calificaciones.reduce((acc, c) => acc + c.calificacion, 0) / totalCalificaciones
      : 0;

    return {
      estudiosCompletados,
      estudiosEnProceso,
      estudiosPendientes,
      completados30Dias,
      entregasATiempo,
      porcentajeATiempo,
      tiempoRespuestaPromedioHoras,
      promedioCalificacion,
      totalCalificaciones,
    };
  }, [estudios, calificaciones]);

  return {
    stats,
    isLoading: loadingEstudios || loadingCalificaciones,
    estudios,
  };
}
