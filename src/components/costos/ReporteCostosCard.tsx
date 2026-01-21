import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MetricasVacantes, 
  ReporteCostos,
  getUnidadMedidaLabel 
} from "@/hooks/useCostosReclutamiento";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  PieChart,
  Users,
  Calculator,
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

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  // Determinar nivel de eficiencia
  // A mayor eficiencia = más contrataciones por cada $1,000 invertidos
  const getEficienciaLevel = (value: number) => {
    if (value >= 0.5) return { label: "Excelente", color: "bg-green-500", textColor: "text-green-600" };
    if (value >= 0.2) return { label: "Buena", color: "bg-blue-500", textColor: "text-blue-600" };
    if (value >= 0.1) return { label: "Regular", color: "bg-yellow-500", textColor: "text-yellow-600" };
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

          {/* Costo por contratación */}
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Target className="h-4 w-4" />
                Costo por Contratación
              </p>
              {metricas.cerradas > 1 && (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(reporte.costoPorContratacion)}
              </p>
              <span className="text-xs text-muted-foreground">/contratación</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Costo total ÷ {metricas.cerradas} vacantes cerradas
            </p>
          </div>

          {/* Costo por vacante efectiva */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Costo por Vacante Efectiva</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-semibold">
                {formatCurrency(reporte.costoPorVacanteEfectiva)}
              </p>
              <span className="text-xs text-muted-foreground">/vacante ponderada</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Costo total ÷ Valor ponderado ({formatNumber(metricas.valorPonderado)})
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
                  <div className="flex items-center gap-2 truncate max-w-[55%]">
                    <span className="truncate">{item.concepto}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {getUnidadMedidaLabel(item.unidadMedida)}
                    </Badge>
                  </div>
                  <span className="font-medium">{formatNumber(item.porcentaje, 1)}%</span>
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
              {formatNumber(reporte.eficienciaOperativa, 3)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                contrataciones/$1,000
              </span>
            </p>
            <Progress 
              value={Math.min(reporte.eficienciaOperativa * 100, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              (Vacantes cerradas × 1,000) ÷ Costo mensual total
            </p>
          </div>

          <Separator />

          {/* Métricas de recursos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Candidatos</span>
              </div>
              <p className="text-lg font-bold">{metricas.totalCandidatos}</p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Reclutadores</span>
              </div>
              <p className="text-lg font-bold">{metricas.totalReclutadores}</p>
            </div>
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
                {formatNumber(metricas.valorPonderado)}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
            <p className="font-medium">📊 Máxima de Costeo:</p>
            <p>A mayor número de vacantes cerradas, menor costo por contratación.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
