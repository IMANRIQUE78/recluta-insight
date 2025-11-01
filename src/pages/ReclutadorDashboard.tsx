import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Copy, CheckCircle2, Clock, Briefcase, Star, Building2, Zap, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { VacantesAsignadasCard } from "@/components/reclutador/VacantesAsignadasCard";
import { EntrevistasReclutadorCard } from "@/components/reclutador/EntrevistasReclutadorCard";

const ReclutadorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [perfilReclutador, setPerfilReclutador] = useState<any>(null);
  const [invitacionesPendientes, setInvitacionesPendientes] = useState<any[]>([]);
  const [asociacionesActivas, setAsociacionesActivas] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

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
      setPerfilReclutador(perfil);

      // Cargar invitaciones pendientes
      const { data: invitaciones } = await supabase
        .from("invitaciones_reclutador")
        .select(`
          *,
          empresas (
            nombre_empresa,
            sector
          )
        `)
        .eq("reclutador_id", perfil.id)
        .eq("estado", "pendiente")
        .order("created_at", { ascending: false });

      setInvitacionesPendientes(invitaciones || []);

      // Cargar asociaciones activas
      const { data: asociaciones } = await supabase
        .from("reclutador_empresa")
        .select(`
          *,
          empresas (
            nombre_empresa,
            sector
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
      navigator.clipboard.writeText(perfilReclutador.codigo_reclutador);
      toast({
        title: "✅ Código copiado",
        description: "Tu código único ha sido copiado al portapapeles",
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

      // Crear asociación
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Dashboard Reclutador
              </h1>
              <p className="text-sm text-muted-foreground">
                {perfilReclutador?.nombre_reclutador || "Panel de control"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Perfil y Código Único */}
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <code className="text-2xl font-bold tracking-wider flex-1">
                    {perfilReclutador?.codigo_reclutador}
                  </code>
                  <Button size="icon" variant="ghost" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
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

        {/* Gestión de Vacantes y Entrevistas */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Mi Trabajo</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <VacantesAsignadasCard reclutadorId={perfilReclutador?.id} />
            <EntrevistasReclutadorCard reclutadorUserId={perfilReclutador?.user_id} />
          </div>
        </section>

        {/* Estadísticas Rápidas */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Resumen</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Invitaciones Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-3xl font-bold">{invitacionesPendientes.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Empresas Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="text-3xl font-bold">{asociacionesActivas.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vacantes Asignadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-green-500" />
                  <span className="text-3xl font-bold">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Invitaciones Pendientes */}
        {invitacionesPendientes.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Invitaciones Pendientes</h2>
            <div className="space-y-3">
              {invitacionesPendientes.map((invitacion) => (
                <Card key={invitacion.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {invitacion.empresas?.nombre_empresa}
                        </CardTitle>
                        <CardDescription>
                          {invitacion.empresas?.sector && `Sector: ${invitacion.empresas.sector}`}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{invitacion.tipo_vinculacion}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {invitacion.mensaje && (
                      <p className="text-sm text-muted-foreground">{invitacion.mensaje}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAceptarInvitacion(
                          invitacion.id,
                          invitacion.empresa_id,
                          invitacion.tipo_vinculacion
                        )}
                        className="flex-1"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aceptar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRechazarInvitacion(invitacion.id)}
                        className="flex-1"
                      >
                        Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empresas Asociadas */}
        {asociacionesActivas.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Empresas con las que Colaboro</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {asociacionesActivas.map((asociacion) => (
                <Card key={asociacion.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {asociacion.empresas?.nombre_empresa}
                    </CardTitle>
                    <CardDescription>
                      {asociacion.empresas?.sector && `Sector: ${asociacion.empresas.sector}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <Badge variant="secondary">{asociacion.tipo_vinculacion}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Desde:</span>
                        <span>{new Date(asociacion.fecha_inicio).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

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
      </div>
    </div>
  );
};

export default ReclutadorDashboard;
