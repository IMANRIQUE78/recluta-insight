import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Users, Calendar, AlertTriangle, FileText, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
  const [postulacionesCount, setPostulacionesCount] = useState(0);
  const [entrevistasCount, setEntrevistasCount] = useState(0);
  const [publicacionId, setPublicacionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("detalle");
  const [showChangeWarning, setShowChangeWarning] = useState(false);
  
  // Estado inicial para comparar cambios
  const [initialData, setInitialData] = useState<{
    folio: string;
    titulo_puesto: string;
    sueldo_bruto_aprobado: string;
    cliente_area_id: string;
    fecha_solicitud: string;
    estatus: "abierta" | "cerrada" | "cancelada";
    reclutador_id: string;
    lugar_trabajo: "hibrido" | "remoto" | "presencial";
    motivo: "baja_personal" | "incapacidad" | "crecimiento_negocio" | "nuevo_puesto";
    a_quien_sustituye: string;
    perfil_requerido: string;
    fecha_cierre: string;
    observaciones: string;
  } | null>(null);
  
  const [formData, setFormData] = useState<{
    folio: string;
    titulo_puesto: string;
    sueldo_bruto_aprobado: string;
    cliente_area_id: string;
    fecha_solicitud: string;
    estatus: "abierta" | "cerrada" | "cancelada";
    reclutador_id: string;
    lugar_trabajo: "hibrido" | "remoto" | "presencial";
    motivo: "baja_personal" | "incapacidad" | "crecimiento_negocio" | "nuevo_puesto";
    a_quien_sustituye: string;
    perfil_requerido: string;
    fecha_cierre: string;
    observaciones: string;
  }>({
    folio: "",
    titulo_puesto: "",
    sueldo_bruto_aprobado: "",
    cliente_area_id: "",
    fecha_solicitud: "",
    estatus: "abierta",
    reclutador_id: "sin-asignar",
    lugar_trabajo: "hibrido",
    motivo: "crecimiento_negocio",
    a_quien_sustituye: "",
    perfil_requerido: "",
    fecha_cierre: "",
    observaciones: "",
  });

  const isLocked = vacante?.estatus === "cerrada" || vacante?.estatus === "cancelada";

  useEffect(() => {
    if (open && vacante) {
      loadClientes();
      loadReclutadores();
      loadVacanteMetrics();
      
      // Cargar datos del formulario una sola vez cuando se abre el modal
      const clienteId = vacante.cliente_area_id || vacante.clientes_areas?.id || "";
      
      // IMPORTANTE: usar reclutador_asignado_id que es perfil_reclutador.id
      const reclutadorId = vacante.reclutador_asignado_id || "sin-asignar";
      
      console.log("Cargando vacante en modal:", {
        vacante_id: vacante.id,
        cliente_area_id: clienteId,
        reclutador_asignado_id: vacante.reclutador_asignado_id,
        reclutadorId
      });
      
      const loadedData = {
        folio: vacante.folio || "",
        titulo_puesto: vacante.titulo_puesto || "",
        sueldo_bruto_aprobado: vacante.sueldo_bruto_aprobado?.toString() || "",
        cliente_area_id: clienteId,
        fecha_solicitud: vacante.fecha_solicitud || "",
        estatus: vacante.estatus || "abierta",
        reclutador_id: reclutadorId,
        lugar_trabajo: vacante.lugar_trabajo || "hibrido",
        motivo: vacante.motivo || "crecimiento_negocio",
        a_quien_sustituye: vacante.a_quien_sustituye || "",
        perfil_requerido: vacante.perfil_requerido || "",
        fecha_cierre: vacante.fecha_cierre || "",
        observaciones: vacante.observaciones || "",
      };
      
      setFormData(loadedData);
      setInitialData(loadedData);
      setShowChangeWarning(false);
    }
  }, [open, vacante]);

  // Detectar cambios para mostrar warning
  useEffect(() => {
    if (initialData) {
      const hasChanges = 
        formData.titulo_puesto !== initialData.titulo_puesto ||
        formData.sueldo_bruto_aprobado !== initialData.sueldo_bruto_aprobado ||
        formData.cliente_area_id !== initialData.cliente_area_id ||
        formData.estatus !== initialData.estatus ||
        formData.reclutador_id !== initialData.reclutador_id ||
        formData.lugar_trabajo !== initialData.lugar_trabajo ||
        formData.motivo !== initialData.motivo ||
        formData.a_quien_sustituye !== initialData.a_quien_sustituye ||
        formData.perfil_requerido !== initialData.perfil_requerido ||
        formData.observaciones !== initialData.observaciones;
      
      setShowChangeWarning(hasChanges);
    }
  }, [formData, initialData]);

  // Obtener lista de cambios para mostrar en el warning
  const getChangesList = () => {
    if (!initialData) return [];
    const changes: string[] = [];
    
    if (formData.titulo_puesto !== initialData.titulo_puesto) {
      changes.push(`Nombre de vacante: "${initialData.titulo_puesto}" → "${formData.titulo_puesto}"`);
    }
    if (formData.sueldo_bruto_aprobado !== initialData.sueldo_bruto_aprobado) {
      changes.push(`Sueldo: $${initialData.sueldo_bruto_aprobado || '0'} → $${formData.sueldo_bruto_aprobado || '0'}`);
    }
    if (formData.cliente_area_id !== initialData.cliente_area_id) {
      const oldCliente = clientes.find(c => c.id === initialData.cliente_area_id);
      const newCliente = clientes.find(c => c.id === formData.cliente_area_id);
      changes.push(`Cliente/Área: "${oldCliente?.cliente_nombre || 'Sin asignar'}" → "${newCliente?.cliente_nombre || 'Sin asignar'}"`);
    }
    if (formData.estatus !== initialData.estatus) {
      changes.push(`Estatus: ${initialData.estatus} → ${formData.estatus}`);
    }
    if (formData.reclutador_id !== initialData.reclutador_id) {
      const oldRec = reclutadores.find(r => r.id === initialData.reclutador_id);
      const newRec = reclutadores.find(r => r.id === formData.reclutador_id);
      changes.push(`Reclutador: "${oldRec?.nombre || 'Sin asignar'}" → "${newRec?.nombre || 'Sin asignar'}"`);
    }
    if (formData.lugar_trabajo !== initialData.lugar_trabajo) {
      changes.push(`Lugar de trabajo: ${initialData.lugar_trabajo} → ${formData.lugar_trabajo}`);
    }
    if (formData.motivo !== initialData.motivo) {
      changes.push(`Motivo: ${initialData.motivo} → ${formData.motivo}`);
    }
    if (formData.a_quien_sustituye !== initialData.a_quien_sustituye) {
      changes.push(`A quien sustituye: "${initialData.a_quien_sustituye}" → "${formData.a_quien_sustituye}"`);
    }
    if (formData.perfil_requerido !== initialData.perfil_requerido) {
      changes.push("Perfil requerido modificado");
    }
    if (formData.observaciones !== initialData.observaciones) {
      changes.push("Observaciones modificadas");
    }
    
    return changes;
  };

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

      // Crear lista de áreas únicas
      const areasUnicas = [...new Set(
        (personalAreas || [])
          .map(p => p.area)
          .filter(Boolean) as string[]
      )].sort();

      // Obtener clientes/áreas existentes
      const { data: clientesExistentes, error: clientesError } = await supabase
        .from("clientes_areas")
        .select("*")
        .eq("user_id", user.id)
        .order("cliente_nombre");

      if (clientesError) throw clientesError;

      // Crear set de nombres existentes
      const nombresExistentes = new Set(
        (clientesExistentes || []).map(c => c.cliente_nombre.toLowerCase())
      );

      // Sincronizar áreas del personal
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

      // Recargar lista sin duplicados
      const { data: clientesFinales } = await supabase
        .from("clientes_areas")
        .select("*")
        .eq("user_id", user.id)
        .order("cliente_nombre");

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
      if (!user) {
        console.log("No hay usuario autenticado");
        setReclutadores([]);
        return;
      }

      // Obtener empresa del usuario desde user_roles
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (roleError) {
        console.error("Error obteniendo rol de usuario:", roleError);
        setReclutadores([]);
        return;
      }

      if (!userRole?.empresa_id) {
        console.log("No se encontró empresa para el usuario");
        setReclutadores([]);
        return;
      }

      console.log("Buscando reclutadores para empresa:", userRole.empresa_id);

      // Obtener asociaciones activas
      const { data: asociaciones, error: asocError } = await supabase
        .from("reclutador_empresa")
        .select("reclutador_id")
        .eq("empresa_id", userRole.empresa_id)
        .eq("estado", "activa");

      console.log("Asociaciones encontradas:", { asociaciones, asocError });

      if (asocError) {
        console.error("Error en query de asociaciones:", asocError);
        setReclutadores([]);
        return;
      }

      if (!asociaciones || asociaciones.length === 0) {
        console.log("No hay reclutadores asociados activos");
        setReclutadores([]);
        return;
      }

      // Obtener perfiles de reclutadores
      const reclutadorIds = asociaciones.map(a => a.reclutador_id);
      const { data: perfiles, error: perfilesError } = await supabase
        .from("perfil_reclutador")
        .select("id, nombre_reclutador, email")
        .in("id", reclutadorIds);

      console.log("Perfiles encontrados:", { perfiles, perfilesError });

      if (perfilesError) {
        console.error("Error obteniendo perfiles:", perfilesError);
        setReclutadores([]);
        return;
      }

      // Formatear datos para el selector - usar perfil_reclutador.id
      const formattedReclutadores = perfiles?.map(perfil => ({
        id: perfil.id, // ID del perfil de reclutador para vacantes.reclutador_asignado_id
        nombre: perfil.nombre_reclutador,
        email: perfil.email,
      })) || [];

      console.log("Reclutadores formateados para dropdown:", formattedReclutadores);
      setReclutadores(formattedReclutadores);
    } catch (error) {
      console.error("Error cargando reclutadores:", error);
      setReclutadores([]);
    }
  };

  // Estado para conteos por etapa del pipeline
  const [pipelineStats, setPipelineStats] = useState<Record<string, number>>({});

  const loadVacanteMetrics = async () => {
    if (!vacante?.id) return;

    try {
      // Obtener publicación de esta vacante
      const { data: publicacion } = await supabase
        .from("publicaciones_marketplace")
        .select("id")
        .eq("vacante_id", vacante.id)
        .maybeSingle();

      if (publicacion) {
        setPublicacionId(publicacion.id);
        
        // Contar postulaciones totales
        const { count: postCount } = await supabase
          .from("postulaciones")
          .select("*", { count: 'exact', head: true })
          .eq("publicacion_id", publicacion.id);

        setPostulacionesCount(postCount || 0);

        // Obtener conteos por etapa para el pipeline
        const etapas = ['recibida', 'en_revision', 'entrevista', 'evaluacion', 'oferta', 'contratado', 'rechazado'];
        const statsPromises = etapas.map(async (etapa) => {
          const { count } = await supabase
            .from("postulaciones")
            .select("*", { count: 'exact', head: true })
            .eq("publicacion_id", publicacion.id)
            .eq("etapa", etapa);
          return { etapa, count: count || 0 };
        });

        const results = await Promise.all(statsPromises);
        const stats: Record<string, number> = {};
        results.forEach(r => { stats[r.etapa] = r.count; });
        setPipelineStats(stats);

        // Contar entrevistas a través de postulaciones
        const { data: postulaciones } = await supabase
          .from("postulaciones")
          .select("id")
          .eq("publicacion_id", publicacion.id);

        if (postulaciones && postulaciones.length > 0) {
          const postulacionIds = postulaciones.map(p => p.id);
          const { count: entCount } = await supabase
            .from("entrevistas_candidato")
            .select("*", { count: 'exact', head: true })
            .in("postulacion_id", postulacionIds)
            .neq("estado", "rechazada");

          setEntrevistasCount(entCount || 0);
        } else {
          setEntrevistasCount(0);
        }
      } else {
        setPublicacionId(null);
        setPostulacionesCount(0);
        setEntrevistasCount(0);
        setPipelineStats({});
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
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

      // Validar todos los campos UUID para evitar cadenas vacías
      const reclutadorId = (formData.reclutador_id === "sin-asignar" || formData.reclutador_id === "" || !formData.reclutador_id) 
        ? null 
        : formData.reclutador_id;
      
      const clienteAreaId = (formData.cliente_area_id === "" || !formData.cliente_area_id)
        ? null
        : formData.cliente_area_id;

      if (!clienteAreaId) {
        throw new Error("Debe seleccionar un cliente/área válido");
      }

      // Preparar solo los campos que se pueden actualizar en la tabla vacantes
      const updateData: any = {
        titulo_puesto: formData.titulo_puesto,
        sueldo_bruto_aprobado: formData.sueldo_bruto_aprobado ? parseFloat(formData.sueldo_bruto_aprobado) : null,
        cliente_area_id: clienteAreaId,
        estatus: formData.estatus,
        reclutador_id: reclutadorId,
        reclutador_asignado_id: reclutadorId,
        lugar_trabajo: formData.lugar_trabajo,
        motivo: formData.motivo,
        a_quien_sustituye: (formData.motivo === "baja_personal" || formData.motivo === "incapacidad") ? formData.a_quien_sustituye : null,
        perfil_requerido: formData.perfil_requerido,
        observaciones: formData.observaciones || null,
      };

      // Si está cambiando a cerrada o cancelada, establecer fecha_cierre y limpiar solicitud
      if ((formData.estatus === "cerrada" || formData.estatus === "cancelada") && !formData.fecha_cierre) {
        updateData.fecha_cierre = new Date().toISOString().split('T')[0];
        // Limpiar la solicitud de cierre ya que fue procesada
        updateData.solicitud_cierre = false;
        updateData.motivo_solicitud_cierre = null;
        updateData.fecha_solicitud_cierre = null;
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

        // Si se cierra o cancela la vacante, despublicar del marketplace
        if (estatusNuevo === "cerrada" || estatusNuevo === "cancelada") {
          await supabase
            .from("publicaciones_marketplace")
            .update({ publicada: false })
            .eq("vacante_id", vacante.id);
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
              Esta vacante ha sido {vacante?.estatus === "cerrada" ? "cerrada" : "cancelada"} y ya no puede modificarse ni está visible en el marketplace.
            </p>
          </div>
        )}

        {/* Alerta de solicitud de cierre del reclutador */}
        {vacante?.solicitud_cierre && !isLocked && (
          <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              Solicitud de Cierre Pendiente
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              El reclutador asignado ha solicitado cerrar esta vacante.
              <br />
              <span className="font-medium">Motivo:</span> {vacante?.motivo_solicitud_cierre || "No especificado"}
              <br />
              <span className="font-medium">Fecha:</span> {vacante?.fecha_solicitud_cierre ? new Date(vacante.fecha_solicitud_cierre).toLocaleDateString() : "Reciente"}
              <br />
              <span className="text-xs mt-2 block">Para cerrar la vacante, cambia el estatus a "Cerrada" en el formulario de abajo.</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs para pipeline de información */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detalle" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalle Requisición
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pipeline ({postulacionesCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detalle" className="mt-4">
            {/* Métricas de la vacante */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Postulaciones Recibidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{postulacionesCount}</p>
                  <CardDescription className="text-xs mt-1">
                    Total de candidatos interesados
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Entrevistas Realizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{entrevistasCount}</p>
                  <CardDescription className="text-xs mt-1">
                    {vacante?.estatus === "abierta" ? "En proceso de selección" : "Total de entrevistas"}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
          {/* ID Único - Solo lectura */}
          <div className="space-y-2">
            <Label htmlFor="folio">ID Único de Vacante</Label>
            <Input
              id="folio"
              value={formData.folio}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Nombre de la Vacante */}
          <div className="space-y-2">
            <Label htmlFor="titulo_puesto">Nombre de la Vacante*</Label>
            <Input
              id="titulo_puesto"
              value={formData.titulo_puesto}
              onChange={(e) => setFormData({ ...formData, titulo_puesto: e.target.value })}
              disabled={isLocked}
            />
          </div>

          {/* Sueldo */}
          <div className="space-y-2">
            <Label htmlFor="sueldo">Sueldo</Label>
            <Input
              id="sueldo"
              type="number"
              value={formData.sueldo_bruto_aprobado}
              onChange={(e) => setFormData({ ...formData, sueldo_bruto_aprobado: e.target.value })}
              disabled={isLocked}
              placeholder="0.00"
            />
          </div>

          {/* Cliente / Área */}
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente / Área*</Label>
            <Select
              key={`cliente-${formData.cliente_area_id}`}
              value={formData.cliente_area_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, cliente_area_id: value })}
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.cliente_nombre} - {cliente.area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha de Registro - Solo lectura con timestamp */}
          <div className="space-y-2">
            <Label htmlFor="fecha_solicitud">Fecha de Registro</Label>
            <Input
              id="fecha_solicitud"
              type="text"
              value={formData.fecha_solicitud ? new Date(formData.fecha_solicitud).toLocaleString('es-MX', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }) : ""}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Estatus */}
            <div className="space-y-2">
              <Label htmlFor="estatus">Estatus*</Label>
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

            {/* Reclutador */}
            <div className="space-y-2">
              <Label htmlFor="reclutador">Reclutador</Label>
              <Select
                key={`reclutador-${formData.reclutador_id}`}
                value={formData.reclutador_id}
                onValueChange={(value) => setFormData({ ...formData, reclutador_id: value })}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  <SelectItem value="sin-asignar">Sin asignar</SelectItem>
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
            {/* Lugar de trabajo */}
            <div className="space-y-2">
              <Label htmlFor="lugar_trabajo">Lugar de Trabajo*</Label>
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

            {/* Motivo que origina la vacante */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo que origina la vacante*</Label>
              <Select
                value={formData.motivo}
                onValueChange={(value: any) => setFormData({ ...formData, motivo: value })}
                disabled={isLocked}
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

          {/* Campo condicional: A quien reemplaza */}
          {(formData.motivo === "baja_personal" || formData.motivo === "incapacidad") && (
            <div className="space-y-2">
              <Label htmlFor="a_quien_sustituye">¿A quién reemplaza?</Label>
              <Input
                id="a_quien_sustituye"
                value={formData.a_quien_sustituye}
                onChange={(e) => setFormData({ ...formData, a_quien_sustituye: e.target.value })}
                disabled={isLocked}
                placeholder="Nombre de la persona a reemplazar"
              />
            </div>
          )}

          {/* Perfil requerido */}
          <div className="space-y-2">
            <Label htmlFor="perfil_requerido">Perfil Requerido</Label>
            <Textarea
              id="perfil_requerido"
              value={formData.perfil_requerido}
              onChange={(e) => setFormData({ ...formData, perfil_requerido: e.target.value })}
              rows={3}
              disabled={isLocked}
              placeholder="Resumen del perfil requerido para la vacante..."
            />
          </div>

          {/* Timestamp condicional de cierre */}
          <div className="space-y-2">
            <Label htmlFor="fecha_cierre">Fecha de Cierre</Label>
            <Input
              id="fecha_cierre"
              type="text"
              value={
                formData.estatus === "abierta" 
                  ? "En proceso" 
                  : formData.fecha_cierre || "Sin fecha"
              }
              disabled
              className="bg-muted"
            />
          </div>

          {/* Observaciones */}
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

              {/* Warning de cambios pendientes */}
              {showChangeWarning && !isLocked && (
                <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 dark:text-amber-200">
                    Cambios pendientes por guardar
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      {getChangesList().map((change, index) => (
                        <li key={index}>{change}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end items-center gap-3 pt-4 border-t">
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
          </TabsContent>

          <TabsContent value="pipeline" className="mt-4">
            {publicacionId ? (
              <div className="space-y-4">
                {/* Pipeline visual con conteos por etapa */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{pipelineStats['recibida'] || 0}</p>
                      <p className="text-sm text-muted-foreground">Recibidas</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{pipelineStats['en_revision'] || 0}</p>
                      <p className="text-sm text-muted-foreground">En Revisión</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{pipelineStats['entrevista'] || 0}</p>
                      <p className="text-sm text-muted-foreground">En Entrevista</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{pipelineStats['evaluacion'] || 0}</p>
                      <p className="text-sm text-muted-foreground">En Evaluación</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Segunda fila de estados finales */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-l-4 border-l-cyan-500">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{pipelineStats['oferta'] || 0}</p>
                      <p className="text-sm text-muted-foreground">Con Oferta</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{pipelineStats['contratado'] || 0}</p>
                      <p className="text-sm text-muted-foreground">Contratados</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{pipelineStats['rechazado'] || 0}</p>
                      <p className="text-sm text-muted-foreground">No Viables</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Resumen */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Postulaciones</p>
                        <p className="text-2xl font-bold">{postulacionesCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Entrevistas Programadas</p>
                        <p className="text-2xl font-bold">{entrevistasCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground text-center">
                  La gestión individual de candidatos es responsabilidad del reclutador asignado
                </p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Vacante no publicada</p>
                <p className="text-sm mt-1">Esta vacante aún no ha sido publicada en el marketplace.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
