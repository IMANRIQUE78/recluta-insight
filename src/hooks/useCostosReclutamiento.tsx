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
}

export interface ReporteCostos {
  costoMensualTotal: number;
  costoAnualTotal: number;
  costoPorVacanteEfectiva: number;
  eficienciaOperativa: number; // (valor ponderado / costo mensual) * 100
  conceptosDesglose: Array<{
    concepto: string;
    costoMensual: number;
    porcentaje: number;
  }>;
}

// Factor de conversión a costo mensual
const FACTOR_PERIODICIDAD: Record<string, number> = {
  diario: 30,
  semanal: 4.33,
  quincenal: 2,
  mensual: 1,
  bimestral: 0.5,
  trimestral: 0.333,
  semestral: 0.167,
  anual: 0.0833,
  unico: 0.0833, // Se prorratea en 12 meses
};

export const useCostosReclutamiento = (empresaId: string | null) => {
  const [conceptos, setConceptos] = useState<ConceptoCosteo[]>([]);
  const [metricas, setMetricas] = useState<MetricasVacantes>({
    cerradas: 0,
    abiertas: 0,
    canceladas: 0,
    valorPonderado: 0,
    totalVacantes: 0,
  });
  const [reporte, setReporte] = useState<ReporteCostos>({
    costoMensualTotal: 0,
    costoAnualTotal: 0,
    costoPorVacanteEfectiva: 0,
    eficienciaOperativa: 0,
    conceptosDesglose: [],
  });
  const [loading, setLoading] = useState(true);

  const calcularCostoMensual = (costo: number, periodicidad: string): number => {
    const factor = FACTOR_PERIODICIDAD[periodicidad] || 1;
    return costo * factor;
  };

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

    // Vacantes del último mes para el análisis de eficiencia
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 1);

    const { data: vacantes, error } = await supabase
      .from("vacantes")
      .select("id, estatus")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading vacantes:", error);
      return;
    }

    const cerradas = vacantes?.filter(v => v.estatus === "cerrada").length || 0;
    const abiertas = vacantes?.filter(v => v.estatus === "abierta").length || 0;
    const canceladas = vacantes?.filter(v => v.estatus === "cancelada").length || 0;

    // Valor ponderado según especificación: cerradas=1, abiertas=0.5, canceladas=0.25
    const valorPonderado = (cerradas * 1) + (abiertas * 0.5) + (canceladas * 0.25);

    setMetricas({
      cerradas,
      abiertas,
      canceladas,
      valorPonderado,
      totalVacantes: vacantes?.length || 0,
    });
  }, [empresaId]);

  const calcularReporte = useCallback(() => {
    const conceptosActivos = conceptos.filter(c => c.activo);
    
    // Calcular costo mensual total
    let costoMensualTotal = 0;
    const desglose: ReporteCostos["conceptosDesglose"] = [];

    conceptosActivos.forEach(concepto => {
      const costoMensual = calcularCostoMensual(concepto.costo, concepto.periodicidad);
      costoMensualTotal += costoMensual;
      desglose.push({
        concepto: concepto.concepto,
        costoMensual,
        porcentaje: 0, // Se calculará después
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
    
    // Costo por vacante efectiva (usando valor ponderado)
    const costoPorVacanteEfectiva = metricas.valorPonderado > 0 
      ? costoMensualTotal / metricas.valorPonderado 
      : 0;

    // Eficiencia operativa: valor ponderado / costo mensual * 1000 (para escala legible)
    const eficienciaOperativa = costoMensualTotal > 0 
      ? (metricas.valorPonderado / costoMensualTotal) * 10000 
      : 0;

    setReporte({
      costoMensualTotal,
      costoAnualTotal,
      costoPorVacanteEfectiva,
      eficienciaOperativa,
      conceptosDesglose: desglose,
    });
  }, [conceptos, metricas]);

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
    // Soft delete: solo desactivar
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

export const PERIODICIDADES = [
  { value: "diario", label: "Diario" },
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "unico", label: "Único/Prorrateo" },
];

export const UNIDADES_MEDIDA = [
  { value: "pesos", label: "MXN (Pesos)" },
  { value: "dolares", label: "USD (Dólares)" },
  { value: "horas", label: "Horas" },
  { value: "dias", label: "Días" },
  { value: "unidad", label: "Unidad" },
];
