import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, Briefcase, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

const getSemaforoBadge = (dias: number) => {
  if (dias <= 15) return { label: "En tiempo", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300" };
  if (dias <= 30) return { label: "Atención", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300" };
  if (dias <= 45) return { label: "Urgente", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300" };
  return { label: "Crítico", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300" };
};

const getRowSemaforoClass = (dias: number, estatus: string) => {
  if (estatus !== "abierta") return "";
  if (dias <= 15) return "border-l-4 border-l-green-500";
  if (dias <= 30) return "border-l-4 border-l-yellow-500";
  if (dias <= 45) return "border-l-4 border-l-orange-500";
  return "border-l-4 border-l-red-500";
};

const ITEMS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);

  // Estadísticas calculadas
  const stats = {
    total: vacantes.length,
    abiertas: vacantes.filter(v => v.estatus === "abierta").length,
    cerradas: vacantes.filter(v => v.estatus === "cerrada").length,
    canceladas: vacantes.filter(v => v.estatus === "cancelada").length,
  };

  // Paginación
  const totalPages = Math.ceil(filteredVacantes.length / ITEMS_PER_PAGE);
  const paginatedVacantes = filteredVacantes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    loadVacantes();
    loadFilters();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
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
          perfil_reclutador:reclutador_asignado_id (
            id,
            nombre_reclutador
          )
        `)
        .order("fecha_solicitud", { ascending: false });

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

      const clientesData = await supabase
        .from("clientes_areas")
        .select("id, cliente_nombre, area")
        .eq("user_id", user.id)
        .order("cliente_nombre");

      if (clientesData.data) setClientes(clientesData.data);
      
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      let formattedReclutadores: any[] = [];

      if (userRole?.empresa_id) {
        const { data: asociaciones } = await supabase
          .from("reclutador_empresa")
          .select("reclutador_id")
          .eq("empresa_id", userRole.empresa_id)
          .eq("estado", "activa");

        if (asociaciones && asociaciones.length > 0) {
          const reclutadorIds = asociaciones.map(a => a.reclutador_id);
          const { data: perfiles } = await supabase
            .from("perfil_reclutador")
            .select("id, nombre_reclutador")
            .in("id", reclutadorIds);

          formattedReclutadores = perfiles?.map(perfil => ({
            id: perfil.id,
            nombre: perfil.nombre_reclutador
          })) || [];
        }
      }
      
      setReclutadores(formattedReclutadores);
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
      filtered = filtered.filter(v => v.reclutador_asignado_id === selectedReclutador);
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

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generar números de página visibles
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <div className="p-2 rounded-full bg-primary/10">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="p-2 rounded-full bg-blue-500/20">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.abiertas}</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Abiertas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <div className="p-2 rounded-full bg-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.cerradas}</p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">Cerradas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <div className="p-2 rounded-full bg-red-500/20">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.canceladas}</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">Canceladas</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
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

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando vacantes...</div>
      ) : vacantes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay vacantes registradas. Crea tu primera vacante.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Nombre de Vacante</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead>Días Abierta</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Reclutador</TableHead>
                  <TableHead>Lugar de Trabajo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVacantes.map((vacante) => {
                  const diasAbierta = differenceInDays(
                    vacante.estatus === "cerrada" && vacante.fecha_cierre 
                      ? new Date(vacante.fecha_cierre) 
                      : new Date(), 
                    new Date(vacante.fecha_solicitud)
                  );
                  const semaforoBadge = getSemaforoBadge(diasAbierta);
                  
                  return (
                    <TableRow
                      key={vacante.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        getRowSemaforoClass(diasAbierta, vacante.estatus)
                      )}
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
                        {vacante.estatus === "abierta" ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={semaforoBadge.className}>
                              <Clock className="h-3 w-3 mr-1" />
                              {diasAbierta}d - {semaforoBadge.label}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">{diasAbierta} días</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getEstatusColor(vacante.estatus)}>
                            {getEstatusLabel(vacante.estatus)}
                          </Badge>
                          {vacante.solicitud_cierre && vacante.estatus === "abierta" && (
                            <span title="Solicitud de cierre pendiente" className="text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                            </span>
                          )}
                        </div>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredVacantes.length)} de {filteredVacantes.length} vacantes
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {getPageNumbers().map((page, idx) => (
                  typeof page === "number" ? (
                    <Button
                      key={idx}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => goToPage(page)}
                      className="h-8 w-8"
                    >
                      {page}
                    </Button>
                  ) : (
                    <span key={idx} className="px-2 text-muted-foreground">...</span>
                  )
                ))}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};