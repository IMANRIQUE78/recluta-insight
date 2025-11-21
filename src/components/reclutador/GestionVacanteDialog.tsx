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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Users, Calendar, Share2, Copy, Check } from "lucide-react";
import { PostulacionesVacanteTab } from "./PostulacionesVacanteTab";

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
  
  // Datos para publicación
  const [titulo, setTitulo] = useState("");
  const [perfilRequerido, setPerfilRequerido] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [sueldoBruto, setSueldoBruto] = useState("");
  const [lugarTrabajo, setLugarTrabajo] = useState<"remoto" | "hibrido" | "presencial">("presencial");
  const [mostrarEmpresa, setMostrarEmpresa] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (open && vacante) {
      loadPublicacionData();
      // Inicializar con datos de la vacante
      setTitulo(vacante.titulo_puesto || "");
      setPerfilRequerido(vacante.perfil_requerido || "");
      setObservaciones(vacante.observaciones || "");
      setUbicacion(vacante.clientes_areas?.ubicacion || "");
      setSueldoBruto(vacante.sueldo_bruto_aprobado?.toString() || "");
      setLugarTrabajo(vacante.lugar_trabajo || "presencial");
    }
  }, [open, vacante]);

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
        // Actualizar publicación existente
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
        // Crear nueva publicación
        const { error } = await supabase
          .from("publicaciones_marketplace")
          .insert([publicacionPayload]);

        if (error) throw error;

        toast({
          title: "✅ Vacante publicada",
          description: "La vacante está ahora visible en el marketplace público",
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detalles">
              <Upload className="mr-2 h-4 w-4" />
              Detalles y Publicación
            </TabsTrigger>
            <TabsTrigger value="postulaciones" disabled={!publicacionData}>
              <Users className="mr-2 h-4 w-4" />
              Postulaciones ({postulacionesCount})
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

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePublicar} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : publicacionData ? "Actualizar Publicación" : "Publicar en Marketplace"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="postulaciones" className="mt-4">
            {publicacionData && (
              <PostulacionesVacanteTab 
                publicacionId={publicacionData.id}
                onPostulacionUpdated={handlePostulacionUpdated}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};