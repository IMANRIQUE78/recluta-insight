import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Briefcase, DollarSign, FileText, Calendar, Building2, Trophy, CheckCircle, Flag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VacantePublicaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicacion: any;
}

export const VacantePublicaDetailModal = ({ 
  open, 
  onOpenChange, 
  publicacion 
}: VacantePublicaDetailModalProps) => {
  const { user } = useAuth();
  const [nombreEmpresa, setNombreEmpresa] = useState<string>("Confidencial");
  const [descripcionEmpresa, setDescripcionEmpresa] = useState<string>("");
  const [sectorEmpresa, setSectorEmpresa] = useState<string>("");
  const [tamanoEmpresa, setTamanoEmpresa] = useState<string>("");
  const [sitioWebEmpresa, setSitioWebEmpresa] = useState<string>("");
  const [showEmpresaInfo, setShowEmpresaInfo] = useState(false);
  const [nombreReclutador, setNombreReclutador] = useState<string>("");
  const [descripcionReclutador, setDescripcionReclutador] = useState<string>("");
  const [vacantesCerradas, setVacantesCerradas] = useState<number>(0);
  const [rankingScore, setRankingScore] = useState<number | null>(null);
  const [posicionRanking, setPosicionRanking] = useState<number | null>(null);
  const [paisReclutador, setPaisReclutador] = useState<string>("");
  const [fechaRegistro, setFechaRegistro] = useState<string>("");
  const [showReclutadorInfo, setShowReclutadorInfo] = useState(false);
  const [yaPostulado, setYaPostulado] = useState(false);
  const [postulando, setPostulando] = useState(false);
  const [tienePerfil, setTienePerfil] = useState(false);

  useEffect(() => {
    if (publicacion && open && user) {
      checkPostulacion();
      checkPerfil();
    }
  }, [publicacion, open, user]);

  useEffect(() => {
    if (publicacion && open) {
      const loadInfoReclutador = async () => {
        // Cargar información del perfil del usuario
        const { data: perfilData } = await supabase
          .from("perfil_usuario")
          .select("nombre_empresa, mostrar_empresa_publica, descripcion_empresa, nombre_usuario, sector, tamano_empresa, sitio_web, created_at, pais")
          .eq("user_id", publicacion.user_id)
          .maybeSingle();

        if (perfilData) {
          setNombreEmpresa(
            perfilData.mostrar_empresa_publica && perfilData.nombre_empresa 
              ? perfilData.nombre_empresa 
              : "Confidencial"
          );
          setDescripcionEmpresa(perfilData.descripcion_empresa || "No hay descripción disponible");
          setSectorEmpresa(perfilData.sector || "");
          setTamanoEmpresa(perfilData.tamano_empresa || "");
          setSitioWebEmpresa(perfilData.sitio_web || "");
          setNombreReclutador(perfilData.nombre_usuario || "Reclutador");
          setDescripcionReclutador("No hay información disponible sobre el reclutador");
          setFechaRegistro(perfilData.created_at || "");
          setPaisReclutador(perfilData.pais || "México");
        }

        // Cargar estadísticas del reclutador
        const { data: estadisticasData } = await supabase
          .from("estadisticas_reclutador")
          .select("vacantes_cerradas, ranking_score")
          .eq("user_id", publicacion.user_id)
          .maybeSingle();

        if (estadisticasData) {
          setVacantesCerradas(estadisticasData.vacantes_cerradas || 0);
          setRankingScore(estadisticasData.ranking_score);

          // Calcular posición en el ranking
          if (estadisticasData.ranking_score !== null) {
            const { count } = await supabase
              .from("estadisticas_reclutador")
              .select("*", { count: 'exact', head: true })
              .gt("ranking_score", estadisticasData.ranking_score);
            
            setPosicionRanking((count || 0) + 1);
          }
        }
      };

      loadInfoReclutador();
    }
  }, [publicacion, open]);

  const checkPerfil = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("perfil_candidato")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    setTienePerfil(!!data);
  };

  const checkPostulacion = async () => {
    if (!user || !publicacion) return;

    const { data } = await supabase
      .from("postulaciones")
      .select("id")
      .eq("publicacion_id", publicacion.id)
      .eq("candidato_user_id", user.id)
      .maybeSingle();

    setYaPostulado(!!data);
  };

  const handlePostularse = async () => {
    if (!user || !publicacion) return;

    if (!tienePerfil) {
      toast.error("Debes completar tu perfil antes de postularte");
      return;
    }

    setPostulando(true);

    try {
      // Verificar que la publicación sigue activa
      const { data: pub } = await supabase
        .from("publicaciones_marketplace")
        .select("publicada")
        .eq("id", publicacion.id)
        .single();

      if (!pub?.publicada) {
        toast.error("Esta vacante ya no está disponible para postulaciones");
        onOpenChange(false);
        return;
      }

      const { error } = await supabase
        .from("postulaciones")
        .insert({
          publicacion_id: publicacion.id,
          candidato_user_id: user.id,
          estado: "pendiente",
          etapa: "recibida"
        });

      if (error) throw error;

      toast.success("¡Postulación enviada exitosamente!");
      setYaPostulado(true);
    } catch (error) {
      console.error("Error al postularse:", error);
      toast.error("Error al enviar la postulación");
    } finally {
      setPostulando(false);
    }
  };

  if (!publicacion) return null;

  const formatSalary = (salary: number | null) => {
    if (!salary) return "No especificado";
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(salary);
  };

  const getModalidadLabel = (modalidad: string) => {
    const labels: Record<string, string> = {
      remoto: "Remoto",
      presencial: "Presencial",
      hibrido: "Híbrido",
    };
    return labels[modalidad] || modalidad;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl font-bold leading-tight">
              {publicacion.titulo_puesto}
            </DialogTitle>
            <Badge variant="secondary" className="shrink-0">
              {getModalidadLabel(publicacion.lugar_trabajo)}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button 
              onClick={() => setShowEmpresaInfo(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <Building2 className="h-4 w-4 group-hover:text-primary" />
              <span className="hover:underline">{nombreEmpresa}</span>
            </button>
            
            <button 
              onClick={() => setShowReclutadorInfo(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <Briefcase className="h-4 w-4 group-hover:text-primary" />
              <span className="hover:underline">{nombreReclutador}</span>
            </button>
            
            {publicacion.ubicacion && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{publicacion.ubicacion}</span>
              </div>
            )}
          </div>
          
          <DialogDescription className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Publicado el {new Date(publicacion.fecha_publicacion).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Compensación destacada */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Compensación mensual
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatSalary(publicacion.sueldo_bruto_aprobado)}
            </p>
          </div>

          {/* Cliente/Área */}
          {publicacion.cliente_area && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Área / Cliente
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {publicacion.cliente_area}
              </p>
            </div>
          )}

          <Separator />

          {/* Perfil requerido */}
          {publicacion.perfil_requerido && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Perfil Requerido
              </div>
              <div className="ml-6 p-3 rounded-md bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {publicacion.perfil_requerido}
                </p>
              </div>
            </div>
          )}

          {/* La empresa ofrece */}
          {publicacion.observaciones && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                La empresa ofrece
              </div>
              <div className="ml-6 p-3 rounded-md bg-green-500/5 border border-green-500/10">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {publicacion.observaciones}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Botón de postulación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Al postularte, tu perfil será visible para el reclutador
            </p>
            {user ? (
              yaPostulado ? (
                <Button size="lg" disabled className="w-full sm:w-auto">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ya te postulaste
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handlePostularse}
                  disabled={postulando || !tienePerfil}
                  className="w-full sm:w-auto"
                >
                  {postulando ? "Enviando..." : tienePerfil ? "Postularme ahora" : "Completa tu perfil primero"}
                </Button>
              )
            ) : (
              <Button size="lg" onClick={() => window.location.href = '/auth'} className="w-full sm:w-auto">
                Inicia sesión para postularte
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Modal de información de la empresa */}
      <AlertDialog open={showEmpresaInfo} onOpenChange={setShowEmpresaInfo}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {nombreEmpresa}
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-4 pt-2">
            <div>
              <h4 className="text-sm font-medium mb-1">Descripción</h4>
              <p className="text-sm text-muted-foreground">
                {descripcionEmpresa}
              </p>
            </div>

            {sectorEmpresa && (
              <div>
                <h4 className="text-sm font-medium mb-1">Sector</h4>
                <p className="text-sm text-muted-foreground">{sectorEmpresa}</p>
              </div>
            )}

            {tamanoEmpresa && (
              <div>
                <h4 className="text-sm font-medium mb-1">Tamaño de la Empresa</h4>
                <p className="text-sm text-muted-foreground capitalize">
                  {tamanoEmpresa.replace('_', ' ')}
                </p>
              </div>
            )}

            {sitioWebEmpresa && (
              <div>
                <h4 className="text-sm font-medium mb-1">Sitio Web</h4>
                <a 
                  href={sitioWebEmpresa.startsWith('http') ? sitioWebEmpresa : `https://${sitioWebEmpresa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {sitioWebEmpresa}
                </a>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setShowEmpresaInfo(false)}>
              Cerrar
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de información del reclutador */}
      <AlertDialog open={showReclutadorInfo} onOpenChange={setShowReclutadorInfo}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {nombreReclutador}
            </AlertDialogTitle>
            <div className="flex items-center gap-3 pt-1">
              {posicionRanking !== null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold">#{posicionRanking}</span>
                  {rankingScore !== null && (
                    <span className="text-muted-foreground">({rankingScore.toFixed(1)} pts)</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Flag className="h-4 w-4" />
                <span>{paisReclutador}</span>
              </div>
            </div>
          </AlertDialogHeader>
          
          <div className="space-y-4 pt-2">
            <div>
              <h4 className="text-sm font-medium mb-1">Descripción</h4>
              <p className="text-sm text-muted-foreground">
                {descripcionReclutador}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs">Vacantes Cerradas</span>
                </div>
                <p className="text-2xl font-bold">{vacantesCerradas}</p>
              </div>
            </div>

            {fechaRegistro && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Reclutador en la plataforma desde {new Date(fechaRegistro).getFullYear()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(fechaRegistro), { addSuffix: true, locale: es })}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setShowReclutadorInfo(false)}>
              Cerrar
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
