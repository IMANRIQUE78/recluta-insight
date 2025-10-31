import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, ChevronsUpDown, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface VacanteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const vacanteSchema = z.object({
  titulo_puesto: z.string().min(3, "El título debe tener al menos 3 caracteres").max(100, "Máximo 100 caracteres"),
  sueldo_bruto_aprobado: z.string().optional(),
  cliente_area_id: z.string().min(1, "Selecciona un cliente/área"),
  reclutador_id: z.string().optional(),
  lugar_trabajo: z.enum(["presencial", "remoto", "hibrido"]),
  motivo: z.enum(["baja_personal", "incapacidad", "crecimiento_negocio", "nuevo_puesto"]),
  a_quien_sustituye: z.string().optional(),
  perfil_requerido: z.string().min(20, "Describe el perfil con al menos 20 caracteres").max(2000, "Máximo 2000 caracteres"),
  observaciones: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  ubicacion: z.string().min(3, "Especifica la ubicación").max(200, "Máximo 200 caracteres"),
  publicar_marketplace: z.boolean().default(false),
});

type VacanteFormData = z.infer<typeof vacanteSchema>;

export const VacanteForm = ({ open, onOpenChange, onSuccess }: VacanteFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [reclutadores, setReclutadores] = useState<any[]>([]);
  
  const [openClienteCombo, setOpenClienteCombo] = useState(false);
  const [openReclutadorCombo, setOpenReclutadorCombo] = useState(false);
  const [newClienteValue, setNewClienteValue] = useState("");
  const [newReclutadorValue, setNewReclutadorValue] = useState("");

  const form = useForm<VacanteFormData>({
    resolver: zodResolver(vacanteSchema),
    defaultValues: {
      titulo_puesto: "",
      sueldo_bruto_aprobado: "",
      cliente_area_id: "",
      reclutador_id: "",
      lugar_trabajo: "hibrido",
      motivo: "crecimiento_negocio",
      a_quien_sustituye: "",
      perfil_requerido: "",
      observaciones: "",
      ubicacion: "",
      publicar_marketplace: false,
    },
  });

  const motivo = form.watch("motivo");

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

  const handleSubmit = async (values: VacanteFormData) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const fechaSolicitud = new Date().toISOString().split('T')[0];

      // Insertar vacante
      const { data: vacanteData, error: vacanteError } = await supabase
        .from("vacantes")
        .insert([{
          titulo_puesto: values.titulo_puesto,
          sueldo_bruto_aprobado: values.sueldo_bruto_aprobado ? parseFloat(values.sueldo_bruto_aprobado) : null,
          cliente_area_id: values.cliente_area_id,
          fecha_solicitud: fechaSolicitud,
          estatus: "abierta",
          reclutador_id: values.reclutador_id || null,
          lugar_trabajo: values.lugar_trabajo,
          motivo: values.motivo,
          a_quien_sustituye: (values.motivo === "baja_personal" || values.motivo === "incapacidad") ? values.a_quien_sustituye : null,
          perfil_requerido: values.perfil_requerido,
          observaciones: values.observaciones || null,
          user_id: user.id,
          folio: "", // El trigger lo generará
        }])
        .select()
        .single();

      if (vacanteError) throw vacanteError;

      // Crear evento inicial en eventos_proceso
      await supabase.from("eventos_proceso").insert([{
        vacante_id: vacanteData.id,
        etapa: "sourcing",
        fecha_inicio: fechaSolicitud,
      }]);

      // Crear registro de auditoría
      await supabase.from("auditoria_vacantes").insert({
        vacante_id: vacanteData.id,
        user_id: user.id,
        estatus_nuevo: "abierta",
        observaciones: "Vacante creada desde formulario",
      });

      // Si se marca publicar en marketplace, crear publicación
      if (values.publicar_marketplace) {
        await supabase.from("publicaciones_marketplace").insert({
          vacante_id: vacanteData.id,
          user_id: user.id,
          titulo_puesto: values.titulo_puesto,
          sueldo_bruto_aprobado: values.sueldo_bruto_aprobado ? parseFloat(values.sueldo_bruto_aprobado) : null,
          lugar_trabajo: values.lugar_trabajo,
          perfil_requerido: values.perfil_requerido,
          observaciones: values.observaciones,
          ubicacion: values.ubicacion,
          publicada: true,
        });
      }

      toast({
        title: "✅ Vacante creada exitosamente",
        description: values.publicar_marketplace 
          ? `${vacanteData.folio} - Publicada en marketplace`
          : `${vacanteData.folio} - Registrada correctamente`,
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error al crear vacante",
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
      form.setValue("cliente_area_id", data.id);
      setNewClienteValue("");
      setOpenClienteCombo(false);
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
      form.setValue("reclutador_id", data.id);
      setNewReclutadorValue("");
      setOpenReclutadorCombo(false);
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
    if (form.getValues("cliente_area_id") === clienteId) {
      form.setValue("cliente_area_id", "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nueva Vacante</DialogTitle>
          <DialogDescription className="text-base">
            Completa la información para registrar y gestionar la vacante de manera eficiente
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
            {/* Sección: Información Básica */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Información Básica</h3>
              
              <FormField
                control={form.control}
                name="titulo_puesto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título de la Vacante *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ej. Desarrollador Full Stack Senior, Gerente de Ventas, Contador Jr."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliente_area_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Cliente/Área *</FormLabel>
                      <Popover open={openClienteCombo} onOpenChange={setOpenClienteCombo}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? clientes.find((c) => c.id === field.value)?.cliente_nombre
                                : "Seleccionar cliente..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
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
                                      form.setValue("cliente_area_id", cliente.id);
                                      setOpenClienteCombo(false);
                                    }}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center flex-1">
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === cliente.id ? "opacity-100" : "opacity-0"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reclutador_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Reclutador Asignado</FormLabel>
                      <Popover open={openReclutadorCombo} onOpenChange={setOpenReclutadorCombo}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? reclutadores.find((r) => r.id === field.value)?.nombre
                                : "Sin asignar (opcional)"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
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
                                      form.setValue("reclutador_id", reclutador.id);
                                      setOpenReclutadorCombo(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === reclutador.id ? "opacity-100" : "opacity-0"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sueldo_bruto_aprobado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sueldo Bruto Mensual</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="ej. 35000"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Opcional, en MXN</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lugar_trabajo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modalidad *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="remoto">Remoto</SelectItem>
                          <SelectItem value="hibrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ubicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ej. CDMX - Polanco, Monterrey - San Pedro, Guadalajara - Zapopan"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Ciudad, zona o colonia donde se ubicará el puesto</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección: Motivo y Contexto */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Motivo y Contexto</h3>
              
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo que origina la vacante *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="crecimiento_negocio">Crecimiento de negocio</SelectItem>
                        <SelectItem value="nuevo_puesto">Nuevo puesto</SelectItem>
                        <SelectItem value="baja_personal">Baja de personal</SelectItem>
                        <SelectItem value="incapacidad">Incapacidad</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(motivo === "baja_personal" || motivo === "incapacidad") && (
                <FormField
                  control={form.control}
                  name="a_quien_sustituye"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿A quién reemplaza?</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ej. Juan Pérez - Desarrollador Senior"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Sección: Perfil y Descripción */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Perfil Requerido</h3>
                <AlertCircle className="h-4 w-4 text-primary" />
              </div>
              
              <FormField
                control={form.control}
                name="perfil_requerido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del Perfil *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ej. Buscamos un Desarrollador Full Stack con 5+ años de experiencia en React, Node.js y PostgreSQL. Experiencia liderando equipos pequeños. Inglés avanzado. Deseable: conocimientos en AWS, Docker y CI/CD. Soft skills: comunicación efectiva, trabajo en equipo, proactividad."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Incluye: experiencia requerida, tecnologías, habilidades técnicas, idiomas, certificaciones y soft skills
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones y Notas Internas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ej. Cliente prefiere candidatos con disponibilidad inmediata. Horario 9-6pm. Prestaciones superiores. Proceso urgente."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Información adicional, urgencias, prioridades o condiciones especiales</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección: Publicación */}
            <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
              <FormField
                control={form.control}
                name="publicar_marketplace"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Publicar inmediatamente en Marketplace
                      </FormLabel>
                      <FormDescription>
                        La vacante estará visible para candidatos registrados y comenzará a recibir postulaciones
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
        </Form>
      </DialogContent>
    </Dialog>
  );
};
