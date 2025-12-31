import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Globe,
  Star,
  Briefcase,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface PerfilPublicoReclutadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reclutadorId: string;
}

interface PerfilData {
  id: string;
  user_id: string;
  nombre_reclutador: string;
  email: string;
  telefono: string | null;
  mostrar_telefono: boolean;
  tipo_reclutador: string;
  anos_experiencia: number;
  especialidades: string[] | null;
  semblanza_profesional: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  descripcion_reclutador: string | null;
  created_at: string;
}

interface EstadisticasData {
  vacantes_cerradas: number;
  promedio_dias_cierre: number;
  tasa_conversion: number;
  calificacion_promedio: number;
  total_calificaciones: number;
  total_entrevistas: number;
}

export function PerfilPublicoReclutadorModal({
  open,
  onOpenChange,
  reclutadorId,
}: PerfilPublicoReclutadorModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null);

  useEffect(() => {
    if (open && reclutadorId) {
      loadPerfilPublico();
    }
  }, [open, reclutadorId]);

  const loadPerfilPublico = async () => {
    try {
      setLoading(true);

      // Cargar perfil del reclutador
      const { data: perfilData, error: perfilError } = await supabase
        .from("perfil_reclutador")
        .select("*")
        .eq("id", reclutadorId)
        .single();

      if (perfilError) throw perfilError;
      setPerfil(perfilData);

      // Calcular estadísticas en tiempo real desde la base de datos
      const [vacantesResult, entrevistasResult, feedbackResult] = await Promise.all([
        supabase
          .from("vacantes")
          .select("id, estatus, fecha_solicitud, fecha_cierre")
          .eq("reclutador_asignado_id", reclutadorId),
        supabase
          .from("entrevistas_candidato")
          .select("id, asistio")
          .eq("reclutador_user_id", perfilData.user_id),
        supabase
          .from("feedback_candidato")
          .select("puntuacion")
          .eq("reclutador_user_id", perfilData.user_id)
          .not("puntuacion", "is", null)
      ]);

      const vacantes = vacantesResult.data || [];
      const entrevistas = entrevistasResult.data || [];
      const feedbacks = feedbackResult.data || [];

      // Calcular estadísticas
      const cerradas = vacantes.filter(v => v.estatus === "cerrada");
      const totalEntrevistas = entrevistas.length;

      // Promedio días de cierre
      let promedioDias = 0;
      if (cerradas.length > 0) {
        const totalDias = cerradas.reduce((sum, v) => {
          if (v.fecha_cierre && v.fecha_solicitud) {
            const dias = Math.floor(
              (new Date(v.fecha_cierre).getTime() - new Date(v.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + Math.max(0, dias);
          }
          return sum;
        }, 0);
        promedioDias = Math.round(totalDias / cerradas.length);
      }

      // Tasa de conversión
      const tasaConversion = totalEntrevistas > 0 
        ? Math.round((cerradas.length / totalEntrevistas) * 100)
        : 0;

      // Calificación promedio
      const totalCalificaciones = feedbacks.length;
      const calificacionPromedio = totalCalificaciones > 0
        ? Math.round((feedbacks.reduce((sum, f) => sum + (f.puntuacion || 0), 0) / totalCalificaciones) * 10) / 10
        : 0;

      setEstadisticas({
        vacantes_cerradas: cerradas.length,
        promedio_dias_cierre: promedioDias,
        tasa_conversion: tasaConversion,
        calificacion_promedio: calificacionPromedio,
        total_calificaciones: totalCalificaciones,
        total_entrevistas: totalEntrevistas,
      });

    } catch (error) {
      console.error("Error cargando perfil público:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      interno: "Reclutador Interno",
      externo: "Reclutador Externo",
      freelance: "Reclutador Freelance",
      agencia: "Agencia de Reclutamiento",
    };
    return tipos[tipo] || tipo;
  };

  const getInitials = (nombre: string) => {
    return nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!perfil) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header con gradiente */}
        <div className="relative h-32 bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-t-lg">
          <div className="absolute -bottom-16 left-8">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarFallback className="text-3xl font-bold bg-secondary text-secondary-foreground">
                {getInitials(perfil.nombre_reclutador)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Contenido */}
        <div className="pt-20 px-8 pb-8 space-y-6">
          {/* Nombre y tipo */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl font-bold">{perfil.nombre_reclutador}</h2>
              <Badge variant="secondary" className="text-sm">
                {getTipoLabel(perfil.tipo_reclutador)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
              {perfil.anos_experiencia > 0 && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {perfil.anos_experiencia} {perfil.anos_experiencia === 1 ? "año" : "años"} de experiencia
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                En la plataforma desde {formatDate(perfil.created_at)}
              </span>
            </div>
          </div>

          {/* Indicadores de Rendimiento - Cards con mismo diseño */}
          {estadisticas && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Indicadores de Rendimiento
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Vacantes Cerradas</span>
                    </div>
                    <p className="text-2xl font-bold">{estadisticas.vacantes_cerradas}</p>
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Promedio Cierre</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {estadisticas.promedio_dias_cierre}
                      <span className="text-sm ml-1 text-muted-foreground font-normal">días</span>
                    </p>
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Conversión</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {estadisticas.tasa_conversion}
                      <span className="text-sm ml-1 text-muted-foreground font-normal">%</span>
                    </p>
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Star className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Calificación</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {estadisticas.calificacion_promedio}
                      <span className="text-sm ml-1 text-muted-foreground font-normal">★</span>
                    </p>
                    {estadisticas.total_calificaciones > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ({estadisticas.total_calificaciones} calificaciones)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Contacto */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Información de Contacto
            </h3>
            <div className="space-y-2 ml-7">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Email:</span>
                <a
                  href={`mailto:${perfil.email}`}
                  className="text-sm hover:underline text-primary"
                >
                  {perfil.email}
                </a>
              </div>
              {perfil.telefono && perfil.mostrar_telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{perfil.telefono}</span>
                </div>
              )}
            </div>
          </div>

          {/* Redes sociales */}
          {(perfil.linkedin_url || perfil.twitter_url || perfil.website_url) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Redes Sociales</h3>
                <div className="flex flex-wrap gap-2">
                  {perfil.linkedin_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <a href={perfil.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {perfil.twitter_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <a href={perfil.twitter_url} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {perfil.website_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <a href={perfil.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                        Sitio Web
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Especialidades */}
          {perfil.especialidades && perfil.especialidades.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Especialidades
                </h3>
                <div className="flex flex-wrap gap-2">
                  {perfil.especialidades.map((especialidad, index) => (
                    <Badge key={index} variant="outline">
                      {especialidad}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Semblanza profesional */}
          {perfil.semblanza_profesional && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Semblanza Profesional</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {perfil.semblanza_profesional}
                </p>
              </div>
            </>
          )}

          {/* Descripción adicional */}
          {perfil.descripcion_reclutador && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Sobre mí</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {perfil.descripcion_reclutador}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}