import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCostosReclutamiento, ConceptoCosteo } from "@/hooks/useCostosReclutamiento";
import { ConceptoCosteoDialog } from "@/components/costos/ConceptoCosteoDialog";
import { ConceptosCosteoTable } from "@/components/costos/ConceptosCosteoTable";
import { ReporteCostosCard } from "@/components/costos/ReporteCostosCard";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Plus,
  DollarSign,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CostosReclutamientoDashboard = () => {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConcepto, setEditingConcepto] = useState<ConceptoCosteo | null>(null);

  const {
    conceptos,
    metricas,
    reporte,
    loading,
    agregarConcepto,
    actualizarConcepto,
    eliminarConcepto,
    refetch,
  } = useCostosReclutamiento(empresaId);

  useEffect(() => {
    const loadEmpresaId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (userRole?.empresa_id) {
        setEmpresaId(userRole.empresa_id);
      } else {
        toast({
          title: "Acceso denegado",
          description: "Solo administradores de empresa pueden acceder a esta sección",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    };

    loadEmpresaId();
  }, [navigate]);

  const handleEdit = (concepto: ConceptoCosteo) => {
    setEditingConcepto(concepto);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingConcepto(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!empresaId) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-[60vh]">
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Costos de Reclutamiento</h1>
                <p className="text-muted-foreground">
                  Gestión y análisis de costos operativos
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Concepto
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[400px]" />
            </div>
            <Skeleton className="h-[300px]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs rápidos */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Costo Mensual</p>
                      <p className="text-2xl font-bold">{formatCurrency(reporte.costoMensualTotal)}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conceptos Activos</p>
                      <p className="text-2xl font-bold">{conceptos.length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500/10">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Ponderado</p>
                      <p className="text-2xl font-bold">{metricas.valorPonderado.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-500/10">
                      <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Costo/Vacante</p>
                      <p className="text-2xl font-bold">{formatCurrency(reporte.costoPorVacanteEfectiva)}</p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-500/10">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {conceptos.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin conceptos de costo</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    Agrega los conceptos de costo de tu operación de reclutamiento para generar
                    reportes de eficiencia y análisis de presupuesto.
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Concepto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Reporte de costos y eficiencia */}
                <ReporteCostosCard reporte={reporte} metricas={metricas} />

                {/* Tabla de conceptos */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Conceptos de Costo</CardTitle>
                        <CardDescription>
                          Lista de conceptos registrados con conversión automática a costo mensual
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ConceptosCosteoTable
                      conceptos={conceptos}
                      onEdit={handleEdit}
                      onDelete={eliminarConcepto}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Dialog para agregar/editar concepto */}
        <ConceptoCosteoDialog
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          concepto={editingConcepto}
          onSave={agregarConcepto}
          onUpdate={actualizarConcepto}
        />
      </div>
    </div>
  );
};

export default CostosReclutamientoDashboard;
