import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, UserX } from "lucide-react";
import { DesvincularReclutadorDialog } from "./DesvincularReclutadorDialog";

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
  const [desvincularDialog, setDesvincularDialog] = useState<{
    open: boolean;
    asociacionId: string;
    reclutadorNombre: string;
  }>({ open: false, asociacionId: "", reclutadorNombre: "" });

  useEffect(() => {
    loadReclutadores();
  }, []);

  const loadReclutadores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        setLoading(false);
        return;
      }

      // Obtener empresa del usuario
      const { data: userRoles, error: roleError } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      console.log("User roles query:", { userRoles, roleError });

      if (!userRoles?.empresa_id) {
        console.log("No empresa_id found for user");
        setLoading(false);
        return;
      }

      // Obtener reclutadores asociados con join manual
      const { data: asociaciones, error } = await supabase
        .from("reclutador_empresa")
        .select("id, reclutador_id, tipo_vinculacion, estado, fecha_inicio")
        .eq("empresa_id", userRoles.empresa_id)
        .eq("estado", "activa");

      console.log("Asociaciones query:", { 
        empresa_id: userRoles.empresa_id,
        asociaciones,
        error 
      });

      if (error) {
        console.error("Error cargando asociaciones:", error);
        setLoading(false);
        return;
      }

      if (!asociaciones || asociaciones.length === 0) {
        console.log("No asociaciones found");
        setLoading(false);
        return;
      }

      // Obtener perfiles de reclutadores
      const reclutadorIds = asociaciones.map(a => a.reclutador_id);
      const { data: perfiles, error: perfilesError } = await supabase
        .from("perfil_reclutador")
        .select("id, nombre_reclutador, email, especialidades, user_id")
        .in("id", reclutadorIds);

      console.log("Perfiles query:", { perfiles, perfilesError });

      if (perfilesError) {
        console.error("Error cargando perfiles:", perfilesError);
        setLoading(false);
        return;
      }

      // Mapear perfiles con asociaciones
      const formattedData = asociaciones
        .map(asoc => {
          const perfil = perfiles?.find(p => p.id === asoc.reclutador_id);
          if (!perfil) return null;
          
          return {
            id: asoc.id,
            reclutador_id: asoc.reclutador_id,
            nombre_reclutador: perfil.nombre_reclutador || "Sin nombre",
            email: perfil.email || "Sin email",
            tipo_vinculacion: asoc.tipo_vinculacion,
            estado: asoc.estado,
            fecha_inicio: asoc.fecha_inicio,
            especialidades: perfil.especialidades || [],
          };
        })
        .filter(Boolean) as ReclutadorAsociado[];

      console.log("Reclutadores formateados final:", formattedData);
      setReclutadores(formattedData);
    } catch (error) {
      console.error("Error general cargando reclutadores:", error);
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
                  <TableHead className="text-right">Acciones</TableHead>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDesvincularDialog({
                          open: true,
                          asociacionId: rec.id,
                          reclutadorNombre: rec.nombre_reclutador
                        })}
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Desvincular
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <DesvincularReclutadorDialog
        open={desvincularDialog.open}
        onOpenChange={(open) => setDesvincularDialog({ ...desvincularDialog, open })}
        asociacionId={desvincularDialog.asociacionId}
        reclutadorNombre={desvincularDialog.reclutadorNombre}
        onSuccess={loadReclutadores}
      />
    </Card>
  );
};
