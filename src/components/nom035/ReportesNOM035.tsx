import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Building2, 
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Printer
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface ReportesNOM035Props {
  empresaId: string;
  empresaNombre: string;
  refreshTrigger?: number;
}

interface ReporteData {
  totalTrabajadores: number;
  evaluacionesCompletadas: number;
  evaluacionesPendientes: number;
  porNivelRiesgo: Record<string, number>;
  porGuia: Record<string, number>;
  porArea: Record<string, { total: number; completadas: number; riesgoAlto: number }>;
  fechaGeneracion: string;
}

const RISK_LABELS: Record<string, string> = {
  nulo: "Nulo",
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  muy_alto: "Muy Alto"
};

export const ReportesNOM035 = ({ empresaId, empresaNombre, refreshTrigger }: ReportesNOM035Props) => {
  const [reporteData, setReporteData] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReporte();
  }, [empresaId, refreshTrigger]);

  const generateReporte = async () => {
    setLoading(true);
    try {
      // Total trabajadores
      const { count: totalTrabajadores } = await supabase
        .from("trabajadores_nom035")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("activo", true);

      // Evaluaciones completadas
      const { data: evaluaciones } = await supabase
        .from("evaluaciones_nom035")
        .select(`
          id,
          tipo_guia,
          estado,
          nivel_riesgo,
          trabajador_id
        `)
        .eq("empresa_id", empresaId);

      // Trabajadores con su área
      const { data: trabajadores } = await supabase
        .from("trabajadores_nom035")
        .select("id, area")
        .eq("empresa_id", empresaId)
        .eq("activo", true);

      const trabajadoresMap = new Map(trabajadores?.map(t => [t.id, t.area]) || []);

      const completadas = evaluaciones?.filter(e => e.estado === "completada") || [];
      const pendientes = evaluaciones?.filter(e => e.estado !== "completada") || [];

      // Por nivel de riesgo
      const porNivelRiesgo: Record<string, number> = {
        nulo: 0,
        bajo: 0,
        medio: 0,
        alto: 0,
        muy_alto: 0
      };

      completadas.forEach(e => {
        if (e.nivel_riesgo && porNivelRiesgo.hasOwnProperty(e.nivel_riesgo)) {
          porNivelRiesgo[e.nivel_riesgo]++;
        }
      });

      // Por tipo de guía
      const porGuia: Record<string, number> = {};
      evaluaciones?.forEach(e => {
        porGuia[e.tipo_guia] = (porGuia[e.tipo_guia] || 0) + 1;
      });

      // Por área
      const porArea: Record<string, { total: number; completadas: number; riesgoAlto: number }> = {};
      
      trabajadores?.forEach(t => {
        if (!porArea[t.area]) {
          porArea[t.area] = { total: 0, completadas: 0, riesgoAlto: 0 };
        }
        porArea[t.area].total++;
      });

      completadas.forEach(e => {
        const area = trabajadoresMap.get(e.trabajador_id);
        if (area && porArea[area]) {
          porArea[area].completadas++;
          if (e.nivel_riesgo === "alto" || e.nivel_riesgo === "muy_alto") {
            porArea[area].riesgoAlto++;
          }
        }
      });

      setReporteData({
        totalTrabajadores: totalTrabajadores || 0,
        evaluacionesCompletadas: completadas.length,
        evaluacionesPendientes: pendientes.length,
        porNivelRiesgo,
        porGuia,
        porArea,
        fechaGeneracion: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reporteData) return;

    const rows = [
      ["Reporte NOM-035-STPS-2018"],
      ["Empresa:", empresaNombre],
      ["Fecha de generación:", format(new Date(reporteData.fechaGeneracion), "dd/MM/yyyy HH:mm", { locale: es })],
      [""],
      ["RESUMEN GENERAL"],
      ["Total de trabajadores:", reporteData.totalTrabajadores.toString()],
      ["Evaluaciones completadas:", reporteData.evaluacionesCompletadas.toString()],
      ["Evaluaciones pendientes:", reporteData.evaluacionesPendientes.toString()],
      [""],
      ["DISTRIBUCIÓN POR NIVEL DE RIESGO"],
      ...Object.entries(reporteData.porNivelRiesgo).map(([nivel, count]) => [
        RISK_LABELS[nivel] || nivel,
        count.toString()
      ]),
      [""],
      ["RESULTADOS POR ÁREA"],
      ["Área", "Total Trabajadores", "Evaluaciones", "Riesgo Alto"],
      ...Object.entries(reporteData.porArea).map(([area, data]) => [
        area,
        data.total.toString(),
        data.completadas.toString(),
        data.riesgoAlto.toString()
      ])
    ];

    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_nom035_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    
    toast.success("Reporte exportado correctamente");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reporteData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No se pudo generar el reporte</p>
      </div>
    );
  }

  const totalEvaluaciones = reporteData.evaluacionesCompletadas + reporteData.evaluacionesPendientes;
  const cumplimientoPercent = reporteData.totalTrabajadores > 0 
    ? Math.round((reporteData.evaluacionesCompletadas / reporteData.totalTrabajadores) * 100)
    : 0;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h3 className="text-lg font-semibold">Reporte de Cumplimiento NOM-035</h3>
          <p className="text-sm text-muted-foreground">
            Generado: {format(new Date(reporteData.fechaGeneracion), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Header del reporte para impresión */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">Reporte de Cumplimiento NOM-035-STPS-2018</h1>
        <p className="text-sm">{empresaNombre}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(reporteData.fechaGeneracion), "dd 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Resumen Ejecutivo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Resumen Ejecutivo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                Total Trabajadores
              </div>
              <div className="text-2xl font-bold">{reporteData.totalTrabajadores}</div>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                Evaluaciones Completadas
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {reporteData.evaluacionesCompletadas}
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 mb-1">
                <Calendar className="h-4 w-4" />
                Pendientes
              </div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {reporteData.evaluacionesPendientes}
              </div>
            </div>
            
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-primary mb-1">
                <FileText className="h-4 w-4" />
                Cumplimiento
              </div>
              <div className="text-2xl font-bold text-primary">{cumplimientoPercent}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribución por Nivel de Riesgo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Distribución por Nivel de Riesgo</CardTitle>
          </div>
          <CardDescription>
            Clasificación de trabajadores evaluados según su nivel de riesgo psicosocial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nivel de Riesgo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Porcentaje</TableHead>
                <TableHead>Acción Requerida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(reporteData.porNivelRiesgo).map(([nivel, count]) => {
                const percent = reporteData.evaluacionesCompletadas > 0 
                  ? Math.round((count / reporteData.evaluacionesCompletadas) * 100)
                  : 0;
                
                return (
                  <TableRow key={nivel}>
                    <TableCell>
                      <Badge 
                        variant={nivel === "alto" || nivel === "muy_alto" ? "destructive" : "outline"}
                        className={
                          nivel === "nulo" ? "bg-green-500 text-white" :
                          nivel === "bajo" ? "bg-lime-500 text-white" :
                          nivel === "medio" ? "bg-yellow-500 text-white" : ""
                        }
                      >
                        {RISK_LABELS[nivel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{count}</TableCell>
                    <TableCell className="text-right">{percent}%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {nivel === "nulo" && "Sin acción requerida"}
                      {nivel === "bajo" && "Difundir política de prevención"}
                      {nivel === "medio" && "Implementar programa de intervención"}
                      {nivel === "alto" && "Intervención inmediata requerida"}
                      {nivel === "muy_alto" && "Atención clínica y organizacional urgente"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resultados por Área */}
      {Object.keys(reporteData.porArea).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Resultados por Área</CardTitle>
            </div>
            <CardDescription>
              Desglose de evaluaciones y riesgo por área de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead className="text-right">Trabajadores</TableHead>
                  <TableHead className="text-right">Evaluados</TableHead>
                  <TableHead className="text-right">Cobertura</TableHead>
                  <TableHead className="text-right">Riesgo Alto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(reporteData.porArea).map(([area, data]) => {
                  const cobertura = data.total > 0 
                    ? Math.round((data.completadas / data.total) * 100)
                    : 0;
                  
                  return (
                    <TableRow key={area}>
                      <TableCell className="font-medium">{area}</TableCell>
                      <TableCell className="text-right">{data.total}</TableCell>
                      <TableCell className="text-right">{data.completadas}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={cobertura >= 80 ? "default" : "secondary"}>
                          {cobertura}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {data.riesgoAlto > 0 ? (
                          <Badge variant="destructive">{data.riesgoAlto}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Nota legal */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> Este reporte se genera conforme a los lineamientos establecidos en la 
            NOM-035-STPS-2018 "Factores de riesgo psicosocial en el trabajo - Identificación, análisis y 
            prevención". Los resultados deben ser interpretados por personal capacitado y las acciones 
            de intervención deben implementarse según lo establecido en la normativa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
