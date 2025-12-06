import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  FileText,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DetalleEvaluacionModal } from "./DetalleEvaluacionModal";

interface ResultadosNOM035Props {
  empresaId: string;
  refreshTrigger?: number;
}

interface Evaluacion {
  id: string;
  tipo_guia: string;
  estado: string;
  nivel_riesgo: string | null;
  puntaje_total: number | null;
  fecha_fin: string | null;
  trabajador: {
    nombre_completo: string;
    area: string;
    puesto: string;
  };
}

interface ResumenRiesgo {
  nivel: string;
  count: number;
  color: string;
}

const RISK_COLORS: Record<string, string> = {
  nulo: "#22c55e",
  bajo: "#84cc16",
  medio: "#eab308",
  alto: "#f97316",
  muy_alto: "#ef4444"
};

const RISK_LABELS: Record<string, string> = {
  nulo: "Nulo",
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  muy_alto: "Muy Alto"
};

export const ResultadosNOM035 = ({ empresaId, refreshTrigger }: ResultadosNOM035Props) => {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [resumenRiesgo, setResumenRiesgo] = useState<ResumenRiesgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completadas: 0,
    pendientes: 0,
    tasaCompletado: 0
  });
  const [selectedEvaluacion, setSelectedEvaluacion] = useState<Evaluacion | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);

  useEffect(() => {
    loadResultados();
  }, [empresaId, refreshTrigger]);

  const loadResultados = async () => {
    setLoading(true);
    try {
      // Cargar evaluaciones completadas con datos de trabajador
      const { data: evalData, error } = await supabase
        .from("evaluaciones_nom035")
        .select(`
          id,
          tipo_guia,
          estado,
          nivel_riesgo,
          puntaje_total,
          fecha_fin,
          trabajador_id
        `)
        .eq("empresa_id", empresaId)
        .order("fecha_fin", { ascending: false });

      if (error) throw error;

      // Obtener datos de trabajadores
      const trabajadorIds = [...new Set(evalData?.map(e => e.trabajador_id) || [])];
      const { data: trabajadores } = await supabase
        .from("trabajadores_nom035")
        .select("id, nombre_completo, area, puesto")
        .in("id", trabajadorIds);

      const trabajadoresMap = new Map(trabajadores?.map(t => [t.id, t]) || []);

      const evaluacionesConTrabajador: Evaluacion[] = (evalData || []).map(e => ({
        id: e.id,
        tipo_guia: e.tipo_guia,
        estado: e.estado,
        nivel_riesgo: e.nivel_riesgo,
        puntaje_total: e.puntaje_total,
        fecha_fin: e.fecha_fin,
        trabajador: trabajadoresMap.get(e.trabajador_id) || {
          nombre_completo: "Desconocido",
          area: "-",
          puesto: "-"
        }
      }));

      setEvaluaciones(evaluacionesConTrabajador);

      // Calcular estadísticas
      const completadas = evaluacionesConTrabajador.filter(e => e.estado === "completada").length;
      const pendientes = evaluacionesConTrabajador.filter(e => e.estado !== "completada").length;
      const total = evaluacionesConTrabajador.length;

      setStats({
        total,
        completadas,
        pendientes,
        tasaCompletado: total > 0 ? Math.round((completadas / total) * 100) : 0
      });

      // Calcular resumen por nivel de riesgo
      const riesgoCounts: Record<string, number> = {
        nulo: 0,
        bajo: 0,
        medio: 0,
        alto: 0,
        muy_alto: 0
      };

      evaluacionesConTrabajador
        .filter(e => e.estado === "completada" && e.nivel_riesgo)
        .forEach(e => {
          if (e.nivel_riesgo && riesgoCounts.hasOwnProperty(e.nivel_riesgo)) {
            riesgoCounts[e.nivel_riesgo]++;
          }
        });

      const resumen: ResumenRiesgo[] = Object.entries(riesgoCounts)
        .map(([nivel, count]) => ({
          nivel: RISK_LABELS[nivel] || nivel,
          count,
          color: RISK_COLORS[nivel] || "#6b7280"
        }))
        .filter(r => r.count > 0);

      setResumenRiesgo(resumen);

    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeVariant = (riesgo: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (riesgo) {
      case "alto":
      case "muy_alto":
        return "destructive";
      case "medio":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getGuiaLabel = (tipo: string) => {
    switch (tipo) {
      case "guia_i":
        return "Guía I";
      case "guia_ii":
        return "Guía II";
      case "guia_iii":
        return "Guía III";
      default:
        return tipo;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (evaluaciones.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Sin evaluaciones registradas</h3>
        <p className="text-muted-foreground">
          Aún no hay evaluaciones completadas. Genera enlaces de cuestionarios para tus trabajadores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completadas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa Completado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasaCompletado}%</div>
            <Progress value={stats.tasaCompletado} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {resumenRiesgo.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución por Nivel de Riesgo</CardTitle>
              <CardDescription>Evaluaciones completadas agrupadas por resultado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={resumenRiesgo}
                    dataKey="count"
                    nameKey="nivel"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ nivel, count }) => `${nivel}: ${count}`}
                  >
                    {resumenRiesgo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evaluaciones por Nivel</CardTitle>
              <CardDescription>Gráfica de barras comparativa</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={resumenRiesgo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nivel" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Evaluaciones">
                    {resumenRiesgo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Evaluaciones Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle de Evaluaciones</CardTitle>
          <CardDescription>Historial completo de evaluaciones aplicadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trabajador</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Nivel Riesgo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluaciones.map((evaluacion) => (
                  <TableRow key={evaluacion.id}>
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-primary hover:underline"
                        onClick={() => {
                          setSelectedEvaluacion(evaluacion);
                          setDetalleModalOpen(true);
                        }}
                      >
                        {evaluacion.trabajador.nombre_completo}
                      </Button>
                    </TableCell>
                    <TableCell>{evaluacion.trabajador.area}</TableCell>
                    <TableCell>{evaluacion.trabajador.puesto}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getGuiaLabel(evaluacion.tipo_guia)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={evaluacion.estado === "completada" ? "default" : "secondary"}
                        className={evaluacion.estado === "completada" ? "bg-green-500" : ""}
                      >
                        {evaluacion.estado === "completada" ? "Completada" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {evaluacion.nivel_riesgo ? (
                        <Badge 
                          variant={getRiskBadgeVariant(evaluacion.nivel_riesgo)}
                          style={{ 
                            backgroundColor: evaluacion.estado === "completada" 
                              ? RISK_COLORS[evaluacion.nivel_riesgo] 
                              : undefined,
                            color: evaluacion.estado === "completada" ? "white" : undefined
                          }}
                        >
                          {RISK_LABELS[evaluacion.nivel_riesgo] || evaluacion.nivel_riesgo}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {evaluacion.fecha_fin ? (
                        format(new Date(evaluacion.fecha_fin), "dd MMM yyyy", { locale: es })
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEvaluacion(evaluacion);
                          setDetalleModalOpen(true);
                        }}
                        disabled={evaluacion.estado !== "completada"}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      {selectedEvaluacion && (
        <DetalleEvaluacionModal
          open={detalleModalOpen}
          onOpenChange={setDetalleModalOpen}
          evaluacionId={selectedEvaluacion.id}
          trabajadorNombre={selectedEvaluacion.trabajador.nombre_completo}
          tipoGuia={selectedEvaluacion.tipo_guia}
        />
      )}
    </div>
  );
};
