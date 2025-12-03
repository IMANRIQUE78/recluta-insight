import { useState, useMemo } from "react";
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
import { Loader2, Calendar, Clock } from "lucide-react";
import { differenceInMonths, differenceInYears, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface RegistroTrabajadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  onSuccess: () => void;
}

export const RegistroTrabajadorDialog = ({
  open,
  onOpenChange,
  empresaId,
  onSuccess,
}: RegistroTrabajadorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    puesto: "",
    area: "",
    centro_trabajo: "",
    fecha_ingreso: "",
    tipo_jornada: "completa",
    modalidad_contratacion: "indefinido",
  });

  // Calcular antigüedad automáticamente
  const antiguedadCalculada = useMemo(() => {
    if (!formData.fecha_ingreso) return null;
    
    try {
      const fechaIngreso = parseISO(formData.fecha_ingreso);
      const hoy = new Date();
      
      if (fechaIngreso > hoy) return null;
      
      const anos = differenceInYears(hoy, fechaIngreso);
      const mesesTotales = differenceInMonths(hoy, fechaIngreso);
      const mesesRestantes = mesesTotales % 12;
      
      return {
        anos,
        meses: mesesRestantes,
        totalMeses: mesesTotales,
        texto: anos > 0 
          ? `${anos} año${anos !== 1 ? 's' : ''} y ${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`
          : `${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`
      };
    } catch {
      return null;
    }
  }, [formData.fecha_ingreso]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre_completo.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("El correo electrónico es requerido");
      return;
    }
    if (!formData.telefono.trim()) {
      toast.error("El teléfono es requerido");
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
    if (!formData.fecha_ingreso) {
      toast.error("La fecha de ingreso es requerida");
      return;
    }

    // Validación de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("El formato del correo electrónico no es válido");
      return;
    }

    // Validación de teléfono (10 dígitos)
    const telefonoLimpio = formData.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length < 10) {
      toast.error("El teléfono debe tener al menos 10 dígitos");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("trabajadores_nom035")
        .insert({
          empresa_id: empresaId,
          codigo_trabajador: "", // Se genera automáticamente por trigger
          nombre_completo: formData.nombre_completo.trim(),
          email: formData.email.trim().toLowerCase(),
          telefono: telefonoLimpio,
          puesto: formData.puesto.trim(),
          area: formData.area.trim(),
          centro_trabajo: formData.centro_trabajo.trim(),
          fecha_ingreso: formData.fecha_ingreso,
          antiguedad_meses: antiguedadCalculada?.totalMeses || 0,
          tipo_jornada: formData.tipo_jornada,
          modalidad_contratacion: formData.modalidad_contratacion,
        });

      if (error) throw error;

      toast.success("Trabajador registrado exitosamente");
      setFormData({
        nombre_completo: "",
        email: "",
        telefono: "",
        puesto: "",
        area: "",
        centro_trabajo: "",
        fecha_ingreso: "",
        tipo_jornada: "completa",
        modalidad_contratacion: "indefinido",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error registering trabajador:", error);
      toast.error(error.message || "Error al registrar trabajador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Trabajador</DialogTitle>
          <DialogDescription>
            Ingresa los datos del trabajador para su registro en el sistema NOM-035. 
            El trabajador deberá aceptar el aviso de privacidad antes de iniciar cualquier evaluación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Juan Pérez García"
              value={formData.nombre_completo}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                placeholder="trabajador@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">WhatsApp / Teléfono *</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="55 1234 5678"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="puesto">Puesto *</Label>
              <Input
                id="puesto"
                placeholder="Ej: Analista de Sistemas"
                value={formData.puesto}
                onChange={(e) => setFormData(prev => ({ ...prev, puesto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Área *</Label>
              <Input
                id="area"
                placeholder="Ej: Tecnología"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="centro_trabajo">Centro de Trabajo *</Label>
            <Input
              id="centro_trabajo"
              placeholder="Ej: Oficinas Corporativas CDMX"
              value={formData.centro_trabajo}
              onChange={(e) => setFormData(prev => ({ ...prev, centro_trabajo: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  id="fecha_ingreso"
                  type="date"
                  max={format(new Date(), 'yyyy-MM-dd')}
                  value={formData.fecha_ingreso}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                />
              </div>
              {antiguedadCalculada && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{antiguedadCalculada.texto}</span>
                </div>
              )}
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
              Registrar Trabajador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
