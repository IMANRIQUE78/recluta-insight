import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, Calendar, Clock, Star, Pencil, Check, X } from "lucide-react";

interface ObjetivosConfig {
  vacantesCerradas: { meta: number; activo: boolean };
  entrevistas: { meta: number; activo: boolean };
  promedioDias: { meta: number; activo: boolean };
  calificacion: { meta: number; activo: boolean };
  mesInicio: string;
}

interface ObjetivosPersonalesCardProps {
  vacantesCerradasMes: number;
  entrevistasRealizadasMes: number;
  promedioDiasCierre: number;
  calificacionPromedio: number;
}

const getMesActual = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMesNombre = () => {
  const mes = new Date().toLocaleDateString('es-MX', { month: 'long' });
  return mes.charAt(0).toUpperCase() + mes.slice(1);
};

const getStorageKey = () => `objetivos_reclutador_v2`;

const defaultConfig: ObjetivosConfig = {
  vacantesCerradas: { meta: 0, activo: false },
  entrevistas: { meta: 0, activo: false },
  promedioDias: { meta: 0, activo: false },
  calificacion: { meta: 0, activo: false },
  mesInicio: getMesActual(),
};

export const ObjetivosPersonalesCard = ({ 
  vacantesCerradasMes, 
  entrevistasRealizadasMes,
  promedioDiasCierre,
  calificacionPromedio,
}: ObjetivosPersonalesCardProps) => {
  const [config, setConfig] = useState<ObjetivosConfig>(defaultConfig);
  const [editando, setEditando] = useState(false);
  const [tempConfig, setTempConfig] = useState<ObjetivosConfig>(defaultConfig);

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey());
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ObjetivosConfig;
        if (parsed.mesInicio !== getMesActual()) {
          // Reset for new month
          const newConfig = { ...defaultConfig, mesInicio: getMesActual() };
          setConfig(newConfig);
          localStorage.setItem(getStorageKey(), JSON.stringify(newConfig));
        } else {
          setConfig(parsed);
        }
      } catch {
        setConfig(defaultConfig);
      }
    }
  }, []);

  const guardarObjetivos = () => {
    const newConfig = { ...tempConfig, mesInicio: getMesActual() };
    setConfig(newConfig);
    localStorage.setItem(getStorageKey(), JSON.stringify(newConfig));
    setEditando(false);
  };

  const iniciarEdicion = () => {
    setTempConfig(config);
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setTempConfig(config);
    setEditando(false);
  };

  const toggleObjetivo = (key: keyof Omit<ObjetivosConfig, 'mesInicio'>) => {
    setTempConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], activo: !prev[key].activo }
    }));
  };

  const setMeta = (key: keyof Omit<ObjetivosConfig, 'mesInicio'>, value: number) => {
    setTempConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], meta: value }
    }));
  };

  // Calculate progress for each objective
  const getProgreso = (key: string, meta: number): { actual: number; porcentaje: number; cumplido: boolean; invertido?: boolean } => {
    if (meta === 0) return { actual: 0, porcentaje: 0, cumplido: false };
    
    let actual = 0;
    let invertido = false;
    
    switch (key) {
      case 'vacantesCerradas':
        actual = vacantesCerradasMes;
        break;
      case 'entrevistas':
        actual = entrevistasRealizadasMes;
        break;
      case 'promedioDias':
        actual = promedioDiasCierre;
        invertido = true; // Lower is better
        break;
      case 'calificacion':
        actual = calificacionPromedio;
        break;
      default:
        actual = 0;
    }

    let porcentaje: number;
    let cumplido: boolean;

    if (invertido) {
      // For "promedio días", goal is to be UNDER the target
      porcentaje = actual === 0 ? 100 : Math.min(100, Math.round((meta / actual) * 100));
      cumplido = actual > 0 && actual <= meta;
    } else {
      porcentaje = Math.min(100, Math.round((actual / meta) * 100));
      cumplido = actual >= meta;
    }

    return { actual, porcentaje, cumplido, invertido };
  };

  const objetivos = [
    { 
      key: 'vacantesCerradas' as const, 
      label: 'Vacantes cerradas', 
      icon: Trophy, 
      unidad: 'vacantes',
      color: 'text-green-500',
      bgColor: 'bg-green-500',
    },
    { 
      key: 'entrevistas' as const, 
      label: 'Entrevistas realizadas', 
      icon: Calendar, 
      unidad: 'entrevistas',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
    },
    { 
      key: 'promedioDias' as const, 
      label: 'Promedio días cierre', 
      icon: Clock, 
      unidad: 'días máx.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      invertido: true,
    },
    { 
      key: 'calificacion' as const, 
      label: 'Calificación personal', 
      icon: Star, 
      unidad: 'puntos',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      disabled: true,
      disabledText: 'Próximamente',
    },
  ];

  const tieneObjetivosActivos = Object.entries(config)
    .filter(([key]) => key !== 'mesInicio')
    .some(([, value]) => (value as { activo: boolean }).activo);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span>Mis Objetivos - {getMesNombre()}</span>
          </div>
          {!editando && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={iniciarEdicion}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {editando ? (
          <>
            <div className="space-y-2">
              {objetivos.map((obj) => (
                <div 
                  key={obj.key} 
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    obj.disabled 
                      ? 'bg-muted/30 border-muted opacity-60' 
                      : tempConfig[obj.key].activo 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-background border-border hover:border-primary/20'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => !obj.disabled && toggleObjetivo(obj.key)}
                    disabled={obj.disabled}
                    className={`flex items-center gap-2 flex-1 min-w-0 text-left ${obj.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      tempConfig[obj.key].activo ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                    }`}>
                      {tempConfig[obj.key].activo && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <obj.icon className={`h-4 w-4 shrink-0 ${obj.color}`} />
                    <span className="text-xs truncate">{obj.label}</span>
                  </button>
                  
                  {obj.disabled ? (
                    <span className="text-[10px] text-muted-foreground italic shrink-0">{obj.disabledText}</span>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        value={tempConfig[obj.key].meta || ''}
                        onChange={(e) => setMeta(obj.key, parseInt(e.target.value) || 0)}
                        disabled={!tempConfig[obj.key].activo}
                        className="w-14 h-7 text-xs text-center p-1"
                        placeholder="0"
                      />
                      <span className="text-[10px] text-muted-foreground w-12">{obj.unidad}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={guardarObjetivos} className="flex-1 h-7 text-xs">
                <Check className="h-3 w-3 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={cancelarEdicion} className="flex-1 h-7 text-xs">
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </>
        ) : !tieneObjetivosActivos ? (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground mb-2">
              Define tus metas mensuales
            </p>
            <Button size="sm" onClick={iniciarEdicion} className="h-7 text-xs">
              <Target className="h-3 w-3 mr-1" />
              Configurar Objetivos
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {objetivos.map((obj) => {
              if (!config[obj.key].activo || obj.disabled) return null;
              
              const { actual, porcentaje, cumplido, invertido } = getProgreso(obj.key, config[obj.key].meta);
              
              return (
                <div key={obj.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <obj.icon className={`h-3.5 w-3.5 ${cumplido ? 'text-green-500' : obj.color}`} />
                      <span className="text-muted-foreground truncate max-w-[100px]">{obj.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cumplido ? 'text-green-600 font-medium' : ''}>
                        {invertido ? (
                          actual > 0 ? `${actual} / ≤${config[obj.key].meta}` : `0 / ≤${config[obj.key].meta}`
                        ) : (
                          `${actual} / ${config[obj.key].meta}`
                        )}
                      </span>
                      {cumplido && <Trophy className="h-3 w-3 text-green-500" />}
                    </div>
                  </div>
                  <Progress 
                    value={porcentaje} 
                    className={`h-1.5 ${cumplido ? '[&>div]:bg-green-500' : `[&>div]:${obj.bgColor}`}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
