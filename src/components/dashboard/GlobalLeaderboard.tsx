import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

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
};

export const GlobalLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<"promedio_dias_cierre" | "vacantes_cerradas" | "ranking_score">("vacantes_cerradas");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    // Re-sort cuando cambian los criterios
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

      // Obtener todos los reclutadores de la plataforma
      const { data: reclutadores } = await supabase
        .from("reclutadores")
        .select(`
          id,
          user_id,
          nombre,
          correo
        `);

      if (!reclutadores || reclutadores.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Para cada reclutador, obtener sus métricas y datos del perfil
      const entries: LeaderboardEntry[] = [];

      for (const reclutador of reclutadores) {
        // Obtener perfil del usuario para país y empresa
        const { data: perfil } = await supabase
          .from("perfil_usuario")
          .select("pais, nombre_empresa")
          .eq("user_id", reclutador.user_id)
          .single();

        // Obtener vacantes cerradas del reclutador
        const { data: vacantes } = await supabase
          .from("vacantes")
          .select("fecha_solicitud, fecha_cierre")
          .eq("reclutador_id", reclutador.id)
          .eq("estatus", "cerrada")
          .not("fecha_cierre", "is", null);

        let promedioDias = 0;
        let vacantesCerradas = 0;

        if (vacantes && vacantes.length > 0) {
          vacantesCerradas = vacantes.length;
          
          // Calcular promedio de días de cierre
          let totalDias = 0;
          vacantes.forEach((v) => {
            if (v.fecha_cierre && v.fecha_solicitud) {
              const inicio = new Date(v.fecha_solicitud);
              const fin = new Date(v.fecha_cierre);
              const dias = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
              totalDias += dias;
            }
          });

          promedioDias = Math.round(totalDias / vacantes.length);
        }

        entries.push({
          id: reclutador.id,
          user_id: reclutador.user_id,
          nombre: reclutador.nombre,
          pais: perfil?.pais || "México",
          empresa: perfil?.nombre_empresa || "Empresa Confidencial",
          promedio_dias_cierre: promedioDias,
          vacantes_cerradas: vacantesCerradas,
          ranking_score: null, // Por ahora null, se calculará en el futuro
        });
      }

      setLeaderboard(entries);
      sortLeaderboard(entries);
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
        return 0;
      } else if (sortColumn === "vacantes_cerradas") {
        comparison = b.vacantes_cerradas - a.vacantes_cerradas;
        // En caso de empate, ordenar por promedio de días (menor es mejor)
        if (comparison === 0 && a.promedio_dias_cierre > 0 && b.promedio_dias_cierre > 0) {
          comparison = a.promedio_dias_cierre - b.promedio_dias_cierre;
        }
      } else {
        // Menor promedio de días es mejor (solo si tienen datos)
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

    setLeaderboard(data);
  };

  const handleSort = (column: "promedio_dias_cierre" | "vacantes_cerradas" | "ranking_score") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "vacantes_cerradas" ? "desc" : column === "ranking_score" ? "desc" : "asc");
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

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Tablero Global de Reclutadores</CardTitle>
          <CardDescription>Cargando clasificación mundial...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Cargando datos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md" id="global-leaderboard">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Tablero Global de Reclutadores
            </CardTitle>
            <CardDescription>
              Clasificación mundial basada en desempeño de cierre de vacantes
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Posición</TableHead>
                <TableHead className="w-[60px]">País</TableHead>
                <TableHead>Reclutador</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("promedio_dias_cierre")}
                >
                  Promedio Días {sortColumn === "promedio_dias_cierre" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("vacantes_cerradas")}
                >
                  Vacantes Cerradas {sortColumn === "vacantes_cerradas" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => handleSort("ranking_score")}
                >
                  Ranking {sortColumn === "ranking_score" && (sortDirection === "asc" ? "↑" : "↓")}
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
      </CardContent>
    </Card>
  );
};
