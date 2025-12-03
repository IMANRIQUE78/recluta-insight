import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Shield
} from "lucide-react";
import { PREGUNTAS_GUIA_I, SECCIONES_GUIA_I, evaluarGuiaI } from "./preguntasGuiaI";
import { AvisoConfidencialidad } from "./AvisoConfidencialidad";

interface CuestionarioGuiaIProps {
  trabajadorNombre: string;
  onComplete: (resultado: {
    respuestas: Record<number, boolean>;
    requiereAtencion: boolean;
    seccionesPositivas: string[];
    mensaje: string;
  }) => void;
  onCancel: () => void;
}

export const CuestionarioGuiaI = ({
  trabajadorNombre,
  onComplete,
  onCancel
}: CuestionarioGuiaIProps) => {
  const [avisoAceptado, setAvisoAceptado] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, boolean>>({});
  const [mostrarResultado, setMostrarResultado] = useState(false);

  const preguntaActual = PREGUNTAS_GUIA_I[currentIndex];
  const progreso = ((currentIndex + 1) / PREGUNTAS_GUIA_I.length) * 100;
  const todasRespondidas = PREGUNTAS_GUIA_I.every(p => respuestas[p.id] !== undefined);

  const handleRespuesta = (valor: boolean) => {
    setRespuestas(prev => ({ ...prev, [preguntaActual.id]: valor }));
  };

  const handleSiguiente = () => {
    if (currentIndex < PREGUNTAS_GUIA_I.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (todasRespondidas) {
      setMostrarResultado(true);
    }
  };

  const handleAnterior = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleFinalizar = () => {
    const resultado = evaluarGuiaI(respuestas);
    onComplete({
      respuestas,
      ...resultado
    });
  };

  if (!avisoAceptado) {
    return (
      <AvisoConfidencialidad
        nombreTrabajador={trabajadorNombre}
        tipoGuia="Guía I - Acontecimientos Traumáticos Severos"
        onAceptar={() => setAvisoAceptado(true)}
        onCancelar={onCancel}
      />
    );
  }

  if (mostrarResultado) {
    const resultado = evaluarGuiaI(respuestas);
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            resultado.requiereAtencion ? "bg-destructive/10" : "bg-success/10"
          }`}>
            {resultado.requiereAtencion ? (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-success" />
            )}
          </div>
          <CardTitle>Evaluación Completada</CardTitle>
          <CardDescription>Guía I - Acontecimientos Traumáticos Severos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Trabajador: {trabajadorNombre}</p>
            <p className="text-sm text-muted-foreground">{resultado.mensaje}</p>
          </div>

          {resultado.seccionesPositivas.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Secciones con respuestas positivas:</p>
              <div className="flex flex-wrap gap-2">
                {resultado.seccionesPositivas.map(seccion => (
                  <Badge key={seccion} variant="outline">
                    Sección {seccion}: {SECCIONES_GUIA_I[seccion as keyof typeof SECCIONES_GUIA_I]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {resultado.requiereAtencion && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Se recomienda canalización para valoración clínica especializada.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Volver
            </Button>
            <Button onClick={handleFinalizar} className="flex-1">
              Guardar Resultado
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Guía I - Acontecimientos Traumáticos Severos</CardTitle>
              <CardDescription>{trabajadorNombre}</CardDescription>
            </div>
            <Badge variant="outline">
              {currentIndex + 1} / {PREGUNTAS_GUIA_I.length}
            </Badge>
          </div>
          <Progress value={progreso} className="h-2 mt-2" />
        </CardHeader>
      </Card>

      {/* Pregunta */}
      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit mb-2">
            Sección {preguntaActual.seccion}: {SECCIONES_GUIA_I[preguntaActual.seccion as keyof typeof SECCIONES_GUIA_I]}
          </Badge>
          <CardTitle className="text-base font-normal leading-relaxed">
            {preguntaActual.texto}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={respuestas[preguntaActual.id]?.toString()}
            onValueChange={(value) => handleRespuesta(value === "true")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="true" id="si" />
              <Label htmlFor="si" className="flex-1 cursor-pointer text-base">Sí</Label>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="false" id="no" />
              <Label htmlFor="no" className="flex-1 cursor-pointer text-base">No</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleAnterior}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <Button
          onClick={handleSiguiente}
          disabled={respuestas[preguntaActual.id] === undefined}
          className="flex-1"
        >
          {currentIndex === PREGUNTAS_GUIA_I.length - 1 ? (
            <>
              Finalizar
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Botón cancelar */}
      <Button variant="ghost" onClick={onCancel} className="w-full">
        Cancelar evaluación
      </Button>
    </div>
  );
};