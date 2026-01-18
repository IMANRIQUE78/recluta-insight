import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  ClipboardList, 
  AlertTriangle, 
  Brain, 
  Users,
  CheckCircle2,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { CuestionarioGuiaI } from "./CuestionarioGuiaI";
import { CuestionarioGuiaIII } from "./CuestionarioGuiaIII";
import { NivelRiesgo } from "./preguntasGuiaIII";

interface Trabajador {
  id: string;
  codigo_trabajador: string;
  nombre_completo: string;
  acepto_aviso_privacidad: boolean;
}

interface SelectorCuestionarioProps {
  empresaId: string;
  onEvaluacionCompleta: () => void;
}

export const SelectorCuestionario = ({ 
  empresaId,
  onEvaluacionCompleta 
}: SelectorCuestionarioProps) => {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null);
  const [selectedGuia, setSelectedGuia] = useState<"guia_i" | "guia_iii" | null>(null);
  const [loading, setLoading] = useState(true);
  const [aplicandoCuestionario, setAplicandoCuestionario] = useState(false);

  useEffect(() => {
    loadTrabajadores();
  }, [empresaId]);

  const loadTrabajadores = async () => {
    try {
      const { data, error } = await supabase
        .from("trabajadores_nom035")
        .select("id, codigo_trabajador, nombre_completo, acepto_aviso_privacidad")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .eq("acepto_aviso_privacidad", true)
        .order("nombre_completo");

      if (error) throw error;
      setTrabajadores(data || []);
    } catch (error) {
      console.error("Error loading trabajadores:", error);
      toast.error("Error al cargar trabajadores");
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarCuestionario = () => {
    if (!selectedTrabajador || !selectedGuia) {
      toast.error("Selecciona un trabajador y un cuestionario");
      return;
    }
    setAplicandoCuestionario(true);
  };

  const handleGuiaIComplete = async (resultado: {
    respuestas: Record<number, boolean>;
    requiereAtencion: boolean;
    seccionesPositivas: string[];
    mensaje: string;
  }) => {
    if (!selectedTrabajador) return;

    try {
      // Crear evaluación
      const { data: evaluacion, error: evalError } = await supabase
        .from("evaluaciones_nom035")
        .insert({
          empresa_id: empresaId,
          trabajador_id: selectedTrabajador.id,
          tipo_guia: "guia_i",
          estado: "completada",
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date().toISOString(),
          nivel_riesgo: resultado.requiereAtencion ? "alto" : "nulo",
          requiere_accion: resultado.requiereAtencion,
          periodo_evaluacion: new Date().getFullYear().toString()
        })
        .select()
        .single();

      if (evalError) throw evalError;

      // Guardar respuestas
      const respuestasToInsert = Object.entries(resultado.respuestas).map(([id, valor]) => ({
        evaluacion_id: evaluacion.id,
        numero_pregunta: parseInt(id),
        seccion: `seccion_${id}`,
        respuesta_valor: valor ? 1 : 0,
        respuesta_texto: valor ? "Sí" : "No"
      }));

      const { error: respError } = await supabase
        .from("respuestas_nom035")
        .insert(respuestasToInsert);

      if (respError) throw respError;

      toast.success("¡Evaluación guardada con éxito!", {
        description: `Gracias por completar la Guía I para ${selectedTrabajador.nombre_completo}. Los resultados han sido registrados correctamente.`,
        duration: 5000,
      });
      setAplicandoCuestionario(false);
      setSelectedTrabajador(null);
      setSelectedGuia(null);
      onEvaluacionCompleta();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("Error al guardar la evaluación");
    }
  };

  const handleGuiaIIIComplete = async (resultado: {
    respuestas: Record<number, number>;
    puntajeTotal: number;
    nivelRiesgo: NivelRiesgo;
    puntajesPorCategoria: Record<string, number>;
  }) => {
    if (!selectedTrabajador) return;

    try {
      // Crear evaluación
      const { data: evaluacion, error: evalError } = await supabase
        .from("evaluaciones_nom035")
        .insert({
          empresa_id: empresaId,
          trabajador_id: selectedTrabajador.id,
          tipo_guia: "guia_iii",
          estado: "completada",
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date().toISOString(),
          puntaje_total: resultado.puntajeTotal,
          nivel_riesgo: resultado.nivelRiesgo.nivel,
          requiere_accion: resultado.nivelRiesgo.nivel === "medio" || 
                          resultado.nivelRiesgo.nivel === "alto" || 
                          resultado.nivelRiesgo.nivel === "muy_alto",
          periodo_evaluacion: new Date().getFullYear().toString()
        })
        .select()
        .single();

      if (evalError) throw evalError;

      // Guardar respuestas
      const respuestasToInsert = Object.entries(resultado.respuestas).map(([id, valor]) => ({
        evaluacion_id: evaluacion.id,
        numero_pregunta: parseInt(id),
        seccion: "guia_iii",
        respuesta_valor: valor
      }));

      const { error: respError } = await supabase
        .from("respuestas_nom035")
        .insert(respuestasToInsert);

      if (respError) throw respError;

      // Guardar resultados por categoría
      const resultadosToInsert = Object.entries(resultado.puntajesPorCategoria).map(([cat, puntaje]) => ({
        evaluacion_id: evaluacion.id,
        dimension: cat,
        categoria: cat,
        puntaje: puntaje,
        nivel_riesgo: resultado.nivelRiesgo.nivel
      }));

      const { error: resError } = await supabase
        .from("resultados_dimension_nom035")
        .insert(resultadosToInsert);

      if (resError) throw resError;

      toast.success("¡Evaluación guardada con éxito!", {
        description: `Gracias por completar la Guía III para ${selectedTrabajador.nombre_completo}. Los resultados y el nivel de riesgo han sido registrados.`,
        duration: 5000,
      });
      setAplicandoCuestionario(false);
      setSelectedTrabajador(null);
      setSelectedGuia(null);
      onEvaluacionCompleta();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("Error al guardar la evaluación");
    }
  };

  const handleCancelar = () => {
    setAplicandoCuestionario(false);
  };

  // Mostrar cuestionario si se está aplicando
  if (aplicandoCuestionario && selectedTrabajador && selectedGuia) {
    if (selectedGuia === "guia_i") {
      return (
        <CuestionarioGuiaI
          trabajadorNombre={selectedTrabajador.nombre_completo}
          onComplete={handleGuiaIComplete}
          onCancel={handleCancelar}
        />
      );
    }
    if (selectedGuia === "guia_iii") {
      return (
        <CuestionarioGuiaIII
          trabajadorNombre={selectedTrabajador.nombre_completo}
          atieneClientes={false}
          esJefe={false}
          onComplete={handleGuiaIIIComplete}
          onCancel={handleCancelar}
        />
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de trabajador y guía */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Seleccionar Trabajador</Label>
          {trabajadores.length === 0 ? (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                No hay trabajadores con aviso de privacidad aceptado.
              </p>
            </div>
          ) : (
            <Select
              value={selectedTrabajador?.id || ""}
              onValueChange={(value) => {
                const t = trabajadores.find(t => t.id === value);
                setSelectedTrabajador(t || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un trabajador" />
              </SelectTrigger>
              <SelectContent>
                {trabajadores.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre_completo} ({t.codigo_trabajador})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tipo de Cuestionario</Label>
          <Select
            value={selectedGuia || ""}
            onValueChange={(value) => setSelectedGuia(value as "guia_i" | "guia_iii")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el cuestionario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="guia_i">Guía I - Acontecimientos Traumáticos</SelectItem>
              <SelectItem value="guia_iii">Guía III - Factores Psicosociales</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de cuestionarios */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className={`cursor-pointer transition-all ${
            selectedGuia === "guia_i" ? "ring-2 ring-primary" : "hover:border-primary/50"
          }`}
          onClick={() => setSelectedGuia("guia_i")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <Badge variant="outline">20 preguntas</Badge>
            </div>
            <CardTitle className="text-lg">Guía I</CardTitle>
            <CardDescription>
              Acontecimientos Traumáticos Severos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Identifica trabajadores expuestos a eventos traumáticos que requieran 
              valoración clínica especializada. Preguntas de Sí/No.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">Obligatorio</Badge>
              <Badge variant="outline" className="text-xs">Todos los centros</Badge>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            selectedGuia === "guia_iii" ? "ring-2 ring-primary" : "hover:border-primary/50"
          }`}
          onClick={() => setSelectedGuia("guia_iii")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline">72 preguntas</Badge>
            </div>
            <CardTitle className="text-lg">Guía III</CardTitle>
            <CardDescription>
              Factores de Riesgo Psicosocial y Entorno Organizacional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Evalúa condiciones del ambiente, carga de trabajo, jornada, liderazgo, 
              relaciones y entorno organizacional. Escala Likert.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">+50 trabajadores</Badge>
              <Badge variant="outline" className="text-xs">Análisis completo</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón iniciar */}
      <Button
        onClick={handleIniciarCuestionario}
        disabled={!selectedTrabajador || !selectedGuia}
        className="w-full"
        size="lg"
      >
        <ClipboardList className="h-5 w-5 mr-2" />
        Iniciar Cuestionario
      </Button>
    </div>
  );
};