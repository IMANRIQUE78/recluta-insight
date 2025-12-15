import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { KPIDetailModal } from "@/components/dashboard/KPIDetailModal";
import { VacanteForm } from "@/components/dashboard/VacanteForm";
import { VacantesTable } from "@/components/dashboard/VacantesTable";
import { VacanteDetailModal } from "@/components/dashboard/VacanteDetailModal";
import { ReclutadorProfileModal } from "@/components/dashboard/ReclutadorProfileModal";
import { InvitarReclutadorDialog } from "@/components/dashboard/InvitarReclutadorDialog";
import { ReclutadoresAsociadosTable } from "@/components/dashboard/ReclutadoresAsociadosTable";
import { AttentionBadges } from "@/components/dashboard/AttentionBadges";
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
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string>("");
  const [requisicionFormOpen, setRequisicionFormOpen] = useState(false);
  const [invitarReclutadorOpen, setInvitarReclutadorOpen] = useState(false);
  const [selectedVacante, setSelectedVacante] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [reclutadorProfileOpen, setReclutadorProfileOpen] = useState(false);
  const [selectedReclutadorId, setSelectedReclutadorId] = useState<string>("");
  const [selectedAsociacionId, setSelectedAsociacionId] = useState<string | undefined>(undefined);
  
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
    },
    {
      title: "Tasa de Éxito de Cierre",
      value: kpiData.tasaExitoCierre,
      unit: "%",
      icon: <Target className="h-4 w-4" />,
    },
    {
      title: "Tasa de Cancelación",
      value: kpiData.tasaCancelacion,
      unit: "%",
      icon: <XCircle className="h-4 w-4" />,
    },
    {
      title: "Vacantes Abiertas",
      value: kpiData.vacantesAbiertas,
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: "Costo por Contratación",
      value: kpiData.costoPromedioContratacion > 0 
        ? `$${kpiData.costoPromedioContratacion.toLocaleString()}` 
        : "$0",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Satisfacción del Cliente",
      value: kpiData.satisfaccionCliente,
      unit: "/5",
      icon: <Award className="h-4 w-4" />,
    },
    {
      title: "Tasa de Rotación",
      value: kpiData.tasaRotacion,
      unit: "%",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Entrevistados vs Contratados",
      value: kpiData.entrevistadosVsContratados,
      icon: <UserCheck className="h-4 w-4" />,
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
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Attention Badges - Lo que requiere mi atención */}
        <AttentionBadges 
          refreshTrigger={refreshTrigger}
          onItemClick={(item) => {
            if (item.type === "cierre" && item.data) {
              setSelectedVacante(item.data);
            }
          }}
        />

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b">
          <QuickActions 
            onNewRequisicion={() => setRequisicionFormOpen(true)}
            onInvitarReclutador={() => setInvitarReclutadorOpen(true)}
          />
        </div>

        {/* KPIs Section - Resumen Ejecutivo */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Resumen Ejecutivo</h2>
            <p className="text-sm text-muted-foreground">Métricas clave de desempeño</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.slice(0, 4).map((kpi, idx) => (
              <KPICard 
                key={idx} 
                {...kpi} 
                onDoubleClick={() => handleKPIDoubleClick(kpi.title)}
              />
            ))}
          </div>
        </section>

        {/* KPIs Section - Eficiencia Operativa */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Eficiencia Operativa</h2>
            <p className="text-sm text-muted-foreground">Costos y productividad</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.slice(4, 8).map((kpi, idx) => (
              <KPICard 
                key={idx} 
                {...kpi}
                onDoubleClick={() => handleKPIDoubleClick(kpi.title)}
              />
            ))}
          </div>
        </section>

        {/* Forecast Chart */}
        <section className="pt-2">
          <ForecastChart 
            selectedCliente={selectedCliente}
            selectedReclutador={selectedReclutador}
            selectedEstatus={selectedEstatus}
          />
        </section>

        {/* Reclutadores Asociados */}
        <section className="space-y-4">
          <ReclutadoresAsociadosTable />
        </section>

        {/* Requisiciones Internas */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Requisiciones Internas</h2>
            <p className="text-sm text-muted-foreground">Solicitudes de contratación de la empresa</p>
          </div>
          <VacantesTable 
            onSelectVacante={(vacante) => setSelectedVacante(vacante)} 
            refreshTrigger={refreshTrigger}
          />
        </section>
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
    </div>
  );
};

export default Dashboard;