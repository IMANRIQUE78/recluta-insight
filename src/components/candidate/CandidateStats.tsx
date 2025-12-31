import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Send, Calendar, MessageSquare, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PostulacionesTableModal } from "./PostulacionesTableModal";

interface Stats {
  totalPostulaciones: number;
  postulacionesMes: number;
  postulacionesMesAnterior: number;
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

interface MonthlyData {
  mes: string;
  postulaciones: number;
  isCurrent: boolean;
}

export const CandidateStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalPostulaciones: 0,
    postulacionesMes: 0,
    postulacionesMesAnterior: 0,
    entrevistasAsistidas: 0,
    feedbackRecibido: 0,
  });
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [postulacionesModalOpen, setPostulacionesModalOpen] = useState(false);

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

      // Postulaciones del mes anterior
      const inicioMesAnterior = new Date();
      inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);
      inicioMesAnterior.setDate(1);
      inicioMesAnterior.setHours(0, 0, 0, 0);
      
      const finMesAnterior = new Date(inicioMes);
      finMesAnterior.setSeconds(-1);

      const { count: mesAnteriorCount } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id)
        .gte("fecha_postulacion", inicioMesAnterior.toISOString())
        .lt("fecha_postulacion", inicioMes.toISOString());

      // Build monthly chart data (current + previous month)
      const currentMonthName = inicioMes.toLocaleDateString('es-MX', { month: 'short' });
      const prevMonthName = inicioMesAnterior.toLocaleDateString('es-MX', { month: 'short' });
      
      setMonthlyData([
        { mes: prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1), postulaciones: mesAnteriorCount || 0, isCurrent: false },
        { mes: currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1), postulaciones: mesCount || 0, isCurrent: true },
      ]);

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
        postulacionesMesAnterior: mesAnteriorCount || 0,
        entrevistasAsistidas: entrevistasCount || 0,
        feedbackRecibido: feedbackCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrend = () => {
    const diff = stats.postulacionesMes - stats.postulacionesMesAnterior;
    if (diff > 0) return { icon: TrendingUp, color: "text-green-500", text: `+${diff} vs mes anterior` };
    if (diff < 0) return { icon: TrendingDown, color: "text-red-500", text: `${diff} vs mes anterior` };
    return { icon: Minus, color: "text-muted-foreground", text: "Sin cambio" };
  };

  if (loading) {
    return <div className="animate-pulse">Cargando estadísticas...</div>;
  }

  const trend = getTrend();
  const TrendIcon = trend.icon;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setPostulacionesModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Postulaciones</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPostulaciones}</div>
            <p className="text-xs text-muted-foreground mt-1">Click para ver detalle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postulacionesMes}</div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${trend.color}`}>
              <TrendIcon className="h-3 w-3" />
              {trend.text}
            </div>
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

      {/* Chart: Postulaciones por mes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Postulaciones por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value, 'Postulaciones']}
                />
                <Bar dataKey="postulaciones" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} 
                      opacity={entry.isCurrent ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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

      <PostulacionesTableModal 
        open={postulacionesModalOpen} 
        onOpenChange={setPostulacionesModalOpen} 
      />
    </div>
  );
};
