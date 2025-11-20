import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, User, CheckCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GestionarEntrevistaDialog } from "./GestionarEntrevistaDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EntrevistasReclutadorCardProps {
  reclutadorUserId: string;
}

export const EntrevistasReclutadorCard = ({ reclutadorUserId }: EntrevistasReclutadorCardProps) => {
  const { toast } = useToast();
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntrevista, setSelectedEntrevista] = useState<any>(null);
  const [gestionarDialogOpen, setGestionarDialogOpen] = useState(false);

  useEffect(() => {
    loadEntrevistas();
  }, [reclutadorUserId]);

  const loadEntrevistas = async () => {
    try {
      // Primero obtener las entrevistas del reclutador
      const { data: entrevistasData, error: entrevistasError } = await supabase
        .from("entrevistas_candidato")
        .select(`
          id,
          fecha_entrevista,
          asistio,
          estado,
          detalles_reunion,
          postulacion_id,
          candidato_user_id
        `)
        .eq("reclutador_user_id", reclutadorUserId)
        .gte("fecha_entrevista", new Date().toISOString())
        .order("fecha_entrevista", { ascending: true })
        .limit(5);

      if (entrevistasError) throw entrevistasError;

      if (!entrevistasData || entrevistasData.length === 0) {
        setEntrevistas([]);
        return;
      }

      // Obtener datos de postulaciones
      const postulacionIds = entrevistasData.map(e => e.postulacion_id);
      const { data: postulaciones } = await supabase
        .from("postulaciones")
        .select(`
          id,
          publicacion_id,
          candidato_user_id
        `)
        .in("id", postulacionIds);

      // Obtener datos de publicaciones
      const publicacionIds = postulaciones?.map(p => p.publicacion_id) || [];
      const { data: publicaciones } = await supabase
        .from("publicaciones_marketplace")
        .select("id, titulo_puesto, vacante_id")
        .in("id", publicacionIds);

      // Obtener datos de candidatos
      const candidatoUserIds = entrevistasData.map(e => e.candidato_user_id);
      const { data: candidatos } = await supabase
        .from("perfil_candidato")
        .select("user_id, nombre_completo, email")
        .in("user_id", candidatoUserIds);

      // Combinar los datos
      const entrevistasEnriquecidas = entrevistasData.map(entrevista => {
        const postulacion = postulaciones?.find(p => p.id === entrevista.postulacion_id);
        const publicacion = publicaciones?.find(p => p.id === postulacion?.publicacion_id);
        const candidato = candidatos?.find(c => c.user_id === entrevista.candidato_user_id);

        return {
          ...entrevista,
          titulo_puesto: publicacion?.titulo_puesto || "Sin título",
          candidato_nombre: candidato?.nombre_completo || candidato?.email || "Sin nombre",
        };
      });

      setEntrevistas(entrevistasEnriquecidas);
    } catch (error: any) {
      console.error("Error cargando entrevistas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarAsistencia = async (entrevistaId: string) => {
    try {
      const { error } = await supabase
        .from("entrevistas_candidato")
        .update({ asistio: true })
        .eq("id", entrevistaId);

      if (error) throw error;

      toast({
        title: "✅ Asistencia confirmada",
        description: "La asistencia ha sido registrada",
      });

      loadEntrevistas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGestionarEntrevista = (entrevista: any) => {
    setSelectedEntrevista(entrevista);
    setGestionarDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Entrevistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Entrevistas
        </CardTitle>
        <CardDescription>
          Entrevistas programadas con candidatos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entrevistas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tienes entrevistas programadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entrevistas.map((entrevista) => (
              <div key={entrevista.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">
                      {entrevista.titulo_puesto}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {entrevista.candidato_nombre}
                    </p>
                  </div>
                  <Badge variant={entrevista.estado === "confirmada" ? "default" : "secondary"}>
                    {entrevista.estado}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(entrevista.fecha_entrevista).toLocaleDateString()}
                  </span>
                  <span>
                    {new Date(entrevista.fecha_entrevista).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                {entrevista.detalles_reunion && (
                  <p className="text-xs text-muted-foreground">{entrevista.detalles_reunion}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleGestionarEntrevista(entrevista)}
                  >
                    <Settings className="mr-2 h-3 w-3" />
                    Gestionar
                  </Button>
                  {!entrevista.asistio && (
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => handleMarcarAsistencia(entrevista.id)}
                    >
                      <CheckCircle className="mr-2 h-3 w-3" />
                      Realizada
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <GestionarEntrevistaDialog
        open={gestionarDialogOpen}
        onOpenChange={setGestionarDialogOpen}
        entrevista={selectedEntrevista}
        onSuccess={loadEntrevistas}
      />
    </Card>
  );
};
