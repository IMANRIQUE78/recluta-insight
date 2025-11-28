import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, Briefcase, Award, Calendar, CheckCircle2, Linkedin, Twitter, Globe } from "lucide-react";
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
  const [empresaAsociada, setEmpresaAsociada] = useState<string>("");

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

      // Si es reclutador interno, buscar empresa asociada
      if (perfilData?.tipo_reclutador === 'interno') {
        const { data: asociacionData } = await supabase
          .from("reclutador_empresa")
          .select("empresa_id, empresas(nombre_empresa)")
          .eq("reclutador_id", reclutadorId)
          .eq("estado", "activa")
          .maybeSingle();

        if (asociacionData?.empresas) {
          setEmpresaAsociada(asociacionData.empresas.nombre_empresa);
        }
      }

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
          {/* Información de Registro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de Registro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nombre Registrado</p>
                  <p className="font-medium">{perfil.nombre_reclutador}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo de Reclutador</p>
                  <p className="font-medium">
                    {perfil.tipo_reclutador === 'interno' 
                      ? `Reclutador Interno${empresaAsociada ? ` de ${empresaAsociada}` : ''}`
                      : 'Reclutador Freelance'
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Años de Experiencia</p>
                  <p className="font-medium">{perfil.anos_experiencia || 0} años</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Registrado Desde</p>
                  <p className="font-medium">
                    {new Date(perfil.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
        </div>
      </DialogContent>
    </Dialog>
  );
};
