import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ConceptoCosteo {
  id: string;
  empresa_id: string;
  concepto: string;
  costo: number;
  periodicidad: string;
  unidad_medida: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetricasVacantes {
  cerradas: number;
  abiertas: number;
  canceladas: number;
  valorPonderado: number; // cerradas*1 + abiertas*0.5 + canceladas*0.25
  totalVacantes: number;
  totalCandidatos: number; // postulaciones totales
  totalReclutadores: number; // reclutadores activos
}

export interface ReporteCostos {
  costoMensualTotal: number;
  costoAnualTotal: number;
  costoPorVacanteEfectiva: number;
  costoPorContratacion: number; // Solo vacantes cerradas
  eficienciaOperativa: number;
  conceptosDesglose: Array<{
    concepto: string;
    costoMensual: number;
    porcentaje: number;
    unidadMedida: string;
  }>;
}

// Factor de conversión temporal a meses
const FACTOR_PERIODICIDAD: Record<string, number> = {
  // Únicos - se prorratea en el período seleccionado
  unico: 1, // El prorrateo se maneja aparte
  // Recurrentes - conversión a mensual
  hora: 160, // 8h * 20 días laborables
  diario: 20, // 20 días laborables por mes
  semanal: 4.33, // semanas por mes
  quincenal: 2,
  mensual: 1,
  bimestral: 0.5,
  trimestral: 1 / 3,
  semestral: 1 / 6,
  anual: 1 / 12,
};

// Períodos de prorrateo para costos únicos (en meses)
const PERIODOS_PRORRATEO: Record<string, number> = {
  "1": 1,
  "3": 3,
  "6": 6,
  "12": 12,
  "24": 24,
  "36": 36,
};

export const useCostosReclutamiento = (empresaId: string | null) => {
  const [conceptos, setConceptos] = useState<ConceptoCosteo[]>([]);
  const [metricas, setMetricas] = useState<MetricasVacantes>({
    cerradas: 0,
    abiertas: 0,
    canceladas: 0,
    valorPonderado: 0,
    totalVacantes: 0,
    totalCandidatos: 0,
    totalReclutadores: 0,
  });
  const [reporte, setReporte] = useState<ReporteCostos>({
    costoMensualTotal: 0,
    costoAnualTotal: 0,
    costoPorVacanteEfectiva: 0,
    costoPorContratacion: 0,
    eficienciaOperativa: 0,
    conceptosDesglose: [],
  });
  const [loading, setLoading] = useState(true);

  /**
   * Calcula el costo mensual según la unidad de medida y periodicidad
   * Unidades de medida y su efecto:
   * - por_contratacion: costo * vacantes cerradas
   * - por_candidato: costo * total candidatos
   * - por_reclutador: costo * total reclutadores
   * - por_hora/dia/mes/año: conversión temporal
   * - fijo: costo directo mensualizado
   */
  const calcularCostoMensual = useCallback((
    concepto: ConceptoCosteo,
    metricasActuales: MetricasVacantes
  ): number => {
    const { costo, periodicidad, unidad_medida } = concepto;
    
    // Primero aplicamos el factor de periodicidad para convertir a mensual
    let costoBase = costo;
    
    // Si es único, el prorrateo viene codificado en periodicidad como "unico_X" donde X es meses
    if (periodicidad.startsWith("unico_")) {
      const mesesProrrateo = parseInt(periodicidad.split("_")[1]) || 12;
      costoBase = costo / mesesProrrateo;
    } else {
      const factor = FACTOR_PERIODICIDAD[periodicidad] || 1;
      costoBase = costo * factor;
    }

    // Luego aplicamos el multiplicador según unidad de medida
    switch (unidad_medida) {
      case "por_contratacion":
        // Solo afecta vacantes cerradas - a más contrataciones, se distribuye el costo
        // El costo total es fijo, pero por contratación individual baja
        return costoBase * Math.max(metricasActuales.cerradas, 1);
      
      case "por_candidato":
        // Afecta por cada candidato en proceso
        return costoBase * Math.max(metricasActuales.totalCandidatos, 1);
      
      case "por_reclutador":
        // Costo por cada reclutador activo
        return costoBase * Math.max(metricasActuales.totalReclutadores, 1);
      
      case "por_hora":
      case "por_dia":
      case "por_mes":
      case "por_ano":
      case "fijo":
      default:
        // El costo ya está mensualizado por el factor de periodicidad
        return costoBase;
    }
  }, []);

  const loadConceptos = useCallback(async () => {
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("conceptos_costeo_reclutamiento")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading conceptos:", error);
      return;
    }

    setConceptos((data as ConceptoCosteo[]) || []);
  }, [empresaId]);

  const loadMetricasVacantes = useCallback(async () => {
    if (!empresaId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Cargar vacantes
    const { data: vacantes, error: vacantesError } = await supabase
      .from("vacantes")
      .select("id, estatus")
      .eq("user_id", user.id);

    if (vacantesError) {
      console.error("Error loading vacantes:", vacantesError);
      return;
    }

    // Contar postulaciones (candidatos) de las publicaciones del usuario
    const { data: publicaciones } = await supabase
      .from("publicaciones_marketplace")
      .select("id")
      .eq("user_id", user.id);

    let totalCandidatos = 0;
    if (publicaciones && publicaciones.length > 0) {
      const publicacionIds = publicaciones.map(p => p.id);
      const { count } = await supabase
        .from("postulaciones")
        .select("id", { count: "exact", head: true })
        .in("publicacion_id", publicacionIds);
      totalCandidatos = count || 0;
    }

    // Contar reclutadores asociados a la empresa
    const { count: reclutadoresCount } = await supabase
      .from("reclutador_empresa")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("estado", "activa");

    const cerradas = vacantes?.filter(v => v.estatus === "cerrada").length || 0;
    const abiertas = vacantes?.filter(v => v.estatus === "abierta").length || 0;
    const canceladas = vacantes?.filter(v => v.estatus === "cancelada").length || 0;

    // Valor ponderado: cerradas=1, abiertas=0.5, canceladas=0.25
    const valorPonderado = (cerradas * 1) + (abiertas * 0.5) + (canceladas * 0.25);

    setMetricas({
      cerradas,
      abiertas,
      canceladas,
      valorPonderado,
      totalVacantes: vacantes?.length || 0,
      totalCandidatos,
      totalReclutadores: reclutadoresCount || 0,
    });
  }, [empresaId]);

  const calcularReporte = useCallback(() => {
    const conceptosActivos = conceptos.filter(c => c.activo);
    
    let costoMensualTotal = 0;
    const desglose: ReporteCostos["conceptosDesglose"] = [];

    // Calcular costos separando por tipo
    let costosContratacion = 0;

    conceptosActivos.forEach(concepto => {
      const costoMensual = calcularCostoMensual(concepto, metricas);
      costoMensualTotal += costoMensual;
      
      if (concepto.unidad_medida === "por_contratacion") {
        costosContratacion += costoMensual;
      }

      desglose.push({
        concepto: concepto.concepto,
        costoMensual,
        porcentaje: 0,
        unidadMedida: concepto.unidad_medida,
      });
    });

    // Calcular porcentajes
    desglose.forEach(item => {
      item.porcentaje = costoMensualTotal > 0 
        ? (item.costoMensual / costoMensualTotal) * 100 
        : 0;
    });

    // Ordenar por costo mensual descendente
    desglose.sort((a, b) => b.costoMensual - a.costoMensual);

    const costoAnualTotal = costoMensualTotal * 12;
    
    // Costo por vacante efectiva (valor ponderado)
    // A mayor número de vacantes cerradas, menor costo por vacante
    const costoPorVacanteEfectiva = metricas.valorPonderado > 0 
      ? costoMensualTotal / metricas.valorPonderado 
      : costoMensualTotal;

    // Costo por contratación (solo vacantes cerradas)
    const costoPorContratacion = metricas.cerradas > 0
      ? costoMensualTotal / metricas.cerradas
      : costoMensualTotal;

    // Eficiencia operativa: relación entre output (vacantes cerradas) e input (costo)
    // Fórmula: (vacantes cerradas * 1000) / costo mensual
    // Interpretación: cuántas "unidades de valor" se generan por cada $1000 invertidos
    const eficienciaOperativa = costoMensualTotal > 0 
      ? (metricas.cerradas * 1000) / costoMensualTotal
      : 0;

    setReporte({
      costoMensualTotal,
      costoAnualTotal,
      costoPorVacanteEfectiva,
      costoPorContratacion,
      eficienciaOperativa,
      conceptosDesglose: desglose,
    });
  }, [conceptos, metricas, calcularCostoMensual]);

  const agregarConcepto = async (data: {
    concepto: string;
    costo: number;
    periodicidad: string;
    unidad_medida: string;
    descripcion?: string;
  }) => {
    if (!empresaId) {
      toast({
        title: "Error",
        description: "No se encontró la empresa asociada",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("conceptos_costeo_reclutamiento")
      .insert({
        empresa_id: empresaId,
        ...data,
      });

    if (error) {
      console.error("Error inserting concepto:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el concepto de costo",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Concepto agregado",
      description: "El concepto de costo se agregó correctamente",
    });

    await loadConceptos();
    return true;
  };

  const actualizarConcepto = async (id: string, data: Partial<ConceptoCosteo>) => {
    const { error } = await supabase
      .from("conceptos_costeo_reclutamiento")
      .update(data)
      .eq("id", id);

    if (error) {
      console.error("Error updating concepto:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el concepto",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Concepto actualizado",
      description: "El concepto se actualizó correctamente",
    });

    await loadConceptos();
    return true;
  };

  const eliminarConcepto = async (id: string) => {
    const { error } = await supabase
      .from("conceptos_costeo_reclutamiento")
      .update({ activo: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting concepto:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el concepto",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Concepto eliminado",
      description: "El concepto se eliminó correctamente",
    });

    await loadConceptos();
    return true;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadConceptos(), loadMetricasVacantes()]);
      setLoading(false);
    };

    if (empresaId) {
      loadData();
    }
  }, [empresaId, loadConceptos, loadMetricasVacantes]);

  useEffect(() => {
    calcularReporte();
  }, [conceptos, metricas, calcularReporte]);

  return {
    conceptos,
    metricas,
    reporte,
    loading,
    agregarConcepto,
    actualizarConcepto,
    eliminarConcepto,
    refetch: () => Promise.all([loadConceptos(), loadMetricasVacantes()]),
  };
};

