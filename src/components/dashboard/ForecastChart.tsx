import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const generateForecastData = () => {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const data = [];
  
  // Datos históricos (últimos 6 meses)
  const historicalData = [18, 22, 25, 20, 28, 24];
  for (let i = 0; i < 6; i++) {
    data.push({
      periodo: months[i + 6],
      historico: historicalData[i],
      proyectado: null,
    });
  }
  
  // Último mes (punto de transición)
  data.push({
    periodo: months[11],
    historico: 26,
    proyectado: 26,
  });
  
  // Proyección siguiente mes
  data.push({
    periodo: "Ene +1",
    historico: null,
    proyectado: 29,
  });
  
  return data;
};

export const ForecastChart = () => {
  const data = generateForecastData();

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
              x="Dic" 
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
          Modelo informativo basado en suavizado exponencial. Ajustar con más datos para mayor precisión.
        </p>
      </CardContent>
    </Card>
  );
};