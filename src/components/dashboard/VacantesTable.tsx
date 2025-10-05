import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VacantesTableProps {
  onSelectVacante: (vacante: any) => void;
  refreshTrigger?: number;
}

const getEstatusColor = (estatus: string) => {
  switch (estatus) {
    case "abierta":
      return "bg-blue-500";
    case "cerrada":
      return "bg-green-500";
    case "cancelada":
      return "bg-destructive";
    default:
      return "bg-muted";
  }
};

const getEstatusLabel = (estatus: string) => {
  switch (estatus) {
    case "abierta":
      return "Abierta";
    case "cerrada":
      return "Cerrada";
    case "cancelada":
      return "Cancelada";
    default:
      return estatus;
  }
};

export const VacantesTable = ({ onSelectVacante, refreshTrigger }: VacantesTableProps) => {
  const { toast } = useToast();
  const [vacantes, setVacantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVacantes();
  }, [refreshTrigger]);

  const loadVacantes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vacantes")
        .select(`
          *,
          clientes_areas:cliente_area_id (
            cliente_nombre,
            tipo_cliente,
            area
          ),
          reclutadores:reclutador_id (
            nombre
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setVacantes(data || []);
    } catch (error: any) {
      toast({
        title: "Error al cargar vacantes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Vacantes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando vacantes...</div>
        ) : vacantes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay vacantes registradas. Crea tu primera vacante.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Nombre de Vacante</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Reclutador</TableHead>
                  <TableHead>Lugar de Trabajo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vacantes.map((vacante) => (
                  <TableRow
                    key={vacante.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onSelectVacante(vacante)}
                  >
                    <TableCell className="font-medium">{vacante.folio}</TableCell>
                    <TableCell>{vacante.titulo_puesto}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{vacante.clientes_areas?.cliente_nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {vacante.clientes_areas?.tipo_cliente}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(vacante.fecha_solicitud)}</TableCell>
                    <TableCell>
                      <Badge className={getEstatusColor(vacante.estatus)}>
                        {getEstatusLabel(vacante.estatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vacante.reclutadores?.nombre || (
                        <span className="text-muted-foreground italic">No asignado</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{vacante.lugar_trabajo}</TableCell>
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
