import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ForecastChartProps {
  selectedCliente?: string;
  selectedReclutador?: string;
  selectedEstatus?: string;
}

export const ForecastChart = ({ 
  selectedCliente = "todos", 
  selectedReclutador = "todos", 
  selectedEstatus = "todos" 
}: ForecastChartProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<string>("neutral");
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    loadForecastData();
  }, [selectedCliente, selectedReclutador, selectedEstatus]);

  const loadForecastData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener vacantes de los últimos 12 meses con filtros
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      let query = supabase
        .from("vacantes")
        .select("fecha_solicitud, estatus")
        .eq("user_id", user.id)
        .gte("fecha_solicitud", twelveMonthsAgo.toISOString().split('T')[0])
        .order("fecha_solicitud", { ascending: true });

      // Aplicar filtros globales
      if (selectedCliente !== "todos") {
        query = query.eq("cliente_area_id", selectedCliente);
      }
      if (selectedReclutador !== "todos") {
        query = query.eq("reclutador_id", selectedReclutador);
      }
      if (selectedEstatus !== "todos") {
        query = query.eq("estatus", selectedEstatus as "abierta" | "cerrada" | "cancelada");
      }

      const { data: vacantes, error } = await query;
      if (error) throw error;

      // Agrupar por mes
      const monthCounts: { [key: string]: number } = {};
      vacantes?.forEach((v) => {
        const date = new Date(v.fecha_solicitud);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });

      // Crear datos de los últimos 6 meses
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const chartData = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const count = monthCounts[monthKey] || 0;
        chartData.push({
          periodo: months[date.getMonth()],
          historico: count,
          proyectado: null,
          min: null,
          max: null,
        });
      }

      // Calcular tendencia y proyección mejorada
      const values = chartData.map(d => d.historico);
      const n = values.length;
      
      // Calcular tendencia lineal (regresión simple)
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      values.forEach((y, x) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Determinar tendencia
      if (slope > 0.5) setTrend("creciente");
      else if (slope < -0.5) setTrend("decreciente");
      else setTrend("estable");
      
      // Calcular desviación estándar para intervalos de confianza
      const mean = sumY / n;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      
      // Proyección para los próximos 3 meses con intervalos de confianza
      const projectionMonths = 3;
      const currentMonth = months[now.getMonth()];
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentValue = monthCounts[currentMonthKey] || 0;
      
      // Agregar punto actual como transición
      chartData.push({
        periodo: currentMonth,
        historico: currentValue,
        proyectado: currentValue,
        min: currentValue,
        max: currentValue,
      });

      // Proyectar próximos meses
      for (let i = 1; i <= projectionMonths; i++) {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const projected = Math.max(0, Math.round(slope * (n + i) + intercept));
        const minProj = Math.max(0, Math.round(projected - stdDev * 1.5));
        const maxProj = Math.round(projected + stdDev * 1.5);
        
        chartData.push({
          periodo: months[nextMonth.getMonth()] + ` +${i}`,
          historico: null,
          proyectado: projected,
          min: minProj,
          max: maxProj,
        });
      }

      // Calcular nivel de confianza basado en consistencia de datos
      const dataConsistency = 1 - (stdDev / (mean + 1));
      const sampleSize = vacantes?.length || 0;
      const confidenceLevel = Math.min(95, Math.round((dataConsistency * 70) + (Math.min(sampleSize / 50, 1) * 25)));
      setConfidence(confidenceLevel);

      setData(chartData);
    } catch (error) {
      console.error("Error loading forecast data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pronóstico de Demanda de Personal</CardTitle>
          <CardDescription>Proyección de vacantes solicitadas para el próximo mes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            Cargando datos...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (trend === "creciente") return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === "decreciente") return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (trend === "creciente") return "default";
    if (trend === "decreciente") return "destructive";
    return "secondary";
  };

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Pronóstico de Demanda de Personal
              {getTrendIcon()}
            </CardTitle>
            <CardDescription>Proyección de vacantes para los próximos 3 meses</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getTrendColor() as any} className="capitalize">
              Tendencia: {trend}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Confianza: {confidence}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorHistorico" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProyectado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConfianza" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--muted))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
            <XAxis 
              dataKey="periodo" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: 'Vacantes Solicitadas', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fill: 'hsl(var(--muted-foreground))', fontSize: '12px' } 
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any, name: string) => {
                if (name === "min" || name === "max") return null;
                return [value, name];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                if (value === "min" || value === "max") return null;
                return value;
              }}
            />
            <ReferenceLine 
              x={data.find(d => d.historico !== null && d.proyectado !== null)?.periodo} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3" 
              label={{ 
                value: '← Histórico | Proyección →', 
                position: 'top', 
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
                fontWeight: 500
              }}
            />
            
            {/* Intervalo de confianza */}
            <Area
              type="monotone"
              dataKey="max"
              stroke="none"
              fill="url(#colorConfianza)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke="none"
              fill="hsl(var(--background))"
              fillOpacity={1}
            />
            
            {/* Área histórica */}
            <Area
              type="monotone"
              dataKey="historico"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#colorHistorico)"
              name="Datos Históricos"
              dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 7 }}
            />
            
            {/* Área proyectada */}
            <Area
              type="monotone"
              dataKey="proyectado"
              stroke="hsl(var(--success))"
              strokeWidth={3}
              strokeDasharray="8 4"
              fill="url(#colorProyectado)"
              name="Proyección"
              dot={{ fill: 'hsl(var(--success))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-medium">Modelo de Regresión Lineal con Intervalos de Confianza</p>
            <p className="text-xs text-muted-foreground">
              La proyección usa tendencia histórica y desviación estándar. El área sombreada representa el rango probable. 
              Nivel de confianza basado en consistencia de datos históricos y tamaño de muestra.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};