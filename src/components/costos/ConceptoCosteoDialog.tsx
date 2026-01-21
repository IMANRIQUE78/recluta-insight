import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ConceptoCosteo, 
  PERIODICIDADES_RECURRENTES, 
  PERIODICIDADES_UNICAS, 
  UNIDADES_MEDIDA 
} from "@/hooks/useCostosReclutamiento";
import { Loader2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConceptoCosteoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  concepto?: ConceptoCosteo | null;
  onSave: (data: {
    concepto: string;
    costo: number;
    periodicidad: string;
    unidad_medida: string;
    descripcion?: string;
  }) => Promise<boolean>;
  onUpdate?: (id: string, data: Partial<ConceptoCosteo>) => Promise<boolean>;
}

export const ConceptoCosteoDialog = ({
  open,
  onOpenChange,
  concepto,
  onSave,
  onUpdate,
}: ConceptoCosteoDialogProps) => {
  const [formData, setFormData] = useState({
    concepto: "",
    costo: "",
    tipoPeriodicidad: "recurrente" as "recurrente" | "unico",
    periodicidad: "mensual",
    unidad_medida: "fijo",
    descripcion: "",
  });
  const [saving, setSaving] = useState(false);

  const isEditing = !!concepto;

  useEffect(() => {
    if (concepto) {
      const esUnico = concepto.periodicidad.startsWith("unico_");
      setFormData({
        concepto: concepto.concepto,
        costo: concepto.costo.toString(),
        tipoPeriodicidad: esUnico ? "unico" : "recurrente",
        periodicidad: concepto.periodicidad,
        unidad_medida: concepto.unidad_medida,
        descripcion: concepto.descripcion || "",
      });
    } else {
      setFormData({
        concepto: "",
        costo: "",
        tipoPeriodicidad: "recurrente",
        periodicidad: "mensual",
        unidad_medida: "fijo",
        descripcion: "",
      });
    }
  }, [concepto, open]);

  // Cuando cambia el tipo de periodicidad, ajustar el valor por defecto
  useEffect(() => {
    if (formData.tipoPeriodicidad === "unico" && !formData.periodicidad.startsWith("unico_")) {
      setFormData(prev => ({ ...prev, periodicidad: "unico_12" }));
    } else if (formData.tipoPeriodicidad === "recurrente" && formData.periodicidad.startsWith("unico_")) {
      setFormData(prev => ({ ...prev, periodicidad: "mensual" }));
    }
  }, [formData.tipoPeriodicidad]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      concepto: formData.concepto.trim(),
      costo: parseFloat(formData.costo) || 0,
      periodicidad: formData.periodicidad,
      unidad_medida: formData.unidad_medida,
      descripcion: formData.descripcion.trim() || undefined,
    };

    let success = false;
    if (isEditing && onUpdate && concepto) {
      success = await onUpdate(concepto.id, data);
    } else {
      success = await onSave(data);
    }

    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const selectedUnidad = UNIDADES_MEDIDA.find(u => u.value === formData.unidad_medida);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Concepto de Costo" : "Nuevo Concepto de Costo"}
            </DialogTitle>
            <DialogDescription>
              Define los conceptos de costo para calcular el presupuesto de reclutamiento
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Concepto */}
            <div className="grid gap-2">
              <Label htmlFor="concepto">Concepto *</Label>
              <Input
                id="concepto"
                placeholder="Ej: Salario Reclutador, Licencia ATS, Publicidad..."
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                required
              />
            </div>

            {/* Costo y Unidad de Medida */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="costo">Costo (MXN) *</Label>
                <Input
                  id="costo"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.costo}
                  onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="unidad">Unidad de Medida *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Define cómo se aplica el costo: por contratación (solo cerradas), 
                          por candidato, por reclutador, o como costo fijo temporal.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={formData.unidad_medida}
                  onValueChange={(value) => setFormData({ ...formData, unidad_medida: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">
                        Basado en volumen
                      </SelectLabel>
                      {UNIDADES_MEDIDA.filter(u => 
                        ["por_contratacion", "por_candidato", "por_reclutador"].includes(u.value)
                      ).map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          <div className="flex flex-col">
                            <span>{u.label}</span>
                            <span className="text-xs text-muted-foreground">{u.descripcion}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">
                        Basado en tiempo
                      </SelectLabel>
                      {UNIDADES_MEDIDA.filter(u => 
                        ["por_hora", "por_dia", "por_mes", "por_ano", "fijo"].includes(u.value)
                      ).map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          <div className="flex flex-col">
                            <span>{u.label}</span>
                            <span className="text-xs text-muted-foreground">{u.descripcion}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descripción de la unidad seleccionada */}
            {selectedUnidad && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                <strong>{selectedUnidad.label}:</strong> {selectedUnidad.descripcion}
              </div>
            )}

            {/* Tipo de periodicidad */}
            <div className="grid gap-3">
              <Label>Tipo de Costo *</Label>
              <RadioGroup
                value={formData.tipoPeriodicidad}
                onValueChange={(value: "recurrente" | "unico") => 
                  setFormData({ ...formData, tipoPeriodicidad: value })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recurrente" id="recurrente" />
                  <Label htmlFor="recurrente" className="font-normal cursor-pointer">
                    Recurrente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unico" id="unico" />
                  <Label htmlFor="unico" className="font-normal cursor-pointer">
                    Único (Prorrateo)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Periodicidad según el tipo */}
            <div className="grid gap-2">
              <Label htmlFor="periodicidad">
                {formData.tipoPeriodicidad === "recurrente" ? "Periodicidad" : "Período de Prorrateo"} *
              </Label>
              <Select
                value={formData.periodicidad}
                onValueChange={(value) => setFormData({ ...formData, periodicidad: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.tipoPeriodicidad === "recurrente" ? (
                    PERIODICIDADES_RECURRENTES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))
                  ) : (
                    PERIODICIDADES_UNICAS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.tipoPeriodicidad === "recurrente" 
                  ? "Los costos se convertirán automáticamente a mensual para el reporte"
                  : "El costo único se distribuirá en el período seleccionado"
                }
              </p>
            </div>

            {/* Descripción */}
            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Textarea
                id="descripcion"
                placeholder="Notas adicionales sobre este concepto..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={2}
              />
            </div>

            {/* Preview del cálculo */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium text-primary mb-1">Vista previa del cálculo:</p>
              <p className="text-xs text-muted-foreground">
                <strong>{formData.concepto || "Concepto"}</strong> → 
                ${parseFloat(formData.costo) || 0} {selectedUnidad?.label || ""}, 
                {formData.tipoPeriodicidad === "recurrente" 
                  ? ` cada período ${PERIODICIDADES_RECURRENTES.find(p => p.value === formData.periodicidad)?.label?.toLowerCase() || ""}`
                  : ` prorrateado en ${formData.periodicidad.split("_")[1] || 12} meses`
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !formData.concepto || !formData.costo}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Agregar Concepto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
