import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Users, Calendar, Share2, Copy, Check, AlertTriangle, CheckCircle2, Coins, Sparkles, FileSearch } from "lucide-react";
import { PostulacionesVacanteTab } from "./PostulacionesVacanteTab";
import { SourcingIATab } from "./SourcingIATab";
import { SolicitarEstudioDialog } from "./SolicitarEstudioDialog";
import { consumirCreditosPublicacion, verificarCreditosDisponibles, COSTO_PUBLICACION } from "@/hooks/useCreditoPublicacion";

interface GestionVacanteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacante: any;
  onSuccess: () => void;
}

export const GestionVacanteDialog = ({ open, onOpenChange, vacante, onSuccess }: GestionVacanteDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publicacionData, setPublicacionData] = useState<any>(null);
  const [postulacionesCount, setPostulacionesCount] = useState(0);
  const [reclutadorId, setReclutadorId] = useState<string | null>(null);
  const [creditosInfo, setCreditosInfo] = useState<{
    suficientes: boolean;
    creditosEmpresa: number;
    creditosHeredados: number;
    nombreEmpresa: string | null;
    origenDisponible: "heredado" | "empresa" | null;
  } | null>(null);
  
  // Datos para publicación
  const [titulo, setTitulo] = useState("");
  const [perfilRequerido, setPerfilRequerido] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [sueldoBruto, setSueldoBruto] = useState("");
  const [lugarTrabajo, setLugarTrabajo] = useState<"remoto" | "hibrido" | "presencial">("presencial");
  const [mostrarEmpresa, setMostrarEmpresa] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Solicitud de cierre
  const [showCierreForm, setShowCierreForm] = useState(false);
  const [solicitarEstudioOpen, setSolicitarEstudioOpen] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState("");

  useEffect(() => {
    if (open && vacante) {
      loadPublicacionData();
      loadReclutadorAndCreditos();
      // Inicializar con datos de la vacante
      setTitulo(vacante.titulo_puesto || "");
      setPerfilRequerido(vacante.perfil_requerido || "");
      setObservaciones(vacante.observaciones || "");
      setUbicacion(vacante.clientes_areas?.ubicacion || "");
      setSueldoBruto(vacante.sueldo_bruto_aprobado?.toString() || "");
      setLugarTrabajo(vacante.lugar_trabajo || "presencial");
    }
  }, [open, vacante]);

  const loadReclutadorAndCreditos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: perfil } = await supabase
      .from("perfil_reclutador")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (perfil) {
      setReclutadorId(perfil.id);
      const creditos = await verificarCreditosDisponibles(perfil.id, vacante.empresa_id);
      setCreditosInfo(creditos);
    }
  };

  const loadPublicacionData = async () => {
    try {
      console.log("🔍 [GestionVacante] Cargando publicación para vacante:", vacante.id);
      
      const { data } = await supabase
        .from("publicaciones_marketplace")
        .select("*")
        .eq("vacante_id", vacante.id)
        .maybeSingle();
      
      console.log("📋 [GestionVacante] Publicación encontrada:", data);
      setPublicacionData(data);
      
      if (data) {
        setTitulo(data.titulo_puesto);
        setPerfilRequerido(data.perfil_requerido || "");
        setObservaciones(data.observaciones || "");
        setUbicacion(data.ubicacion || "");
        setSueldoBruto(data.sueldo_bruto_aprobado?.toString() || "");
        setLugarTrabajo(data.lugar_trabajo);
        
        // Cargar conteo de postulaciones
        console.log("🔍 [GestionVacante] Buscando postulaciones para publicación:", data.id);
        const { count, error: countError } = await supabase
          .from("postulaciones")
          .select("*", { count: "exact", head: true })
          .eq("publicacion_id", data.id);
        
        if (countError) {
          console.error("❌ [GestionVacante] Error contando postulaciones:", countError);
        } else {
          console.log("✅ [GestionVacante] Total de postulaciones:", count);
          setPostulacionesCount(count || 0);
        }
      } else {
        console.log("⚠️ [GestionVacante] No se encontró publicación para esta vacante");
        setPostulacionesCount(0);
      }
    } catch (error) {
      console.error("❌ [GestionVacante] Error cargando publicación:", error);
    }
  };
  
  const handlePostulacionUpdated = () => {
    console.log("🔄 [GestionVacante] Recargando datos de publicación...");
    loadPublicacionData();
  };

  const handlePublicar = async () => {
    if (!titulo.trim()) {
      toast({
        title: "Error",
        description: "El título del puesto es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");
      if (!reclutadorId) throw new Error("No se encontró el perfil de reclutador");

      const publicacionPayload = {
        vacante_id: vacante.id,
        user_id: user.id,
        titulo_puesto: titulo,
        cliente_area: mostrarEmpresa ? vacante.clientes_areas?.cliente_nombre : null,
        perfil_requerido: perfilRequerido,
        observaciones: observaciones,
        ubicacion: ubicacion,
        sueldo_bruto_aprobado: sueldoBruto ? parseFloat(sueldoBruto) : null,
        lugar_trabajo: lugarTrabajo,
        publicada: true,
      };

      if (publicacionData) {
        // Actualizar publicación existente (sin costo)
        const { error } = await supabase
          .from("publicaciones_marketplace")
          .update(publicacionPayload)
          .eq("id", publicacionData.id);

        if (error) throw error;

        toast({
          title: "✅ Publicación actualizada",
          description: "La vacante ha sido actualizada en el marketplace",
        });
      } else {
        // Nueva publicación - consumir créditos
        const resultado = await consumirCreditosPublicacion(
          user.id,
          reclutadorId,
          vacante.id,
          vacante.empresa_id
        );

        if (!resultado.success) {
          throw new Error(resultado.error || "Error al consumir créditos");
        }

        // Crear nueva publicación
        const { error } = await supabase
          .from("publicaciones_marketplace")
          .insert([publicacionPayload]);

        if (error) throw error;

        toast({
          title: "✅ Vacante publicada",
          description: `Se descontaron ${COSTO_PUBLICACION} créditos (${resultado.origen_pago === "heredado_empresa" ? "empresa" : "propios"})`,
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicacionData?.id) return;
    
    const shareableLink = `${window.location.origin}/marketplace?vacante=${publicacionData.id}`;
    
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopiedLink(true);
      toast({
        title: "¡Enlace copiado!",
        description: "Ahora puedes compartirlo en redes sociales",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  const handleSolicitarCierre = async () => {
    if (!motivoCierre.trim()) {
      toast({
        title: "Error",
        description: "Debes indicar el motivo de la solicitud de cierre",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("vacantes")
        .update({
          solicitud_cierre: true,
          motivo_solicitud_cierre: motivoCierre,
          fecha_solicitud_cierre: new Date().toISOString(),
        })
        .eq("id", vacante.id);

      if (error) throw error;

      toast({
        title: "✅ Solicitud enviada",
        description: "La empresa ha sido notificada de tu solicitud de cierre. Solo ellos pueden cambiar el estatus de la requisición.",
      });

      setShowCierreForm(false);
      setMotivoCierre("");
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestión de Vacante
          </DialogTitle>
          <DialogDescription>
            Completa los detalles y gestiona la publicación en el marketplace
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="detalles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="detalles">
              <Upload className="mr-2 h-4 w-4" />
              Publicación
            </TabsTrigger>
            <TabsTrigger value="postulaciones" disabled={!publicacionData}>
              <Users className="mr-2 h-4 w-4" />
              Postulaciones ({postulacionesCount})
            </TabsTrigger>
            <TabsTrigger value="sourcing" disabled={!publicacionData}>
              <Sparkles className="mr-2 h-4 w-4" />
              Sourcing IA
            </TabsTrigger>
          </TabsList>
          
          {/* Enlace compartible */}
          {publicacionData && (
            <div className="mt-4 p-4 bg-secondary/10 rounded-lg border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Share2 className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">Enlace para compartir</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Comparte esta vacante en redes sociales
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar enlace
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <TabsContent value="detalles" className="space-y-4 mt-4">
            {/* Información de la requisición original */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">Requisición Original</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Folio:</span>
                  <p className="font-medium">{vacante.folio}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cliente/Área:</span>
                  <p className="font-medium">{vacante.clientes_areas?.cliente_nombre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha solicitud:</span>
                  <p className="font-medium">{new Date(vacante.fecha_solicitud).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant="outline">{vacante.estatus}</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Formulario de publicación */}
            <div className="space-y-4">
              <h3 className="font-semibold">Datos para Publicación en Marketplace</h3>
              
              {/* Información de créditos (solo si no está publicada) */}
              {!publicacionData && (
                <Alert className={creditosInfo?.suficientes ? "bg-green-500/10 border-green-200" : "bg-destructive/10 border-destructive/30"}>
                  <Coins className="h-4 w-4" />
                  <AlertDescription className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span>
                        Costo de publicación: <strong>{COSTO_PUBLICACION} créditos</strong>
                      </span>
                      <span className="text-sm">
                        {creditosInfo?.origenDisponible === "heredado" ? (
                          <>Tus créditos asignados: {creditosInfo?.creditosHeredados || 0}</>
                        ) : (
                          <>Créditos empresa: {creditosInfo?.creditosEmpresa || 0}</>
                        )}
                      </span>
                    </div>
                    {creditosInfo?.nombreEmpresa && (
                      <span className="text-xs text-muted-foreground">
                        {creditosInfo?.origenDisponible === "heredado" 
                          ? `Créditos asignados por: ${creditosInfo.nombreEmpresa}`
                          : `Se descontarán de la wallet de: ${creditosInfo.nombreEmpresa}`
                        }
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {!publicacionData && !creditosInfo?.suficientes && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No hay créditos suficientes. Se necesitan {COSTO_PUBLICACION} créditos para publicar.
                    {creditosInfo?.creditosHeredados === 0 && creditosInfo?.creditosEmpresa === 0 && (
                      <span className="block mt-1 text-xs">La empresa no te ha asignado créditos y su wallet está vacía.</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="titulo">Título del Puesto *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Desarrollador Full Stack Senior"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Ciudad, Estado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sueldo">Sueldo Bruto Mensual</Label>
                  <Input
                    id="sueldo"
                    type="number"
                    value={sueldoBruto}
                    onChange={(e) => setSueldoBruto(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lugar">Modalidad de Trabajo</Label>
                <Select value={lugarTrabajo} onValueChange={(value: any) => setLugarTrabajo(value)}>
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
                <Label htmlFor="perfil">Perfil Requerido</Label>
                <Textarea
                  id="perfil"
                  value={perfilRequerido}
                  onChange={(e) => setPerfilRequerido(e.target.value)}
                  placeholder="Describe las habilidades, experiencia y requisitos..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">La empresa ofrece</Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Prestaciones, beneficios y ventajas que ofrece la empresa..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Mostrar nombre de la empresa</Label>
                  <p className="text-sm text-muted-foreground">
                    {mostrarEmpresa ? "La empresa será visible" : "Publicación anónima"}
                  </p>
                </div>
                <Switch
                  checked={mostrarEmpresa}
                  onCheckedChange={setMostrarEmpresa}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Sección de Solicitud de Cierre */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Gestión del Estatus de Vacante
              </h3>
              
              {vacante.solicitud_cierre ? (
                <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 dark:text-amber-200">Solicitud de cierre enviada</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    Has solicitado el cierre de esta vacante el {vacante.fecha_solicitud_cierre ? new Date(vacante.fecha_solicitud_cierre).toLocaleDateString() : "recientemente"}.
                    <br />
                    <span className="font-medium">Motivo:</span> {vacante.motivo_solicitud_cierre || "No especificado"}
                    <br />
                    <span className="text-xs mt-2 block">La empresa debe aprobar y cerrar la requisición.</span>
                  </AlertDescription>
                </Alert>
              ) : showCierreForm ? (
                <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
                  <Label htmlFor="motivoCierre">Motivo de solicitud de cierre *</Label>
                  <Select value={motivoCierre} onValueChange={setMotivoCierre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Candidato seleccionado y contratado">Candidato seleccionado y contratado</SelectItem>
                      <SelectItem value="Candidato en proceso de contratación">Candidato en proceso de contratación</SelectItem>
                      <SelectItem value="Sin candidatos viables">Sin candidatos viables</SelectItem>
                      <SelectItem value="Vacante cancelada por la empresa">Vacante cancelada por la empresa</SelectItem>
                      <SelectItem value="Otro motivo">Otro motivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Al solicitar el cierre, la empresa será notificada y solo ella puede cambiar el estatus de la requisición.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setShowCierreForm(false);
                        setMotivoCierre("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSolicitarCierre} 
                      disabled={isSubmitting || !motivoCierre}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setShowCierreForm(true)}
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Solicitar Cierre de Vacante
                </Button>
              )}
              
              <p className="text-xs text-muted-foreground">
                Nota: Solo la empresa puede cerrar o cancelar la requisición. Como reclutador, puedes solicitar el cierre cuando hayas concluido el proceso.
              </p>

              <Separator className="my-4" />

              {/* Botón Solicitar Estudio Socioeconómico */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Estudios Socioeconómicos</h4>
                <Button 
                  variant="outline" 
                  onClick={() => setSolicitarEstudioOpen(true)}
                  className="w-full"
                >
                  <FileSearch className="mr-2 h-4 w-4" />
                  Solicitar Estudio Socioeconómico
                </Button>
                <p className="text-xs text-muted-foreground">
                  Solicita un estudio socioeconómico para candidatos de esta vacante.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handlePublicar} 
                disabled={isSubmitting || (!publicacionData && !creditosInfo?.suficientes)}
              >
                {isSubmitting ? "Guardando..." : publicacionData ? "Actualizar Publicación" : `Publicar (${COSTO_PUBLICACION} créditos)`}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="postulaciones" className="mt-4">
            {publicacionData && (
              <PostulacionesVacanteTab 
                publicacionId={publicacionData.id}
                tituloPuesto={vacante.titulo_puesto}
                onPostulacionUpdated={handlePostulacionUpdated}
              />
            )}
          </TabsContent>

          <TabsContent value="sourcing" className="mt-4">
            {publicacionData && (
              <SourcingIATab 
                vacanteId={vacante.id}
                publicacionId={publicacionData.id}
                tituloPuesto={vacante.titulo_puesto}
                reclutadorId={reclutadorId}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Diálogo para solicitar estudio socioeconómico */}
        {reclutadorId && (
          <SolicitarEstudioDialog
            open={solicitarEstudioOpen}
            onOpenChange={setSolicitarEstudioOpen}
            reclutadorId={reclutadorId}
            onSuccess={() => {
              toast({
                title: "✅ Estudio solicitado",
                description: "El estudio socioeconómico ha sido solicitado exitosamente",
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};