// Unidades de medida con descripción clara
export const UNIDADES_MEDIDA = [
  { value: "por_contratacion", label: "Por contratación", descripcion: "Afecta solo vacantes cerradas" },
  { value: "por_candidato", label: "Por candidato", descripcion: "Afecta costos de reclutamiento" },
  { value: "por_reclutador", label: "Por reclutador", descripcion: "Costo por cada reclutador" },
  { value: "por_hora", label: "Por hora", descripcion: "Costo horario" },
  { value: "por_dia", label: "Por día", descripcion: "Costo diario" },
  { value: "por_mes", label: "Por mes", descripcion: "Costo mensual fijo" },
  { value: "por_ano", label: "Por año", descripcion: "Costo anual fijo" },
  { value: "fijo", label: "Costo fijo", descripcion: "Costo fijo mensualizado" },
];

// Periodicidades separadas en dos categorías
export const PERIODICIDADES_RECURRENTES = [
  { value: "hora", label: "Por hora" },
  { value: "diario", label: "Diario" },
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

export const PERIODICIDADES_UNICAS = [
  { value: "unico_1", label: "Único - Prorrateo 1 mes" },
  { value: "unico_3", label: "Único - Prorrateo 3 meses" },
  { value: "unico_6", label: "Único - Prorrateo 6 meses" },
  { value: "unico_12", label: "Único - Prorrateo 12 meses" },
  { value: "unico_24", label: "Único - Prorrateo 24 meses" },
  { value: "unico_36", label: "Único - Prorrateo 36 meses" },
];

// Mantener compatibilidad - combinar todas las periodicidades
export const PERIODICIDADES = [
  ...PERIODICIDADES_RECURRENTES,
  ...PERIODICIDADES_UNICAS,
];

// Helper para obtener label de periodicidad
export const getPeriodicidadLabel = (value: string): string => {
  const found = PERIODICIDADES.find(p => p.value === value);
  return found?.label || value;
};

// Helper para obtener label de unidad de medida
export const getUnidadMedidaLabel = (value: string): string => {
  const found = UNIDADES_MEDIDA.find(u => u.value === value);
  return found?.label || value;
};
