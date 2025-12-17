import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, Calendar, Pencil, Check, X } from "lucide-react";

interface ObjetivoConfig {
  tipo: string;
  meta: number;
  mesInicio: string; // YYYY-MM format
}

interface ObjetivosPersonalesCardProps {
  vacantesCerradasMes: number;
  entrevistasRealizadasMes: number;
}

const TIPOS_OBJETIVO = [
  { value: "vacantes_cerradas", label: "Cerrar vacantes este mes", icon: Trophy, unidad: "vacantes" },
  { value: "entrevistas_realizadas", label: "Realizar entrevistas este mes", icon: Calendar, unidad: "entrevistas" },
];

const getMesActual = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getStorageKey = (reclutadorId?: string) => `objetivo_personal_${reclutadorId || 'default'}`;

export const ObjetivosPersonalesCard = ({ 
  vacantesCerradasMes, 
  entrevistasRealizadasMes 
}: ObjetivosPersonalesCardProps) => {
  const [objetivo, setObjetivo] = useState<ObjetivoConfig | null>(null);
  const [editando, setEditando] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [metaInput, setMetaInput] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey());
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ObjetivoConfig;
        // Reset if month changed
        if (parsed.mesInicio !== getMesActual()) {
          setObjetivo(null);
          localStorage.removeItem(getStorageKey());
        } else {
          setObjetivo(parsed);
        }
      } catch {
        setObjetivo(null);
      }
    }
  }, []);

  const getProgreso = (): number => {
    if (!objetivo) return 0;
    switch (objetivo.tipo) {
      case "vacantes_cerradas":
        return vacantesCerradasMes;
      case "entrevistas_realizadas":
        return entrevistasRealizadasMes;
      default:
        return 0;
    }
  };

  const getPorcentaje = (): number => {
    if (!objetivo || objetivo.meta === 0) return 0;
    return Math.min(100, Math.round((getProgreso() / objetivo.meta) * 100));
  };

  const guardarObjetivo = () => {
    if (!tipoSeleccionado || !metaInput || parseInt(metaInput) <= 0) return;
    
    const nuevoObjetivo: ObjetivoConfig = {
      tipo: tipoSeleccionado,
      meta: parseInt(metaInput),
      mesInicio: getMesActual(),
    };
    
    setObjetivo(nuevoObjetivo);
    localStorage.setItem(getStorageKey(), JSON.stringify(nuevoObjetivo));
    setEditando(false);
    setTipoSeleccionado("");
    setMetaInput("");
  };

  const eliminarObjetivo = () => {
    setObjetivo(null);
    localStorage.removeItem(getStorageKey());
    setEditando(false);
  };

  const iniciarEdicion = () => {
    if (objetivo) {
      setTipoSeleccionado(objetivo.tipo);
      setMetaInput(objetivo.meta.toString());
    }
    setEditando(true);
  };

  const tipoInfo = objetivo ? TIPOS_OBJETIVO.find(t => t.value === objetivo.tipo) : null;
  const progreso = getProgreso();
  const porcentaje = getPorcentaje();
  const completado = objetivo && progreso >= objetivo.meta;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Mi Objetivo del Mes
          {objetivo && !editando && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-auto"
              onClick={iniciarEdicion}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!objetivo && !editando ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Define un objetivo personal para este mes
            </p>
            <Button size="sm" onClick={() => setEditando(true)}>
              <Target className="h-4 w-4 mr-2" />
              Crear Objetivo
            </Button>
          </div>
        ) : editando ? (
          <div className="space-y-3">
            <Select value={tipoSeleccionado} onValueChange={setTipoSeleccionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo de objetivo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_OBJETIVO.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <div className="flex items-center gap-2">
                      <tipo.icon className="h-4 w-4" />
                      {tipo.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="100"
                placeholder="Meta"
                value={metaInput}
                onChange={(e) => setMetaInput(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                {tipoSeleccionado ? TIPOS_OBJETIVO.find(t => t.value === tipoSeleccionado)?.unidad : "unidades"}
              </span>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={guardarObjetivo} disabled={!tipoSeleccionado || !metaInput}>
                <Check className="h-4 w-4 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditando(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              {objetivo && (
                <Button size="sm" variant="destructive" onClick={eliminarObjetivo}>
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {tipoInfo && <tipoInfo.icon className="h-5 w-5 text-primary" />}
              <span className="text-sm font-medium">
                {tipoInfo?.label}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={completado ? "text-green-600 font-medium" : "text-muted-foreground"}>
                  {progreso} / {objetivo?.meta} {tipoInfo?.unidad}
                </span>
                <span className={completado ? "text-green-600 font-medium" : "text-primary"}>
                  {porcentaje}%
                </span>
              </div>
              <Progress 
                value={porcentaje} 
                className={`h-2 ${completado ? "[&>div]:bg-green-500" : ""}`}
              />
            </div>

            {completado && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Trophy className="h-4 w-4" />
                ¡Objetivo cumplido!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
