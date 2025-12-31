import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Linkedin, Twitter, Globe, Copy, CheckCircle2, TrendingUp, Clock, Star, Target } from "lucide-react";
import { useReclutadorStats } from "@/hooks/useReclutadorStats";

interface EditarPerfilReclutadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reclutadorId: string;
  onUpdate?: () => void;
}

export function EditarPerfilReclutadorDialog({
  open,
  onOpenChange,
  reclutadorId,
  onUpdate,
}: EditarPerfilReclutadorDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Hook para estadísticas de rendimiento
  const { stats, loading: statsLoading } = useReclutadorStats(reclutadorId);

  // Datos de solo lectura
  const [nombreReclutador, setNombreReclutador] = useState("");
  const [tipoReclutador, setTipoReclutador] = useState("");
  const [empresaAsociada, setEmpresaAsociada] = useState("");
  const [anosExperiencia, setAnosExperiencia] = useState(0);
  const [fechaRegistro, setFechaRegistro] = useState("");
  const [codigoReclutador, setCodigoReclutador] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Datos editables
  const [telefono, setTelefono] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [semblanza, setSemblanza] = useState("");
  const [mostrarTelefono, setMostrarTelefono] = useState(true);

  useEffect(() => {
    if (open && reclutadorId) {
      loadPerfilData();
    }
  }, [open, reclutadorId]);

  const loadPerfilData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos del perfil
      const { data: perfilData, error: perfilError } = await supabase
        .from("perfil_reclutador")
        .select("*")
        .eq("id", reclutadorId)
        .single();

      if (perfilError) throw perfilError;

      if (perfilData) {
        // Guardar user_id para el hook de stats
        setUserId(perfilData.user_id);
        
        // Datos de solo lectura
        setNombreReclutador(perfilData.nombre_reclutador);
        setTipoReclutador(perfilData.tipo_reclutador);
        setAnosExperiencia(perfilData.anos_experiencia || 0);
        setFechaRegistro(new Date(perfilData.created_at).toLocaleDateString('es-MX'));
        setCodigoReclutador(perfilData.codigo_reclutador || "");

        // Si es reclutador interno, buscar empresa asociada
        if (perfilData.tipo_reclutador === 'interno') {
          const { data: asociacionData } = await supabase
            .from("reclutador_empresa")
            .select("empresa_id, empresas(nombre_empresa)")
            .eq("reclutador_id", reclutadorId)
            .eq("estado", "activa")
            .single();

          if (asociacionData?.empresas) {
            setEmpresaAsociada(asociacionData.empresas.nombre_empresa);
          }
        }

        // Datos editables
        setTelefono(perfilData.telefono || "");
        setLinkedinUrl(perfilData.linkedin_url || "");
        setTwitterUrl(perfilData.twitter_url || "");
        setWebsiteUrl(perfilData.website_url || "");
        setSemblanza(perfilData.semblanza_profesional || "");
        setMostrarTelefono(perfilData.mostrar_telefono ?? true);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("perfil_reclutador")
        .update({
          telefono,
          linkedin_url: linkedinUrl || null,
          twitter_url: twitterUrl || null,
          website_url: websiteUrl || null,
          semblanza_profesional: semblanza || null,
          mostrar_telefono: mostrarTelefono,
        })
        .eq("id", reclutadorId);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tu información se guardó correctamente",
      });

      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error guardando perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCodigo = () => {
    if (codigoReclutador) {
      navigator.clipboard.writeText(codigoReclutador);
      setCopiado(true);
      toast({
        title: "✅ Código copiado",
        description: `Tu código ${codigoReclutador} ha sido copiado al portapapeles`,
      });
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mi Perfil Profesional</DialogTitle>
          <DialogDescription>
            Gestiona tu información profesional y código de vinculación
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Código de Vinculación - DESTACADO */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Tu Código Único de Vinculación</h3>
                  <p className="text-xs text-muted-foreground">
                    Comparte este código con empresas para que te inviten a colaborar
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-background px-4 py-2 rounded-md border border-border font-mono text-lg font-bold text-primary tracking-wider">
                    {codigoReclutador || "------"}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCodigo}
                    className="h-10 w-10 shrink-0"
                  >
                    {copiado ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Sección de Solo Lectura */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Información de Registro</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Nombre Registrado</p>
                  <p className="font-medium text-foreground">{nombreReclutador}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground text-xs">Tipo de Reclutador</p>
                  <p className="font-medium text-foreground">
                    {tipoReclutador === 'interno' 
                      ? `Reclutador Interno${empresaAsociada ? ` de ${empresaAsociada}` : ''}`
                      : 'Reclutador Freelance'
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-muted-foreground text-xs">Años de Experiencia</p>
                  <p className="font-medium text-foreground">{anosExperiencia} años</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground text-xs">Registrado Desde</p>
                  <p className="font-medium text-foreground">{fechaRegistro}</p>
                </div>
              </div>
            </div>

            {/* Indicadores de Rendimiento - Solo Lectura */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Mi Rendimiento</h3>
                <span className="text-xs text-muted-foreground ml-auto">Visible para empresas</span>
              </div>
              
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-background rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-muted-foreground">Vacantes Cerradas</span>
                    </div>
                    <p className="text-xl font-bold">{stats?.vacantesCerradas || 0}</p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Promedio Cierre</span>
                    </div>
                    <p className="text-xl font-bold">
                      {stats?.promedioDiasCierre || 0}
                      <span className="text-xs font-normal text-muted-foreground ml-1">días</span>
                    </p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-xs text-muted-foreground">Conversión</span>
                    </div>
                    <p className="text-xl font-bold">
                      {stats?.porcentajeExito || 0}
                      <span className="text-xs font-normal text-muted-foreground ml-1">%</span>
                    </p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">Calificación</span>
                    </div>
                    <p className="text-xl font-bold">
                      {stats?.calificacionPromedio || 0}
                      <span className="text-xs font-normal text-muted-foreground ml-1">★</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Semblanza Profesional */}
            <div className="space-y-2">
              <Label htmlFor="semblanza">Semblanza Profesional</Label>
              <Textarea
                id="semblanza"
                value={semblanza}
                onChange={(e) => setSemblanza(e.target.value)}
                placeholder="Describe brevemente tu trayectoria profesional, experiencia en reclutamiento, sectores en los que te especializas..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Esta información será visible en tu perfil público
              </p>
            </div>

            {/* Redes Sociales */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Redes Sociales</h3>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/tu-perfil"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter / X
                </Label>
                <Input
                  id="twitter"
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/tu-usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Sitio Web / Portfolio
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://tu-sitio.com"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+52 55 1234 5678"
              />
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="mostrar-telefono"
                  checked={mostrarTelefono}
                  onCheckedChange={setMostrarTelefono}
                />
                <Label htmlFor="mostrar-telefono" className="text-sm font-normal">
                  Mostrar teléfono en perfil público
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
