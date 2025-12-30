import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User, Copy, CheckCircle2, Clock, Briefcase, Star, Building2, Zap, TrendingUp, UserCog, MessageSquare, ClipboardList, Users, Store, FileSearch, ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VacantesGestionCard } from "@/components/reclutador/VacantesGestionCard";
import { EntrevistasCalendarioCard } from "@/components/reclutador/EntrevistasCalendarioCard";
import { GlobalLeaderboard } from "@/components/dashboard/GlobalLeaderboard";
import { VacantesPublicadasCard } from "@/components/reclutador/VacantesPublicadasCard";
import { PostulacionesRecibidas } from "@/components/dashboard/PostulacionesRecibidas";
import { KPICard } from "@/components/dashboard/KPICard";
import { KPIDetailModal } from "@/components/dashboard/KPIDetailModal";
import { useReclutadorStats } from "@/hooks/useReclutadorStats";
import { useReclutadorKPIDetails } from "@/hooks/useReclutadorKPIDetails";
import { calcularRankingGlobal } from "@/utils/rankingCalculations";
import { EditarPerfilReclutadorDialog } from "@/components/reclutador/EditarPerfilReclutadorDialog";
import { EmpresasVinculadasCard } from "@/components/reclutador/EmpresasVinculadasCard";
import { PoolCandidatos } from "@/components/reclutador/PoolCandidatos";
import { MarketplaceReclutador } from "@/components/reclutador/MarketplaceReclutador";
import { SolicitarEstudioDialog } from "@/components/reclutador/SolicitarEstudioDialog";
import { EstudiosSolicitadosCard } from "@/components/reclutador/EstudiosSolicitadosCard";
import { AttentionBadgesReclutador } from "@/components/reclutador/AttentionBadgesReclutador";
import { ObjetivosPersonalesCard } from "@/components/reclutador/ObjetivosPersonalesCard";
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
  const [solicitarEstudioOpen, setSolicitarEstudioOpen] = useState(false);
  const [perfilExpanded, setPerfilExpanded] = useState(false);
  
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

      const hace28Dias = new Date();
      hace28Dias.setDate(hace28Dias.getDate() - 28);
      const fechaLimite = hace28Dias.toISOString().split('T')[0];

      const { data: perfiles } = await supabase
        .from('perfil_reclutador')
        .select('id, user_id, nombre_reclutador');

      const { data: vacantes } = await supabase
        .from('vacantes')
        .select('reclutador_asignado_id, estatus, fecha_cierre, fecha_solicitud')
        .eq('estatus', 'cerrada')
        .not('fecha_cierre', 'is', null)
        .gte('fecha_cierre', fechaLimite);

      if (!perfiles || !vacantes) return;

      const statsMap = new Map();
      
      perfiles.forEach(perfil => {
        const vacantesReclutador = vacantes.filter(v => v.reclutador_asignado_id === perfil.id);
        
        let promedioDias = 0;
        if (vacantesReclutador.length > 0) {
          const totalDias = vacantesReclutador.reduce((sum, v) => {
            if (v.fecha_cierre && v.fecha_solicitud) {
              const dias = Math.floor(
                (new Date(v.fecha_cierre).getTime() - new Date(v.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + dias;
            }
            return sum;
          }, 0);
          promedioDias = totalDias / vacantesReclutador.length;
        }
        
        statsMap.set(perfil.user_id, {
          user_id: perfil.user_id,
          nombre_reclutador: perfil.nombre_reclutador,
          vacantes_cerradas: vacantesReclutador.length,
          promedio_dias_cierre: promedioDias
        });
      });

      const reclutadoresData = Array.from(statsMap.values());
      const rankingCalculado = calcularRankingGlobal(reclutadoresData);

      const userRanking = rankingCalculado.find(r => r.user_id === user.id);
      if (userRanking) {
        setRankingPosition(userRanking.posicion);
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

      const { data: perfil, error: perfilError } = await supabase
        .from("perfil_reclutador")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (perfilError) throw perfilError;
      
      setPerfilReclutador(perfil);

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
            pais,
            email_contacto,
            telefono_contacto
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
      const { error: updateError } = await supabase
        .from("invitaciones_reclutador")
        .update({ estado: "aceptada" })
        .eq("id", invitacionId);

      if (updateError) throw updateError;

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
      {/* Header Mejorado - UI/UX Optimizado */}
      <header className={`sticky top-0 z-50 w-full bg-background/98 backdrop-blur-md supports-[backdrop-filter]:bg-background/95 transition-all duration-300 shadow-sm ${
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
      }`}>
        {/* Barra superior con gradiente sutil */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
        
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* ZONA IZQUIERDA: Branding e Identidad */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Logo con efecto hover */}
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <img 
                  src={vvgiLogo} 
                  alt="VVGI" 
                  className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0 relative z-10 transition-transform group-hover:scale-105" 
                />
              </div>
              
              {/* Información del reclutador */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    Oficina de{" "}
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                      {perfilReclutador?.nombre_reclutador || "Reclutador"}
                    </span>
                  </h1>
                </div>
                
                {/* Badge de ranking destacado */}
                {rankingPosition && (
                  <div className="inline-flex items-center gap-1.5 mt-1">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        #{rankingPosition}
                      </span>
                      <span className="text-xs text-amber-600/70 dark:text-amber-400/70 hidden sm:inline">
                        Ranking Global
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* ZONA DERECHA: Acciones Principales */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Acción Principal - Mi Perfil */}
              <Button
                onClick={() => setEditarPerfilOpen(true)}
                className="hidden sm:flex h-9 px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Mi Perfil
              </Button>
              <Button
                size="icon"
                onClick={() => setEditarPerfilOpen(true)}
                className="sm:hidden h-9 w-9 bg-gradient-to-r from-primary to-primary/80"
              >
                <UserCog className="h-4 w-4" />
              </Button>
              
              {/* Separador visual */}
              <div className="hidden sm:block h-6 w-px bg-border" />
              
              {/* Acciones Secundarias */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/wallet-reclutador")}
                  className="hidden sm:flex h-9 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Wallet className="mr-1.5 h-4 w-4" />
                  Mi Wallet
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/wallet-reclutador")}
                  className="sm:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary"
                >
                  <Wallet className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSolicitarEstudioOpen(true)}
                  className="hidden sm:flex h-9 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <FileSearch className="mr-1.5 h-4 w-4" />
                  Solicitar Estudio
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSolicitarEstudioOpen(true)}
                  className="sm:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary"
                >
                  <FileSearch className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut} 
                  className="hidden sm:flex h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Salir
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut} 
                  className="sm:hidden h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="resumen" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5 gap-1 h-auto p-1 lg:w-[800px]">
            <TabsTrigger value="resumen" className="text-xs sm:text-sm px-2 py-2 flex-col sm:flex-row gap-1 sm:gap-2">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="gestion" className="text-xs sm:text-sm px-2 py-2 flex-col sm:flex-row gap-1 sm:gap-2">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Gestión</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="text-xs sm:text-sm px-2 py-2 flex-col sm:flex-row gap-1 sm:gap-2">
              <Store className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Market</span>
            </TabsTrigger>
            <TabsTrigger value="pool" className="text-xs sm:text-sm px-2 py-2 flex-col sm:flex-row gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Pool</span>
            </TabsTrigger>
            <TabsTrigger value="mensajes" className="text-xs sm:text-sm px-2 py-2 flex-col sm:flex-row gap-1 sm:gap-2">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: RESUMEN - Reorganizado para UX óptima */}
          <TabsContent value="resumen" className="space-y-4 sm:space-y-6">
            
            {/* ══════════════════════════════════════════════════════════════════
                ZONA 1: ATENCIÓN INMEDIATA - Lo que necesita acción AHORA
            ══════════════════════════════════════════════════════════════════ */}
            
            {/* Invitaciones Pendientes - MÁXIMA PRIORIDAD */}
            {invitacionesPendientes.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg font-bold">¡Invitaciones Pendientes!</h2>
                  <Badge variant="destructive" className="animate-pulse">{invitacionesPendientes.length}</Badge>
                </div>
                <div className="space-y-3">
                  {invitacionesPendientes.map((invitacion) => (
                    <Card key={invitacion.id} className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
                      <CardContent className="py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Building2 className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-semibold text-primary">
                                {invitacion.empresas?.nombre_empresa || 'Empresa'}
                              </span>
                              <Badge variant={invitacion.tipo_vinculacion === 'interno' ? 'default' : 'secondary'} className="text-xs">
                                {invitacion.tipo_vinculacion === 'interno' ? 'Interno' : 'Freelance'}
                              </Badge>
                            </div>
                            {invitacion.mensaje && (
                              <p className="text-sm text-muted-foreground italic">"{invitacion.mensaje}"</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleAceptarInvitacion(invitacion.id, invitacion.empresa_id, invitacion.tipo_vinculacion)}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              Aceptar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleRechazarInvitacion(invitacion.id)}>
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* AttentionBadges - Acciones Pendientes */}
            {perfilReclutador?.user_id && (
              <AttentionBadgesReclutador 
                reclutadorUserId={perfilReclutador.user_id} 
                reclutadorId={perfilReclutador.id}
              />
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ZONA 2: TRABAJO PRINCIPAL - El corazón del workflow diario
            ══════════════════════════════════════════════════════════════════ */}
            
            {/* Layout de 2 columnas en desktop para trabajo principal */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Vacantes - Ocupa 2/3 del espacio */}
              <div className="lg:col-span-2">
                <VacantesGestionCard reclutadorId={perfilReclutador?.id} />
              </div>
              
              {/* Panel lateral derecho */}
              <div className="space-y-4">
                {/* Objetivos Personales - Prominente */}
                <ObjetivosPersonalesCard
                  vacantesCerradasMes={stats.vacantesCerradasMes}
                  entrevistasRealizadasMes={stats.entrevistasRealizadasMes}
                  promedioDiasCierre={stats.promedioDiasCierre}
                  calificacionPromedio={stats.calificacionPromedio}
                />
                
                {/* KPIs Compactos */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Indicadores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleKPIClick("Promedio Cierre")}
                      className="text-left p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Promedio</span>
                      </div>
                      <p className="text-lg font-bold">{stats.promedioDiasCierre}<span className="text-xs font-normal text-muted-foreground ml-1">días</span></p>
                    </button>
                    
                    <button 
                      onClick={() => handleKPIClick("Vacantes Cerradas")}
                      className="text-left p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Cerradas</span>
                      </div>
                      <p className="text-lg font-bold">{stats.vacantesCerradas}</p>
                    </button>
                    
                    <button 
                      onClick={() => handleKPIClick("Entrevistas / Cierre")}
                      className="text-left p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Conversión</span>
                      </div>
                      <p className="text-lg font-bold">{stats.porcentajeExito}<span className="text-xs font-normal text-muted-foreground ml-1">%</span></p>
                    </button>
                    
                    <button 
                      onClick={() => handleKPIClick("Calificación")}
                      className="text-left p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Star className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Rating</span>
                      </div>
                      <p className="text-lg font-bold">{stats.calificacionPromedio}<span className="text-xs font-normal text-muted-foreground ml-1">★</span></p>
                    </button>
                  </CardContent>
                </Card>

                {/* Resumen Compacto */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Estado Actual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-xs text-muted-foreground">Empresas activas</span>
                      <Badge variant="secondary" className="font-mono">{asociacionesActivas.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-xs text-muted-foreground">Vacantes asignadas</span>
                      <Badge variant="secondary" className="font-mono">{stats.vacantesAsignadas}</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-muted-foreground">Vacantes publicadas</span>
                      <Badge variant="secondary" className="font-mono">{stats.vacantesPublicadas}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Calendario de Entrevistas y Estudios Solicitados */}
            <div className="grid gap-4 lg:grid-cols-2">
              <EntrevistasCalendarioCard reclutadorUserId={perfilReclutador?.user_id} />
              <EstudiosSolicitadosCard reclutadorUserId={perfilReclutador?.user_id} />
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                ZONA 3: EMPRESAS COLABORADORAS - Información importante para vender vacantes
            ══════════════════════════════════════════════════════════════════ */}
            
            {/* Empresas Vinculadas - VISIBLE para que el reclutador tenga info de la empresa */}
            <EmpresasVinculadasCard 
              asociaciones={asociacionesActivas} 
              onDesvincularSuccess={loadDashboardData}
            />

            {/* ══════════════════════════════════════════════════════════════════
                ZONA 4: INFORMACIÓN SECUNDARIA - Colapsable
            ══════════════════════════════════════════════════════════════════ */}
            
            <Collapsible open={perfilExpanded} onOpenChange={setPerfilExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-10 px-3 hover:bg-muted/50">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Configuración y Suscripción
                  </span>
                  {perfilExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">

                <div className="grid gap-4 md:grid-cols-1">

                  {/* Plan de Suscripción */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Plan de Suscripción
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Plan actual:</span>
                        <Badge variant="secondary">Básico</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Asociaciones:</span>
                        <span className="text-sm font-medium">1 empresa</span>
                      </div>
                      <Separator />
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium">Premium incluye:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                          <li>Hasta 5 asociaciones</li>
                          <li>Pool premium + IA sourcing</li>
                          <li>Baterías psicométricas</li>
                        </ul>
                      </div>
                      <Button className="w-full h-8 text-xs" disabled>
                        <Zap className="mr-1.5 h-3.5 w-3.5" />
                        Próximamente
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* ══════════════════════════════════════════════════════════════════
                ZONA 4: RANKING Y COMUNIDAD
            ══════════════════════════════════════════════════════════════════ */}
            
            <GlobalLeaderboard />

            {/* Estado Vacío */}
            {invitacionesPendientes.length === 0 && asociacionesActivas.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aún no tienes colaboraciones</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-4">
                    Comparte tu código único con empresas para que te inviten a colaborar.
                  </p>
                  <Button onClick={handleCopyCode} variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar mi código
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: GESTIÓN DE VACANTES */}
          <TabsContent value="gestion" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Gestión de Postulaciones</h2>
                <p className="text-sm text-muted-foreground">
                  Administra las postulaciones de tus vacantes publicadas
                </p>
              </div>
              <PostulacionesRecibidas />
            </div>
          </TabsContent>

          {/* TAB: MARKETPLACE */}
          <TabsContent value="marketplace" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Mis Vacantes en Marketplace</h2>
                <p className="text-sm text-muted-foreground">
                  Visualiza tus vacantes publicadas en el marketplace público
                </p>
              </div>
              <MarketplaceReclutador reclutadorUserId={perfilReclutador?.user_id} />
            </div>
          </TabsContent>

          {/* TAB: POOL DE CANDIDATOS */}
          <TabsContent value="pool" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Pool de Candidatos</h2>
                <p className="text-sm text-muted-foreground">
                  Explora candidatos registrados en la plataforma
                </p>
              </div>
              <PoolCandidatos reclutadorId={perfilReclutador.id} />
            </div>
          </TabsContent>

          {/* TAB: MENSAJES */}
          <TabsContent value="mensajes" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Centro de Comunicación</h2>
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
                      Accede al chat desde la pestaña "Gestión" al revisar cada postulación
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales */}
      <KPIDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={selectedKPI}
        description="Datos detallados del indicador seleccionado"
        data={detailData}
        columns={detailColumns}
        loading={detailLoading}
      />

      {perfilReclutador && (
        <EditarPerfilReclutadorDialog
          open={editarPerfilOpen}
          onOpenChange={setEditarPerfilOpen}
          reclutadorId={perfilReclutador.id}
          onUpdate={loadDashboardData}
        />
      )}

      {perfilReclutador && (
        <SolicitarEstudioDialog
          open={solicitarEstudioOpen}
          onOpenChange={setSolicitarEstudioOpen}
          reclutadorId={perfilReclutador.user_id}
        />
      )}
    </div>
  );
};

export default ReclutadorDashboard;
