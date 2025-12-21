import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ForecastChartEmbeddedProps {
  selectedCliente?: string;
  selectedReclutador?: string;
  selectedEstatus?: string;
}

export const ForecastChartEmbedded = ({ 
  selectedCliente = "todos", 
  selectedReclutador = "todos", 
  selectedEstatus = "todos" 
}: ForecastChartEmbeddedProps) => {
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

      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      let query = supabase
        .from("vacantes")
        .select("fecha_solicitud, estatus")
        .eq("user_id", user.id)
        .gte("fecha_solicitud", twelveMonthsAgo.toISOString().split('T')[0])
        .order("fecha_solicitud", { ascending: true });

      if (selectedCliente !== "todos") {
        query = query.eq("cliente_area_id", selectedCliente);
      }
      if (selectedReclutador !== "todos") {
        query = query.eq("reclutador_asignado_id", selectedReclutador);
      }
      if (selectedEstatus !== "todos") {
        query = query.eq("estatus", selectedEstatus as "abierta" | "cerrada" | "cancelada");
      }

      const { data: vacantes, error } = await query;
      if (error) throw error;

      const monthCounts: { [key: string]: number } = {};
      vacantes?.forEach((v) => {
        const date = new Date(v.fecha_solicitud);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });

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

      const values = chartData.map(d => d.historico);
      const n = values.length;
      
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      values.forEach((y, x) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      if (slope > 0.5) setTrend("creciente");
      else if (slope < -0.5) setTrend("decreciente");
      else setTrend("estable");
      
      const mean = sumY / n;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      
      const projectionMonths = 3;
      const currentMonth = months[now.getMonth()];
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentValue = monthCounts[currentMonthKey] || 0;
      
      chartData.push({
        periodo: currentMonth,
        historico: currentValue,
        proyectado: currentValue,
        min: currentValue,
        max: currentValue,
      });

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

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Cargando pronóstico...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Pronóstico de Demanda</h3>
          {getTrendIcon()}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getTrendColor() as any} className="capitalize text-xs">
            {trend}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {confidence}% confianza
          </span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorHistoricoEmbed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProyectadoEmbed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorConfianzaEmbed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--muted))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--muted))" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
          <XAxis 
            dataKey="periodo" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            width={30}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: any, name: string) => {
              if (name === "min" || name === "max") return null;
              return [value, name];
            }}
          />
          <ReferenceLine 
            x={data.find(d => d.historico !== null && d.proyectado !== null)?.periodo} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="3 3" 
          />
          
          <Area
            type="monotone"
            dataKey="max"
            stroke="none"
            fill="url(#colorConfianzaEmbed)"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="min"
            stroke="none"
            fill="hsl(var(--background))"
            fillOpacity={1}
          />
          
          <Area
            type="monotone"
            dataKey="historico"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorHistoricoEmbed)"
            name="Histórico"
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
          />
          
          <Area
            type="monotone"
            dataKey="proyectado"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            strokeDasharray="6 3"
            fill="url(#colorProyectadoEmbed)"
            name="Proyección"
            dot={{ fill: 'hsl(var(--success))', r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};