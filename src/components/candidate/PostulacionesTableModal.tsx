import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Briefcase, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PostulacionesTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Postulacion {
  id: string;
  estado: string;
  etapa: string | null;
  fecha_postulacion: string;
  publicacion: {
    titulo_puesto: string;
    ubicacion: string | null;
    lugar_trabajo: string;
    sueldo_bruto_aprobado: number | null;
    vacante: {
      estatus: string;
    } | null;
  } | null;
}

const ITEMS_PER_PAGE = 10;

const getEstadoColor = (estado: string, vacanteCerrada: boolean) => {
  if (vacanteCerrada) return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  
  switch (estado.toLowerCase()) {
    case "pendiente":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "aceptado":
    case "contratado":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "rechazado":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "en_proceso":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getModalidadLabel = (modalidad: string) => {
  switch (modalidad) {
    case "remoto": return "Remoto";
    case "presencial": return "Presencial";
    case "hibrido": return "Híbrido";
    default: return modalidad;
  }
};

export const PostulacionesTableModal = ({ open, onOpenChange }: PostulacionesTableModalProps) => {
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (open) {
      loadPostulaciones();
    }
  }, [open, currentPage]);

  const loadPostulaciones = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get total count
      const { count } = await supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .eq("candidato_user_id", session.user.id);

      setTotalCount(count || 0);

      // Get paginated data
      const { data, error } = await supabase
        .from("postulaciones")
        .select(`
          id,
          estado,
          etapa,
          fecha_postulacion,
          publicacion:publicaciones_marketplace(
            titulo_puesto,
            ubicacion,
            lugar_trabajo,
            sueldo_bruto_aprobado,
            vacante:vacantes(estatus)
          )
        `)
        .eq("candidato_user_id", session.user.id)
        .order("fecha_postulacion", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // Filter out orphaned records
      const validPostulaciones = (data || []).filter(p => p.publicacion !== null);
      setPostulaciones(validPostulaciones as Postulacion[]);
    } catch (error) {
      console.error("Error loading postulaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Todas mis Postulaciones ({totalCount})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse">Cargando postulaciones...</div>
          </div>
        ) : postulaciones.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tienes postulaciones registradas
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Puesto</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Salario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vacante</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postulaciones.map((postulacion) => {
                    const vacanteCerrada = postulacion.publicacion?.vacante?.estatus === "cerrada";
                    
                    return (
                      <TableRow key={postulacion.id}>
                        <TableCell className="font-medium">
                          {postulacion.publicacion?.titulo_puesto || "Sin título"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin className="h-3 w-3" />
                            {postulacion.publicacion?.ubicacion || "No especificada"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getModalidadLabel(postulacion.publicacion?.lugar_trabajo || "")}
                        </TableCell>
                        <TableCell>
                          {postulacion.publicacion?.sueldo_bruto_aprobado ? (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              {postulacion.publicacion.sueldo_bruto_aprobado.toLocaleString("es-MX")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No indicado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getEstadoColor(postulacion.estado, vacanteCerrada)}
                          >
                            {vacanteCerrada ? "Vacante Cerrada" : postulacion.etapa || postulacion.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              vacanteCerrada 
                                ? "bg-red-500/10 text-red-600 border-red-500/20" 
                                : "bg-green-500/10 text-green-600 border-green-500/20"
                            }
                          >
                            {vacanteCerrada ? "Cerrada" : "Abierta"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(postulacion.fecha_postulacion), "dd MMM yyyy", { locale: es })}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
