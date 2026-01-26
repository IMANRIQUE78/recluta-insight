import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Check, ArrowRight, Zap, Tag, Building2, TrendingUp } from "lucide-react";
import { useImproveResumen } from "@/hooks/useImproveResumen";

interface ImproveResumenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumenActual: string;
  puestoBuscado?: string;
  habilidadesTecnicas?: string[];
  habilidadesBlandas?: string[];
  experienciaLaboral?: Array<{
    empresa: string;
    puesto: string;
    descripcion: string;
    tags?: string;
  }>;
  onSuccess: (resumenMejorado: string) => void;
}

interface ResultadoMejora {
  resumen_mejorado: string;
  resumen_indexado: string;
  keywords: string[];
  industrias: string[];
  nivel_experiencia: string;
}

const nivelesLabel: Record<string, { label: string; color: string }> = {
  junior: { label: "Junior", color: "bg-blue-100 text-blue-700 border-blue-200" },
  mid: { label: "Mid-Level", color: "bg-green-100 text-green-700 border-green-200" },
  senior: { label: "Senior", color: "bg-purple-100 text-purple-700 border-purple-200" },
  lead: { label: "Lead/Manager", color: "bg-orange-100 text-orange-700 border-orange-200" },
  executive: { label: "Executive", color: "bg-red-100 text-red-700 border-red-200" },
};

export function ImproveResumenDialog({
  open,
  onOpenChange,
  resumenActual,
  puestoBuscado,
  habilidadesTecnicas,
  habilidadesBlandas,
  experienciaLaboral,
  onSuccess,
}: ImproveResumenDialogProps) {
  const { loading, mejorarResumen, guardarResumenIndexado } = useImproveResumen();
  const [resultado, setResultado] = useState<ResultadoMejora | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [paso, setPaso] = useState<'inicial' | 'procesando' | 'comparar' | 'guardado'>('inicial');

  const handleMejorar = async () => {
    setPaso('procesando');
    
    const result = await mejorarResumen({
      resumen_actual: resumenActual,
      puesto_buscado: puestoBuscado,
      habilidades_tecnicas: habilidadesTecnicas,
      habilidades_blandas: habilidadesBlandas,
      experiencia_laboral: experienciaLaboral,
    });

    if (result) {
      setResultado(result);
      setPaso('comparar');
    } else {
      setPaso('inicial');
    }
  };

  const handleAceptar = async () => {
    if (!resultado) return;
    
    setGuardando(true);
    const success = await guardarResumenIndexado(
      resultado.resumen_mejorado,
      resultado.resumen_indexado,
      resultado.keywords,
      resultado.industrias,
      resultado.nivel_experiencia
    );

    if (success) {
      setPaso('guardado');
      onSuccess(resultado.resumen_mejorado);
      setTimeout(() => {
        onOpenChange(false);
        // Reset state for next use
        setResultado(null);
        setPaso('inicial');
      }, 1500);
    }
    setGuardando(false);
  };

  const handleCancelar = () => {
    onOpenChange(false);
    setResultado(null);
    setPaso('inicial');
  };

  const nivelInfo = resultado?.nivel_experiencia 
    ? nivelesLabel[resultado.nivel_experiencia] 
    : null;

  return (
    <Dialog open={open} onOpenChange={handleCancelar}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mejorar Resumen con IA
          </DialogTitle>
          <DialogDescription>
            {paso === 'inicial' && "Mejora tu resumen profesional y optimízalo para ser encontrado por reclutadores."}
            {paso === 'procesando' && "Analizando y mejorando tu resumen..."}
            {paso === 'comparar' && "Revisa las mejoras sugeridas y decide si aceptarlas."}
            {paso === 'guardado' && "¡Tu resumen ha sido mejorado y guardado!"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {paso === 'inicial' && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-sm">Tu resumen actual:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {resumenActual || "Sin resumen profesional"}
                </p>
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  ¿Qué hará la IA?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  <li>• Mejorará la redacción profesional</li>
                  <li>• Optimizará keywords para sourcing</li>
                  <li>• Identificará tu industria y nivel</li>
                  <li>• Creará un índice para búsquedas rápidas</li>
                </ul>
              </div>
            </div>
          )}

          {paso === 'procesando' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-muted-foreground">Procesando con inteligencia artificial...</p>
            </div>
          )}

          {paso === 'comparar' && resultado && (
            <div className="space-y-4 py-4">
              {/* Comparación de resúmenes */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Resumen Original</h4>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm">
                    {resumenActual}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Resumen Mejorado
                  </h4>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                    {resultado.resumen_mejorado}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Metadatos extraídos */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Metadatos para Sourcing</h4>
                
                {/* Nivel de experiencia */}
                {nivelInfo && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Nivel detectado:</span>
                    <Badge variant="outline" className={nivelInfo.color}>
                      {nivelInfo.label}
                    </Badge>
                  </div>
                )}

                {/* Keywords */}
                {resultado.keywords.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Keywords:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {resultado.keywords.map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Industrias */}
                {resultado.industrias.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Industrias:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {resultado.industrias.map((ind, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumen indexado */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Índice para búsqueda rápida:</p>
                  <p className="text-sm font-medium">{resultado.resumen_indexado}</p>
                </div>
              </div>
            </div>
          )}

          {paso === 'guardado' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-green-600">¡Resumen mejorado correctamente!</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          {paso === 'inicial' && (
            <>
              <Button variant="outline" onClick={handleCancelar}>
                Cancelar
              </Button>
              <Button onClick={handleMejorar} disabled={!resumenActual || resumenActual.length < 20}>
                <Sparkles className="h-4 w-4 mr-2" />
                Mejorar con IA
              </Button>
            </>
          )}

          {paso === 'comparar' && (
            <>
              <Button variant="outline" onClick={handleCancelar}>
                Descartar
              </Button>
              <Button onClick={handleAceptar} disabled={guardando}>
                {guardando ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Aceptar y Guardar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
