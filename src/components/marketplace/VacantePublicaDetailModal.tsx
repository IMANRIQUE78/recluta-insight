import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Briefcase, DollarSign, FileText, Calendar, Building2, Trophy, CheckCircle } from "lucide-react";
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
          .select("nombre_empresa, mostrar_empresa_publica, descripcion_empresa, nombre_reclutador, descripcion_reclutador, nombre_usuario, sector, tamano_empresa, sitio_web, created_at")
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
          setNombreReclutador(perfilData.nombre_reclutador || perfilData.nombre_usuario || "Reclutador");
          setDescripcionReclutador(perfilData.descripcion_reclutador || "No hay información disponible sobre el reclutador");
          setFechaRegistro(perfilData.created_at || "");
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
        <DialogHeader>
          <DialogTitle className="text-2xl">{publicacion.titulo_puesto}</DialogTitle>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <button 
                onClick={() => setShowEmpresaInfo(true)}
                className="hover:underline hover:text-foreground transition-colors"
              >
                {nombreEmpresa}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>•</span>
              <button 
                onClick={() => setShowReclutadorInfo(true)}
                className="hover:underline hover:text-foreground transition-colors"
              >
                {nombreReclutador}
              </button>
            </div>
            {publicacion.ubicacion && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{publicacion.ubicacion}</span>
              </div>
            )}
          </div>
          <DialogDescription>
            Publicado el {new Date(publicacion.fecha_publicacion).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Badges principales */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {getModalidadLabel(publicacion.lugar_trabajo)}
            </Badge>
          </div>

          <Separator />

          {/* Sueldo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Compensación
            </div>
            <p className="text-lg font-semibold ml-6">
              {formatSalary(publicacion.sueldo_bruto_aprobado)}
            </p>
          </div>

          {/* Perfil requerido */}
          {publicacion.perfil_requerido && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Perfil Requerido
                </div>
                <p className="text-sm text-muted-foreground ml-6 whitespace-pre-wrap">
                  {publicacion.perfil_requerido}
                </p>
              </div>
            </>
          )}

          {/* Observaciones */}
          {publicacion.observaciones && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Información Adicional
                </div>
                <p className="text-sm text-muted-foreground ml-6 whitespace-pre-wrap">
                  {publicacion.observaciones}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Botón de postulación */}
          <div className="flex justify-end">
            {user ? (
              yaPostulado ? (
                <Button size="lg" disabled>
                  Ya te postulaste
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handlePostularse}
                  disabled={postulando || !tienePerfil}
                >
                  {postulando ? "Enviando..." : tienePerfil ? "Postularme" : "Completa tu perfil primero"}
                </Button>
              )
            ) : (
              <Button size="lg" variant="outline" onClick={() => window.location.href = '/auth'}>
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
          </AlertDialogHeader>
          
          <div className="space-y-4 pt-2">
            <div>
              <h4 className="text-sm font-medium mb-1">Descripción</h4>
              <p className="text-sm text-muted-foreground">
                {descripcionReclutador}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs">Vacantes Cerradas</span>
                </div>
                <p className="text-2xl font-bold">{vacantesCerradas}</p>
              </div>

              {rankingScore !== null && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span className="text-xs">Ranking</span>
                  </div>
                  <p className="text-2xl font-bold">{rankingScore.toFixed(1)}</p>
                </div>
              )}
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
