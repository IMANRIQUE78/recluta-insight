import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock } from "lucide-react";

interface VacanteDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacante: any;
  onSuccess: () => void;
}

export const VacanteDetailModal = ({ open, onOpenChange, vacante, onSuccess }: VacanteDetailModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [reclutadores, setReclutadores] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<{
    folio: string;
    titulo_puesto: string;
    cliente_area_id: string;
    fecha_solicitud: string;
    fecha_cierre: string;
    reclutador_id: string;
    estatus: "abierta" | "cerrada" | "cancelada";
    motivo: "crecimiento" | "reposicion" | "temporal";
    lugar_trabajo: "hibrido" | "remoto" | "presencial";
    sueldo_bruto_aprobado: string;
    observaciones: string;
  }>({
    folio: "",
    titulo_puesto: "",
    cliente_area_id: "",
    fecha_solicitud: "",
    fecha_cierre: "",
    reclutador_id: "",
    estatus: "abierta",
    motivo: "crecimiento",
    lugar_trabajo: "hibrido",
    sueldo_bruto_aprobado: "",
    observaciones: "",
  });

  const isLocked = vacante?.estatus === "cerrada" || vacante?.estatus === "cancelada";

  useEffect(() => {
    if (vacante && open) {
      setFormData({
        folio: vacante.folio || "",
        titulo_puesto: vacante.titulo_puesto || "",
        cliente_area_id: vacante.cliente_area_id || "",
        fecha_solicitud: vacante.fecha_solicitud || "",
        fecha_cierre: vacante.fecha_cierre || "",
        reclutador_id: vacante.reclutador_id || "",
        estatus: vacante.estatus || "abierta",
        motivo: vacante.motivo || "crecimiento",
        lugar_trabajo: vacante.lugar_trabajo || "hibrido",
        sueldo_bruto_aprobado: vacante.sueldo_bruto_aprobado?.toString() || "",
        observaciones: vacante.observaciones || "",
      });
      loadClientes();
      loadReclutadores();
    }
  }, [vacante, open]);

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
    if (isLocked && !editing) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const estatusAnterior = vacante.estatus;
      const estatusNuevo = formData.estatus;

      const updateData: any = {
        ...formData,
        sueldo_bruto_aprobado: formData.sueldo_bruto_aprobado ? parseFloat(formData.sueldo_bruto_aprobado) : null,
      };

      // Si está cambiando a cerrada o cancelada, establecer fecha_cierre
      if ((formData.estatus === "cerrada" || formData.estatus === "cancelada") && !formData.fecha_cierre) {
        updateData.fecha_cierre = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from("vacantes")
        .update(updateData)
        .eq("id", vacante.id);

      if (error) throw error;

      // Registrar auditoría si cambió el estatus
      if (estatusAnterior !== estatusNuevo) {
        const { error: auditError } = await supabase
          .from("auditoria_vacantes")
          .insert({
            vacante_id: vacante.id,
            estatus_anterior: estatusAnterior,
            estatus_nuevo: estatusNuevo,
            user_id: user.id,
            observaciones: `Cambio de estado de ${estatusAnterior} a ${estatusNuevo}`,
          });

        if (auditError) {
          console.error("Error al registrar auditoría:", auditError);
        }
      }

      toast({
        title: "Vacante actualizada",
        description: "Los cambios se han guardado correctamente",
      });

      onSuccess();
      onOpenChange(false);
      setEditing(false);
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

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case "abierta":
        return "bg-blue-500";
      case "cerrada":
        return "bg-green-500";
      case "cancelada":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Detalle de Vacante</DialogTitle>
              <DialogDescription>
                {isLocked ? "Esta vacante está bloqueada y no puede editarse" : "Visualiza y edita la información de la vacante"}
              </DialogDescription>
            </div>
            <Badge className={getEstatusColor(vacante?.estatus)}>
              {vacante?.estatus}
            </Badge>
          </div>
        </DialogHeader>

        {isLocked && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Esta vacante ha sido {vacante?.estatus === "cerrada" ? "cerrada" : "cancelada"} y ya no puede modificarse.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="folio">Folio Único</Label>
              <Input
                id="folio"
                value={formData.folio}
                onChange={(e) => setFormData({ ...formData, folio: e.target.value })}
                disabled={isLocked}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_solicitud">Fecha de Solicitud</Label>
              <Input
                id="fecha_solicitud"
                type="date"
                value={formData.fecha_solicitud}
                onChange={(e) => setFormData({ ...formData, fecha_solicitud: e.target.value })}
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo_puesto">Título del Puesto</Label>
            <Input
              id="titulo_puesto"
              value={formData.titulo_puesto}
              onChange={(e) => setFormData({ ...formData, titulo_puesto: e.target.value })}
              disabled={isLocked}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente/Área</Label>
              <Select
                value={formData.cliente_area_id}
                onValueChange={(value) => setFormData({ ...formData, cliente_area_id: value })}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.cliente_nombre} - {cliente.area}
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
                disabled={isLocked}
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estatus">Estatus</Label>
              <Select
                value={formData.estatus}
                onValueChange={(value: any) => setFormData({ ...formData, estatus: value })}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abierta">Abierta</SelectItem>
                  <SelectItem value="cerrada">Cerrada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Select
                value={formData.motivo}
                onValueChange={(value: any) => setFormData({ ...formData, motivo: value })}
                disabled={isLocked}
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
              <Label htmlFor="lugar_trabajo">Modalidad de Trabajo</Label>
              <Select
                value={formData.lugar_trabajo}
                onValueChange={(value: any) => setFormData({ ...formData, lugar_trabajo: value })}
                disabled={isLocked}
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
                disabled={isLocked}
              />
            </div>
          </div>

          {formData.fecha_cierre && (
            <div className="space-y-2">
              <Label htmlFor="fecha_cierre">Fecha de Cierre</Label>
              <Input
                id="fecha_cierre"
                type="date"
                value={formData.fecha_cierre}
                disabled
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
              disabled={isLocked}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setEditing(false);
              }}
            >
              Cerrar
            </Button>
            {!isLocked && (
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
