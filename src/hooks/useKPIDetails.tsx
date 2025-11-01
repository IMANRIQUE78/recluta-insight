import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useKPIDetails = (kpiTitle: string) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<Array<{ key: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kpiTitle) {
      loadKPIDetails();
    }
  }, [kpiTitle]);

  const loadKPIDetails = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      switch (kpiTitle) {
        case "Tiempo Promedio de Cobertura":
          await loadCoverageTimeDetails(user.id);
          break;
        case "Tasa de Éxito de Cierre":
          await loadSuccessRateDetails(user.id);
          break;
        case "Tasa de Cancelación":
          await loadCancellationDetails(user.id);
          break;
        case "Vacantes Abiertas":
          await loadOpenVacanciesDetails(user.id);
          break;
        case "Costo por Contratación":
          await loadCostDetails(user.id);
          break;
        case "Satisfacción del Cliente":
          await loadSatisfactionDetails(user.id);
          break;
        case "Tasa de Rotación":
          await loadTurnoverDetails(user.id);
          break;
        case "Entrevistados vs Contratados":
          await loadCandidateRatioDetails(user.id);
          break;
        default:
          setData([]);
          setColumns([]);
      }
    } catch (error) {
      console.error("Error loading KPI details:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoverageTimeDetails = async (userId: string) => {
    const { data: vacantes } = await supabase
      .from("vacantes")
      .select("folio, titulo_puesto, fecha_solicitud, fecha_cierre, clientes_areas!inner(cliente_nombre), estatus")
      .eq("user_id", userId)
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
        cliente: v.clientes_areas?.cliente_nombre,
        estatus: "Cerrada",
        fechaSolicitud: v.fecha_solicitud,
        fechaCierre: v.fecha_cierre,
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
      {
        metrica: "Total de vacantes cerradas",
        valor: `${totalVacantes} vacantes`,
      },
      {
        metrica: "Tiempo promedio de cobertura",
        valor: `${promedioDias} días`,
      },
      {
        metrica: "Mejor tiempo de cierre",
        valor: mejorVacante ? `${mejorVacante.dias} días - ${mejorVacante.puesto} (${mejorVacante.folio})` : "N/A",
      },
      {
        metrica: "Peor tiempo de cierre",
        valor: peorVacante ? `${peorVacante.dias} días - ${peorVacante.puesto} (${peorVacante.folio})` : "N/A",
      },
    ];

    setData([...estadisticas, ...vacantesConDias]);
    setColumns([
      { key: "metrica", label: "Métrica" },
      { key: "valor", label: "Valor" },
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "dias", label: "Días" },
      { key: "cliente", label: "Cliente" },
    ]);
  };

  const loadSuccessRateDetails = async (userId: string) => {
    const { data: vacantes } = await supabase
      .from("vacantes")
      .select("folio, titulo_puesto, fecha_solicitud, fecha_cierre, clientes_areas!inner(cliente_nombre), estatus")
      .eq("user_id", userId)
      .eq("estatus", "cerrada")
      .order("fecha_cierre", { ascending: false });

    const details = vacantes?.map((v) => ({
      folio: v.folio,
      puesto: v.titulo_puesto,
      cliente: v.clientes_areas?.cliente_nombre,
      fechaCierre: new Date(v.fecha_cierre!).toLocaleDateString("es-MX"),
      estatus: "Exitosa",
    })) || [];

    setData(details);
    setColumns([
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "cliente", label: "Cliente" },
      { key: "fechaCierre", label: "Fecha Cierre" },
      { key: "estatus", label: "Estatus" },
    ]);
  };

  const loadCancellationDetails = async (userId: string) => {
    const { data: vacantes } = await supabase
      .from("vacantes")
      .select("folio, titulo_puesto, fecha_solicitud, clientes_areas!inner(cliente_nombre), observaciones")
      .eq("user_id", userId)
      .eq("estatus", "cancelada")
      .order("fecha_solicitud", { ascending: false });

    const details = vacantes?.map((v) => ({
      folio: v.folio,
      puesto: v.titulo_puesto,
      cliente: v.clientes_areas?.cliente_nombre,
      fechaSolicitud: new Date(v.fecha_solicitud).toLocaleDateString("es-MX"),
      motivo: v.observaciones || "No especificado",
    })) || [];

    setData(details);
    setColumns([
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "cliente", label: "Cliente" },
      { key: "fechaSolicitud", label: "Fecha Solicitud" },
      { key: "motivo", label: "Motivo" },
    ]);
  };

  const loadOpenVacanciesDetails = async (userId: string) => {
    const { data: vacantes } = await supabase
      .from("vacantes")
      .select("folio, titulo_puesto, fecha_solicitud, clientes_areas!inner(cliente_nombre), perfil_reclutador(nombre_reclutador)")
      .eq("user_id", userId)
      .eq("estatus", "abierta")
      .order("fecha_solicitud", { ascending: false });

    const details = vacantes?.map((v) => {
      const diasAbierta = Math.ceil(
        (new Date().getTime() - new Date(v.fecha_solicitud).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      return {
        folio: v.folio,
        puesto: v.titulo_puesto,
        cliente: v.clientes_areas?.cliente_nombre,
        diasAbierta,
        reclutador: (v.perfil_reclutador as any)?.nombre_reclutador || "No asignado",
      };
    }) || [];

    setData(details);
    setColumns([
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "cliente", label: "Cliente" },
      { key: "diasAbierta", label: "Días Abierta" },
      { key: "reclutador", label: "Reclutador" },
    ]);
  };

  const loadCostDetails = async (userId: string) => {
    const { data: costos } = await supabase
      .from("costos")
      .select("tipo_costo, monto, fecha, vacantes!inner(folio, titulo_puesto, user_id)")
      .eq("vacantes.user_id", userId)
      .order("fecha", { ascending: false });

    const details = costos?.map((c) => ({
      folio: c.vacantes?.folio,
      puesto: c.vacantes?.titulo_puesto,
      tipoCosto: c.tipo_costo,
      monto: `$${Number(c.monto).toLocaleString()}`,
      fecha: new Date(c.fecha).toLocaleDateString("es-MX"),
    })) || [];

    setData(details);
    setColumns([
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "tipoCosto", label: "Tipo de Costo" },
      { key: "monto", label: "Monto" },
      { key: "fecha", label: "Fecha" },
    ]);
  };

  const loadSatisfactionDetails = async (userId: string) => {
    const { data: satisfaccion } = await supabase
      .from("satisfaccion")
      .select("satisfaccion, nps, comentarios, fecha, vacantes!inner(folio, titulo_puesto, user_id, clientes_areas(cliente_nombre))")
      .eq("vacantes.user_id", userId)
      .order("fecha", { ascending: false });

    const details = satisfaccion?.map((s) => ({
      folio: s.vacantes?.folio,
      puesto: s.vacantes?.titulo_puesto,
      cliente: s.vacantes?.clientes_areas?.cliente_nombre,
      satisfaccion: `${s.satisfaccion || 0}/5`,
      nps: s.nps || 0,
      fecha: new Date(s.fecha).toLocaleDateString("es-MX"),
    })) || [];

    setData(details);
    setColumns([
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "cliente", label: "Cliente" },
      { key: "satisfaccion", label: "Satisfacción" },
      { key: "nps", label: "NPS" },
      { key: "fecha", label: "Fecha" },
    ]);
  };

  const loadTurnoverDetails = async (userId: string) => {
    const { data: rotacion } = await supabase
      .from("rotacion")
      .select("empleado_hash, fecha_ingreso, fecha_baja, motivo_baja, vacantes!inner(folio, titulo_puesto, user_id)")
      .eq("vacantes.user_id", userId)
      .not("fecha_baja", "is", null)
      .order("fecha_baja", { ascending: false });

    const details = rotacion?.map((r) => {
      const diasTrabajados = Math.ceil(
        (new Date(r.fecha_baja!).getTime() - new Date(r.fecha_ingreso).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      return {
        folio: r.vacantes?.folio,
        puesto: r.vacantes?.titulo_puesto,
        fechaBaja: new Date(r.fecha_baja!).toLocaleDateString("es-MX"),
        diasTrabajados,
        motivo: r.motivo_baja || "No especificado",
      };
    }) || [];

    setData(details);
    setColumns([
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "fechaBaja", label: "Fecha Baja" },
      { key: "diasTrabajados", label: "Días Trabajados" },
      { key: "motivo", label: "Motivo" },
    ]);
  };

  const loadCandidateRatioDetails = async (userId: string) => {
    const { data: candidatos } = await supabase
      .from("candidatos")
      .select("contratado, etapa_maxima, fuente, vacantes!inner(folio, titulo_puesto, user_id)")
      .eq("vacantes.user_id", userId)
      .order("vacantes(folio)", { ascending: false });

    const groupedByVacante: { [key: string]: any } = {};
    candidatos?.forEach((c) => {
      const folio = c.vacantes?.folio || "";
      if (!groupedByVacante[folio]) {
        groupedByVacante[folio] = {
          folio,
          puesto: c.vacantes?.titulo_puesto,
          entrevistados: 0,
          contratados: 0,
        };
      }
      groupedByVacante[folio].entrevistados++;
      if (c.contratado) {
        groupedByVacante[folio].contratados++;
      }
    });

    const details = Object.values(groupedByVacante).map((v: any) => ({
      folio: v.folio,
      puesto: v.puesto,
      entrevistados: v.entrevistados,
      contratados: v.contratados,
      ratio: v.contratados > 0 ? `1:${(v.entrevistados / v.contratados).toFixed(1)}` : "0:0",
    }));

    setData(details);
    setColumns([
      { key: "folio", label: "Folio" },
      { key: "puesto", label: "Puesto" },
      { key: "entrevistados", label: "Entrevistados" },
      { key: "contratados", label: "Contratados" },
      { key: "ratio", label: "Ratio" },
    ]);
  };

  return { data, columns, loading };
};