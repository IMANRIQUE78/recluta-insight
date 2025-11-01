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
} from "lucide-react";

interface PerfilPublicoReclutadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reclutadorId: string;
}

interface PerfilData {
  id: string;
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
}

interface EstadisticasData {
  vacantes_cerradas: number;
  promedio_dias_cierre: number;
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

      const { data: perfilData, error: perfilError } = await supabase
        .from("perfil_reclutador")
        .select("*")
        .eq("id", reclutadorId)
        .single();

      if (perfilError) throw perfilError;

      const { data: statsData } = await supabase
        .from("estadisticas_reclutador")
        .select("vacantes_cerradas, promedio_dias_cierre")
        .eq("id", reclutadorId)
        .single();

      setPerfil(perfilData);
      setEstadisticas(statsData);
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
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold">{perfil.nombre_reclutador}</h2>
              <Badge variant="secondary" className="text-sm">
                {getTipoLabel(perfil.tipo_reclutador)}
              </Badge>
            </div>
            {perfil.anos_experiencia > 0 && (
              <p className="text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {perfil.anos_experiencia} {perfil.anos_experiencia === 1 ? "año" : "años"} de
                experiencia
              </p>
            )}
          </div>

          {/* Estadísticas rápidas */}
          {estadisticas && (estadisticas.vacantes_cerradas > 0 || estadisticas.promedio_dias_cierre > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Award className="h-4 w-4" />
                  Vacantes Cerradas
                </div>
                <p className="text-2xl font-bold">{estadisticas.vacantes_cerradas}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Promedio de Cierre
                </div>
                <p className="text-2xl font-bold">
                  {estadisticas.promedio_dias_cierre.toFixed(0)} días
                </p>
              </div>
            </div>
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
                  <Star className="h-5 w-5 text-primary" />
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
