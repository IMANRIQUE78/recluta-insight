import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Briefcase, Users, Eye, Clock, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GestionVacanteDialog } from "./GestionVacanteDialog";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface VacantesGestionCardProps {
  reclutadorId: string;
}

interface VacanteEnriquecida {
  id: string;
  folio: string;
  titulo_puesto: string;
  fecha_solicitud: string;
  fecha_cierre?: string;
  estatus: string;
  lugar_trabajo: string;
  sueldo_bruto_aprobado?: number;
  perfil_requerido?: string;
  observaciones?: string;
  solicitud_cierre?: boolean;
  clientes_areas?: { cliente_nombre: string; area: string };
  empresas?: { nombre_empresa: string };
  publicada: boolean;
  publicacion_id?: string;
  fecha_publicacion?: string;
  postulaciones: number;
  entrevistas: number;
  diasAbierta: number;
  diasHastaPublicacion: number | null;
}

export const VacantesGestionCard = ({ reclutadorId }: VacantesGestionCardProps) => {
  const [vacantesAbiertas, setVacantesAbiertas] = useState<VacanteEnriquecida[]>([]);
  const [vacantesCerradas, setVacantesCerradas] = useState<VacanteEnriquecida[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacante, setSelectedVacante] = useState<any>(null);
  const [showGestionDialog, setShowGestionDialog] = useState(false);

  useEffect(() => {
    if (reclutadorId) {
      loadVacantes();
    }
  }, [reclutadorId]);

  const loadVacantes = async () => {
    try {
      // Cargar vacantes abiertas
      const { data: abiertas, error: errorAbiertas } = await supabase
        .from("vacantes")
        .select(`
          *,
          clientes_areas (cliente_nombre, area),
          empresas (nombre_empresa)
        `)
        .eq("reclutador_asignado_id", reclutadorId)
        .eq("estatus", "abierta")
        .order("fecha_solicitud", { ascending: false });

      if (errorAbiertas) throw errorAbiertas;

      // Cargar vacantes cerradas (últimas 10)
      const { data: cerradas, error: errorCerradas } = await supabase
        .from("vacantes")
        .select(`
          *,
          clientes_areas (cliente_nombre, area),
          empresas (nombre_empresa)
        `)
        .eq("reclutador_asignado_id", reclutadorId)
        .eq("estatus", "cerrada")
        .order("fecha_cierre", { ascending: false })
        .limit(10);

      if (errorCerradas) throw errorCerradas;

      // Enriquecer vacantes abiertas
      const abiertasEnriquecidas = await Promise.all(
        (abiertas || []).map(async (vacante) => {
          const { data: publicacion } = await supabase
            .from("publicaciones_marketplace")
            .select("id, fecha_publicacion")
            .eq("vacante_id", vacante.id)
            .maybeSingle();

          let postulacionesCount = 0;
          let entrevistasCount = 0;

          if (publicacion) {
            const { count: postCount } = await supabase
              .from("postulaciones")
              .select("*", { count: "exact", head: true })
              .eq("publicacion_id", publicacion.id);
            postulacionesCount = postCount || 0;

            // Contar entrevistas relacionadas
            const { data: postulaciones } = await supabase
              .from("postulaciones")
              .select("id")
              .eq("publicacion_id", publicacion.id);

            if (postulaciones && postulaciones.length > 0) {
              const postIds = postulaciones.map(p => p.id);
              const { count: entCount } = await supabase
                .from("entrevistas_candidato")
                .select("*", { count: "exact", head: true })
                .in("postulacion_id", postIds);
              entrevistasCount = entCount || 0;
            }
          }

          const diasAbierta = differenceInDays(new Date(), new Date(vacante.fecha_solicitud));
          const diasHastaPublicacion = publicacion?.fecha_publicacion
            ? differenceInDays(new Date(publicacion.fecha_publicacion), new Date(vacante.fecha_solicitud))
            : null;

          return {
            ...vacante,
            publicada: !!publicacion,
            publicacion_id: publicacion?.id,
            fecha_publicacion: publicacion?.fecha_publicacion,
            postulaciones: postulacionesCount,
            entrevistas: entrevistasCount,
            diasAbierta,
            diasHastaPublicacion,
          } as VacanteEnriquecida;
        })
      );

      // Enriquecer vacantes cerradas
      const cerradasEnriquecidas = await Promise.all(
        (cerradas || []).map(async (vacante) => {
          const diasCierre = vacante.fecha_cierre
            ? differenceInDays(new Date(vacante.fecha_cierre), new Date(vacante.fecha_solicitud))
            : 0;

          return {
            ...vacante,
            publicada: true,
            postulaciones: 0,
            entrevistas: 0,
            diasAbierta: diasCierre,
            diasHastaPublicacion: null,
          } as VacanteEnriquecida;
        })
      );

      setVacantesAbiertas(abiertasEnriquecidas);
      setVacantesCerradas(cerradasEnriquecidas);
    } catch (error: any) {
      console.error("Error cargando vacantes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (vacante: any) => {
    setSelectedVacante(vacante);
    setShowGestionDialog(true);
  };

  const getSemaforoColor = (dias: number, publicada: boolean) => {
    if (!publicada) return "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20";
    if (dias <= 15) return "border-l-green-500 bg-green-50 dark:bg-green-950/20";
    if (dias <= 30) return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    if (dias <= 45) return "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20";
    return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
  };

  const getSemaforoBadge = (dias: number, publicada: boolean) => {
    if (!publicada) {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300">⏳ Sin publicar</Badge>;
    }
    if (dias <= 15) return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300">✓ En tiempo</Badge>;
    if (dias <= 30) return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300">⚡ Atención</Badge>;
    if (dias <= 45) return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300">⚠️ Urgente</Badge>;
    return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300">🔴 Crítico</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Gestión de Vacantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Briefcase className="h-6 w-6" />
                Gestión de Vacantes
              </CardTitle>
              <CardDescription>
                Tu principal objetivo: cerrar vacantes eficientemente
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">{vacantesAbiertas.length}</span>
                <span className="text-muted-foreground">abiertas</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold">{vacantesCerradas.length}</span>
                <span className="text-muted-foreground">cerradas</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="abiertas" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="abiertas" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Abiertas ({vacantesAbiertas.length})
              </TabsTrigger>
              <TabsTrigger value="cerradas" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Cerradas ({vacantesCerradas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="abiertas" className="space-y-3">
              {vacantesAbiertas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Sin vacantes asignadas</p>
                  <p className="text-sm">Las empresas te asignarán requisiciones</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {vacantesAbiertas.map((vacante) => (
                    <div
                      key={vacante.id}
                      className={cn(
                        "p-4 border-l-4 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer",
                        getSemaforoColor(vacante.diasAbierta, vacante.publicada)
                      )}
                      onClick={() => handleVerDetalles(vacante)}
                    >
                      {/* Header con folio y semáforo */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {vacante.folio}
                        </Badge>
                        {getSemaforoBadge(vacante.diasAbierta, vacante.publicada)}
                      </div>

                      {/* Título y empresa */}
                      <h4 className="font-semibold text-base mb-1 line-clamp-1">{vacante.titulo_puesto}</h4>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                        {vacante.empresas?.nombre_empresa || `${vacante.clientes_areas?.cliente_nombre}`}
                      </p>

                      {/* Métricas principales */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-background/80 rounded-md p-2 text-center">
                          <p className="text-2xl font-bold text-foreground">{vacante.diasAbierta}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Días abierta</p>
                        </div>
                        <div className="bg-background/80 rounded-md p-2 text-center">
                          <p className="text-2xl font-bold text-foreground">{vacante.entrevistas}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entrevistas</p>
                        </div>
                      </div>

                      {/* Timeline: Asignación → Publicación */}
                      <div className="bg-background/60 rounded-md p-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="text-center">
                            <p className="text-muted-foreground">Asignada</p>
                            <p className="font-medium">{format(new Date(vacante.fecha_solicitud), "dd MMM", { locale: es })}</p>
                          </div>
                          <div className="flex-1 flex items-center justify-center px-2">
                            {vacante.diasHastaPublicacion !== null ? (
                              <>
                                <div className="h-px bg-green-400 flex-1"></div>
                                <span className="px-1 text-[10px] text-green-600 font-medium">
                                  {vacante.diasHastaPublicacion}d
                                </span>
                                <ArrowRight className="h-3 w-3 text-green-500" />
                              </>
                            ) : (
                              <>
                                <div className="h-px bg-amber-400 flex-1 border-dashed"></div>
                                <AlertTriangle className="h-3 w-3 text-amber-500 ml-1" />
                              </>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Publicada</p>
                            <p className="font-medium">
                              {vacante.fecha_publicacion 
                                ? format(new Date(vacante.fecha_publicacion), "dd MMM", { locale: es })
                                : "Pendiente"
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer con candidatos */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{vacante.postulaciones} candidatos</span>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          {vacante.publicada ? "Gestionar" : "Publicar"}
                        </Button>
                      </div>

                      {vacante.solicitud_cierre && (
                        <Badge className="w-full justify-center mt-2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Cierre solicitado - Pendiente aprobación
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cerradas" className="space-y-3">
              {vacantesCerradas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Aún sin vacantes cerradas</p>
                  <p className="text-sm">Tu objetivo es cerrar vacantes eficientemente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vacantesCerradas.map((vacante) => (
                    <div
                      key={vacante.id}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        <div>
                          <p className="font-medium">{vacante.titulo_puesto}</p>
                          <p className="text-xs text-muted-foreground">
                            {vacante.empresas?.nombre_empresa} • {vacante.folio}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {vacante.diasAbierta} días
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cerrada {vacante.fecha_cierre && format(new Date(vacante.fecha_cierre), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedVacante && (
        <GestionVacanteDialog
          open={showGestionDialog}
          onOpenChange={setShowGestionDialog}
          vacante={selectedVacante}
          onSuccess={loadVacantes}
        />
      )}
    </>
  );
};
