import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  nombre: string;
  pais: string;
  empresa: string;
  promedio_dias_cierre: number;
  vacantes_cerradas: number;
  ranking_score: number | null;
}

const countryFlags: Record<string, string> = {
  "México": "🇲🇽",
  "Colombia": "🇨🇴",
  "Argentina": "🇦🇷",
  "Chile": "🇨🇱",
  "Perú": "🇵🇪",
  "España": "🇪🇸",
  "Estados Unidos": "🇺🇸",
  "Brasil": "🇧🇷",
};

interface GlobalLeaderboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalLeaderboardModal = ({ open, onOpenChange }: GlobalLeaderboardModalProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<"promedio_dias_cierre" | "vacantes_cerradas" | "ranking_score">("vacantes_cerradas");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (open) {
      loadLeaderboard();
    }
  }, [open]);

  useEffect(() => {
    if (leaderboard.length > 0) {
      sortLeaderboard();
    }
  }, [sortColumn, sortDirection]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Obtener todos los perfiles de reclutadores con sus estadísticas
      const { data: reclutadores, error: reclutadoresError } = await supabase
        .from("perfil_reclutador")
        .select("user_id, nombre_reclutador");

      if (reclutadoresError) {
        console.error("Error fetching reclutadores:", reclutadoresError);
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      if (!reclutadores || reclutadores.length === 0) {
        console.log("No hay reclutadores registrados");
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Obtener estadísticas de todos los reclutadores
      const { data: estadisticas, error: estadisticasError } = await supabase
        .from("estadisticas_reclutador")
        .select("user_id, vacantes_cerradas, promedio_dias_cierre, ranking_score");

      if (estadisticasError) {
        console.error("Error fetching estadisticas:", estadisticasError);
      }

      // Por ahora usar país fijo, en el futuro se puede agregar un campo de país al perfil_reclutador
      const leaderboardData: LeaderboardEntry[] = reclutadores.map((reclutador: any) => {
        const stats = estadisticas?.find(e => e.user_id === reclutador.user_id);
        
        // Formatear nombre: si no es el usuario actual, mostrar nombre + primera letra del apellido
        const nombreCompleto = reclutador.nombre_reclutador || "Reclutador";
        let nombreFormateado = nombreCompleto;
        if (reclutador.user_id !== user?.id) {
          const parts = nombreCompleto.trim().split(' ');
          if (parts.length > 1) {
            // Tomar primer nombre y primera letra del apellido
            nombreFormateado = `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
          }
        }
        
        // Calcular score total
        const vacantesCerradas = stats?.vacantes_cerradas || 0;
        const promedioDias = stats?.promedio_dias_cierre || 0;
        
        return {
          id: reclutador.user_id,
          user_id: reclutador.user_id,
          nombre: nombreFormateado,
          pais: "México", // Por defecto, se puede agregar campo de país después
          empresa: "Independiente",
          promedio_dias_cierre: promedioDias,
          vacantes_cerradas: vacantesCerradas,
          ranking_score: vacantesCerradas > 0 ? vacantesCerradas : null,
        };
      });

      console.log("Total reclutadores:", leaderboardData.length);
      setLeaderboard(leaderboardData);
      sortLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const sortLeaderboard = (entries?: LeaderboardEntry[]) => {
    const data = entries || [...leaderboard];
    
    data.sort((a, b) => {
      let comparison = 0;
      
      if (sortColumn === "ranking_score") {
        // Por ahora todos son null, no ordenar
        const scoreA = a.ranking_score ?? 0;
        const scoreB = b.ranking_score ?? 0;
        comparison = scoreB - scoreA;
      } else if (sortColumn === "vacantes_cerradas") {
        comparison = b.vacantes_cerradas - a.vacantes_cerradas;
        // En caso de empate, ordenar por promedio de días (menor es mejor)
        if (comparison === 0 && a.promedio_dias_cierre > 0 && b.promedio_dias_cierre > 0) {
          comparison = a.promedio_dias_cierre - b.promedio_dias_cierre;
        }
      } else {
        // Menor promedio de días es mejor (solo si tienen datos)
        if (a.promedio_dias_cierre === 0 && b.promedio_dias_cierre === 0) return 0;
        if (a.promedio_dias_cierre === 0) return 1;
        if (b.promedio_dias_cierre === 0) return -1;
        comparison = a.promedio_dias_cierre - b.promedio_dias_cierre;
        // En caso de empate, ordenar por vacantes cerradas
        if (comparison === 0) {
          comparison = b.vacantes_cerradas - a.vacantes_cerradas;
        }
      }
      
      return sortDirection === "asc" ? -comparison : comparison;
    });

    if (!entries) {
      setLeaderboard(data);
    }
  };

  const handleSort = (column: "promedio_dias_cierre" | "vacantes_cerradas" | "ranking_score") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "vacantes_cerradas" || column === "ranking_score" ? "desc" : "asc");
    }
  };

  // La función formatNombre ya no es necesaria porque formateamos en loadLeaderboard

  const getRankingBadge = (index: number) => {
    const position = index + 1;
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-sm text-muted-foreground">#{position}</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Ranking Global de Reclutadores
          </DialogTitle>
          <DialogDescription>
            Clasificación mundial de todos los reclutadores registrados en la plataforma
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Cargando ranking global...</div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Posición</TableHead>
                  <TableHead className="w-[60px]">País</TableHead>
                  <TableHead>Reclutador</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("vacantes_cerradas")}
                      className="w-full justify-end"
                    >
                      Vacantes Cerradas
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("promedio_dias_cierre")}
                      className="w-full justify-end"
                    >
                      Promedio Días Cierre
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay reclutadores registrados en la plataforma aún
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map((entry, index) => (
                    <TableRow 
                      key={entry.id}
                      className={currentUserId && entry.user_id === currentUserId ? "bg-primary/5 font-medium" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankingBadge(index)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-2xl">{countryFlags[entry.pais] || "🌎"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.nombre}
                          {currentUserId && entry.user_id === currentUserId && (
                            <Badge variant="secondary" className="text-xs">Tú</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {entry.vacantes_cerradas > 0 ? entry.vacantes_cerradas : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.promedio_dias_cierre > 0 ? (
                          <span className={entry.promedio_dias_cierre <= 30 ? "text-green-600 font-semibold" : ""}>
                            {entry.promedio_dias_cierre} días
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
