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
import { calcularRankingGlobal } from "@/utils/rankingCalculations";

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
  const [sortColumn, setSortColumn] = useState<"promedio_dias_cierre" | "vacantes_cerradas" | "ranking_score">("ranking_score");
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

      // Obtener datos de todos los reclutadores
      const { data: perfiles, error: perfilesError } = await supabase
        .from('perfil_reclutador')
        .select('user_id, nombre_reclutador');

      if (perfilesError) {
        console.error("Error cargando perfiles:", perfilesError);
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Obtener estadísticas de vacantes para cada reclutador
      const { data: vacantes, error: vacantesError } = await supabase
        .from('vacantes')
        .select('reclutador_asignado_id, estatus, fecha_cierre, fecha_solicitud');

      if (vacantesError) {
        console.error("Error cargando vacantes:", vacantesError);
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Calcular estadísticas por reclutador
      const statsMap = new Map();
      
      perfiles?.forEach(perfil => {
        const vacantesReclutador = vacantes?.filter((v: any) => v.reclutador_asignado_id === perfil.user_id) || [];
        const cerradas = vacantesReclutador.filter((v: any) => v.estatus === 'cerrada' && v.fecha_cierre);
        
        let promedioDias = 0;
        if (cerradas.length > 0) {
          const totalDias = cerradas.reduce((sum, v: any) => {
            if (v.fecha_cierre && v.fecha_solicitud) {
              const dias = Math.floor(
                (new Date(v.fecha_cierre).getTime() - new Date(v.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + dias;
            }
            return sum;
          }, 0);
          promedioDias = totalDias / cerradas.length;
        }
        
        statsMap.set(perfil.user_id, {
          user_id: perfil.user_id,
          nombre_reclutador: perfil.nombre_reclutador,
          vacantes_cerradas: cerradas.length,
          promedio_dias_cierre: promedioDias
        });
      });

      // Convertir a array y calcular ranking con nuevo algoritmo
      const reclutadoresData = Array.from(statsMap.values());
      const rankingCalculado = calcularRankingGlobal(reclutadoresData);

      // Formatear los datos para la tabla
      const formattedData: LeaderboardEntry[] = rankingCalculado.map((entry) => {
        // Si NO es el usuario actual, ofuscar apellido
        let nombreFormateado = entry.nombre_reclutador || "Reclutador";
        if (user && entry.user_id !== user.id) {
          const parts = nombreFormateado.trim().split(' ');
          if (parts.length > 1) {
            nombreFormateado = `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
          }
        }
        
        return {
          id: entry.user_id,
          user_id: entry.user_id,
          nombre: nombreFormateado,
          pais: "México",
          empresa: "Independiente",
          promedio_dias_cierre: entry.promedio_dias_cierre || 0,
          vacantes_cerradas: entry.vacantes_cerradas || 0,
          ranking_score: entry.ranking_score > 0 ? entry.ranking_score : null,
        };
      });

      console.log("Leaderboard data completo:", formattedData);
      setLeaderboard(formattedData);
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
        // Ordenar por score (mayor es mejor)
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

  const getRankingBadge = (index: number) => {
    const position = index + 1;
    switch (position) {
      case 1:
        return (
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 px-3 py-1.5 rounded-full">
            <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">1°</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center gap-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700/30 dark:to-slate-600/20 px-3 py-1.5 rounded-full">
            <Medal className="h-5 w-5 text-slate-500 dark:text-slate-300" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">2°</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 px-3 py-1.5 rounded-full">
            <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-bold text-orange-700 dark:text-orange-300">3°</span>
          </div>
        );
      default:
        return (
          <span className="text-sm font-medium text-muted-foreground px-3">#{position}</span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-background to-secondary/20">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="bg-gradient-to-br from-primary to-chart-1 p-2 rounded-lg">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Ranking Global de Reclutadores
            </span>
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Índice de Productividad: (Vacantes Cerradas / Promedio de Días) × 100
            <br />
            <span className="text-xs text-muted-foreground">
              Resultados publicados mensualmente del periodo anterior
            </span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-muted-foreground font-medium">Calculando ranking global...</div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[140px] font-bold">Posición</TableHead>
                  <TableHead className="w-[60px]">País</TableHead>
                  <TableHead className="font-bold">Reclutador</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("vacantes_cerradas")}
                      className="w-full justify-end font-bold hover:bg-primary/10"
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
                      className="w-full justify-end font-bold hover:bg-primary/10"
                    >
                      Promedio Días
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleSort("ranking_score")}
                       className="w-full justify-end font-bold hover:bg-primary/10"
                       title="Índice de Productividad: (Vacantes / Días) × 100"
                     >
                       Índice
                       <ArrowUpDown className="ml-2 h-4 w-4" />
                     </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Trophy className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-lg">No hay reclutadores registrados en la plataforma aún</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map((entry, index) => {
                    const isTopThree = index < 3;
                    const isCurrentUser = currentUserId && entry.user_id === currentUserId;
                    
                    return (
                      <TableRow 
                        key={entry.id}
                        className={`
                          transition-colors
                          ${isCurrentUser ? "bg-primary/10 font-semibold border-l-4 border-l-primary" : ""}
                          ${isTopThree && !isCurrentUser ? "bg-muted/30" : ""}
                          ${!isTopThree && !isCurrentUser ? "hover:bg-muted/20" : ""}
                        `}
                      >
                        <TableCell>
                          {getRankingBadge(index)}
                        </TableCell>
                        <TableCell>
                          <span className="text-2xl">{countryFlags[entry.pais] || "🌎"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={isTopThree ? "font-bold" : ""}>{entry.nombre}</span>
                            {isCurrentUser && (
                              <Badge className="bg-primary text-primary-foreground text-xs">Tú</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.vacantes_cerradas > 0 ? (
                            <span className="font-semibold text-lg">
                              {entry.vacantes_cerradas}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.promedio_dias_cierre > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className={`font-semibold ${
                                entry.promedio_dias_cierre <= 30 
                                  ? "text-success" 
                                  : entry.promedio_dias_cierre <= 45 
                                  ? "text-chart-5" 
                                  : "text-muted-foreground"
                              }`}>
                                {Math.round(entry.promedio_dias_cierre)}
                              </span>
                              <span className="text-xs text-muted-foreground">días</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.ranking_score ? (
                            <span className="font-bold text-primary text-lg">
                              {Math.round(entry.ranking_score)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {!loading && leaderboard.length > 0 && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Índice de Productividad:</strong> (Vacantes Cerradas / Promedio de Días) × 100
              <br />
              <span className="text-xs">
                Mayor índice = más vacantes cerradas en menos tiempo. Resultados publicados mensualmente.
              </span>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
