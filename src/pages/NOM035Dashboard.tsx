import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Users, 
  ClipboardList, 
  BarChart3, 
  FileText, 
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2
} from "lucide-react";
import { TrabajadoresNOM035Table } from "@/components/nom035/TrabajadoresNOM035Table";
import { RegistroTrabajadorDialog } from "@/components/nom035/RegistroTrabajadorDialog";
import { AvisoPrivacidadNOM035 } from "@/components/nom035/AvisoPrivacidadNOM035";
import { toast } from "sonner";

const NOM035Dashboard = () => {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState<string>("");
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [registroDialogOpen, setRegistroDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalTrabajadores: 0,
    evaluacionesPendientes: 0,
    evaluacionesCompletadas: 0,
    riesgoAlto: 0
  });

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (empresaId) {
      loadStats();
    }
  }, [empresaId, refreshTrigger]);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Verificar rol admin_empresa y obtener empresa_id
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (!userRole?.empresa_id) {
        toast.error("No tienes permisos para acceder a este módulo");
        navigate("/dashboard");
        return;
      }

      // Verificar suscripción enterprise
      const { data: suscripcion } = await supabase
        .from("suscripcion_empresa")
        .select("plan, activa")
        .eq("empresa_id", userRole.empresa_id)
        .eq("activa", true)
        .maybeSingle();

      if (!suscripcion || suscripcion.plan !== "enterprise") {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Obtener nombre de empresa
      const { data: empresa } = await supabase
        .from("empresas")
        .select("nombre_empresa")
        .eq("id", userRole.empresa_id)
        .maybeSingle();

      setEmpresaId(userRole.empresa_id);
      setEmpresaNombre(empresa?.nombre_empresa || "");
      setHasAccess(true);
    } catch (error) {
      console.error("Error checking access:", error);
      toast.error("Error al verificar acceso");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!empresaId) return;

    try {
      const { count: totalTrabajadores } = await supabase
        .from("trabajadores_nom035")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("activo", true);

      const { count: evaluacionesPendientes } = await supabase
        .from("evaluaciones_nom035")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .in("estado", ["pendiente", "en_progreso"]);

      const { count: evaluacionesCompletadas } = await supabase
        .from("evaluaciones_nom035")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("estado", "completada");

      const { count: riesgoAlto } = await supabase
        .from("evaluaciones_nom035")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("estado", "completada")
        .in("nivel_riesgo", ["alto", "muy_alto"]);

      setStats({
        totalTrabajadores: totalTrabajadores || 0,
        evaluacionesPendientes: evaluacionesPendientes || 0,
        evaluacionesCompletadas: evaluacionesCompletadas || 0,
        riesgoAlto: riesgoAlto || 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
          
          <Card className="max-w-2xl mx-auto border-destructive/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Acceso Restringido</CardTitle>
              <CardDescription className="text-base mt-2">
                El módulo NOM-035 está disponible exclusivamente para empresas con plan Enterprise.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Beneficios del plan Enterprise:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Evaluación completa NOM-035-STPS-2018
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Cuestionarios oficiales (Guía I, II y III)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Análisis de riesgo psicosocial por dimensión
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Reportes de cumplimiento para STPS
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Plan de acción y seguimiento
                  </li>
                </ul>
              </div>
              <Button className="w-full" onClick={() => toast.info("Contacta a ventas para actualizar tu plan")}>
                Actualizar a Enterprise
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Módulo NOM-035</h1>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Enterprise
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {empresaNombre}
                </p>
              </div>
            </div>
            <Button onClick={() => setRegistroDialogOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Registrar Trabajador
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Trabajadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrabajadores}</div>
              <p className="text-xs text-muted-foreground">Registrados activos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Evaluaciones Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.evaluacionesPendientes}</div>
              <p className="text-xs text-muted-foreground">Por completar</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Evaluaciones Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.evaluacionesCompletadas}</div>
              <p className="text-xs text-muted-foreground">Este periodo</p>
            </CardContent>
          </Card>
          
          <Card className={stats.riesgoAlto > 0 ? "border-destructive/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Riesgo Alto/Muy Alto</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${stats.riesgoAlto > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.riesgoAlto > 0 ? "text-destructive" : ""}`}>
                {stats.riesgoAlto}
              </div>
              <p className="text-xs text-muted-foreground">Requieren acción</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="trabajadores" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trabajadores" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Trabajadores</span>
            </TabsTrigger>
            <TabsTrigger value="cuestionarios" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Cuestionarios</span>
            </TabsTrigger>
            <TabsTrigger value="resultados" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Resultados</span>
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="politica" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Política</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trabajadores" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Trabajadores</CardTitle>
                <CardDescription>
                  Gestiona los trabajadores sujetos a evaluación NOM-035. Cada trabajador debe aceptar 
                  el aviso de privacidad antes de realizar cualquier evaluación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {empresaId && (
                  <TrabajadoresNOM035Table 
                    empresaId={empresaId} 
                    refreshTrigger={refreshTrigger}
                    onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cuestionarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cuestionarios Oficiales</CardTitle>
                <CardDescription>
                  Aplicación de los cuestionarios oficiales de la NOM-035-STPS-2018
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Próximamente: Implementación de Guía I y Guía III
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Resultados</CardTitle>
                <CardDescription>
                  Visualización de resultados por dimensión y nivel de riesgo
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Próximamente: Dashboard de análisis y métricas
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reportes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reportes de Cumplimiento</CardTitle>
                <CardDescription>
                  Generación de reportes para inspecciones STPS y auditorías
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Próximamente: Reportes individuales y globales
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="politica" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Política de Prevención</CardTitle>
                <CardDescription>
                  Configuración de la política de prevención de riesgos psicosociales (Guía IV)
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Próximamente: Editor de política con plantilla oficial
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {empresaId && (
        <RegistroTrabajadorDialog
          open={registroDialogOpen}
          onOpenChange={setRegistroDialogOpen}
          empresaId={empresaId}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
            setRegistroDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default NOM035Dashboard;