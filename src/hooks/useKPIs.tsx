import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useKPIs = (refreshTrigger?: number) => {
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
  }, [refreshTrigger]);

  const calculateKPIs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener todas las vacantes del usuario
      const { data: vacantes, error: vacantesError } = await supabase
        .from("vacantes")
        .select("*")
        .eq("user_id", user.id);

      if (vacantesError) throw vacantesError;

      const totalVacantes = vacantes?.length || 0;
      const abiertas = vacantes?.filter((v) => v.estatus === "abierta").length || 0;
      const cerradas = vacantes?.filter((v) => v.estatus === "cerrada").length || 0;
      const canceladas = vacantes?.filter((v) => v.estatus === "cancelada").length || 0;

      // Calcular tiempo promedio de cobertura (vacantes cerradas)
      const vacantesCerradas = vacantes?.filter(
        (v) => v.estatus === "cerrada" && v.fecha_cierre && v.fecha_solicitud
      ) || [];
      
      let tiempoPromedio = 0;
      if (vacantesCerradas.length > 0) {
        const totalDias = vacantesCerradas.reduce((sum, v) => {
          const inicio = new Date(v.fecha_solicitud);
          const fin = new Date(v.fecha_cierre!);
          const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
          return sum + dias;
        }, 0);
        tiempoPromedio = Math.round(totalDias / vacantesCerradas.length);
      }

      // Calcular tasas
      const tasaExito = totalVacantes > 0 ? Math.round((cerradas / totalVacantes) * 100) : 0;
      const tasaCancel = totalVacantes > 0 ? Math.round((canceladas / totalVacantes) * 100) : 0;

      // Obtener candidatos
      const { data: candidatos } = await supabase
        .from("candidatos")
        .select("*, vacantes!inner(user_id)")
        .eq("vacantes.user_id", user.id);

      const totalCandidatos = candidatos?.length || 0;
      const contratados = candidatos?.filter((c) => c.contratado).length || 0;
      const ratio = contratados > 0 ? `1:${(totalCandidatos / contratados).toFixed(1)}` : "0:0";

      // Obtener costos
      const { data: costos } = await supabase
        .from("costos")
        .select("*, vacantes!inner(user_id)")
        .eq("vacantes.user_id", user.id);

      const costoTotal = costos?.reduce((sum, c) => sum + Number(c.monto), 0) || 0;
      const costoPromedio = contratados > 0 ? Math.round(costoTotal / contratados) : 0;

      // Obtener satisfacción
      const { data: satisfaccion } = await supabase
        .from("satisfaccion")
        .select("*, vacantes!inner(user_id)")
        .eq("vacantes.user_id", user.id);

      const promedioSatisfaccion = satisfaccion && satisfaccion.length > 0
        ? (satisfaccion.reduce((sum, s) => sum + (s.satisfaccion || 0), 0) / satisfaccion.length).toFixed(1)
        : 0;

      // Obtener rotación
      const { data: rotacion } = await supabase
        .from("rotacion")
        .select("*, vacantes!inner(user_id)")
        .eq("vacantes.user_id", user.id);

      const empleadosConBaja = rotacion?.filter((r) => r.fecha_baja).length || 0;
      const tasaRot = contratados > 0 ? Math.round((empleadosConBaja / contratados) * 100) : 0;

      setKpis({
        tiempoPromedioCobertura: tiempoPromedio,
        tasaExitoCierre: tasaExito,
        tasaCancelacion: tasaCancel,
        vacantesAbiertas: abiertas,
        costoPromedioContratacion: costoPromedio,
        satisfaccionCliente: Number(promedioSatisfaccion),
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
