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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConceptoCosteo, PERIODICIDADES, UNIDADES_MEDIDA } from "@/hooks/useCostosReclutamiento";
import { Loader2 } from "lucide-react";

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
    periodicidad: "mensual",
    unidad_medida: "pesos",
    descripcion: "",
  });
  const [saving, setSaving] = useState(false);

  const isEditing = !!concepto;

  useEffect(() => {
    if (concepto) {
      setFormData({
        concepto: concepto.concepto,
        costo: concepto.costo.toString(),
        periodicidad: concepto.periodicidad,
        unidad_medida: concepto.unidad_medida,
        descripcion: concepto.descripcion || "",
      });
    } else {
      setFormData({
        concepto: "",
        costo: "",
        periodicidad: "mensual",
        unidad_medida: "pesos",
        descripcion: "",
      });
    }
  }, [concepto, open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="costo">Costo *</Label>
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
                <Label htmlFor="unidad">Unidad de Medida</Label>
                <Select
                  value={formData.unidad_medida}
                  onValueChange={(value) => setFormData({ ...formData, unidad_medida: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES_MEDIDA.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="periodicidad">Periodicidad *</Label>
              <Select
                value={formData.periodicidad}
                onValueChange={(value) => setFormData({ ...formData, periodicidad: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICIDADES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los costos se convertirán automáticamente a mensual para el reporte
              </p>
            </div>

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
