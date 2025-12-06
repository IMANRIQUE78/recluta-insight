import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Briefcase, 
  Building2,
  Calendar,
  FileText,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Printer
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PREGUNTAS_GUIA_I, SECCIONES_GUIA_I } from "./cuestionarios/preguntasGuiaI";

interface DetalleEvaluacionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluacionId: string;
  trabajadorNombre: string;
  tipoGuia: string;
}

interface RespuestaDetalle {
  numero_pregunta: number;
  respuesta_valor: number;
  respuesta_texto: string | null;
  seccion: string;
  dimension: string | null;
}

interface EvaluacionDetalle {
  id: string;
  tipo_guia: string;
  estado: string;
  nivel_riesgo: string | null;
  puntaje_total: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  requiere_accion: boolean | null;
  trabajador: {
    nombre_completo: string;
    area: string;
    puesto: string;
    centro_trabajo: string;
    email: string | null;
    telefono: string | null;
    antiguedad_meses: number;
  };
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

const RISK_RECOMMENDATIONS: Record<string, string> = {
  nulo: "No se requieren acciones adicionales. Mantener las condiciones actuales de trabajo.",
  bajo: "Se recomienda mantener monitoreo preventivo y continuar con buenas prácticas laborales.",
  medio: "Se requiere análisis de las causas y acciones preventivas. Considerar intervenciones focalizadas.",
  alto: "Se requiere intervención inmediata. Implementar acciones correctivas y seguimiento especializado.",
  muy_alto: "ATENCIÓN URGENTE. Canalización obligatoria a valoración clínica especializada. Implementar acciones correctivas inmediatas."
};

export const DetalleEvaluacionModal = ({
  open,
  onOpenChange,
  evaluacionId,
  trabajadorNombre,
  tipoGuia
}: DetalleEvaluacionModalProps) => {
  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState<EvaluacionDetalle | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestaDetalle[]>([]);
  const [dimensiones, setDimensiones] = useState<Record<string, { puntaje: number; nivel: string }>>({});

  useEffect(() => {
    if (open && evaluacionId) {
      loadDetalleEvaluacion();
    }
  }, [open, evaluacionId]);

  const loadDetalleEvaluacion = async () => {
    setLoading(true);
    try {
      // Cargar evaluación con trabajador
      const { data: evalData, error: evalError } = await supabase
        .from("evaluaciones_nom035")
        .select("*, trabajador_id")
        .eq("id", evaluacionId)
        .maybeSingle();

      if (evalError) throw evalError;
      if (!evalData) return;

      // Cargar datos del trabajador
      const { data: trabajadorData } = await supabase
        .from("trabajadores_nom035")
        .select("nombre_completo, area, puesto, centro_trabajo, email, telefono, antiguedad_meses")
        .eq("id", evalData.trabajador_id)
        .maybeSingle();

      setEvaluacion({
        ...evalData,
        trabajador: trabajadorData || {
          nombre_completo: trabajadorNombre,
          area: "-",
          puesto: "-",
          centro_trabajo: "-",
          email: null,
          telefono: null,
          antiguedad_meses: 0
        }
      });

      // Cargar respuestas
      const { data: respuestasData, error: respError } = await supabase
        .from("respuestas_nom035")
        .select("numero_pregunta, respuesta_valor, respuesta_texto, seccion, dimension")
        .eq("evaluacion_id", evaluacionId)
        .order("numero_pregunta", { ascending: true });

      if (respError) throw respError;
      setRespuestas(respuestasData || []);

      // Cargar resultados por dimensión (para Guía III)
      if (tipoGuia === "guia_iii") {
        const { data: dimData } = await supabase
          .from("resultados_dimension_nom035")
          .select("dimension, categoria, puntaje, nivel_riesgo")
          .eq("evaluacion_id", evaluacionId);

        if (dimData) {
          const dimMap: Record<string, { puntaje: number; nivel: string }> = {};
          dimData.forEach(d => {
            dimMap[d.categoria] = { puntaje: d.puntaje, nivel: d.nivel_riesgo };
          });
          setDimensiones(dimMap);
        }
      }

    } catch (error) {
      console.error("Error loading evaluation details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getGuiaLabel = (tipo: string) => {
    switch (tipo) {
      case "guia_i": return "Guía I - Acontecimientos Traumáticos Severos";
      case "guia_ii": return "Guía II - Factores de Riesgo";
      case "guia_iii": return "Guía III - Factores de Riesgo Psicosocial";
      default: return tipo;
    }
  };

  const formatAntiguedad = (meses: number) => {
    if (meses < 12) return `${meses} meses`;
    const anos = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;
    if (mesesRestantes === 0) return `${anos} año${anos > 1 ? 's' : ''}`;
    return `${anos} año${anos > 1 ? 's' : ''} y ${mesesRestantes} mes${mesesRestantes > 1 ? 'es' : ''}`;
  };

  const renderRespuestasGuiaI = () => {
    // Agrupar por sección
    const porSeccion: Record<string, RespuestaDetalle[]> = {};
    respuestas.forEach(r => {
      if (!porSeccion[r.seccion]) porSeccion[r.seccion] = [];
      porSeccion[r.seccion].push(r);
    });

    return (
      <div className="space-y-4">
        {Object.entries(porSeccion).map(([seccion, resps]) => {
          const seccionLabel = SECCIONES_GUIA_I[seccion as keyof typeof SECCIONES_GUIA_I] || seccion;
          const tienePositivas = resps.some(r => r.respuesta_valor === 1);

          return (
            <Card key={seccion} className={tienePositivas ? "border-destructive/50 bg-destructive/5" : ""}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Sección {seccion}: {seccionLabel}
                  </CardTitle>
                  {tienePositivas && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Requiere atención
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <div className="space-y-2">
                  {resps.map((resp) => {
                    const pregunta = PREGUNTAS_GUIA_I.find(p => p.id === resp.numero_pregunta);
                    return (
                      <div 
                        key={resp.numero_pregunta} 
                        className={`flex items-start gap-3 p-2 rounded ${
                          resp.respuesta_valor === 1 ? "bg-destructive/10" : "bg-muted/30"
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {resp.respuesta_valor === 1 ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">P{resp.numero_pregunta}:</span>{" "}
                            {pregunta?.texto || `Pregunta ${resp.numero_pregunta}`}
                          </p>
                          <p className={`text-xs mt-1 font-medium ${
                            resp.respuesta_valor === 1 ? "text-destructive" : "text-green-600"
                          }`}>
                            Respuesta: {resp.respuesta_valor === 1 ? "Sí" : "No"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderRespuestasGuiaIII = () => {
    const LIKERT_LABELS = ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"];
    
    // Agrupar por categoría
    const porCategoria: Record<string, RespuestaDetalle[]> = {};
    respuestas.forEach(r => {
      const cat = r.dimension || r.seccion || "general";
      if (!porCategoria[cat]) porCategoria[cat] = [];
      porCategoria[cat].push(r);
    });

    return (
      <div className="space-y-4">
        {/* Resumen por dimensiones */}
        {Object.keys(dimensiones).length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Resultados por Categoría</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(dimensiones).map(([cat, data]) => (
                  <div key={cat} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {cat.replace(/_/g, " ")}
                      </span>
                      <Badge 
                        style={{ 
                          backgroundColor: RISK_COLORS[data.nivel] || "#6b7280",
                          color: "white"
                        }}
                      >
                        {RISK_LABELS[data.nivel] || data.nivel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={Math.min((data.puntaje / 50) * 100, 100)} 
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {data.puntaje} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalle de respuestas */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Detalle de Respuestas ({respuestas.length} preguntas)</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {respuestas.map((resp) => (
                <div 
                  key={resp.numero_pregunta} 
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <span className="text-sm">
                    Pregunta {resp.numero_pregunta}
                  </span>
                  <Badge variant="outline">
                    {LIKERT_LABELS[resp.respuesta_valor] || resp.respuesta_texto || `Valor: ${resp.respuesta_valor}`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Resultado Individual de Evaluación
          </DialogTitle>
          <DialogDescription>
            {getGuiaLabel(tipoGuia)}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : evaluacion ? (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 pb-4">
              {/* Datos del trabajador */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Datos del Trabajador
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Nombre</p>
                        <p className="text-sm font-medium">{evaluacion.trabajador.nombre_completo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Puesto</p>
                        <p className="text-sm font-medium">{evaluacion.trabajador.puesto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Área / Centro</p>
                        <p className="text-sm font-medium">{evaluacion.trabajador.area} - {evaluacion.trabajador.centro_trabajo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Antigüedad</p>
                        <p className="text-sm font-medium">{formatAntiguedad(evaluacion.trabajador.antiguedad_meses)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resultado general */}
              <Card className={
                evaluacion.nivel_riesgo === "alto" || evaluacion.nivel_riesgo === "muy_alto"
                  ? "border-destructive"
                  : evaluacion.nivel_riesgo === "medio"
                    ? "border-yellow-500"
                    : "border-green-500"
              }>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Resultado de la Evaluación
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-full ${
                      evaluacion.nivel_riesgo === "alto" || evaluacion.nivel_riesgo === "muy_alto"
                        ? "bg-destructive/10"
                        : evaluacion.nivel_riesgo === "medio"
                          ? "bg-yellow-500/10"
                          : "bg-green-500/10"
                    }`}>
                      {evaluacion.nivel_riesgo === "alto" || evaluacion.nivel_riesgo === "muy_alto" || evaluacion.requiere_accion ? (
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                      ) : (
                        <CheckCircle2 className={`h-8 w-8 ${
                          evaluacion.nivel_riesgo === "medio" ? "text-yellow-600" : "text-green-600"
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">Nivel de Riesgo:</span>
                        {evaluacion.nivel_riesgo && (
                          <Badge 
                            style={{ 
                              backgroundColor: RISK_COLORS[evaluacion.nivel_riesgo],
                              color: "white"
                            }}
                            className="text-sm"
                          >
                            {RISK_LABELS[evaluacion.nivel_riesgo]}
                          </Badge>
                        )}
                      </div>
                      {evaluacion.puntaje_total !== null && tipoGuia === "guia_iii" && (
                        <p className="text-sm text-muted-foreground">
                          Puntaje total: <span className="font-medium">{evaluacion.puntaje_total}</span>
                        </p>
                      )}
                      {evaluacion.fecha_fin && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completada: {format(new Date(evaluacion.fecha_fin), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recomendación */}
                  {evaluacion.nivel_riesgo && (
                    <div className={`p-3 rounded-lg ${
                      evaluacion.nivel_riesgo === "alto" || evaluacion.nivel_riesgo === "muy_alto"
                        ? "bg-destructive/10 border border-destructive/20"
                        : evaluacion.nivel_riesgo === "medio"
                          ? "bg-yellow-500/10 border border-yellow-500/20"
                          : "bg-green-500/10 border border-green-500/20"
                    }`}>
                      <p className="text-sm font-medium mb-1">Recomendación:</p>
                      <p className="text-sm text-muted-foreground">
                        {RISK_RECOMMENDATIONS[evaluacion.nivel_riesgo]}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator />

              {/* Detalle de respuestas */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detalle de Respuestas
                </h3>
                {tipoGuia === "guia_i" ? renderRespuestasGuiaI() : renderRespuestasGuiaIII()}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontró información de la evaluación.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
