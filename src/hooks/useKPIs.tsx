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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Construir query con filtros
      let query = supabase
        .from("vacantes")
        .select("*")
        .eq("user_id", user.id);

      if (selectedCliente !== "todos") {
        query = query.eq("cliente_area_id", selectedCliente);
      }
      if (selectedReclutador !== "todos") {
        query = query.eq("reclutador_id", selectedReclutador);
      }
      if (selectedEstatus !== "todos") {
        query = query.eq("estatus", selectedEstatus as "abierta" | "cerrada" | "cancelada");
      }

      const { data: vacantes, error: vacantesError } = await query;
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

      // KPIs obsoletos deshabilitados temporalmente
      // TODO: Reimplementar usando el sistema de postulaciones
      const totalCandidatos = 0;
      const contratados = 0;
      const ratio = "0:0";
      const costoPromedio = 0;
      const promedioSatisfaccion = 0;
      const tasaRot = 0;

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
