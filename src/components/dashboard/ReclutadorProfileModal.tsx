import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, Briefcase, Award, Calendar, CheckCircle2, Linkedin, Twitter, Globe, Building2, TrendingUp, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReclutadorProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reclutadorId: string;
  asociacionId?: string;
}

export const ReclutadorProfileModal = ({ open, onOpenChange, reclutadorId, asociacionId }: ReclutadorProfileModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [asociacion, setAsociacion] = useState<any>(null);
  const [estadisticasColaboracion, setEstadisticasColaboracion] = useState<any>(null);

  useEffect(() => {
    if (open && reclutadorId) {
      loadReclutadorProfile();
    }
  }, [open, reclutadorId, asociacionId]);

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

      // Cargar información de la asociación específica
      if (asociacionId) {
        const { data: asociacionData } = await supabase
          .from("reclutador_empresa")
          .select(`
            id,
            tipo_vinculacion,
            estado,
            fecha_inicio,
            fecha_fin,
            empresa_id,
            empresas (
              nombre_empresa,
              sector,
              ciudad,
              estado
            )
          `)
          .eq("id", asociacionId)
          .single();

        setAsociacion(asociacionData);

        // Cargar estadísticas de esta colaboración específica
        if (asociacionData?.empresa_id) {
          try {
            // Contar vacantes asignadas a este reclutador por esta empresa
            const { data: vacantesAsignadas, error: vacantesError } = await supabase
              .from("vacantes")
              .select("id, estatus, fecha_solicitud, fecha_cierre")
              .eq("reclutador_asignado_id", reclutadorId)
              .eq("empresa_id", asociacionData.empresa_id);

            if (vacantesError) {
              console.error("Error consultando vacantes:", vacantesError);
              throw vacantesError;
            }

            console.log(`Vacantes encontradas para reclutador ${reclutadorId} en empresa ${asociacionData.empresa_id}:`, vacantesAsignadas);

            const vacantesAbiertas = vacantesAsignadas?.filter(v => v.estatus === 'abierta').length || 0;
            const vacantesCerradas = vacantesAsignadas?.filter(v => v.estatus === 'cerrada').length || 0;
            
            // Calcular promedio de días de cierre
            const cerradasConFechas = vacantesAsignadas?.filter(
              v => v.estatus === 'cerrada' && v.fecha_cierre && v.fecha_solicitud
            ) || [];
            
            let promedioDias = 0;
            if (cerradasConFechas.length > 0) {
              const totalDias = cerradasConFechas.reduce((sum, v) => {
                const inicio = new Date(v.fecha_solicitud);
                const fin = new Date(v.fecha_cierre!);
                const dias = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
                return sum + dias;
              }, 0);
              promedioDias = Math.round(totalDias / cerradasConFechas.length);
            }

            const stats = {
              vacantesAsignadas: vacantesAsignadas?.length || 0,
              vacantesAbiertas,
              vacantesCerradas,
              promedioDias,
            };

            console.log("Estadísticas de colaboración calculadas:", stats);
            setEstadisticasColaboracion(stats);
          } catch (error) {
            console.error("Error cargando estadísticas de colaboración:", error);
            // Establecer valores en 0 si hay error
            setEstadisticasColaboracion({
              vacantesAsignadas: 0,
              vacantesAbiertas: 0,
              vacantesCerradas: 0,
              promedioDias: 0,
            });
          }
        }
      } else {
        console.log("No se proporcionó asociacionId, saltando estadísticas de colaboración");
      }

      // Cargar estadísticas globales
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

  const getTipoVinculacionLabel = (tipo: string) => {
    switch (tipo) {
      case "interno":
        return "Colaborador Interno";
      case "freelance":
        return "Freelance";
      case "externo":
        return "Externo";
      default:
        return tipo;
    }
  };

  const getTipoVinculacionBadge = (tipo: string) => {
    switch (tipo) {
      case "interno":
        return "default";
      case "freelance":
        return "secondary";
      case "externo":
        return "outline";
      default:
        return "default";
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
              <DialogDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{perfil.anos_experiencia || 0} años de experiencia</span>
                </div>
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
          {/* Información de la Colaboración */}
          {asociacion && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Colaboración con {asociacion.empresas?.nombre_empresa}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tipo de Vinculación</p>
                    <Badge variant={getTipoVinculacionBadge(asociacion.tipo_vinculacion) as any}>
                      {getTipoVinculacionLabel(asociacion.tipo_vinculacion)}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Colaborando desde
                    </p>
                    <p className="font-medium">
                      {format(new Date(asociacion.fecha_inicio), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estado</p>
                    <Badge variant={asociacion.estado === 'activa' ? 'default' : 'secondary'}>
                      {asociacion.estado === 'activa' ? 'Activa' : asociacion.estado}
                    </Badge>
                  </div>
                </div>

                {/* Estadísticas de esta colaboración */}
                {estadisticasColaboracion && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Desempeño en esta Colaboración
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-background rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">
                            {estadisticasColaboracion.vacantesAsignadas}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Vacantes Asignadas</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-500">
                            {estadisticasColaboracion.vacantesAbiertas}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">En Proceso</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-green-500">
                            {estadisticasColaboracion.vacantesCerradas}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Cerradas</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-orange-500">
                            {estadisticasColaboracion.promedioDias || 0}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Días Promedio</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Semblanza Profesional */}
          {perfil.semblanza_profesional && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Semblanza Profesional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {perfil.semblanza_profesional}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Redes Sociales */}
          {(perfil.linkedin_url || perfil.twitter_url || perfil.website_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Redes Sociales y Enlaces</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {perfil.linkedin_url && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={perfil.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                
                {perfil.twitter_url && (
                  <div className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={perfil.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Twitter / X
                    </a>
                  </div>
                )}
                
                {perfil.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={perfil.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Sitio Web / Portfolio
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
              {perfil.telefono && perfil.mostrar_telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${perfil.telefono}`} className="text-primary hover:underline">
                    {perfil.telefono}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Especialidades */}
          {perfil.especialidades && perfil.especialidades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Especialidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {perfil.especialidades.map((especialidad: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {especialidad}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas Globales */}
          {estadisticas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Estadísticas Globales en VVGI
                </CardTitle>
                <CardDescription>
                  Desempeño histórico en todas las colaboraciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Vacantes Cerradas</p>
                    <p className="text-3xl font-bold text-primary">{estadisticas.vacantes_cerradas || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Promedio de Cierre
                    </p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
