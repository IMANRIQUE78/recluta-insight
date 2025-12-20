import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { KPIDetailModal } from "@/components/dashboard/KPIDetailModal";
import { VacanteForm } from "@/components/dashboard/VacanteForm";
import { VacantesTable } from "@/components/dashboard/VacantesTable";
import { VacanteDetailModal } from "@/components/dashboard/VacanteDetailModal";
import { ReclutadorProfileModal } from "@/components/dashboard/ReclutadorProfileModal";
import { InvitarReclutadorDialog } from "@/components/dashboard/InvitarReclutadorDialog";
import { ReclutadoresAsociadosTable } from "@/components/dashboard/ReclutadoresAsociadosTable";
import { AttentionBadges } from "@/components/dashboard/AttentionBadges";
import { HistorialVacantesModal } from "@/components/dashboard/HistorialVacantesModal";
import { useKPIs } from "@/hooks/useKPIs";
import { useKPIDetails } from "@/hooks/useKPIDetails";
import { supabase } from "@/integrations/supabase/client";
import { 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  XCircle,
  Award,
  UserCheck,
  Plus,
  UserPlus,
  Brain,
  Crown,
  BarChart3,
  Briefcase,
  History
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string>("");
  const [requisicionFormOpen, setRequisicionFormOpen] = useState(false);
  const [invitarReclutadorOpen, setInvitarReclutadorOpen] = useState(false);
  const [selectedVacante, setSelectedVacante] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [reclutadorProfileOpen, setReclutadorProfileOpen] = useState(false);
  const [selectedReclutadorId, setSelectedReclutadorId] = useState<string>("");
  const [selectedAsociacionId, setSelectedAsociacionId] = useState<string | undefined>(undefined);
  const [historialOpen, setHistorialOpen] = useState(false);
  
  // Filtros globales
  const [clientes, setClientes] = useState<Array<{ id: string; cliente_nombre: string; area: string }>>([]);
  const [reclutadores, setReclutadores] = useState<Array<{ id: string; nombre: string }>>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>("todos");
  const [selectedReclutador, setSelectedReclutador] = useState<string>("todos");
  const [selectedEstatus, setSelectedEstatus] = useState<string>("todos");
  
  const { kpis: kpiData, loading: kpiLoading } = useKPIs(refreshTrigger, selectedCliente, selectedReclutador, selectedEstatus);
  const { data: detailData, columns: detailColumns, loading: detailLoading } = useKPIDetails(selectedKPI);

  useEffect(() => {
    loadFilters();

    // Escuchar evento para abrir perfil de reclutador
    const handleOpenReclutadorProfile = (event: any) => {
      const { reclutadorId, asociacionId } = event.detail;
      setSelectedReclutadorId(reclutadorId);
      setSelectedAsociacionId(asociacionId);
      setReclutadorProfileOpen(true);
    };

    window.addEventListener('openReclutadorProfile', handleOpenReclutadorProfile as EventListener);

    return () => {
      window.removeEventListener('openReclutadorProfile', handleOpenReclutadorProfile as EventListener);
    };
  }, []);

  const loadFilters = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clientesData } = await supabase
      .from("clientes_areas")
      .select("id, cliente_nombre, area")
      .eq("user_id", user.id)
      .order("cliente_nombre", { ascending: true });

    // Obtener empresa del usuario desde user_roles
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("empresa_id")
      .eq("user_id", user.id)
      .eq("role", "admin_empresa")
      .maybeSingle();

    let formattedReclutadores: any[] = [];

    if (userRole?.empresa_id) {
      // Cargar reclutadores asociados a la empresa
      const { data: asociaciones } = await supabase
        .from("reclutador_empresa")
        .select("reclutador_id")
        .eq("empresa_id", userRole.empresa_id)
        .eq("estado", "activa");

      if (asociaciones && asociaciones.length > 0) {
        const reclutadorIds = asociaciones.map(a => a.reclutador_id);
        const { data: perfiles } = await supabase
          .from("perfil_reclutador")
          .select("id, nombre_reclutador")
          .in("id", reclutadorIds);

        // Usar perfil_reclutador.id para filtros (coincide con vacantes.reclutador_asignado_id)
        formattedReclutadores = perfiles?.map(perfil => ({
          id: perfil.id,
          nombre: perfil.nombre_reclutador
        })) || [];
      }
    }

    if (clientesData) setClientes(clientesData);
    setReclutadores(formattedReclutadores);
  };

  const handleKPIDoubleClick = (kpiTitle: string) => {
    console.log("Opening modal for:", kpiTitle);
    setSelectedKPI(kpiTitle);
    setModalOpen(true);
  };

  const kpis = [
    {
      title: "Tiempo Promedio de Cobertura",
      value: kpiData.tiempoPromedioCobertura,
      unit: "días",
      icon: <Clock className="h-4 w-4" />,
      category: "operativo"
    },
    {
      title: "Tasa de Éxito de Cierre",
      value: kpiData.tasaExitoCierre,
      unit: "%",
      icon: <Target className="h-4 w-4" />,
      category: "operativo"
    },
    {
      title: "Vacantes Abiertas",
      value: kpiData.vacantesAbiertas,
      icon: <TrendingUp className="h-4 w-4" />,
      category: "operativo"
    },
    {
      title: "Tasa de Cancelación",
      value: kpiData.tasaCancelacion,
      unit: "%",
      icon: <XCircle className="h-4 w-4" />,
      category: "operativo"
    },
    {
      title: "Costo por Contratación",
      value: kpiData.costoPromedioContratacion > 0 
        ? `$${kpiData.costoPromedioContratacion.toLocaleString()}` 
        : "$0",
      icon: <DollarSign className="h-4 w-4" />,
      category: "financiero"
    },
    {
      title: "Satisfacción del Cliente",
      value: kpiData.satisfaccionCliente,
      unit: "/5",
      icon: <Award className="h-4 w-4" />,
      category: "calidad"
    },
    {
      title: "Tasa de Rotación",
      value: kpiData.tasaRotacion,
      unit: "%",
      icon: <Users className="h-4 w-4" />,
      category: "calidad"
    },
    {
      title: "Entrevistados vs Contratados",
      value: kpiData.entrevistadosVsContratados,
      icon: <UserCheck className="h-4 w-4" />,
      category: "operativo"
    },
  ];

  const handleVacanteSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        clientes={clientes}
        reclutadores={reclutadores}
        selectedCliente={selectedCliente}
        selectedReclutador={selectedReclutador}
        selectedEstatus={selectedEstatus}
        onClienteChange={setSelectedCliente}
        onReclutadorChange={setSelectedReclutador}
        onEstatusChange={setSelectedEstatus}
      />
      
      <div className="container mx-auto px-4 py-6">
        {/* Action Bar - Prominente y siempre visible */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button 
            onClick={() => setRequisicionFormOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Requisición
          </Button>
          <Button 
            variant="outline"
            onClick={() => setInvitarReclutadorOpen(true)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invitar Reclutador
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/nom035")}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            NOM-035
            <Badge variant="outline" className="ml-1 bg-primary/10 text-primary border-primary/20 text-[10px]">
              <Crown className="h-2.5 w-2.5 mr-0.5" />
              PRO
            </Badge>
          </Button>
        </div>

        {/* Layout Principal: 2 columnas en desktop */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Columna Principal */}
          <div className="space-y-6">
            {/* KPIs Section - Destacado con tabs */}
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Indicadores Clave</CardTitle>
                      <CardDescription>Click en cualquier indicador para ver detalles</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Tabs defaultValue="todos" className="w-full">
                  <TabsList className="mb-4 w-full justify-start bg-muted/50">
                    <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
                    <TabsTrigger value="operativo" className="text-xs">Operativos</TabsTrigger>
                    <TabsTrigger value="financiero" className="text-xs">Financieros</TabsTrigger>
                    <TabsTrigger value="calidad" className="text-xs">Calidad</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="todos" className="mt-0">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {kpis.map((kpi, idx) => (
                        <KPICard 
                          key={idx} 
                          title={kpi.title}
                          value={kpi.value}
                          unit={kpi.unit}
                          icon={kpi.icon}
                          onDoubleClick={() => handleKPIDoubleClick(kpi.title)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="operativo" className="mt-0">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {kpis.filter(k => k.category === "operativo").map((kpi, idx) => (
                        <KPICard 
                          key={idx} 
                          title={kpi.title}
                          value={kpi.value}
                          unit={kpi.unit}
                          icon={kpi.icon}
                          onDoubleClick={() => handleKPIDoubleClick(kpi.title)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="financiero" className="mt-0">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {kpis.filter(k => k.category === "financiero").map((kpi, idx) => (
                        <KPICard 
                          key={idx} 
                          title={kpi.title}
                          value={kpi.value}
                          unit={kpi.unit}
                          icon={kpi.icon}
                          onDoubleClick={() => handleKPIDoubleClick(kpi.title)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="calidad" className="mt-0">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {kpis.filter(k => k.category === "calidad").map((kpi, idx) => (
                        <KPICard 
                          key={idx} 
                          title={kpi.title}
                          value={kpi.value}
                          unit={kpi.unit}
                          icon={kpi.icon}
                          onDoubleClick={() => handleKPIDoubleClick(kpi.title)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Forecast Chart */}
            <ForecastChart 
              selectedCliente={selectedCliente}
              selectedReclutador={selectedReclutador}
              selectedEstatus={selectedEstatus}
            />

            {/* Requisiciones Internas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle>Requisiciones Internas</CardTitle>
                      <CardDescription>Solicitudes de contratación de la empresa</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setHistorialOpen(true)}
                    className="gap-2"
                  >
                    <History className="h-4 w-4" />
                    Ver Historial Completo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <VacantesTable 
                  onSelectVacante={(vacante) => setSelectedVacante(vacante)} 
                  refreshTrigger={refreshTrigger}
                />
              </CardContent>
            </Card>

            {/* Reclutadores Asociados */}
            <ReclutadoresAsociadosTable />
          </div>

          {/* Columna Lateral - Atención y Alertas */}
          <div className="space-y-6">
            <AttentionBadges 
              refreshTrigger={refreshTrigger}
              onItemClick={(item) => {
                if (item.type === "cierre" && item.data) {
                  setSelectedVacante(item.data);
                }
              }}
            />
          </div>
        </div>
      </div>

      <VacanteForm
        open={requisicionFormOpen}
        onOpenChange={setRequisicionFormOpen}
        onSuccess={handleVacanteSuccess}
      />

      <InvitarReclutadorDialog
        open={invitarReclutadorOpen}
        onOpenChange={setInvitarReclutadorOpen}
        onSuccess={handleVacanteSuccess}
      />

      {selectedVacante && (
        <VacanteDetailModal
          open={!!selectedVacante}
          onOpenChange={(open) => !open && setSelectedVacante(null)}
          vacante={selectedVacante}
          onSuccess={handleVacanteSuccess}
        />
      )}

      <KPIDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={`Detalles: ${selectedKPI}`}
        description="Datos que generan este indicador"
        data={detailData}
        columns={detailColumns}
        loading={detailLoading}
      />

      <ReclutadorProfileModal
        open={reclutadorProfileOpen}
        onOpenChange={setReclutadorProfileOpen}
        reclutadorId={selectedReclutadorId}
        asociacionId={selectedAsociacionId}
      />

      <HistorialVacantesModal
        open={historialOpen}
        onOpenChange={setHistorialOpen}
        onSelectVacante={(vacante) => setSelectedVacante(vacante)}
      />
    </div>
  );
};

export default Dashboard;