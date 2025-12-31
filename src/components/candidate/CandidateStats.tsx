import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Send, Calendar, MessageSquare, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, MapPin, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

interface Postulacion {
  id: string;
  estado: string;
  etapa: string | null;
  fecha_postulacion: string;
  publicacion: {
    titulo_puesto: string;
    ubicacion: string | null;
    lugar_trabajo: string;
    sueldo_bruto_aprobado: number | null;
    vacante: {
      estatus: string;
    } | null;
  } | null;
}

const ITEMS_PER_PAGE = 10;

const getEstadoColor = (estado: string, vacanteCerrada: boolean) => {
  if (vacanteCerrada) return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  
  switch (estado.toLowerCase()) {
    case "pendiente":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "aceptado":
    case "contratado":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "rechazado":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "en_proceso":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getModalidadLabel = (modalidad: string) => {
  switch (modalidad) {
    case "remoto": return "Remoto";
    case "presencial": return "Presencial";
    case "hibrido": return "Híbrido";
    default: return modalidad;
  }
};

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
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadPostulaciones();
  }, [currentPage]);

  const loadPostulaciones = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get total count
      const { count } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id);

      setTotalCount(count || 0);

      // Get paginated postulaciones first
      const { data: postulacionesData, error: postError } = await supabase
        .from("postulaciones")
        .select("id, estado, etapa, fecha_postulacion, publicacion_id")
        .eq("candidato_user_id", session.user.id)
        .order("fecha_postulacion", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (postError) throw postError;

      if (!postulacionesData || postulacionesData.length === 0) {
        setPostulaciones([]);
        return;
      }

      // Get publication IDs
      const pubIds = postulacionesData.map(p => p.publicacion_id);

      // Fetch publications separately (RLS allows seeing published ones)
      const { data: publicacionesData } = await supabase
        .from("publicaciones_marketplace")
        .select("id, titulo_puesto, ubicacion, lugar_trabajo, sueldo_bruto_aprobado, vacante_id")
        .in("id", pubIds);

      // Get vacancy IDs from publications
      const vacanteIds = (publicacionesData || [])
        .map(p => p.vacante_id)
        .filter(Boolean);

      // Fetch vacancies to get status
      const { data: vacantesData } = await supabase
        .from("vacantes")
        .select("id, estatus, titulo_puesto")
        .in("id", vacanteIds);

      // Build map for quick lookup
      const vacantesMap = new Map(
        (vacantesData || []).map(v => [v.id, v])
      );

      const publicacionesMap = new Map(
        (publicacionesData || []).map(p => [p.id, {
          ...p,
          vacante: p.vacante_id ? vacantesMap.get(p.vacante_id) || null : null
        }])
      );

      // Combine data
      const combinedData: Postulacion[] = postulacionesData.map(post => {
        const pub = publicacionesMap.get(post.publicacion_id);
        return {
          id: post.id,
          estado: post.estado,
          etapa: post.etapa,
          fecha_postulacion: post.fecha_postulacion,
          publicacion: pub ? {
            titulo_puesto: pub.titulo_puesto,
            ubicacion: pub.ubicacion,
            lugar_trabajo: pub.lugar_trabajo,
            sueldo_bruto_aprobado: pub.sueldo_bruto_aprobado,
            vacante: pub.vacante ? { estatus: pub.vacante.estatus } : null
          } : null
        };
      });

      setPostulaciones(combinedData);
    } catch (error) {
      console.error("Error loading postulaciones:", error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Total postulaciones
      const { count: totalCount } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id);

      // Calculate dates for last 3 months
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      // Postulaciones del mes actual
      const { count: mesCount } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id)
        .gte("fecha_postulacion", currentMonth.toISOString());

      // Postulaciones del mes anterior
      const { count: mesAnteriorCount } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id)
        .gte("fecha_postulacion", lastMonth.toISOString())
        .lt("fecha_postulacion", currentMonth.toISOString());

      // Postulaciones de hace 2 meses
      const { count: dosMesesCount } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id)
        .gte("fecha_postulacion", twoMonthsAgo.toISOString())
        .lt("fecha_postulacion", lastMonth.toISOString());

      // Build monthly chart data (last 3 months)
      const getMonthName = (date: Date) => {
        const name = date.toLocaleDateString('es-MX', { month: 'short' });
        return name.charAt(0).toUpperCase() + name.slice(1);
      };
      
      setMonthlyData([
        { mes: getMonthName(twoMonthsAgo), postulaciones: dosMesesCount || 0, isCurrent: false },
        { mes: getMonthName(lastMonth), postulaciones: mesAnteriorCount || 0, isCurrent: false },
        { mes: getMonthName(currentMonth), postulaciones: mesCount || 0, isCurrent: true },
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
        const { data: postulacionesData } = await supabase
          .from("postulaciones")
          .select(`
            id,
            publicacion:publicaciones_marketplace(titulo_puesto)
          `)
          .in("id", postulacionIds);

        const feedbackConTitulos = feedbackData.map(f => {
          const post = postulacionesData?.find(p => p.id === f.postulacion_id);
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
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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

      {/* Tabla de Postulaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            Todas mis Postulaciones ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postulaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes postulaciones registradas
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Puesto</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead>Salario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Vacante</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postulaciones.map((postulacion) => {
                      const vacanteCerrada = postulacion.publicacion?.vacante?.estatus === "cerrada" || 
                                            postulacion.publicacion?.vacante?.estatus === "cancelada";
                      const tienePublicacion = postulacion.publicacion !== null;
                      
                      return (
                        <TableRow key={postulacion.id}>
                          <TableCell className="font-medium">
                            {tienePublicacion ? postulacion.publicacion?.titulo_puesto : "Vacante eliminada"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <MapPin className="h-3 w-3" />
                              {tienePublicacion ? (postulacion.publicacion?.ubicacion || "No especificada") : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {tienePublicacion ? getModalidadLabel(postulacion.publicacion?.lugar_trabajo || "") : "-"}
                          </TableCell>
                          <TableCell>
                            {tienePublicacion && postulacion.publicacion?.sueldo_bruto_aprobado ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                {postulacion.publicacion.sueldo_bruto_aprobado.toLocaleString("es-MX")}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getEstadoColor(postulacion.estado, vacanteCerrada)}
                            >
                              {vacanteCerrada ? "Vacante Cerrada" : postulacion.etapa || postulacion.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tienePublicacion ? (
                              <Badge 
                                variant="outline" 
                                className={
                                  vacanteCerrada 
                                    ? "bg-red-500/10 text-red-600 border-red-500/20" 
                                    : "bg-green-500/10 text-green-600 border-green-500/20"
                                }
                              >
                                {vacanteCerrada ? "Cerrada" : "Abierta"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                                N/A
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(postulacion.fecha_postulacion), "dd MMM yyyy", { locale: es })}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Chart: Postulaciones por mes - últimos 3 meses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Postulaciones por Mes (últimos 3 meses)</CardTitle>
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
    </div>
  );
};
