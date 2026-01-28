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
import { useToast } from "@/hooks/use-toast";
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener empresa_id del usuario
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (!userRoles?.empresa_id) {
        setClientes([]);
        return;
      }

      // Obtener áreas únicas desde personal_empresa
      const { data: personalAreas, error: personalError } = await supabase
        .from("personal_empresa")
        .select("area")
        .eq("empresa_id", userRoles.empresa_id)
        .not("area", "is", null);

      if (personalError) throw personalError;

      // Crear lista de áreas únicas y ordenadas
      const areasUnicas = [...new Set(
        (personalAreas || [])
          .map(p => p.area)
          .filter(Boolean) as string[]
      )].sort();

      // Obtener clientes/áreas existentes de la empresa
      const { data: clientesExistentes, error: clientesError } = await supabase
        .from("clientes_areas")
        .select("*")
        .eq("user_id", user.id)
        .order("cliente_nombre");

      if (clientesError) throw clientesError;

      // Crear set de nombres existentes para evitar duplicados
      const nombresExistentes = new Set(
        (clientesExistentes || []).map(c => c.cliente_nombre.toLowerCase())
      );

      // Sincronizar áreas del personal con clientes_areas (solo las que no existen)
      for (const area of areasUnicas) {
        if (!nombresExistentes.has(area.toLowerCase())) {
          await supabase.from("clientes_areas").insert({
            cliente_nombre: area,
            area: area,
            tipo_cliente: "interno",
            user_id: user.id,
          });
        }
      }

      // Recargar la lista actualizada, eliminando duplicados por nombre
      const { data: clientesFinales } = await supabase
        .from("clientes_areas")
        .select("*")
        .eq("user_id", user.id)
        .order("cliente_nombre");

      // Filtrar duplicados manteniendo solo el primero de cada nombre
      const clientesSinDuplicados = (clientesFinales || []).reduce((acc: any[], curr) => {
        const existe = acc.find(c => c.cliente_nombre.toLowerCase() === curr.cliente_nombre.toLowerCase());
        if (!existe) {
          acc.push(curr);
        }
        return acc;
      }, []);

      setClientes(clientesSinDuplicados);
    } catch (error) {
      console.error("Error cargando clientes/áreas:", error);
      setClientes([]);
    }
  };

  const loadReclutadores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener empresa del usuario
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (!userRoles?.empresa_id) {
        setReclutadores([]);
        return;
      }

      // Obtener reclutadores asociados a la empresa
      const { data: asociaciones, error } = await supabase
        .from("reclutador_empresa")
        .select(`
          id,
          reclutador_id,
          perfil_reclutador (
            id,
            nombre_reclutador,
            email,
            user_id
          )
        `)
        .eq("empresa_id", userRoles.empresa_id)
        .eq("estado", "activa");

      if (error) throw error;

      // Formatear datos para el selector
      const formattedReclutadores = asociaciones?.map(asoc => ({
        id: (asoc.perfil_reclutador as any)?.id || "",
        nombre: (asoc.perfil_reclutador as any)?.nombre_reclutador || "Sin nombre",
        email: (asoc.perfil_reclutador as any)?.email || "",
        user_id: (asoc.perfil_reclutador as any)?.user_id || "",
      })).filter(rec => rec.id) || [];

      setReclutadores(formattedReclutadores);
    } catch (error) {
      console.error("Error cargando reclutadores:", error);
      setReclutadores([]);
    }
  };

  const handleSubmit = async (values: VacanteFormData) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Obtener empresa_id del usuario - ES OBLIGATORIO
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      // Validar que el usuario tenga una empresa asociada
      if (!userRoles?.empresa_id) {
        throw new Error("No tienes una empresa asociada. Debes completar el registro de empresa antes de crear vacantes.");
      }

      const fechaSolicitud = new Date().toISOString().split('T')[0];

      // Insertar vacante - empresa_id es OBLIGATORIO
      const { data: vacanteData, error: vacanteError } = await supabase
        .from("vacantes")
        .insert([{
          titulo_puesto: values.titulo_puesto,
          sueldo_bruto_aprobado: values.sueldo_bruto_aprobado ? parseFloat(values.sueldo_bruto_aprobado) : null,
          cliente_area_id: values.cliente_area_id,
          fecha_solicitud: fechaSolicitud,
          estatus: "abierta",
          reclutador_id: values.reclutador_id || null,
          reclutador_asignado_id: values.reclutador_id || null,
          lugar_trabajo: values.lugar_trabajo,
          motivo: values.motivo,
          a_quien_sustituye: (values.motivo === "baja_personal" || values.motivo === "incapacidad") ? values.a_quien_sustituye : null,
          perfil_requerido: values.perfil_requerido,
          observaciones: values.observaciones || null,
          user_id: user.id,
          empresa_id: userRoles.empresa_id, // Siempre obligatorio
          folio: "", // El trigger lo generará
        }])
        .select()
        .single();

      if (vacanteError) throw vacanteError;

      // Ya no creamos eventos_proceso (tabla eliminada)

      // Crear registro de auditoría
      await supabase.from("auditoria_vacantes").insert({
        vacante_id: vacanteData.id,
        user_id: user.id,
        estatus_nuevo: "abierta",
        observaciones: "Vacante creada desde formulario",
      });

      toast({
        title: "✅ Vacante creada exitosamente",
        description: `${vacanteData.folio} - Para publicar en marketplace, abre la vacante y usa el botón "Publicar en Marketplace"`,
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

      // Verificar si ya existe (evitar duplicados)
      const existente = clientes.find(
        c => c.cliente_nombre.toLowerCase() === newClienteValue.trim().toLowerCase()
      );
      
      if (existente) {
        form.setValue("cliente_area_id", existente.id);
        setNewClienteValue("");
        setOpenClienteCombo(false);
        return;
      }

      const { data, error } = await supabase
        .from("clientes_areas")
        .insert({
          cliente_nombre: newClienteValue.trim(),
          area: newClienteValue.trim(), // Usar el mismo valor para área
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
      
      toast({
        title: "Área creada",
        description: `"${newClienteValue.trim()}" agregada correctamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddReclutador = async () => {
    // Ya no se pueden agregar reclutadores desde aquí
    // Solo se pueden asignar los que ya están asociados a la empresa
    toast({
      title: "Información",
      description: "Solo puedes asignar reclutadores que ya están asociados a tu empresa. Usa 'Invitar Reclutador' para agregar nuevos.",
      variant: "default",
    });
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
                        <PopoverContent className="w-full p-0 z-[100] bg-popover">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar reclutador..." 
                            />
                            <CommandList>
                              <CommandEmpty>
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  No hay reclutadores asociados. 
                                  <br />
                                  Usa 'Invitar Reclutador' para agregar uno.
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="sin-asignar"
                                  onSelect={() => {
                                    form.setValue("reclutador_id", "");
                                    setOpenReclutadorCombo(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Sin asignar
                                </CommandItem>
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
                                    <div>
                                      <div className="font-medium">{reclutador.nombre}</div>
                                      <div className="text-xs text-muted-foreground">{reclutador.email}</div>
                                    </div>
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
                    <FormLabel>La empresa ofrece</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ej. Prestaciones superiores a la ley, vales de despensa, seguro de gastos médicos mayores, bonos por desempeño, horario flexible, home office, capacitación constante."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Beneficios, prestaciones y ventajas que ofrece la empresa para esta posición</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nota informativa sobre publicación */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Publicación en Marketplace</p>
                <p className="text-sm text-muted-foreground">
                  Una vez creada la requisición, un usuario con perfil de <span className="font-medium">Reclutador</span> asignado deberá analizarla, depurar la información y publicarla en el Marketplace VVGI cuando esté lista.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-amber-600 dark:text-amber-400">Nota:</span> Las vacantes marcadas como confidenciales deducen el doble de créditos para garantizar la protección y confidencialidad del proceso de reclutamiento.
                </p>
              </div>
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
