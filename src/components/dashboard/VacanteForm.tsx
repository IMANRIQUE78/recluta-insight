import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
    titulo_puesto: "",
    sueldo_bruto_aprobado: "",
    cliente_area_id: "",
    fecha_solicitud: new Date().toISOString().split('T')[0],
    estatus: "abierta" as const,
    reclutador_id: "",
    lugar_trabajo: "hibrido" as const,
    motivo: "crecimiento_negocio" as "baja_personal" | "incapacidad" | "crecimiento_negocio" | "nuevo_puesto",
    a_quien_sustituye: "",
    perfil_requerido: "",
    observaciones: "",
  });

  const [openClienteCombo, setOpenClienteCombo] = useState(false);
  const [openReclutadorCombo, setOpenReclutadorCombo] = useState(false);
  const [newClienteValue, setNewClienteValue] = useState("");
  const [newReclutadorValue, setNewReclutadorValue] = useState("");

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

      const { error } = await supabase.from("vacantes").insert([{
        titulo_puesto: formData.titulo_puesto,
        sueldo_bruto_aprobado: formData.sueldo_bruto_aprobado ? parseFloat(formData.sueldo_bruto_aprobado) : null,
        cliente_area_id: formData.cliente_area_id,
        fecha_solicitud: formData.fecha_solicitud,
        estatus: formData.estatus,
        reclutador_id: formData.reclutador_id || null,
        lugar_trabajo: formData.lugar_trabajo,
        motivo: formData.motivo,
        a_quien_sustituye: (formData.motivo === "baja_personal" || formData.motivo === "incapacidad") ? formData.a_quien_sustituye : null,
        perfil_requerido: formData.perfil_requerido || null,
        observaciones: formData.observaciones || null,
        user_id: user.id,
        folio: "", // El trigger lo generará automáticamente
      }]);

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

  const handleAddCliente = async () => {
    if (!newClienteValue.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clientes_areas")
        .insert({
          cliente_nombre: newClienteValue,
          area: "General",
          tipo_cliente: "interno",
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadClientes();
      setFormData({ ...formData, cliente_area_id: data.id });
      setNewClienteValue("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddReclutador = async () => {
    if (!newReclutadorValue.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("reclutadores")
        .insert({
          nombre: newReclutadorValue,
          correo: `${newReclutadorValue.toLowerCase().replace(/\s/g, '.')}@example.com`,
          senioridad: "junior",
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadReclutadores();
      setFormData({ ...formData, reclutador_id: data.id });
      setNewReclutadorValue("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCliente = (clienteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientes(clientes.filter(c => c.id !== clienteId));
    if (formData.cliente_area_id === clienteId) {
      setFormData({ ...formData, cliente_area_id: "" });
    }
  };

  const resetForm = () => {
    setFormData({
      titulo_puesto: "",
      sueldo_bruto_aprobado: "",
      cliente_area_id: "",
      fecha_solicitud: new Date().toISOString().split('T')[0],
      estatus: "abierta",
      reclutador_id: "",
      lugar_trabajo: "hibrido",
      motivo: "crecimiento_negocio",
      a_quien_sustituye: "",
      perfil_requerido: "",
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
          <div className="space-y-2">
            <Label htmlFor="titulo_puesto">Nombre de la Vacante*</Label>
            <Input
              id="titulo_puesto"
              value={formData.titulo_puesto}
              onChange={(e) => setFormData({ ...formData, titulo_puesto: e.target.value })}
              placeholder="Desarrollador Senior Full Stack"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sueldo">Sueldo</Label>
            <Input
              id="sueldo"
              type="number"
              value={formData.sueldo_bruto_aprobado}
              onChange={(e) => setFormData({ ...formData, sueldo_bruto_aprobado: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente/Área*</Label>
              <Popover open={openClienteCombo} onOpenChange={setOpenClienteCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openClienteCombo}
                    className="w-full justify-between"
                  >
                    {formData.cliente_area_id
                      ? clientes.find((c) => c.id === formData.cliente_area_id)?.cliente_nombre
                      : "Seleccionar cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar o crear cliente..." 
                      value={newClienteValue}
                      onValueChange={setNewClienteValue}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={handleAddCliente}
                        >
                          Crear "{newClienteValue}"
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {clientes.map((cliente) => (
                          <CommandItem
                            key={cliente.id}
                            value={cliente.cliente_nombre}
                            onSelect={() => {
                              setFormData({ ...formData, cliente_area_id: cliente.id });
                              setOpenClienteCombo(false);
                            }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center flex-1">
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.cliente_area_id === cliente.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {cliente.cliente_nombre} - {cliente.area}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={(e) => handleDeleteCliente(cliente.id, e)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Reclutador Asignado</Label>
              <Popover open={openReclutadorCombo} onOpenChange={setOpenReclutadorCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openReclutadorCombo}
                    className="w-full justify-between"
                  >
                    {formData.reclutador_id
                      ? reclutadores.find((r) => r.id === formData.reclutador_id)?.nombre
                      : "Sin asignar..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar o crear reclutador..." 
                      value={newReclutadorValue}
                      onValueChange={setNewReclutadorValue}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={handleAddReclutador}
                        >
                          Crear "{newReclutadorValue}"
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {reclutadores.map((reclutador) => (
                          <CommandItem
                            key={reclutador.id}
                            value={reclutador.nombre}
                            onSelect={() => {
                              setFormData({ ...formData, reclutador_id: reclutador.id });
                              setOpenReclutadorCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.reclutador_id === reclutador.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {reclutador.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_solicitud">Fecha de Registro*</Label>
            <Input
              id="fecha_solicitud"
              type="date"
              value={formData.fecha_solicitud}
              onChange={(e) => setFormData({ ...formData, fecha_solicitud: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lugar_trabajo">Lugar de Trabajo*</Label>
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
              <Label htmlFor="motivo">Motivo que origina la vacante*</Label>
              <Select
                value={formData.motivo}
                onValueChange={(value: any) => setFormData({ ...formData, motivo: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja_personal">Baja de personal</SelectItem>
                  <SelectItem value="incapacidad">Incapacidad</SelectItem>
                  <SelectItem value="crecimiento_negocio">Crecimiento de negocio</SelectItem>
                  <SelectItem value="nuevo_puesto">Nuevo puesto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(formData.motivo === "baja_personal" || formData.motivo === "incapacidad") && (
            <div className="space-y-2">
              <Label htmlFor="a_quien_sustituye">¿A quién reemplaza?</Label>
              <Input
                id="a_quien_sustituye"
                value={formData.a_quien_sustituye}
                onChange={(e) => setFormData({ ...formData, a_quien_sustituye: e.target.value })}
                placeholder="Nombre de la persona a reemplazar"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="perfil_requerido">Perfil Requerido</Label>
            <Textarea
              id="perfil_requerido"
              value={formData.perfil_requerido}
              onChange={(e) => setFormData({ ...formData, perfil_requerido: e.target.value })}
              placeholder="Resumen del perfil requerido para la vacante..."
              rows={3}
            />
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
