import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User, Copy, CheckCircle2, Clock, Briefcase, Star, Building2, Zap, TrendingUp, UserCog, MessageSquare, ClipboardList, Users, Store } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { VacantesAsignadasCard } from "@/components/reclutador/VacantesAsignadasCard";
import { EntrevistasReclutadorCard } from "@/components/reclutador/EntrevistasReclutadorCard";
import { GlobalLeaderboard } from "@/components/dashboard/GlobalLeaderboard";
import { VacantesPublicadasCard } from "@/components/reclutador/VacantesPublicadasCard";
import { PostulacionesRecibidas } from "@/components/dashboard/PostulacionesRecibidas";
import { KPICard } from "@/components/dashboard/KPICard";
import { KPIDetailModal } from "@/components/dashboard/KPIDetailModal";
import { useReclutadorStats } from "@/hooks/useReclutadorStats";
import { useReclutadorKPIDetails } from "@/hooks/useReclutadorKPIDetails";
import { EditarPerfilReclutadorDialog } from "@/components/reclutador/EditarPerfilReclutadorDialog";
import { EmpresasVinculadasCard } from "@/components/reclutador/EmpresasVinculadasCard";
import { PoolCandidatos } from "@/components/reclutador/PoolCandidatos";
import { MarketplaceReclutador } from "@/components/reclutador/MarketplaceReclutador";
import vvgiLogo from "@/assets/vvgi-logo.png";

const ReclutadorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollDirection = useScrollDirection();
  const [loading, setLoading] = useState(true);
  const [perfilReclutador, setPerfilReclutador] = useState<any>(null);
  const [invitacionesPendientes, setInvitacionesPendientes] = useState<any[]>([]);
  const [asociacionesActivas, setAsociacionesActivas] = useState<any[]>([]);
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);
  const [rankingPosition, setRankingPosition] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string>("");
  
  const { stats, loading: statsLoading } = useReclutadorStats(perfilReclutador?.id);
  const { data: detailData, columns: detailColumns, loading: detailLoading } = useReclutadorKPIDetails(
    selectedKPI, 
    perfilReclutador?.user_id
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (perfilReclutador) {
      loadRankingPosition();
    }
  }, [perfilReclutador]);

  const loadRankingPosition = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener todos los reclutadores
      const { data: reclutadores } = await supabase
        .from("perfil_reclutador")
        .select("user_id");

      if (!reclutadores) return;

      // Recalcular estadísticas de TODOS los reclutadores para tener ranking actualizado
      const recalcularPromesas = reclutadores.map(async (reclutador) => {
        try {
          await supabase.rpc('recalcular_estadisticas_reclutador', { 
            p_user_id: reclutador.user_id 
          });
        } catch (error) {
          console.error(`Error recalculando stats para ${reclutador.user_id}:`, error);
        }
      });
      
      await Promise.all(recalcularPromesas);

      // Pequeña pausa para asegurar que la BD se actualice
      await new Promise(resolve => setTimeout(resolve, 500));

      // Obtener estadísticas ACTUALIZADAS de todos los reclutadores
      const { data: estadisticas } = await supabase
        .from("estadisticas_reclutador")
        .select("user_id, vacantes_cerradas, promedio_dias_cierre");

      if (!estadisticas) return;

      // Combinar y calcular ranking_score usando la misma fórmula del modal
      const rankings = reclutadores
        .map(r => {
          const stats = estadisticas.find(e => e.user_id === r.user_id);
          const vacantesCerradas = stats?.vacantes_cerradas || 0;
          const promedioDias = stats?.promedio_dias_cierre || 0;
          
          // Calcular ranking_score: (Vacantes Cerradas * 100) - (Promedio Días * 0.5)
          let rankingScore = 0;
          if (vacantesCerradas > 0) {
            const puntosVacantes = vacantesCerradas * 100;
            const penalizacionDias = promedioDias > 0 ? promedioDias * 0.5 : 0;
            rankingScore = Math.max(0, puntosVacantes - penalizacionDias);
          }
          
          return {
            user_id: r.user_id,
            vacantes_cerradas: vacantesCerradas,
            promedio_dias_cierre: promedioDias,
            ranking_score: rankingScore,
          };
        })
        .sort((a, b) => {
          // Ordenar por ranking_score (mayor es mejor)
          const scoreA = a.ranking_score ?? 0;
          const scoreB = b.ranking_score ?? 0;
          return scoreB - scoreA;
        });

      // Encontrar posición del usuario actual
      const position = rankings.findIndex(r => r.user_id === user.id);
      if (position !== -1) {
        setRankingPosition(position + 1); // +1 porque el índice empieza en 0
      }
    } catch (error) {
      console.error("Error loading ranking position:", error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Cargar perfil de reclutador
      const { data: perfil, error: perfilError } = await supabase
        .from("perfil_reclutador")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (perfilError) throw perfilError;
      
      console.log("Perfil de reclutador cargado:", perfil);
      console.log("Código único del reclutador:", perfil?.codigo_reclutador);
      
      setPerfilReclutador(perfil);

      // Cargar invitaciones pendientes con información del administrador
      const { data: invitaciones } = await supabase
        .from("invitaciones_reclutador")
        .select(`
          *,
          empresas (
            nombre_empresa,
            sector,
            created_by,
            email_contacto
          )
        `)
        .eq("reclutador_id", perfil.id)
        .eq("estado", "pendiente")
        .order("created_at", { ascending: false });

      setInvitacionesPendientes(invitaciones || []);

      // Cargar asociaciones con información completa de empresas (todas, no solo activas)
      const { data: asociaciones } = await supabase
        .from("reclutador_empresa")
        .select(`
          *,
          empresas (
            id,
            nombre_empresa,
            sector,
            descripcion_empresa,
            sitio_web,
            tamano_empresa,
            ciudad,
            estado,
            pais
          )
        `)
        .eq("reclutador_id", perfil.id)
        .eq("estado", "activa")
        .order("created_at", { ascending: false });

      setAsociacionesActivas(asociaciones || []);
    } catch (error: any) {
      toast({
        title: "Error al cargar datos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (perfilReclutador?.codigo_reclutador) {
      // Copiar código tal como está (en minúsculas, sin modificar)
      const codigo = perfilReclutador.codigo_reclutador.trim();
      navigator.clipboard.writeText(codigo);
      toast({
        title: "✅ Código copiado",
        description: `Tu código ${codigo} ha sido copiado al portapapeles`,
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo copiar el código. Intenta recargar la página.",
        variant: "destructive",
      });
    }
  };

  const handleAceptarInvitacion = async (invitacionId: string, empresaId: string, tipoVinculacion: string) => {
    try {
      // Actualizar estado de invitación
      const { error: updateError } = await supabase
        .from("invitaciones_reclutador")
        .update({ estado: "aceptada" })
        .eq("id", invitacionId);

      if (updateError) throw updateError;

      // SIEMPRE crear NUEVA asociación - NUNCA actualizar registros históricos
      const { error: asociacionError } = await supabase
        .from("reclutador_empresa")
        .insert([{
          reclutador_id: perfilReclutador.id,
          empresa_id: empresaId,
          tipo_vinculacion: tipoVinculacion as "interno" | "freelance",
          estado: "activa",
          es_asociacion_activa: true,
        }]);

      if (asociacionError) throw asociacionError;

      toast({
        title: "✅ Invitación aceptada",
        description: "Ahora puedes trabajar con esta empresa",
      });

      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Error al aceptar invitación",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRechazarInvitacion = async (invitacionId: string) => {
    try {
      const { error } = await supabase
        .from("invitaciones_reclutador")
        .update({ estado: "rechazada" })
        .eq("id", invitacionId);

      if (error) throw error;

      toast({
        title: "Invitación rechazada",
        description: "La invitación ha sido rechazada",
      });

      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Error al rechazar invitación",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate("/auth");
  };

  const handleKPIClick = (kpiTitle: string) => {
    setSelectedKPI(kpiTitle);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
      }`}>
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
              <img src={vvgiLogo} alt="VVGI" className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                  Oficina de {perfilReclutador?.nombre_reclutador || "Reclutador"}
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap mt-1">
                  {rankingPosition && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-md hover:shadow-primary/20">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary fill-primary animate-pulse" />
                      <span className="text-sm sm:text-base font-bold bg-gradient-primary bg-clip-text text-transparent">
                        <span className="hidden sm:inline">Lugar </span>#{rankingPosition}
                      </span>
                      <span className="hidden md:inline text-xs text-muted-foreground ml-1">
                        / Ranking Global
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditarPerfilOpen(true)}
                className="hidden sm:flex"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Mejorar Perfil
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setEditarPerfilOpen(true)}
                className="sm:hidden"
              >
                <UserCog className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:flex">
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </Button>
              <Button variant="outline" size="icon" onClick={handleSignOut} className="sm:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="resumen" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5 gap-1 h-auto p-1 lg:w-[1000px]">
            <TabsTrigger value="resumen" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 flex-col sm:flex-row gap-1 sm:gap-2">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="gestion" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 flex-col sm:flex-row gap-1 sm:gap-2">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Gestión</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 flex-col sm:flex-row gap-1 sm:gap-2">
              <Store className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="pool" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 flex-col sm:flex-row gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Pool</span>
            </TabsTrigger>
            <TabsTrigger value="mensajes" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 flex-col sm:flex-row gap-1 sm:gap-2">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: RESUMEN */}
          <TabsContent value="resumen" className="space-y-4 sm:space-y-6">
            
            {/* Invitaciones Pendientes - PRIORIDAD MÁXIMA */}
            {invitacionesPendientes.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 sm:h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg sm:text-2xl font-bold">¡Invitaciones Pendientes!</h2>
                </div>
                <div className="space-y-3">
                  {invitacionesPendientes.map((invitacion) => (
                    <Card key={invitacion.id} className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background shadow-lg hover:shadow-xl transition-all">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              <CardTitle className="text-xl">
                                Nueva Invitación de Colaboración
                              </CardTitle>
                            </div>
                            
                            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg border border-border/50 space-y-2">
                              <p className="text-sm leading-relaxed">
                                La empresa{' '}
                                <span className="font-bold text-primary text-base">
                                  {invitacion.empresas?.nombre_empresa || 'Empresa'}
                                </span>
                                {' '}te invita a trabajar como{' '}
                                <span className="font-bold text-foreground">
                                  {invitacion.tipo_vinculacion === 'interno' ? 'Reclutador Interno' : 'Reclutador Freelance'}
                                </span>
                              </p>
                              
                              {invitacion.empresas?.sector && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                                  <Badge variant="outline" className="font-normal">
                                    {invitacion.empresas.sector}
                                  </Badge>
                                </div>
                              )}
                              
                              {invitacion.empresas?.email_contacto && (
                                <p className="text-xs text-muted-foreground pt-1">
                                  Contacto: {invitacion.empresas.email_contacto}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <Badge 
                            variant={invitacion.tipo_vinculacion === 'interno' ? 'default' : 'secondary'}
                            className="text-sm px-3 py-1"
                          >
                            {invitacion.tipo_vinculacion === 'interno' ? 'Interno' : 'Freelance'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {invitacion.mensaje && (
                          <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
                              Mensaje de la Empresa
                            </p>
                            <p className="text-sm text-foreground/90 italic leading-relaxed">
                              "{invitacion.mensaje}"
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                          <Button
                            onClick={() => handleAceptarInvitacion(
                              invitacion.id,
                              invitacion.empresa_id,
                              invitacion.tipo_vinculacion
                            )}
                            className="flex-1 h-10 sm:h-11"
                            size="lg"
                          >
                            <CheckCircle2 className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                            <span className="text-sm sm:text-base">Aceptar Invitación</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRechazarInvitacion(invitacion.id)}
                            className="flex-1 h-10 sm:h-11"
                            size="lg"
                          >
                            <span className="text-sm sm:text-base">Rechazar</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

        {/* Empresas Vinculadas - TARJETA PERMANENTE */}
        <EmpresasVinculadasCard 
          asociaciones={asociacionesActivas} 
          onDesvincularSuccess={loadDashboardData}
        />

        {/* Perfil y Código Único */}
        <section className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {/* Código Único */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Tu Código Único
                </CardTitle>
                <CardDescription>
                  Comparte este código con empresas para que te inviten a colaborar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {perfilReclutador?.codigo_reclutador ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border-2 border-primary/20">
                      <code className="text-2xl font-bold font-mono tracking-wider flex-1 text-primary select-all">
                        {perfilReclutador.codigo_reclutador}
                      </code>
                      <Button size="icon" variant="ghost" onClick={handleCopyCode} title="Copiar código">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Haz clic en el botón <Copy className="h-3 w-3 inline" /> para copiar tu código y compartirlo con empresas
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Código no disponible</p>
                    <p className="text-xs">Contacta a soporte si el problema persiste</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan y Estado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Plan de Suscripción
                </CardTitle>
                <CardDescription>
                  Tu plan actual y beneficios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan actual:</span>
                  <Badge variant="secondary">Básico (Gratuito)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Asociaciones simultáneas:</span>
                  <span className="font-semibold">1 empresa</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Actualiza a Premium para obtener:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Hasta 5 asociaciones simultáneas</li>
                    <li>Acceso a pool de candidatos premium</li>
                    <li>Baterías psicométricas</li>
                    <li>IA para sourcing automático</li>
                    <li>Publicaciones destacadas</li>
                  </ul>
                </div>
                <Button className="w-full" disabled>
                  <Zap className="mr-2 h-4 w-4" />
                  Actualizar a Premium (Próximamente)
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Indicadores de Performance */}
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-xl font-bold">Indicadores de Performance</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Promedio Cierre"
              value={stats.promedioDiasCierre}
              unit="días"
              icon={<Clock className="h-5 w-5" />}
              onDoubleClick={() => handleKPIClick("Promedio Cierre")}
            />
            <KPICard
              title="Vacantes Cerradas"
              value={stats.vacantesCerradas}
              icon={<CheckCircle2 className="h-5 w-5" />}
              onDoubleClick={() => handleKPIClick("Vacantes Cerradas")}
            />
            <KPICard
              title="Entrevistas / Cierre"
              value={stats.porcentajeExito}
              unit="%"
              icon={<TrendingUp className="h-5 w-5" />}
              onDoubleClick={() => handleKPIClick("Entrevistas / Cierre")}
            />
            <KPICard
              title="Calificación"
              value={stats.calificacionPromedio}
              unit={`★ (${stats.totalCalificaciones})`}
              icon={<Star className="h-5 w-5" />}
              onDoubleClick={() => handleKPIClick("Calificación")}
            />
          </div>
        </section>

        {/* Gestión de Vacantes y Entrevistas */}
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-xl font-bold">Mi Trabajo</h2>
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <VacantesAsignadasCard reclutadorId={perfilReclutador?.id} />
            <EntrevistasReclutadorCard reclutadorUserId={perfilReclutador?.user_id} />
          </div>
        </section>

        {/* Estadísticas Rápidas */}
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-xl font-bold">Resumen</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="hover:shadow-elegant transition-all duration-300 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Invitaciones Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary opacity-60" />
                  <span className="text-3xl font-bold tracking-tight">{invitacionesPendientes.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-all duration-300 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Empresas Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary opacity-60" />
                  <span className="text-3xl font-bold tracking-tight">{asociacionesActivas.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-all duration-300 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vacantes Asignadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-8 w-8 text-primary opacity-60" />
                  <span className="text-3xl font-bold tracking-tight">{stats.vacantesAsignadas}</span>
                </div>
              </CardContent>
            </Card>

            <VacantesPublicadasCard count={stats.vacantesPublicadas} loading={statsLoading} />
          </div>
        </section>



        {/* Ranking Global de Reclutadores */}
        <section className="pt-4">
          <GlobalLeaderboard />
        </section>

        {/* Estado Vacío - Solo mostrar si no hay invitaciones NI asociaciones NI trabajo activo */}
        {invitacionesPendientes.length === 0 && asociacionesActivas.length === 0 && (
          <section>
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aún no tienes colaboraciones</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  Comparte tu código único con empresas para que te inviten a colaborar en sus procesos de reclutamiento.
                </p>
                <Button onClick={handleCopyCode} variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar mi código
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
          </TabsContent>

          {/* TAB: GESTIÓN DE VACANTES */}
          <TabsContent value="gestion" className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">Gestión de Vacantes Publicadas</h2>
                <p className="text-sm text-muted-foreground">
                  Administra tus vacantes publicadas en el marketplace
                </p>
              </div>

              {/* Postulaciones Recibidas Component */}
              <PostulacionesRecibidas />
            </div>
          </TabsContent>

          {/* TAB: MARKETPLACE */}
          <TabsContent value="marketplace" className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">Mis Vacantes en Marketplace</h2>
                <p className="text-sm text-muted-foreground">
                  Visualiza tus vacantes publicadas en el marketplace público
                </p>
              </div>

              <MarketplaceReclutador reclutadorUserId={perfilReclutador?.user_id} />
            </div>
          </TabsContent>

          {/* TAB: POOL DE CANDIDATOS */}
          <TabsContent value="pool" className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">Pool de Candidatos</h2>
                <p className="text-sm text-muted-foreground">
                  Explora candidatos registrados en la plataforma
                </p>
              </div>

              <PoolCandidatos reclutadorId={perfilReclutador.id} />
            </div>
          </TabsContent>

          {/* TAB: MENSAJES */}
          <TabsContent value="mensajes" className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">Centro de Comunicación</h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona tus conversaciones con candidatos
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Mensajes con Candidatos</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Accede al chat con cada candidato desde la sección de Postulaciones Recibidas en "Gestión de Vacantes"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de detalles de KPI */}
      <KPIDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={selectedKPI}
        description="Datos detallados del indicador seleccionado"
        data={detailData}
        columns={detailColumns}
        loading={detailLoading}
      />

      {/* Modal de edición de perfil */}
      {perfilReclutador && (
        <EditarPerfilReclutadorDialog
          open={editarPerfilOpen}
          onOpenChange={setEditarPerfilOpen}
          reclutadorId={perfilReclutador.id}
          onUpdate={loadDashboardData}
        />
      )}
    </div>
  );
};

export default ReclutadorDashboard;
