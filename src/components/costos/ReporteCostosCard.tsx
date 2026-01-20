import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MetricasVacantes, ReporteCostos } from "@/hooks/useCostosReclutamiento";
import {
  DollarSign,
  TrendingUp,
  Target,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  PieChart,
} from "lucide-react";

interface ReporteCostosCardProps {
  reporte: ReporteCostos;
  metricas: MetricasVacantes;
}

export const ReporteCostosCard = ({ reporte, metricas }: ReporteCostosCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Determinar nivel de eficiencia
  const getEficienciaLevel = (value: number) => {
    if (value >= 10) return { label: "Excelente", color: "bg-green-500", textColor: "text-green-600" };
    if (value >= 5) return { label: "Buena", color: "bg-blue-500", textColor: "text-blue-600" };
    if (value >= 2) return { label: "Regular", color: "bg-yellow-500", textColor: "text-yellow-600" };
    return { label: "Baja", color: "bg-red-500", textColor: "text-red-600" };
  };

  const eficiencia = getEficienciaLevel(reporte.eficienciaOperativa);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Resumen de Costos */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Resumen de Costos</CardTitle>
              <CardDescription>Análisis mensual y anual</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Costo Mensual Total</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(reporte.costoMensualTotal)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Costo Anual Proyectado</p>
              <p className="text-2xl font-bold">
                {formatCurrency(reporte.costoAnualTotal)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Costo por Vacante Efectiva</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-semibold">
                {formatCurrency(reporte.costoPorVacanteEfectiva)}
              </p>
              <span className="text-xs text-muted-foreground">/vacante ponderada</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Basado en valor ponderado: cerradas×1 + abiertas×0.5 + canceladas×0.25
            </p>
          </div>

          <Separator />

          {/* Desglose de conceptos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Distribución de Costos</p>
            </div>
            {reporte.conceptosDesglose.slice(0, 5).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[60%]">{item.concepto}</span>
                  <span className="font-medium">{item.porcentaje.toFixed(1)}%</span>
                </div>
                <Progress value={item.porcentaje} className="h-2" />
              </div>
            ))}
            {reporte.conceptosDesglose.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{reporte.conceptosDesglose.length - 5} conceptos más
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Vacantes y Eficiencia */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Eficiencia Operativa</CardTitle>
              <CardDescription>Rendimiento del proceso de reclutamiento</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Indicador de eficiencia */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Índice de Eficiencia</span>
              <Badge className={`${eficiencia.color} text-white`}>
                {eficiencia.label}
              </Badge>
            </div>
            <p className="text-3xl font-bold">
              {reporte.eficienciaOperativa.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground ml-1">puntos</span>
            </p>
            <p className="text-xs text-muted-foreground">
              (Valor Ponderado / Costo Mensual) × 10,000
            </p>
          </div>

          <Separator />

          {/* Métricas de vacantes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Estado de Vacantes</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{metricas.cerradas}</p>
                <p className="text-xs text-muted-foreground">Cerradas</p>
                <Badge variant="outline" className="mt-1 text-[10px]">×1.00</Badge>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">{metricas.abiertas}</p>
                <p className="text-xs text-muted-foreground">Abiertas</p>
                <Badge variant="outline" className="mt-1 text-[10px]">×0.50</Badge>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-center">
                <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{metricas.canceladas}</p>
                <p className="text-xs text-muted-foreground">Canceladas</p>
                <Badge variant="outline" className="mt-1 text-[10px]">×0.25</Badge>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Valor Ponderado Total</span>
              </div>
              <p className="text-xl font-bold text-primary">
                {metricas.valorPonderado.toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">📊 Metodología de Valuación:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Vacantes cerradas representan trabajo completado (100%)</li>
              <li>Vacantes abiertas son trabajo en progreso (50%)</li>
              <li>Vacantes canceladas consumieron recursos parciales (25%)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
