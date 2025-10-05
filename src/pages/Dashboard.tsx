import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { KPIDetailModal } from "@/components/dashboard/KPIDetailModal";
import { VacanteForm } from "@/components/dashboard/VacanteForm";
import { VacantesTable } from "@/components/dashboard/VacantesTable";
import { VacanteDetailModal } from "@/components/dashboard/VacanteDetailModal";
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

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string>("");
  const [vacanteFormOpen, setVacanteFormOpen] = useState(false);
  const [selectedVacante, setSelectedVacante] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleKPIDoubleClick = (kpiTitle: string) => {
    setSelectedKPI(kpiTitle);
    setModalOpen(true);
  };

  const [kpiData, setKpiData] = useState<any[]>([]);
  
  const mockDetailData = [
    { folio: "VAC-001", puesto: "Desarrollador Senior", dias: 28, cliente: "TechCorp", estatus: "Cerrada" },
    { folio: "VAC-002", puesto: "Gerente de Ventas", dias: 35, cliente: "RetailMax", estatus: "Cerrada" },
    { folio: "VAC-003", puesto: "Analista de Datos", dias: 21, cliente: "DataSolutions", estatus: "Cerrada" },
  ];

  const detailColumns = [
    { key: "folio", label: "Folio" },
    { key: "puesto", label: "Puesto" },
    { key: "dias", label: "Días" },
    { key: "cliente", label: "Cliente" },
    { key: "estatus", label: "Estatus" },
  ];

  // Datos de ejemplo
  const kpis = [
    {
      title: "Tiempo Promedio de Cobertura",
      value: 28,
      unit: "días",
      trend: -12,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: "Tasa de Éxito de Cierre",
      value: 85,
      unit: "%",
      trend: 5,
      icon: <Target className="h-4 w-4" />,
    },
    {
      title: "Tasa de Cancelación",
      value: 8,
      unit: "%",
      trend: -3,
      icon: <XCircle className="h-4 w-4" />,
    },
    {
      title: "Vacantes Abiertas",
      value: 24,
      trend: 15,
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: "Costo por Contratación",
      value: "$12,500",
      trend: -8,
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Satisfacción del Cliente",
      value: 4.3,
      unit: "/5",
      trend: 2,
      icon: <Award className="h-4 w-4" />,
    },
    {
      title: "Tasa de Rotación",
      value: 12,
      unit: "%",
      trend: -5,
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Entrevistados vs Contratados",
      value: "1:4.2",
      icon: <UserCheck className="h-4 w-4" />,
    },
  ];

  const handleVacanteSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        <QuickActions onNewVacante={() => setVacanteFormOpen(true)} />

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
                onDoubleClick={() => handleKPIDoubleClick(kpi.title)}
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
                onDoubleClick={() => handleKPIDoubleClick(kpi.title)}
              />
            ))}
          </div>
        </section>

        <ForecastChart />

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Vacantes Críticas</CardTitle>
              <CardDescription>Vacantes con tiempo de cobertura elevado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { puesto: "Desarrollador Senior Full Stack", dias: 45, cliente: "TechCorp" },
                  { puesto: "Gerente de Operaciones", dias: 38, cliente: "RetailMax" },
                  { puesto: "Analista de Datos", dias: 35, cliente: "DataSolutions" },
                ].map((vacante, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{vacante.puesto}</p>
                      <p className="text-sm text-muted-foreground">{vacante.cliente}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-destructive">{vacante.dias} días</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Fuentes Más Efectivas</CardTitle>
              <CardDescription>De donde provienen tus mejores candidatos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { fuente: "LinkedIn", contratados: 45, tasa: 18 },
                  { fuente: "Referidos", contratados: 32, tasa: 28 },
                  { fuente: "Portales de Empleo", contratados: 28, tasa: 12 },
                  { fuente: "Base Interna", contratados: 15, tasa: 22 },
                ].map((fuente, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{fuente.fuente}</span>
                      <span className="text-sm font-bold text-success">{fuente.tasa}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-primary rounded-full transition-all"
                          style={{ width: `${fuente.tasa * 3}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{fuente.contratados}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <VacantesTable 
          onSelectVacante={(vacante) => setSelectedVacante(vacante)} 
          refreshTrigger={refreshTrigger}
        />
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
        data={mockDetailData}
        columns={detailColumns}
      />
    </div>
  );
};

export default Dashboard;