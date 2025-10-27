import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalificarEntrevistaDialog } from "./CalificarEntrevistaDialog";

interface EntrevistaCompletada {
  id: string;
  fecha_entrevista: string;
  tipo_entrevista: string;
  candidato_user_id: string;
  candidato_nombre: string;
  titulo_puesto: string;
  postulacion_id: string;
  tiene_feedback: boolean;
  feedback_puntuacion?: number;
}

export function EntrevistasCompletadasCard() {
  const [entrevistas, setEntrevistas] = useState<EntrevistaCompletada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntrevista, setSelectedEntrevista] = useState<EntrevistaCompletada | null>(null);
  const [calificarDialogOpen, setCalificarDialogOpen] = useState(false);

  useEffect(() => {
    loadEntrevistas();
  }, []);

  const loadEntrevistas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("entrevistas_candidato")
        .select(`
          id,
          fecha_entrevista,
          tipo_entrevista,
          candidato_user_id,
          postulacion_id,
          postulacion:postulaciones(
            candidato:perfil_candidato(nombre_completo),
            publicacion:publicaciones_marketplace(titulo_puesto)
          )
        `)
        .eq("reclutador_user_id", session.user.id)
        .eq("estado", "completada")
        .order("fecha_entrevista", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Check for existing feedback
      const entrevistaIds = (data || []).map((e: any) => e.id);
      const { data: feedbackData } = await supabase
        .from("feedback_candidato")
        .select("id, puntuacion, candidato_user_id")
        .in("candidato_user_id", (data || []).map((e: any) => e.candidato_user_id))
        .eq("reclutador_user_id", session.user.id);

      const feedbackMap = new Map(
        (feedbackData || []).map((f: any) => [f.candidato_user_id, f.puntuacion])
      );

      const formattedData = (data || []).map((e: any) => ({
        id: e.id,
        fecha_entrevista: e.fecha_entrevista,
        tipo_entrevista: e.tipo_entrevista,
        candidato_user_id: e.candidato_user_id,
        candidato_nombre: e.postulacion?.candidato?.nombre_completo || "Sin nombre",
        titulo_puesto: e.postulacion?.publicacion?.titulo_puesto || "Sin título",
        postulacion_id: e.postulacion_id,
        tiene_feedback: feedbackMap.has(e.candidato_user_id),
        feedback_puntuacion: feedbackMap.get(e.candidato_user_id),
      }));

      setEntrevistas(formattedData);
    } catch (error) {
      console.error("Error loading entrevistas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalificar = (entrevista: EntrevistaCompletada) => {
    setSelectedEntrevista(entrevista);
    setCalificarDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entrevistas Completadas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Entrevistas Completadas</CardTitle>
        </CardHeader>
        <CardContent>
          {entrevistas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay entrevistas completadas</p>
          ) : (
            <div className="space-y-3">
              {entrevistas.map((entrevista) => (
                <div
                  key={entrevista.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{entrevista.candidato_nombre}</p>
                    <p className="text-sm text-muted-foreground">{entrevista.titulo_puesto}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entrevista.fecha_entrevista), "PPP", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entrevista.tiene_feedback ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {entrevista.feedback_puntuacion}/5
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCalificar(entrevista)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Calificar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEntrevista && (
        <CalificarEntrevistaDialog
          open={calificarDialogOpen}
          onOpenChange={setCalificarDialogOpen}
          entrevistaId={selectedEntrevista.id}
          candidatoUserId={selectedEntrevista.candidato_user_id}
          postulacionId={selectedEntrevista.postulacion_id}
          onSuccess={loadEntrevistas}
        />
      )}
    </>
  );
}
