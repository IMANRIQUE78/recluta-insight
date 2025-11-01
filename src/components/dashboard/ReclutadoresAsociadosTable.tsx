import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";

interface ReclutadorAsociado {
  id: string;
  reclutador_id: string;
  nombre_reclutador: string;
  email: string;
  tipo_vinculacion: string;
  estado: string;
  fecha_inicio: string;
  especialidades?: string[];
}

export const ReclutadoresAsociadosTable = () => {
  const [reclutadores, setReclutadores] = useState<ReclutadorAsociado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReclutadores();
  }, []);

  const loadReclutadores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener empresa del usuario
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .single();

      if (!userRoles?.empresa_id) {
        setLoading(false);
        return;
      }

      // Obtener reclutadores asociados
      const { data: asociaciones, error } = await supabase
        .from("reclutador_empresa")
        .select(`
          id,
          reclutador_id,
          tipo_vinculacion,
          estado,
          fecha_inicio,
          perfil_reclutador (
            id,
            nombre_reclutador,
            email,
            especialidades
          )
        `)
        .eq("empresa_id", userRoles.empresa_id)
        .eq("estado", "activa");

      if (error) throw error;

      const formattedData = asociaciones?.map(asoc => ({
        id: asoc.id,
        reclutador_id: asoc.reclutador_id,
        nombre_reclutador: (asoc.perfil_reclutador as any)?.nombre_reclutador || "Sin nombre",
        email: (asoc.perfil_reclutador as any)?.email || "Sin email",
        tipo_vinculacion: asoc.tipo_vinculacion,
        estado: asoc.estado,
        fecha_inicio: asoc.fecha_inicio,
        especialidades: (asoc.perfil_reclutador as any)?.especialidades || [],
      })) || [];

      setReclutadores(formattedData);
    } catch (error) {
      console.error("Error cargando reclutadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoVinculacionBadge = (tipo: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      interno: "default",
      externo: "secondary",
      freelance: "outline",
    };
    
    const labels: Record<string, string> = {
      interno: "Básico",
      externo: "Externo",
      freelance: "Freelance",
    };

    return (
      <Badge variant={variants[tipo] || "default"}>
        {labels[tipo] || tipo}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Reclutadores Asociados
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Reclutadores Asociados
        </CardTitle>
        <CardDescription>
          Personal de reclutamiento activo en tu empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reclutadores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay reclutadores asociados</p>
            <p className="text-sm mt-1">Invita reclutadores desde las acciones rápidas</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reclutadores.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('openReclutadorProfile', { detail: { reclutadorId: rec.reclutador_id } }));
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        {rec.nombre_reclutador}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rec.email}</TableCell>
                    <TableCell>{getTipoVinculacionBadge(rec.tipo_vinculacion)}</TableCell>
                    <TableCell>
                      {rec.especialidades && rec.especialidades.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rec.especialidades.slice(0, 3).map((esp, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {esp}
                            </Badge>
                          ))}
                          {rec.especialidades.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{rec.especialidades.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(rec.fecha_inicio).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
