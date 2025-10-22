import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { KPIDetailModal } from "@/components/dashboard/KPIDetailModal";
import { VacanteForm } from "@/components/dashboard/VacanteForm";
import { VacantesTable } from "@/components/dashboard/VacantesTable";
import { VacanteDetailModal } from "@/components/dashboard/VacanteDetailModal";
import { GlobalLeaderboard } from "@/components/dashboard/GlobalLeaderboard";
import { PostulacionesRecibidas } from "@/components/dashboard/PostulacionesRecibidas";
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
  Trophy
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string>("");
  const [vacanteFormOpen, setVacanteFormOpen] = useState(false);
  const [selectedVacante, setSelectedVacante] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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
  }, []);

  const loadFilters = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clientesData } = await supabase
      .from("clientes_areas")
      .select("id, cliente_nombre, area")
      .eq("user_id", user.id)
      .order("cliente_nombre", { ascending: true });

    const { data: reclutadoresData } = await supabase
      .from("reclutadores")
      .select("id, nombre")
      .eq("user_id", user.id)
      .order("nombre", { ascending: true });

    if (clientesData) setClientes(clientesData);
    if (reclutadoresData) setReclutadores(reclutadoresData);
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

  const scrollToLeaderboard = () => {
    const element = document.getElementById("global-leaderboard");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <QuickActions onNewVacante={() => setVacanteFormOpen(true)} />
          <Button 
            variant="outline" 
            onClick={scrollToLeaderboard}
            className="flex items-center gap-2"
          >
            <Trophy className="h-4 w-4" />
            Ver Ranking Global
          </Button>
        </div>

        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Resumen Ejecutivo</h2>
            <p className="text-muted-foreground">Métricas clave de tus procesos de reclutamiento</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.slice(0, 4).map((kpi, idx) => (
              <KPICard 
                key={idx} 
                {...kpi} 
                onDoubleClick={() => {
                  console.log("KPI clicked:", kpi.title);
                  handleKPIDoubleClick(kpi.title);
                }}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Eficiencia Operativa</h2>
            <p className="text-muted-foreground">Costos y productividad del equipo</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.slice(4, 8).map((kpi, idx) => (
              <KPICard 
                key={idx} 
                {...kpi}
                onDoubleClick={() => {
                  console.log("KPI clicked:", kpi.title);
                  handleKPIDoubleClick(kpi.title);
                }}
              />
            ))}
          </div>
        </section>

        <ForecastChart />

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Próximamente</CardTitle>
              <CardDescription>Nuevas funcionalidades en desarrollo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Las tarjetas de vacantes críticas y fuentes efectivas estarán disponibles próximamente con datos reales de tu proceso de reclutamiento.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Análisis Avanzado</CardTitle>
              <CardDescription>Métricas detalladas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pronto podrás visualizar análisis detallados de tus fuentes de reclutamiento y candidatos más efectivos.
              </p>
            </CardContent>
          </Card>
        </section>

        <VacantesTable 
          onSelectVacante={(vacante) => setSelectedVacante(vacante)} 
          refreshTrigger={refreshTrigger}
        />

        <PostulacionesRecibidas />

        <GlobalLeaderboard />
      </div>

      <VacanteForm
        open={vacanteFormOpen}
        onOpenChange={setVacanteFormOpen}
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
    </div>
  );
};

export default Dashboard;