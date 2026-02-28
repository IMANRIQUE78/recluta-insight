import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3,
  Send,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ─── Constantes ───────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

// Estados válidos permitidos — cualquier otro valor se trata como desconocido
const ESTADOS_VALIDOS = new Set(["pendiente", "aceptado", "contratado", "rechazado", "en_proceso"]);

// ─── Tipos ────────────────────────────────────────────────────────────────────
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
  publicacion: { titulo_puesto: string };
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
    vacante: { estatus: string } | null;
  } | null;
}

// ─── Helpers de seguridad ─────────────────────────────────────────────────────
const sanitizeText = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.replace(/[<>{}\[\]\\;`'"&|$^%*=+~]/g, "").trim();
};

// Formatea fecha de forma segura — nunca muestra "Invalid Date"
const formatFecha = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return "—";
    return format(date, "dd MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
};

// Formatea fecha larga de forma segura
const formatFechaLarga = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return "—";
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return "—";
  }
};

// Valida puntuación de estrellas: solo enteros 1-5
const safePuntuacion = (val: number | null | undefined): number => {
  if (typeof val !== "number" || isNaN(val)) return 0;
  return Math.min(5, Math.max(0, Math.floor(val)));
};

// ─── Helpers de UI ────────────────────────────────────────────────────────────
const getEstadoColor = (estado: string, vacanteCerrada: boolean): string => {
  if (vacanteCerrada) return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  const normalizado = estado.toLowerCase().trim();
  switch (normalizado) {
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

const getModalidadLabel = (modalidad: string): string => {
  const map: Record<string, string> = {
    remoto: "Remoto",
    presencial: "Presencial",
    hibrido: "Híbrido",
  };
  return map[modalidad?.toLowerCase()] ?? sanitizeText(modalidad) ?? "—";
};

// Etiqueta segura de estado — nunca renderiza texto arbitrario de la BD
const getEstadoLabel = (estado: string, etapa: string | null, vacanteCerrada: boolean): string => {
  if (vacanteCerrada) return "Vacante Cerrada";
  // Mostrar etapa si existe y es texto limpio, o estado validado
  if (etapa) return sanitizeText(etapa) || sanitizeText(estado) || "—";
  const normalizado = estado.toLowerCase().trim();
  if (!ESTADOS_VALIDOS.has(normalizado)) return "—";
  return sanitizeText(estado);
};

// ─── Componente principal ─────────────────────────────────────────────────────
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

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [tableError, setTableError] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Ref para cancelar queries de paginación en vuelo si el usuario cambia
  // de página antes de que termine la anterior
  const pageRequestRef = useRef<number>(0);

  // ── Cargar estadísticas generales ────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(false);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      // Lanzar todas las queries en paralelo — más rápido y fácil de manejar errores
      const [totalResult, mesResult, mesAnteriorResult, dosMesesResult, entrevistasResult, feedbackResult] =
        await Promise.all([
          supabase.from("postulaciones").select("*", { count: "exact", head: true }).eq("candidato_user_id", userId),
          supabase
            .from("postulaciones")
            .select("*", { count: "exact", head: true })
            .eq("candidato_user_id", userId)
            .gte("fecha_postulacion", currentMonth.toISOString()),
          supabase
            .from("postulaciones")
            .select("*", { count: "exact", head: true })
            .eq("candidato_user_id", userId)
            .gte("fecha_postulacion", lastMonth.toISOString())
            .lt("fecha_postulacion", currentMonth.toISOString()),
          supabase
            .from("postulaciones")
            .select("*", { count: "exact", head: true })
            .eq("candidato_user_id", userId)
            .gte("fecha_postulacion", twoMonthsAgo.toISOString())
            .lt("fecha_postulacion", lastMonth.toISOString()),
          supabase
            .from("entrevistas_candidato")
            .select("*", { count: "exact", head: true })
            .eq("candidato_user_id", userId)
            .eq("asistio", true),
          supabase
            .from("feedback_candidato")
            .select("id, comentario, puntuacion, created_at, postulacion_id")
            .eq("candidato_user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      // Verificar errores de queries críticas
      if (totalResult.error) throw totalResult.error;

      const getMonthName = (date: Date) => {
        const name = date.toLocaleDateString("es-MX", { month: "short" });
        return name.charAt(0).toUpperCase() + name.slice(1);
      };

      setMonthlyData([
        { mes: getMonthName(twoMonthsAgo), postulaciones: dosMesesResult.count || 0, isCurrent: false },
        { mes: getMonthName(lastMonth), postulaciones: mesAnteriorResult.count || 0, isCurrent: false },
        { mes: getMonthName(currentMonth), postulaciones: mesResult.count || 0, isCurrent: true },
      ]);

      // Enriquecer feedback con títulos de puestos
      if (feedbackResult.data && feedbackResult.data.length > 0) {
        const postulacionIds = feedbackResult.data.map((f) => f.postulacion_id);
        const { data: postulacionesData } = await supabase
          .from("postulaciones")
          .select("id, publicacion:publicaciones_marketplace(titulo_puesto)")
          .in("id", postulacionIds);

        const feedbackConTitulos: Feedback[] = feedbackResult.data.map((f) => {
          const post = postulacionesData?.find((p) => p.id === f.postulacion_id);
          return {
            id: f.id,
            comentario: sanitizeText(f.comentario),
            puntuacion: safePuntuacion(f.puntuacion),
            created_at: f.created_at,
            publicacion: {
              titulo_puesto: sanitizeText((post?.publicacion as any)?.titulo_puesto) || "Vacante",
            },
          };
        });

        setFeedbacks(feedbackConTitulos);
      }

      setStats({
        totalPostulaciones: totalResult.count || 0,
        postulacionesMes: mesResult.count || 0,
        postulacionesMesAnterior: mesAnteriorResult.count || 0,
        entrevistasAsistidas: entrevistasResult.count || 0,
        feedbackRecibido: feedbackResult.count || 0,
      });
    } catch (error: any) {
      console.error("Error loading stats:", error.message);
      setStatsError(true);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── Cargar postulaciones paginadas ────────────────────────────────────────────
  const loadPostulaciones = useCallback(async (page: number) => {
    setLoadingTable(true);
    setTableError(false);

    // Token de esta request — si el usuario cambia de página antes de que
    // termine, descartamos el resultado de la request anterior
    const requestId = ++pageRequestRef.current;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      const { count } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", userId);

      const { data: postulacionesData, error: postError } = await supabase
        .from("postulaciones")
        .select("id, estado, etapa, fecha_postulacion, publicacion_id")
        .eq("candidato_user_id", userId)
        .order("fecha_postulacion", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (postError) throw postError;

      // Si llegó una request más nueva, descartar esta
      if (requestId !== pageRequestRef.current) return;

      if (!postulacionesData || postulacionesData.length === 0) {
        setTotalCount(count || 0);
        setPostulaciones([]);
        return;
      }

      const pubIds = postulacionesData.map((p) => p.publicacion_id).filter(Boolean);

      const { data: publicacionesData } = await supabase
        .from("publicaciones_marketplace")
        .select("id, titulo_puesto, ubicacion, lugar_trabajo, sueldo_bruto_aprobado, vacante_id")
        .in("id", pubIds);

      const vacanteIds = (publicacionesData || []).map((p) => p.vacante_id).filter(Boolean);

      const { data: vacantesData } = await supabase.from("vacantes").select("id, estatus").in("id", vacanteIds);

      if (requestId !== pageRequestRef.current) return;

      const vacantesMap = new Map((vacantesData || []).map((v) => [v.id, v]));
      const publicacionesMap = new Map(
        (publicacionesData || []).map((p) => [
          p.id,
          {
            ...p,
            vacante: p.vacante_id ? vacantesMap.get(p.vacante_id) || null : null,
          },
        ]),
      );

      const combinedData: Postulacion[] = postulacionesData.map((post) => {
        const pub = publicacionesMap.get(post.publicacion_id);
        return {
          id: post.id,
          estado: post.estado,
          etapa: post.etapa,
          fecha_postulacion: post.fecha_postulacion,
          publicacion: pub
            ? {
                titulo_puesto: sanitizeText(pub.titulo_puesto),
                ubicacion: sanitizeText(pub.ubicacion),
                lugar_trabajo: pub.lugar_trabajo,
                sueldo_bruto_aprobado: pub.sueldo_bruto_aprobado,
                vacante: pub.vacante ? { estatus: sanitizeText(pub.vacante.estatus) } : null,
              }
            : null,
        };
      });

      setTotalCount(count || 0);
      setPostulaciones(combinedData);
    } catch (error: any) {
      if (requestId !== pageRequestRef.current) return;
      console.error("Error loading postulaciones:", error.message);
      setTableError(true);
    } finally {
      if (requestId === pageRequestRef.current) {
        setLoadingTable(false);
      }
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadPostulaciones(currentPage);
  }, [currentPage, loadPostulaciones]);

  // ── Tendencia mes a mes ───────────────────────────────────────────────────────
  const getTrend = () => {
    const diff = stats.postulacionesMes - stats.postulacionesMesAnterior;
    if (diff > 0) return { icon: TrendingUp, color: "text-green-500", text: `+${diff} vs mes anterior` };
    if (diff < 0) return { icon: TrendingDown, color: "text-red-500", text: `${diff} vs mes anterior` };
    return { icon: Minus, color: "text-muted-foreground", text: "Sin cambio" };
  };

  const trend = getTrend();
  const TrendIcon = trend.icon;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // ── Skeleton de estadísticas ─────────────────────────────────────────────────
  if (loadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error de estadísticas ─────────────────────────────────────────────────────
  if (statsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se pudieron cargar las estadísticas.{" "}
          <button type="button" className="underline font-medium" onClick={loadStats}>
            Intentar de nuevo
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── TARJETAS DE RESUMEN ── */}
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

      {/* ── TABLA DE POSTULACIONES ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            Todas mis Postulaciones ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tableError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No se pudieron cargar las postulaciones.{" "}
                <button type="button" className="underline font-medium" onClick={() => loadPostulaciones(currentPage)}>
                  Intentar de nuevo
                </button>
              </AlertDescription>
            </Alert>
          ) : loadingTable ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : postulaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tienes postulaciones registradas</div>
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
                      const vacanteCerrada =
                        postulacion.publicacion?.vacante?.estatus === "cerrada" ||
                        postulacion.publicacion?.vacante?.estatus === "cancelada";
                      const tienePublicacion = postulacion.publicacion !== null;

                      return (
                        <TableRow key={postulacion.id}>
                          <TableCell className="font-medium">
                            {tienePublicacion ? postulacion.publicacion?.titulo_puesto || "—" : "Vacante eliminada"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {tienePublicacion ? postulacion.publicacion?.ubicacion || "No especificada" : "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {tienePublicacion ? getModalidadLabel(postulacion.publicacion?.lugar_trabajo || "") : "—"}
                          </TableCell>
                          <TableCell>
                            {tienePublicacion && postulacion.publicacion?.sueldo_bruto_aprobado ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                {postulacion.publicacion.sueldo_bruto_aprobado.toLocaleString("es-MX")}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getEstadoColor(postulacion.estado, vacanteCerrada)}>
                              {getEstadoLabel(postulacion.estado, postulacion.etapa, vacanteCerrada)}
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
                              <Calendar className="h-3 w-3 shrink-0" />
                              {formatFecha(postulacion.fecha_postulacion)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loadingTable}
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || loadingTable}
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

      {/* ── GRÁFICA ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Postulaciones por Mes (últimos 3 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [value, "Postulaciones"]}
                />
                <Bar dataKey="postulaciones" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrent ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                      opacity={entry.isCurrent ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── FEEDBACK DE RECLUTADORES ── */}
      {feedbacks.length > 0 ? (
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
                      <p className="text-sm text-muted-foreground">{formatFechaLarga(feedback.created_at)}</p>
                    </div>
                    {/* Estrellas con puntuación validada — nunca más de 5 */}
                    <div className="flex items-center gap-0.5" aria-label={`${feedback.puntuacion} de 5 estrellas`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < feedback.puntuacion ? "text-yellow-500" : "text-gray-300"}
                          aria-hidden="true"
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Comentario sanitizado — no se renderiza HTML arbitrario */}
                  <p className="text-sm">{feedback.comentario}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aún no has recibido feedback de los reclutadores
          </CardContent>
        </Card>
      )}
    </div>
  );
};
