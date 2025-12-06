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
  Info
} from "lucide-react";
import { 
  PREGUNTAS_GUIA_III, 
  ESCALA_LIKERT,
  ESCALA_LIKERT_INVERTIDA,
  calcularNivelRiesgo,
  NIVELES_RIESGO,
  NivelRiesgo
} from "./preguntasGuiaIII";
import { AvisoConfidencialidad } from "./AvisoConfidencialidad";

interface CuestionarioGuiaIIIProps {
  trabajadorNombre: string;
  atieneClientes: boolean;
  esJefe: boolean;
  onComplete: (resultado: {
    respuestas: Record<number, number>;
    puntajeTotal: number;
    nivelRiesgo: NivelRiesgo;
    puntajesPorCategoria: Record<string, number>;
  }) => void;
  onCancel: () => void;
}

export const CuestionarioGuiaIII = ({
  trabajadorNombre,
  atieneClientes,
  esJefe,
  onComplete,
  onCancel
}: CuestionarioGuiaIIIProps) => {
  const [avisoAceptado, setAvisoAceptado] = useState(false);
  const [paso, setPaso] = useState<"condiciones" | "cuestionario" | "resultado">("condiciones");
  const [condiciones, setCondiciones] = useState({ atieneClientes: false, esJefe: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  
  // Filtrar preguntas según condiciones
  const preguntasFiltradas = PREGUNTAS_GUIA_III.filter(p => {
    // Preguntas 65-68 solo si atiende clientes
    if (p.id >= 65 && p.id <= 68 && !condiciones.atieneClientes) return false;
    // Preguntas 69-72 solo si es jefe
    if (p.id >= 69 && p.id <= 72 && !condiciones.esJefe) return false;
    return true;
  });

  const preguntaActual = preguntasFiltradas[currentIndex];
  const progreso = ((currentIndex + 1) / preguntasFiltradas.length) * 100;
  const todasRespondidas = preguntasFiltradas.every(p => respuestas[p.id] !== undefined);

  const handleRespuesta = (valor: number) => {
    setRespuestas(prev => ({ ...prev, [preguntaActual.id]: valor }));
  };

  const handleSiguiente = () => {
    if (currentIndex < preguntasFiltradas.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (todasRespondidas) {
      setPaso("resultado");
    }
  };

  const handleAnterior = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const calcularResultados = () => {
    let puntajeTotal = 0;
    const puntajesPorCategoria: Record<string, number> = {};

    preguntasFiltradas.forEach(pregunta => {
      const respuestaIndex = respuestas[pregunta.id];
      if (respuestaIndex === undefined) return;

      // Obtener valor según si la pregunta es invertida o no
      const escala = pregunta.invertida ? ESCALA_LIKERT_INVERTIDA : ESCALA_LIKERT;
      const valor = escala[respuestaIndex].valor;
      
      puntajeTotal += valor;
      
      if (!puntajesPorCategoria[pregunta.categoria]) {
        puntajesPorCategoria[pregunta.categoria] = 0;
      }
      puntajesPorCategoria[pregunta.categoria] += valor;
    });

    return {
      puntajeTotal,
      nivelRiesgo: calcularNivelRiesgo(puntajeTotal),
      puntajesPorCategoria
    };
  };

  const handleFinalizar = () => {
    const resultados = calcularResultados();
    onComplete({
      respuestas,
      ...resultados
    });
  };

  if (!avisoAceptado) {
    return (
      <AvisoConfidencialidad
        nombreTrabajador={trabajadorNombre}
        tipoGuia="Guía III - Factores de Riesgo Psicosocial"
        onAceptar={() => setAvisoAceptado(true)}
        onCancelar={onCancel}
      />
    );
  }

  if (paso === "condiciones") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Preguntas Previas</CardTitle>
          <CardDescription>
            Antes de comenzar, responda las siguientes preguntas para personalizar el cuestionario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <p className="font-medium">¿En su trabajo debe brindar servicio a clientes o usuarios?</p>
              <div className="flex gap-4">
                <Button
                  variant={condiciones.atieneClientes ? "default" : "outline"}
                  onClick={() => setCondiciones(prev => ({ ...prev, atieneClientes: true }))}
                >
                  Sí
                </Button>
                <Button
                  variant={!condiciones.atieneClientes ? "default" : "outline"}
                  onClick={() => setCondiciones(prev => ({ ...prev, atieneClientes: false }))}
                >
                  No
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <p className="font-medium">¿Es usted jefe de otros trabajadores?</p>
              <div className="flex gap-4">
                <Button
                  variant={condiciones.esJefe ? "default" : "outline"}
                  onClick={() => setCondiciones(prev => ({ ...prev, esJefe: true }))}
                >
                  Sí
                </Button>
                <Button
                  variant={!condiciones.esJefe ? "default" : "outline"}
                  onClick={() => setCondiciones(prev => ({ ...prev, esJefe: false }))}
                >
                  No
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={() => setPaso("cuestionario")} className="flex-1">
              Continuar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paso === "resultado") {
    const resultados = calcularResultados();
    const nivelColor = {
      nulo: "bg-emerald-500",
      bajo: "bg-green-500", 
      medio: "bg-yellow-500",
      alto: "bg-orange-500",
      muy_alto: "bg-red-500"
    };
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            resultados.nivelRiesgo.nivel === "alto" || resultados.nivelRiesgo.nivel === "muy_alto"
              ? "bg-destructive/10"
              : resultados.nivelRiesgo.nivel === "medio" 
                ? "bg-yellow-500/10"
                : "bg-success/10"
          }`}>
            {resultados.nivelRiesgo.nivel === "alto" || resultados.nivelRiesgo.nivel === "muy_alto" ? (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            ) : (
              <CheckCircle2 className={`h-8 w-8 ${
                resultados.nivelRiesgo.nivel === "medio" ? "text-yellow-600" : "text-success"
              }`} />
            )}
          </div>
          <CardTitle>Evaluación Completada</CardTitle>
          <CardDescription>Guía III - Factores de Riesgo Psicosocial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Trabajador: {trabajadorNombre}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-sm">Puntaje Total:</span>
              <span className="text-2xl font-bold">{resultados.puntajeTotal}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Nivel de Riesgo:</p>
            <div className={`p-4 rounded-lg ${nivelColor[resultados.nivelRiesgo.nivel]} text-white`}>
              <p className="font-bold text-lg capitalize">
                {resultados.nivelRiesgo.nivel.replace("_", " ")}
              </p>
              <p className="text-sm mt-1 opacity-90">
                {resultados.nivelRiesgo.descripcion}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Puntajes por Categoría:</p>
            <div className="grid gap-2">
              {Object.entries(resultados.puntajesPorCategoria).map(([cat, puntaje]) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-sm capitalize">{cat.replace(/_/g, " ")}</span>
                  <Badge variant="outline">{puntaje}</Badge>
                </div>
              ))}
            </div>
          </div>

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

  // Cuestionario principal
  const escalaActual = preguntaActual.invertida ? ESCALA_LIKERT_INVERTIDA : ESCALA_LIKERT;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Guía III - Factores de Riesgo Psicosocial</CardTitle>
              <CardDescription>{trabajadorNombre}</CardDescription>
            </div>
            <Badge variant="outline">
              {currentIndex + 1} / {preguntasFiltradas.length}
            </Badge>
          </div>
          <Progress value={progreso} className="h-2 mt-2" />
        </CardHeader>
      </Card>

      {/* Pregunta */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {preguntaActual.categoria.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Pregunta {preguntaActual.id}
            </Badge>
          </div>
          <CardTitle className="text-base font-normal leading-relaxed">
            {preguntaActual.texto}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            key={preguntaActual.id}
            value={respuestas[preguntaActual.id]?.toString()}
            onValueChange={(value) => handleRespuesta(parseInt(value))}
            className="space-y-2"
          >
            {ESCALA_LIKERT.map((opcion, index) => (
              <div 
                key={index}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
              >
                <RadioGroupItem value={index.toString()} id={`opcion-${preguntaActual.id}-${index}`} />
                <Label htmlFor={`opcion-${preguntaActual.id}-${index}`} className="flex-1 cursor-pointer">
                  {opcion.texto}
                </Label>
              </div>
            ))}
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
          {currentIndex === preguntasFiltradas.length - 1 ? (
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