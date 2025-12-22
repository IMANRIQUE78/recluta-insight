import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useReclutadorKPIDetails = (kpiTitle: string, reclutadorUserId: string | null) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<Array<{ key: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);

  const loadPromedioCierreDetails = useCallback(async (userId: string, perfilId: string) => {
    const { data: vacantes } = await supabase
      .from("vacantes")
      .select(`
        folio, 
        titulo_puesto, 
        fecha_solicitud, 
        fecha_cierre,
        empresas(nombre_empresa)
      `)
      .eq("reclutador_asignado_id", perfilId)
      .eq("estatus", "cerrada")
      .not("fecha_cierre", "is", null)
      .order("fecha_cierre", { ascending: false });

    const vacantesConDias = vacantes?.map((v) => {
      const dias = Math.ceil(
        (new Date(v.fecha_cierre!).getTime() - new Date(v.fecha_solicitud).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      return {
        folio: v.folio,
        puesto: v.titulo_puesto,
        dias,
        empresa: (v.empresas as any)?.nombre_empresa || "Sin empresa",
        fechaSolicitud: new Date(v.fecha_solicitud).toLocaleDateString("es-MX"),
        fechaCierre: new Date(v.fecha_cierre!).toLocaleDateString("es-MX"),
      };
    }) || [];

    const totalVacantes = vacantesConDias.length;
    const promedioDias = totalVacantes > 0 
      ? Math.round(vacantesConDias.reduce((acc, v) => acc + v.dias, 0) / totalVacantes)
      : 0;
    
    const mejorVacante = vacantesConDias.length > 0
      ? vacantesConDias.reduce((min, v) => v.dias < min.dias ? v : min)
      : null;
    
    const peorVacante = vacantesConDias.length > 0
      ? vacantesConDias.reduce((max, v) => v.dias > max.dias ? v : max)
      : null;

    const estadisticas = [
      { metrica: "Total de vacantes cerradas", valor: `${totalVacantes} vacantes` },
      { metrica: "Tiempo promedio de cierre", valor: `${promedioDias} días` },
      { metrica: "Mejor tiempo de cierre", valor: mejorVacante ? `${mejorVacante.dias} días - ${mejorVacante.puesto}` : "N/A" },
      { metrica: "Mayor tiempo de cierre", valor: peorVacante ? `${peorVacante.dias} días - ${peorVacante.puesto}` : "N/A" },
    ];

    setData([...estadisticas, ...vacantesConDias]);
    setColumns([
      { key: "metrica", label: "Métrica" },
      { key: "valor", label: "Valor" },
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "dias", label: "Días" },
      { key: "empresa", label: "Empresa" },
      { key: "fechaSolicitud", label: "F. Solicitud" },
      { key: "fechaCierre", label: "F. Cierre" },
    ]);
  }, []);

  const loadVacantesCerradasDetails = useCallback(async (userId: string, perfilId: string) => {
    const { data: vacantes } = await supabase
      .from("vacantes")
      .select(`
        folio, 
        titulo_puesto, 
        fecha_cierre,
        empresas(nombre_empresa)
      `)
      .eq("reclutador_asignado_id", perfilId)
      .eq("estatus", "cerrada")
      .order("fecha_cierre", { ascending: false });

    const details = vacantes?.map((v) => ({
      folio: v.folio,
      puesto: v.titulo_puesto,
      empresa: (v.empresas as any)?.nombre_empresa || "Sin empresa",
      fechaCierre: new Date(v.fecha_cierre!).toLocaleDateString("es-MX"),
    })) || [];

    setData(details);
    setColumns([
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "empresa", label: "Empresa" },
      { key: "fechaCierre", label: "Fecha Cierre" },
    ]);
  }, []);

  const loadEntrevistasDetails = useCallback(async (userId: string) => {
    const { data: entrevistas } = await supabase
      .from("entrevistas_candidato")
      .select(`
        fecha_entrevista,
        estado,
        tipo_entrevista,
        asistio,
        postulaciones(
          publicaciones_marketplace(
            titulo_puesto,
            vacante_id
          )
        )
      `)
      .eq("reclutador_user_id", userId)
      .order("fecha_entrevista", { ascending: false });

    const details = entrevistas?.map((e) => {
      const publicacion = (e.postulaciones as any)?.publicaciones_marketplace;
      return {
        fecha: new Date(e.fecha_entrevista).toLocaleDateString("es-MX"),
        puesto: publicacion?.titulo_puesto || "Sin título",
        tipo: e.tipo_entrevista || "No especificado",
        estado: e.estado,
        asistio: e.asistio ? "Sí" : e.asistio === false ? "No" : "Pendiente",
      };
    }) || [];

    const totalEntrevistas = details.length;
    const realizadas = details.filter(d => d.asistio === "Sí").length;

    const estadisticas = [
      { metrica: "Total de entrevistas programadas", valor: `${totalEntrevistas} entrevistas` },
      { metrica: "Entrevistas realizadas", valor: `${realizadas} entrevistas` },
      { metrica: "Tasa de asistencia", valor: totalEntrevistas > 0 ? `${Math.round((realizadas / totalEntrevistas) * 100)}%` : "0%" },
    ];

    setData([...estadisticas, ...details]);
    setColumns([
      { key: "metrica", label: "Métrica" },
      { key: "valor", label: "Valor" },
      { key: "fecha", label: "Fecha" },
      { key: "puesto", label: "Puesto" },
      { key: "tipo", label: "Tipo" },
      { key: "estado", label: "Estado" },
      { key: "asistio", label: "Asistió" },
    ]);
  }, []);

  const loadCalificacionDetails = useCallback(async (userId: string) => {
    const { data: feedbacks } = await supabase
      .from("feedback_candidato")
      .select(`
        puntuacion,
        comentario,
        created_at,
        aspectos_positivos,
        aspectos_mejora,
        postulaciones(
          publicaciones_marketplace(
            titulo_puesto
          )
        )
      `)
      .eq("reclutador_user_id", userId)
      .not("puntuacion", "is", null)
      .order("created_at", { ascending: false });

    const details = feedbacks?.map((f) => {
      const publicacion = (f.postulaciones as any)?.publicaciones_marketplace;
      return {
        puesto: publicacion?.titulo_puesto || "Sin título",
        puntuacion: f.puntuacion,
        fecha: new Date(f.created_at).toLocaleDateString("es-MX"),
        aspectosPositivos: f.aspectos_positivos?.join(", ") || "N/A",
        aspectosMejora: f.aspectos_mejora?.join(", ") || "N/A",
        comentario: f.comentario || "Sin comentario",
      };
    }) || [];

    const totalFeedbacks = details.length;
    const promedio = totalFeedbacks > 0
      ? (details.reduce((acc, f) => acc + (f.puntuacion || 0), 0) / totalFeedbacks).toFixed(1)
      : "0.0";

    const estadisticas = [
      { metrica: "Total de calificaciones recibidas", valor: `${totalFeedbacks} calificaciones` },
      { metrica: "Calificación promedio", valor: `${promedio} ★` },
    ];

    setData([...estadisticas, ...details]);
    setColumns([
      { key: "metrica", label: "Métrica" },
      { key: "valor", label: "Valor" },
      { key: "puesto", label: "Puesto" },
      { key: "puntuacion", label: "Puntuación" },
      { key: "fecha", label: "Fecha" },
      { key: "aspectosPositivos", label: "Aspectos Positivos" },
      { key: "aspectosMejora", label: "Aspectos de Mejora" },
    ]);
  }, []);

  useEffect(() => {
    if (!kpiTitle || !reclutadorUserId) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadKPIDetails = async () => {
      setLoading(true);
      try {
        // Get perfil_reclutador.id from user_id once
        const { data: perfil } = await supabase
          .from("perfil_reclutador")
          .select("id")
          .eq("user_id", reclutadorUserId)
          .single();

        if (abortController.signal.aborted) return;

        const perfilId = perfil?.id;

        switch (kpiTitle) {
          case "Promedio Cierre":
            if (perfilId) await loadPromedioCierreDetails(reclutadorUserId, perfilId);
            break;
          case "Vacantes Cerradas":
            if (perfilId) await loadVacantesCerradasDetails(reclutadorUserId, perfilId);
            break;
          case "Entrevistas / Cierre":
            await loadEntrevistasDetails(reclutadorUserId);
            break;
          case "Calificación":
            await loadCalificacionDetails(reclutadorUserId);
            break;
          default:
            setData([]);
            setColumns([]);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error loading KPI details:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadKPIDetails();

    return () => {
      abortController.abort();
    };
  }, [kpiTitle, reclutadorUserId, loadPromedioCierreDetails, loadVacantesCerradasDetails, loadEntrevistasDetails, loadCalificacionDetails]);

  return { data, columns, loading };
};
