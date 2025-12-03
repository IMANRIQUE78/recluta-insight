import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Trabajador {
  id: string;
  codigo_trabajador: string;
  nombre_completo: string;
  puesto: string;
  area: string;
  centro_trabajo: string;
  antiguedad_meses: number;
  tipo_jornada: string;
  modalidad_contratacion: string;
}

interface EditarTrabajadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trabajador: Trabajador;
  onSuccess: () => void;
}

export const EditarTrabajadorDialog = ({
  open,
  onOpenChange,
  trabajador,
  onSuccess,
}: EditarTrabajadorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    puesto: "",
    area: "",
    centro_trabajo: "",
    antiguedad_anos: 0,
    antiguedad_meses: 0,
    tipo_jornada: "completa",
    modalidad_contratacion: "indefinido",
  });

  useEffect(() => {
    if (trabajador) {
      const years = Math.floor(trabajador.antiguedad_meses / 12);
      const months = trabajador.antiguedad_meses % 12;
      setFormData({
        nombre_completo: trabajador.nombre_completo,
        puesto: trabajador.puesto,
        area: trabajador.area,
        centro_trabajo: trabajador.centro_trabajo,
        antiguedad_anos: years,
        antiguedad_meses: months,
        tipo_jornada: trabajador.tipo_jornada,
        modalidad_contratacion: trabajador.modalidad_contratacion,
      });
    }
  }, [trabajador]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre_completo.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!formData.puesto.trim()) {
      toast.error("El puesto es requerido");
      return;
    }
    if (!formData.area.trim()) {
      toast.error("El área es requerida");
      return;
    }
    if (!formData.centro_trabajo.trim()) {
      toast.error("El centro de trabajo es requerido");
      return;
    }

    setLoading(true);
    try {
      const totalMeses = (formData.antiguedad_anos * 12) + formData.antiguedad_meses;

      const { error } = await supabase
        .from("trabajadores_nom035")
        .update({
          nombre_completo: formData.nombre_completo.trim(),
          puesto: formData.puesto.trim(),
          area: formData.area.trim(),
          centro_trabajo: formData.centro_trabajo.trim(),
          antiguedad_meses: totalMeses,
          tipo_jornada: formData.tipo_jornada,
          modalidad_contratacion: formData.modalidad_contratacion,
        })
        .eq("id", trabajador.id);

      if (error) throw error;

      toast.success("Trabajador actualizado exitosamente");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating trabajador:", error);
      toast.error(error.message || "Error al actualizar trabajador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Trabajador</DialogTitle>
          <DialogDescription>
            Código: {trabajador.codigo_trabajador}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo *</Label>
            <Input
              id="nombre"
              value={formData.nombre_completo}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="puesto">Puesto *</Label>
              <Input
                id="puesto"
                value={formData.puesto}
                onChange={(e) => setFormData(prev => ({ ...prev, puesto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Área *</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="centro_trabajo">Centro de Trabajo *</Label>
            <Input
              id="centro_trabajo"
              value={formData.centro_trabajo}
              onChange={(e) => setFormData(prev => ({ ...prev, centro_trabajo: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Antigüedad en la Empresa</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={formData.antiguedad_anos}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    antiguedad_anos: parseInt(e.target.value) || 0 
                  }))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">años</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="11"
                  value={formData.antiguedad_meses}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    antiguedad_meses: Math.min(11, parseInt(e.target.value) || 0)
                  }))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">meses</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jornada">Tipo de Jornada</Label>
              <Select
                value={formData.tipo_jornada}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_jornada: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completa">Jornada Completa</SelectItem>
                  <SelectItem value="parcial">Jornada Parcial</SelectItem>
                  <SelectItem value="nocturna">Jornada Nocturna</SelectItem>
                  <SelectItem value="mixta">Jornada Mixta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contratacion">Modalidad de Contratación</Label>
              <Select
                value={formData.modalidad_contratacion}
                onValueChange={(value) => setFormData(prev => ({ ...prev, modalidad_contratacion: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinido">Contrato Indefinido</SelectItem>
                  <SelectItem value="temporal">Contrato Temporal</SelectItem>
                  <SelectItem value="obra_determinada">Obra Determinada</SelectItem>
                  <SelectItem value="capacitacion">Capacitación Inicial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};