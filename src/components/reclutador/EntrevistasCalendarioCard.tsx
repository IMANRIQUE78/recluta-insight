import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, User, CheckCircle, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GestionarEntrevistaDialog } from "./GestionarEntrevistaDialog";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EntrevistasCalendarioCardProps {
  reclutadorUserId: string;
}

export const EntrevistasCalendarioCard = ({ reclutadorUserId }: EntrevistasCalendarioCardProps) => {
  const { toast } = useToast();
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntrevista, setSelectedEntrevista] = useState<any>(null);
  const [gestionarDialogOpen, setGestionarDialogOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    loadEntrevistas();
  }, [reclutadorUserId]);

  const loadEntrevistas = async () => {
    try {
      // First fetch interviews
      const { data: entrevistasData, error: entrevistasError } = await supabase
        .from("entrevistas_candidato")
        .select(`
          id,
          fecha_entrevista,
          asistio,
          estado,
          detalles_reunion,
          tipo_entrevista,
          duracion_minutos,
          postulacion_id,
          candidato_user_id
        `)
        .eq("reclutador_user_id", reclutadorUserId)
        .gte("fecha_entrevista", new Date().toISOString())
        .order("fecha_entrevista", { ascending: true });

      if (entrevistasError) throw entrevistasError;

      if (!entrevistasData || entrevistasData.length === 0) {
        setEntrevistas([]);
        return;
      }

      // Get unique IDs for parallel queries
      const postulacionIds = [...new Set(entrevistasData.map(e => e.postulacion_id))];
      const candidatoUserIds = [...new Set(entrevistasData.map(e => e.candidato_user_id))];

      // Parallel queries for related data
      const [postulacionesResult, candidatosResult] = await Promise.all([
        supabase
          .from("postulaciones")
          .select(`
            id, 
            publicacion_id,
            publicaciones_marketplace(id, titulo_puesto)
          `)
          .in("id", postulacionIds),
        supabase
          .from("perfil_candidato")
          .select("user_id, nombre_completo, email")
          .in("user_id", candidatoUserIds)
      ]);

      const postulaciones = postulacionesResult.data || [];
      const candidatos = candidatosResult.data || [];

      // Build lookup maps for O(1) access
      const postulacionMap = new Map(postulaciones.map(p => [p.id, p]));
      const candidatoMap = new Map(candidatos.map(c => [c.user_id, c]));

      const entrevistasEnriquecidas = entrevistasData.map(entrevista => {
        const postulacion = postulacionMap.get(entrevista.postulacion_id);
        const publicacion = (postulacion as any)?.publicaciones_marketplace;
        const candidato = candidatoMap.get(entrevista.candidato_user_id);

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

  const getEntrevistasPorDia = (day: Date) => {
    return entrevistas.filter(e => isSameDay(new Date(e.fecha_entrevista), day));
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "confirmada":
      case "aceptada":
        return "bg-green-500";
      case "propuesta":
        return "bg-amber-500";
      case "rechazada":
        return "bg-red-500";
      default:
        return "bg-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario de Entrevistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded w-full"></div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendario de Entrevistas
            </CardTitle>
            <CardDescription>
              {entrevistas.length} entrevista{entrevistas.length !== 1 ? 's' : ''} programada{entrevistas.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(new Date())} className="text-xs">
              Hoy
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {/* Header de días */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "text-center text-xs font-medium py-1 rounded",
                isToday(day) && "bg-primary text-primary-foreground"
              )}
            >
              <span className="hidden sm:block">{format(day, "EEE", { locale: es })}</span>
              <span className="sm:hidden">{format(day, "EEEEE", { locale: es })}</span>
              <span className="block text-lg font-bold">{format(day, "d")}</span>
            </div>
          ))}
        </div>

        {/* Celdas de calendario */}
        <div className="grid grid-cols-7 gap-1 h-[calc(100%-60px)] min-h-[200px]">
          {weekDays.map((day) => {
            const entrevistasDelDia = getEntrevistasPorDia(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border rounded-lg p-1 overflow-y-auto",
                  isToday(day) && "border-primary bg-primary/5",
                  entrevistasDelDia.length > 0 && "bg-muted/30"
                )}
              >
                {entrevistasDelDia.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-xs text-muted-foreground/50">-</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {entrevistasDelDia.map((entrevista) => (
                      <div
                        key={entrevista.id}
                        className="p-1.5 bg-background rounded border cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleGestionarEntrevista(entrevista)}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <div className={cn("w-2 h-2 rounded-full", getEstadoColor(entrevista.estado))} />
                          <span className="text-[10px] font-medium truncate">
                            {format(new Date(entrevista.fecha_entrevista), "HH:mm")}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold truncate leading-tight">
                          {entrevista.titulo_puesto}
                        </p>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {entrevista.candidato_nombre.split(' ')[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Lista resumida debajo del calendario */}
        {entrevistas.length > 0 && (
          <div className="mt-3 pt-3 border-t space-y-2 max-h-[150px] overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground">Próximas:</p>
            {entrevistas.slice(0, 3).map((entrevista) => (
              <div
                key={entrevista.id}
                className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg text-xs cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleGestionarEntrevista(entrevista)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{entrevista.titulo_puesto}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate">{entrevista.candidato_nombre}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium">
                    {format(new Date(entrevista.fecha_entrevista), "d MMM", { locale: es })}
                  </p>
                  <p className="text-muted-foreground">
                    {format(new Date(entrevista.fecha_entrevista), "HH:mm")}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGestionarEntrevista(entrevista);
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  {!entrevista.asistio && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-green-600 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarcarAsistencia(entrevista.id);
                      }}
                    >
                      <CheckCircle className="h-3 w-3" />
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
