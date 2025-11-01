import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, Phone, Briefcase, Award, Calendar, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ReclutadorProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reclutadorId: string;
}

export const ReclutadorProfileModal = ({ open, onOpenChange, reclutadorId }: ReclutadorProfileModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);

  useEffect(() => {
    if (open && reclutadorId) {
      loadReclutadorProfile();
    }
  }, [open, reclutadorId]);

  const loadReclutadorProfile = async () => {
    setLoading(true);
    try {
      // Cargar perfil del reclutador
      const { data: perfilData, error: perfilError } = await supabase
        .from("perfil_reclutador")
        .select("*")
        .eq("id", reclutadorId)
        .single();

      if (perfilError) throw perfilError;
      setPerfil(perfilData);

      // Cargar estadísticas si existen
      if (perfilData?.user_id) {
        const { data: statsData } = await supabase
          .from("estadisticas_reclutador")
          .select("*")
          .eq("user_id", perfilData.user_id)
          .maybeSingle();

        setEstadisticas(statsData);
      }
    } catch (error: any) {
      toast({
        title: "Error al cargar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "interno":
        return "Reclutador Interno";
      case "freelance":
        return "Reclutador Freelance";
      case "agencia":
        return "Agencia de Reclutamiento";
      default:
        return tipo;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!perfil) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Perfil no encontrado</DialogTitle>
            <DialogDescription>
              No se pudo cargar la información del reclutador
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{perfil.nombre_reclutador}</DialogTitle>
              <DialogDescription className="mt-1">
                <Badge variant="outline" className="mt-2">
                  {getTipoLabel(perfil.tipo_reclutador)}
                </Badge>
              </DialogDescription>
            </div>
            {perfil.codigo_reclutador && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Código</p>
                <p className="text-sm font-mono font-semibold">{perfil.codigo_reclutador.toUpperCase()}</p>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${perfil.email}`} className="text-primary hover:underline">
                  {perfil.email}
                </a>
              </div>
              {perfil.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${perfil.telefono}`} className="text-primary hover:underline">
                    {perfil.telefono}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experiencia y Especialidades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Experiencia y Especialidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {perfil.anos_experiencia > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Años de Experiencia</p>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <p className="text-base font-semibold">{perfil.anos_experiencia} años</p>
                  </div>
                </div>
              )}

              {perfil.especialidades && perfil.especialidades.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {perfil.especialidades.map((especialidad: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {especialidad}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {perfil.descripcion_reclutador && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm">{perfil.descripcion_reclutador}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas */}
          {estadisticas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Estadísticas de Desempeño
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Vacantes Cerradas</p>
                    <p className="text-3xl font-bold text-primary">{estadisticas.vacantes_cerradas || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Promedio de Cierre</p>
                    <p className="text-3xl font-bold text-primary">
                      {estadisticas.promedio_dias_cierre 
                        ? `${Math.round(estadisticas.promedio_dias_cierre)} días` 
                        : "N/A"}
                    </p>
                  </div>
                </div>
                {estadisticas.ultima_actualizacion && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Última actualización: {new Date(estadisticas.ultima_actualizacion).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fecha de Creación */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Miembro desde {new Date(perfil.created_at).toLocaleDateString('es-MX', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
