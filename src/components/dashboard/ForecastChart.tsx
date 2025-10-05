import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const ForecastChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecastData();
  }, []);

  const loadForecastData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener vacantes de los últimos 12 meses
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: vacantes, error } = await supabase
        .from("vacantes")
        .select("fecha_solicitud")
        .eq("user_id", user.id)
        .gte("fecha_solicitud", twelveMonthsAgo.toISOString().split('T')[0])
        .order("fecha_solicitud", { ascending: true });

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
        chartData.push({
          periodo: months[date.getMonth()],
          historico: monthCounts[monthKey] || 0,
          proyectado: null,
        });
      }

      // Calcular proyección usando promedio móvil simple
      const recentValues = chartData.slice(-3).map(d => d.historico);
      const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      const projection = Math.round(average * 1.1); // 10% de crecimiento estimado

      // Agregar mes actual como transición
      const currentMonth = months[now.getMonth()];
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentValue = monthCounts[currentMonthKey] || 0;
      
      chartData.push({
        periodo: currentMonth,
        historico: currentValue,
        proyectado: currentValue,
      });

      // Agregar proyección siguiente mes
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      chartData.push({
        periodo: months[nextMonth.getMonth()] + " +1",
        historico: null,
        proyectado: projection,
      });

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

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Pronóstico de Demanda de Personal</CardTitle>
        <CardDescription>Proyección de vacantes solicitadas para el próximo mes</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="periodo" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Vacantes Solicitadas', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <ReferenceLine 
              x={data[data.length - 2]?.periodo} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3" 
              label={{ value: 'Proyección', position: 'top', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Line 
              type="monotone" 
              dataKey="historico" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Datos Históricos"
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="proyectado" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Proyección"
              dot={{ fill: 'hsl(var(--success))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Modelo informativo basado en promedio móvil. Ajustar con más datos para mayor precisión.
        </p>
      </CardContent>
    </Card>
  );
};