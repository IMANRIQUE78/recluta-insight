import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const [filteredVacantes, setFilteredVacantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [reclutadores, setReclutadores] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>("todos");
  const [selectedReclutador, setSelectedReclutador] = useState<string>("todos");
  const [selectedEstatus, setSelectedEstatus] = useState<string>("todos");

  useEffect(() => {
    loadVacantes();
    loadFilters();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [vacantes, selectedCliente, selectedReclutador, selectedEstatus]);

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
          perfil_reclutador:reclutador_id (
            id,
            nombre_reclutador
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

  const loadFilters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clientesData, reclutadoresData] = await Promise.all([
        supabase
          .from("clientes_areas")
          .select("id, cliente_nombre, area")
          .eq("user_id", user.id)
          .order("cliente_nombre"),
        supabase
          .from("reclutadores")
          .select("id, nombre")
          .eq("user_id", user.id)
          .order("nombre")
      ]);

      if (clientesData.data) setClientes(clientesData.data);
      if (reclutadoresData.data) setReclutadores(reclutadoresData.data);
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...vacantes];

    if (selectedCliente !== "todos") {
      filtered = filtered.filter(v => v.cliente_area_id === selectedCliente);
    }

    if (selectedReclutador !== "todos") {
      filtered = filtered.filter(v => v.reclutador_id === selectedReclutador);
    }

    if (selectedEstatus !== "todos") {
      filtered = filtered.filter(v => v.estatus === selectedEstatus);
    }

    setFilteredVacantes(filtered);
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
          <>
            <div className="flex gap-4 mb-4 flex-wrap">
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Cliente/Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.cliente_nombre} - {cliente.area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedReclutador} onValueChange={setSelectedReclutador}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Reclutador Asignado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los reclutadores</SelectItem>
                  {reclutadores.map((reclutador) => (
                    <SelectItem key={reclutador.id} value={reclutador.id}>
                      {reclutador.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedEstatus} onValueChange={setSelectedEstatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estatus</SelectItem>
                  <SelectItem value="abierta">Abierta</SelectItem>
                  <SelectItem value="cerrada">Cerrada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                {filteredVacantes.map((vacante) => (
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {vacante.perfil_reclutador?.nombre_reclutador ? (
                        <button
                          onClick={() => {
                            const reclutadorId = vacante.reclutador_id;
                            if (reclutadorId) {
                              window.dispatchEvent(new CustomEvent('openReclutadorProfile', { detail: { reclutadorId } }));
                            }
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          {vacante.perfil_reclutador.nombre_reclutador}
                        </button>
                      ) : (
                        <span className="text-muted-foreground italic">No asignado</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{vacante.lugar_trabajo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
