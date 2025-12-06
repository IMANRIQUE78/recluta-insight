import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Printer,
  ClipboardList
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
  fecha_fin: string | null;
  requiere_accion: boolean | null;
  trabajador: {
    nombre_completo: string;
    area: string;
    puesto: string;
    centro_trabajo: string;
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

  useEffect(() => {
    if (open && evaluacionId) {
      loadDetalleEvaluacion();
    }
  }, [open, evaluacionId]);

  const loadDetalleEvaluacion = async () => {
    setLoading(true);
    try {
      const { data: evalData, error: evalError } = await supabase
        .from("evaluaciones_nom035")
        .select("*, trabajador_id")
        .eq("id", evaluacionId)
        .maybeSingle();

      if (evalError) throw evalError;
      if (!evalData) return;

      const { data: trabajadorData } = await supabase
        .from("trabajadores_nom035")
        .select("nombre_completo, area, puesto, centro_trabajo, antiguedad_meses")
        .eq("id", evalData.trabajador_id)
        .maybeSingle();

      setEvaluacion({
        ...evalData,
        trabajador: trabajadorData || {
          nombre_completo: trabajadorNombre,
          area: "-",
          puesto: "-",
          centro_trabajo: "-",
          antiguedad_meses: 0
        }
      });

      const { data: respuestasData, error: respError } = await supabase
        .from("respuestas_nom035")
        .select("numero_pregunta, respuesta_valor, respuesta_texto, seccion, dimension")
        .eq("evaluacion_id", evaluacionId)
        .order("numero_pregunta", { ascending: true });

      if (respError) throw respError;
      setRespuestas(respuestasData || []);

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
      case "guia_iii": return "Guía III - Factores de Riesgo Psicosocial";
      default: return tipo;
    }
  };

  const formatAntiguedad = (meses: number) => {
    if (meses < 12) return `${meses} meses`;
    const anos = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;
    if (mesesRestantes === 0) return `${anos} año${anos > 1 ? 's' : ''}`;
    return `${anos}a ${mesesRestantes}m`;
  };

  const LIKERT_LABELS = ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"];
  const LIKERT_SCORES = [4, 3, 2, 1, 0];

  const countPositiveResponses = () => respuestas.filter(r => r.respuesta_valor === 1).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col print:max-w-none print:max-h-none print:h-auto">
        <DialogHeader className="print:mb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 print:hidden" />
            Resultado de Evaluación NOM-035
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : evaluacion ? (
          <ScrollArea className="flex-1 -mx-6 px-6 print:overflow-visible">
            <div className="space-y-3 pb-2 print:space-y-2">
              {/* Encabezado compacto */}
              <div className="border rounded-lg p-3 bg-muted/30 print:p-2 print:text-xs">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm print:text-xs">
                  <div><span className="text-muted-foreground">Trabajador:</span> <strong>{evaluacion.trabajador.nombre_completo}</strong></div>
                  <div><span className="text-muted-foreground">Puesto:</span> {evaluacion.trabajador.puesto}</div>
                  <div><span className="text-muted-foreground">Área:</span> {evaluacion.trabajador.area}</div>
                  <div><span className="text-muted-foreground">Centro:</span> {evaluacion.trabajador.centro_trabajo}</div>
                  <div><span className="text-muted-foreground">Antigüedad:</span> {formatAntiguedad(evaluacion.trabajador.antiguedad_meses)}</div>
                  <div><span className="text-muted-foreground">Fecha:</span> {evaluacion.fecha_fin ? format(new Date(evaluacion.fecha_fin), "dd/MM/yyyy", { locale: es }) : "-"}</div>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground print:text-xs">{getGuiaLabel(tipoGuia)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {evaluacion.nivel_riesgo && (
                      <>
                        {(evaluacion.nivel_riesgo === "alto" || evaluacion.nivel_riesgo === "muy_alto" || evaluacion.requiere_accion) ? (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <Badge 
                          style={{ backgroundColor: RISK_COLORS[evaluacion.nivel_riesgo], color: "white" }}
                          className="text-xs"
                        >
                          Riesgo {RISK_LABELS[evaluacion.nivel_riesgo]}
                        </Badge>
                      </>
                    )}
                    {tipoGuia === "guia_iii" && evaluacion.puntaje_total !== null && (
                      <Badge variant="outline" className="text-xs">
                        {evaluacion.puntaje_total} pts
                      </Badge>
                    )}
                    {tipoGuia === "guia_i" && (
                      <Badge variant="outline" className="text-xs">
                        {countPositiveResponses()} / {respuestas.length} positivas
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabla de respuestas compacta */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium w-10">#</th>
                      <th className="text-left p-2 font-medium">Pregunta</th>
                      <th className="text-center p-2 font-medium w-24">Respuesta</th>
                      {tipoGuia === "guia_iii" && (
                        <th className="text-center p-2 font-medium w-16">Valor</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {respuestas.map((resp, idx) => {
                      const preguntaTexto = tipoGuia === "guia_i" 
                        ? PREGUNTAS_GUIA_I.find(p => p.id === resp.numero_pregunta)?.texto || `Pregunta ${resp.numero_pregunta}`
                        : `Pregunta ${resp.numero_pregunta}`;
                      
                      const isPositive = tipoGuia === "guia_i" ? resp.respuesta_valor === 1 : false;
                      const respuestaLabel = tipoGuia === "guia_i" 
                        ? (resp.respuesta_valor === 1 ? "Sí" : "No")
                        : (LIKERT_LABELS[resp.respuesta_valor] || resp.respuesta_texto || "-");
                      const score = tipoGuia === "guia_iii" ? LIKERT_SCORES[resp.respuesta_valor] : null;

                      return (
                        <tr 
                          key={resp.numero_pregunta} 
                          className={`border-t ${isPositive ? "bg-destructive/10" : idx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                        >
                          <td className="p-2 text-muted-foreground">{resp.numero_pregunta}</td>
                          <td className="p-2 leading-tight">
                            <span className="line-clamp-2 print:line-clamp-none">{preguntaTexto}</span>
                          </td>
                          <td className={`p-2 text-center font-medium ${isPositive ? "text-destructive" : ""}`}>
                            {respuestaLabel}
                          </td>
                          {tipoGuia === "guia_iii" && (
                            <td className="p-2 text-center text-muted-foreground">{score}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Resumen por sección (solo Guía I) */}
              {tipoGuia === "guia_i" && (
                <div className="border rounded-lg p-3 bg-muted/30 print:p-2">
                  <p className="text-xs font-medium mb-2">Resumen por Sección:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Object.entries(SECCIONES_GUIA_I).map(([key, label]) => {
                      const seccionRespuestas = respuestas.filter(r => r.seccion === key);
                      const positivas = seccionRespuestas.filter(r => r.respuesta_valor === 1).length;
                      const tienePositivas = positivas > 0;
                      return (
                        <div 
                          key={key} 
                          className={`p-2 rounded ${tienePositivas ? "bg-destructive/20 text-destructive" : "bg-green-500/10 text-green-700"}`}
                        >
                          <span className="font-medium">S{key}:</span> {positivas}/{seccionRespuestas.length}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nota de acción requerida */}
              {(evaluacion.nivel_riesgo === "alto" || evaluacion.nivel_riesgo === "muy_alto" || evaluacion.requiere_accion) && (
                <div className="border border-destructive/50 rounded-lg p-2 bg-destructive/5 text-xs print:p-2">
                  <p className="font-medium text-destructive">⚠️ Se requiere seguimiento y posible canalización a valoración clínica.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No se encontró información.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
