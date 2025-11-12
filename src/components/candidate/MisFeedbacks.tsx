import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Feedback {
  id: string;
  puntuacion: number;
  comentario: string;
  created_at: string;
  titulo_puesto: string;
  empresa: string;
}

export function MisFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [promedio, setPromedio] = useState(0);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("feedback_candidato")
        .select(`
          id,
          puntuacion,
          comentario,
          created_at,
          postulacion:postulaciones(
            publicacion:publicaciones_marketplace(
              titulo_puesto,
              vacante:vacantes(
                empresa:empresas(nombre_empresa)
              )
            )
          )
        `)
        .eq("candidato_user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((f: any) => ({
        id: f.id,
        puntuacion: f.puntuacion,
        comentario: f.comentario,
        created_at: f.created_at,
        titulo_puesto: f.postulacion?.publicacion?.titulo_puesto || "Sin título",
        empresa: f.postulacion?.publicacion?.vacante?.empresa?.nombre_empresa || "Empresa",
      }));

      setFeedbacks(formattedData);

      if (formattedData.length > 0) {
        const avg = formattedData.reduce((acc, f) => acc + f.puntuacion, 0) / formattedData.length;
        setPromedio(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error("Error loading feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Calificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mis Calificaciones</CardTitle>
          {feedbacks.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Promedio: {promedio}/5
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {feedbacks.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aún no tienes calificaciones</p>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="border-l-4 border-primary pl-4 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{feedback.titulo_puesto}</p>
                    <p className="text-sm text-muted-foreground">{feedback.empresa}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < feedback.puntuacion
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm bg-muted p-3 rounded">{feedback.comentario}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(feedback.created_at), "PPP", { locale: es })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
