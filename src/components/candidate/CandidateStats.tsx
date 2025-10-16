import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Send, Calendar, MessageSquare } from "lucide-react";

interface Stats {
  totalPostulaciones: number;
  postulacionesMes: number;
  entrevistasAsistidas: number;
  feedbackRecibido: number;
}

interface Feedback {
  id: string;
  comentario: string;
  puntuacion: number;
  created_at: string;
  publicacion: {
    titulo_puesto: string;
  };
}

export const CandidateStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalPostulaciones: 0,
    postulacionesMes: 0,
    entrevistasAsistidas: 0,
    feedbackRecibido: 0,
  });
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Total postulaciones
      const { count: totalCount } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id);

      // Postulaciones del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { count: mesCount } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id)
        .gte("fecha_postulacion", inicioMes.toISOString());

      // Entrevistas asistidas
      const { count: entrevistasCount } = await supabase
        .from("entrevistas_candidato")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id)
        .eq("asistio", true);

      // Feedback recibido
      const { data: feedbackData, count: feedbackCount } = await supabase
        .from("feedback_candidato")
        .select(`
          id,
          comentario,
          puntuacion,
          created_at,
          postulacion_id
        `)
        .eq("candidato_user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Obtener títulos de puestos para el feedback
      if (feedbackData && feedbackData.length > 0) {
        const postulacionIds = feedbackData.map(f => f.postulacion_id);
        const { data: postulaciones } = await supabase
          .from("postulaciones")
          .select(`
            id,
            publicacion:publicaciones_marketplace(titulo_puesto)
          `)
          .in("id", postulacionIds);

        const feedbackConTitulos = feedbackData.map(f => {
          const post = postulaciones?.find(p => p.id === f.postulacion_id);
          return {
            ...f,
            publicacion: {
              titulo_puesto: (post?.publicacion as any)?.titulo_puesto || "Vacante"
            }
          };
        });

        setFeedbacks(feedbackConTitulos);
      }

      setStats({
        totalPostulaciones: totalCount || 0,
        postulacionesMes: mesCount || 0,
        entrevistasAsistidas: entrevistasCount || 0,
        feedbackRecibido: feedbackCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Cargando estadísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Postulaciones</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPostulaciones}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postulacionesMes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entrevistas Asistidas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.entrevistasAsistidas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Feedback Recibido</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.feedbackRecibido}</div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback de Reclutadores */}
      {feedbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comentarios de Reclutadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{feedback.publicacion.titulo_puesto}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(feedback.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < feedback.puntuacion ? "text-yellow-500" : "text-gray-300"}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm">{feedback.comentario}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {feedbacks.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aún no has recibido feedback de los reclutadores
          </CardContent>
        </Card>
      )}
    </div>
  );
};