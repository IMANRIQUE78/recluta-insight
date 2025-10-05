import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface VacanteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const VacanteForm = ({ open, onOpenChange, onSuccess }: VacanteFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [reclutadores, setReclutadores] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    folio: "",
    titulo_puesto: "",
    cliente_area_id: "",
    fecha_solicitud: new Date().toISOString().split('T')[0],
    reclutador_id: "",
    estatus: "abierta" as const,
    motivo: "crecimiento" as const,
    lugar_trabajo: "hibrido" as const,
    senioridad: "junior" as const,
    sueldo_bruto_aprobado: "",
    observaciones: "",
  });

  useEffect(() => {
    if (open) {
      loadClientes();
      loadReclutadores();
    }
  }, [open]);

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from("clientes_areas")
      .select("*")
      .order("cliente_nombre");
    
    if (!error && data) {
      setClientes(data);
    }
  };

  const loadReclutadores = async () => {
    const { data, error } = await supabase
      .from("reclutadores")
      .select("*")
      .order("nombre");
    
    if (!error && data) {
      setReclutadores(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase.from("vacantes").insert({
        ...formData,
        user_id: user.id,
        sueldo_bruto_aprobado: formData.sueldo_bruto_aprobado ? parseFloat(formData.sueldo_bruto_aprobado) : null,
      });

      if (error) throw error;

      toast({
        title: "Vacante creada",
        description: "La vacante se ha registrado correctamente",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      folio: "",
      titulo_puesto: "",
      cliente_area_id: "",
      fecha_solicitud: new Date().toISOString().split('T')[0],
      reclutador_id: "",
      estatus: "abierta",
      motivo: "crecimiento",
      lugar_trabajo: "hibrido",
      senioridad: "junior",
      sueldo_bruto_aprobado: "",
      observaciones: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Vacante</DialogTitle>
          <DialogDescription>Registra una nueva solicitud de vacante</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="folio">Folio Único*</Label>
              <Input
                id="folio"
                value={formData.folio}
                onChange={(e) => setFormData({ ...formData, folio: e.target.value })}
                placeholder="VAC-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_solicitud">Fecha de Solicitud*</Label>
              <Input
                id="fecha_solicitud"
                type="date"
                value={formData.fecha_solicitud}
                onChange={(e) => setFormData({ ...formData, fecha_solicitud: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo_puesto">Título del Puesto*</Label>
            <Input
              id="titulo_puesto"
              value={formData.titulo_puesto}
              onChange={(e) => setFormData({ ...formData, titulo_puesto: e.target.value })}
              placeholder="Desarrollador Senior Full Stack"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente/Área*</Label>
              <Select
                value={formData.cliente_area_id}
                onValueChange={(value) => setFormData({ ...formData, cliente_area_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.cliente_nombre} - {cliente.area} ({cliente.tipo_cliente})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reclutador">Reclutador Asignado</Label>
              <Select
                value={formData.reclutador_id}
                onValueChange={(value) => setFormData({ ...formData, reclutador_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  {reclutadores.map((reclutador) => (
                    <SelectItem key={reclutador.id} value={reclutador.id}>
                      {reclutador.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo*</Label>
              <Select
                value={formData.motivo}
                onValueChange={(value: any) => setFormData({ ...formData, motivo: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crecimiento">Crecimiento</SelectItem>
                  <SelectItem value="reposicion">Reposición</SelectItem>
                  <SelectItem value="temporal">Temporal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senioridad">Senioridad*</Label>
              <Select
                value={formData.senioridad}
                onValueChange={(value: any) => setFormData({ ...formData, senioridad: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lugar_trabajo">Modalidad de Trabajo*</Label>
              <Select
                value={formData.lugar_trabajo}
                onValueChange={(value: any) => setFormData({ ...formData, lugar_trabajo: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="remoto">Remoto</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sueldo">Sueldo Bruto Aprobado</Label>
              <Input
                id="sueldo"
                type="number"
                value={formData.sueldo_bruto_aprobado}
                onChange={(e) => setFormData({ ...formData, sueldo_bruto_aprobado: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Detalles adicionales sobre la vacante..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Vacante
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
