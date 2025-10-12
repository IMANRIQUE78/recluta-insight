import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  nombre_usuario: string;
  pais: string;
  promedio_dias_cierre: number;
  vacantes_cerradas: number;
  ranking: number;
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
  const [sortColumn, setSortColumn] = useState<"promedio_dias_cierre" | "vacantes_cerradas">("vacantes_cerradas");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    // Re-sort cuando cambian los criterios
    sortLeaderboard();
  }, [sortColumn, sortDirection]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Obtener todos los perfiles de usuario con sus métricas
      const { data: perfiles } = await supabase
        .from("perfil_usuario")
        .select("user_id, nombre_usuario, pais");

      if (!perfiles) {
        setLeaderboard([]);
        return;
      }

      // Para cada usuario, calcular sus métricas
      const entries: LeaderboardEntry[] = [];

      for (const perfil of perfiles) {
        // Obtener vacantes cerradas del usuario
        const { data: vacantes } = await supabase
          .from("vacantes")
          .select("fecha_solicitud, fecha_cierre")
          .eq("user_id", perfil.user_id)
          .eq("estatus", "cerrada")
          .not("fecha_cierre", "is", null);

        if (!vacantes || vacantes.length === 0) continue;

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

        const promedioDias = Math.round(totalDias / vacantes.length);

        entries.push({
          user_id: perfil.user_id,
          nombre_usuario: perfil.nombre_usuario || "Usuario",
          pais: perfil.pais || "México",
          promedio_dias_cierre: promedioDias,
          vacantes_cerradas: vacantes.length,
          ranking: 0, // Se calculará después del ordenamiento
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
      
      if (sortColumn === "vacantes_cerradas") {
        comparison = b.vacantes_cerradas - a.vacantes_cerradas;
        // En caso de empate, ordenar por promedio de días (menor es mejor)
        if (comparison === 0) {
          comparison = a.promedio_dias_cierre - b.promedio_dias_cierre;
        }
      } else {
        // Menor promedio de días es mejor
        comparison = a.promedio_dias_cierre - b.promedio_dias_cierre;
        // En caso de empate, ordenar por vacantes cerradas
        if (comparison === 0) {
          comparison = b.vacantes_cerradas - a.vacantes_cerradas;
        }
      }
      
      return sortDirection === "asc" ? -comparison : comparison;
    });

    // Asignar rankings
    data.forEach((entry, index) => {
      entry.ranking = index + 1;
    });

    setLeaderboard(data);
  };

  const handleSort = (column: "promedio_dias_cierre" | "vacantes_cerradas") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "vacantes_cerradas" ? "desc" : "asc");
    }
  };

  const formatNombre = (nombre: string, userId: string) => {
    if (userId === currentUserId) {
      return nombre; // Mostrar nombre completo del usuario actual
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

  const getRankingIcon = (ranking: number) => {
    switch (ranking) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return null;
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
                <TableHead className="w-[80px]">Ranking</TableHead>
                <TableHead className="w-[60px]">País</TableHead>
                <TableHead>Reclutador</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("promedio_dias_cierre")}
                >
                  Promedio Días Cierre {sortColumn === "promedio_dias_cierre" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("vacantes_cerradas")}
                >
                  Vacantes Cerradas {sortColumn === "vacantes_cerradas" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay datos disponibles aún
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((entry) => (
                  <TableRow 
                    key={entry.user_id}
                    className={entry.user_id === currentUserId ? "bg-primary/5 font-medium" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRankingIcon(entry.ranking)}
                        <span className="font-semibold">#{entry.ranking}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-2xl">{countryFlags[entry.pais] || "🌎"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatNombre(entry.nombre_usuario, entry.user_id)}
                        {entry.user_id === currentUserId && (
                          <Badge variant="secondary" className="text-xs">Tú</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={entry.promedio_dias_cierre <= 30 ? "text-green-600 font-semibold" : ""}>
                        {entry.promedio_dias_cierre} días
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {entry.vacantes_cerradas}
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
