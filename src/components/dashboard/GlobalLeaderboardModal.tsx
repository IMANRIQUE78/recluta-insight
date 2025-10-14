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

      // Obtener perfiles con sus estadísticas usando JOIN
      const { data: entries, error } = await supabase
        .from("perfil_usuario")
        .select(`
          user_id,
          nombre_usuario,
          pais,
          nombre_empresa,
          estadisticas_reclutador!inner (
            vacantes_cerradas,
            promedio_dias_cierre,
            ranking_score
          )
        `);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      if (!entries || entries.length === 0) {
        console.log("No leaderboard data found");
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Mapear los datos al formato esperado
      const leaderboardData: LeaderboardEntry[] = entries.map((entry: any) => ({
        id: entry.user_id,
        user_id: entry.user_id,
        nombre: entry.nombre_usuario || "Usuario",
        pais: entry.pais || "México",
        empresa: entry.nombre_empresa || "Empresa Confidencial",
        promedio_dias_cierre: entry.estadisticas_reclutador[0]?.promedio_dias_cierre || 0,
        vacantes_cerradas: entry.estadisticas_reclutador[0]?.vacantes_cerradas || 0,
        ranking_score: entry.estadisticas_reclutador[0]?.ranking_score || null,
      }));

      console.log("Total entries:", leaderboardData.length);
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

  const formatNombre = (nombre: string, userId: string) => {
    // Mostrar nombre completo para el usuario actual
    if (currentUserId && userId === currentUserId) {
      return nombre;
    }
    
    // Para otros usuarios, mostrar nombre + inicial del apellido
    const partes = nombre.trim().split(" ");
    if (partes.length === 1) {
      return partes[0];
    }
    
    const primerNombre = partes[0];
    const inicialApellido = partes[partes.length - 1][0] + ".";
    return `${primerNombre} ${inicialApellido}`;
  };

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
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("promedio_dias_cierre")}
                      className="w-full justify-end"
                    >
                      Promedio Días
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
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
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("ranking_score")}
                      className="w-full justify-center"
                    >
                      Ranking
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                          {formatNombre(entry.nombre, entry.user_id)}
                          {currentUserId && entry.user_id === currentUserId && (
                            <Badge variant="secondary" className="text-xs">Tú</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{entry.empresa}</span>
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
                      <TableCell className="text-right font-semibold">
                        {entry.vacantes_cerradas > 0 ? entry.vacantes_cerradas : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {entry.ranking_score !== null ? entry.ranking_score : "-"}
                        </Badge>
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
