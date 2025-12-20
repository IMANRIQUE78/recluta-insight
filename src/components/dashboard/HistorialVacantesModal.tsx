import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search, Calendar, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistorialVacantesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVacante: (vacante: any) => void;
}

const getEstatusConfig = (estatus: string) => {
  switch (estatus) {
    case "abierta":
      return { label: "Abierta", className: "bg-blue-500 hover:bg-blue-600", icon: Clock };
    case "cerrada":
      return { label: "Cerrada", className: "bg-green-500 hover:bg-green-600", icon: CheckCircle2 };
    case "cancelada":
      return { label: "Cancelada", className: "bg-destructive hover:bg-destructive/90", icon: XCircle };
    default:
      return { label: estatus, className: "bg-muted", icon: Clock };
  }
};

export const HistorialVacantesModal = ({ 
  open, 
  onOpenChange, 
  onSelectVacante 
}: HistorialVacantesModalProps) => {
  const [vacantes, setVacantes] = useState<any[]>([]);
  const [filteredVacantes, setFilteredVacantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estatusFilter, setEstatusFilter] = useState("todos");

  useEffect(() => {
    if (open) {
      loadAllVacantes();
    }
  }, [open]);

  useEffect(() => {
    applyFilters();
  }, [vacantes, searchTerm, estatusFilter]);

  const loadAllVacantes = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vacantes")
        .select(`
          *,
          clientes_areas:cliente_area_id (
            cliente_nombre,
            area
          ),
          perfil_reclutador:reclutador_asignado_id (
            nombre_reclutador
          )
        `)
        .eq("user_id", user.id)
        .order("fecha_solicitud", { ascending: false });

      if (error) throw error;
      setVacantes(data || []);
    } catch (error) {
      console.error("Error loading vacantes:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vacantes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.folio?.toLowerCase().includes(term) ||
        v.titulo_puesto?.toLowerCase().includes(term) ||
        v.clientes_areas?.cliente_nombre?.toLowerCase().includes(term)
      );
    }

    if (estatusFilter !== "todos") {
      filtered = filtered.filter(v => v.estatus === estatusFilter);
    }

    setFilteredVacantes(filtered);
  };

  const handleSelectVacante = (vacante: any) => {
    onSelectVacante(vacante);
    onOpenChange(false);
  };

  // Estadísticas rápidas
  const stats = {
    total: vacantes.length,
    abiertas: vacantes.filter(v => v.estatus === "abierta").length,
    cerradas: vacantes.filter(v => v.estatus === "cerrada").length,
    canceladas: vacantes.filter(v => v.estatus === "cancelada").length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Historial Completo de Vacantes
          </DialogTitle>
          <DialogDescription>
            Consulta todas las vacantes registradas incluyendo cerradas y canceladas
          </DialogDescription>
        </DialogHeader>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-4 gap-3 py-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <p className="text-2xl font-bold text-blue-600">{stats.abiertas}</p>
            <p className="text-xs text-blue-600/70">Abiertas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
            <p className="text-2xl font-bold text-green-600">{stats.cerradas}</p>
            <p className="text-xs text-green-600/70">Cerradas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <p className="text-2xl font-bold text-red-600">{stats.canceladas}</p>
            <p className="text-xs text-red-600/70">Canceladas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio, puesto o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={estatusFilter} onValueChange={setEstatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar estatus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estatus</SelectItem>
              <SelectItem value="abierta">Abiertas</SelectItem>
              <SelectItem value="cerrada">Cerradas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <ScrollArea className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredVacantes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron vacantes con los filtros aplicados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Reclutador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVacantes.map((vacante) => {
                  const config = getEstatusConfig(vacante.estatus);
                  const Icon = config.icon;
                  const diasTotal = differenceInDays(
                    vacante.fecha_cierre ? new Date(vacante.fecha_cierre) : new Date(),
                    new Date(vacante.fecha_solicitud)
                  );

                  return (
                    <TableRow 
                      key={vacante.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSelectVacante(vacante)}
                    >
                      <TableCell className="font-mono text-sm">{vacante.folio}</TableCell>
                      <TableCell className="font-medium">{vacante.titulo_puesto}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{vacante.clientes_areas?.cliente_nombre || "-"}</span>
                          <span className="text-xs text-muted-foreground">
                            {vacante.clientes_areas?.area}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(vacante.fecha_solicitud), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${vacante.estatus === "cerrada" ? "text-green-600" : ""}`}>
                          {diasTotal} días
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.className} gap-1`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {vacante.perfil_reclutador?.nombre_reclutador || (
                          <span className="text-muted-foreground italic">No asignado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-right pt-2 border-t">
          Mostrando {filteredVacantes.length} de {vacantes.length} vacantes
        </div>
      </DialogContent>
    </Dialog>
  );
};