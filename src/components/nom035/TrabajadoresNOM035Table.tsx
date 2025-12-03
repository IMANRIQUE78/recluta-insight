import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Search, 
  CheckCircle2, 
  XCircle, 
  FileText,
  ClipboardList,
  Trash2,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { EditarTrabajadorDialog } from "./EditarTrabajadorDialog";
import { AvisoPrivacidadNOM035 } from "./AvisoPrivacidadNOM035";

interface Trabajador {
  id: string;
  codigo_trabajador: string;
  nombre_completo: string;
  puesto: string;
  area: string;
  centro_trabajo: string;
  antiguedad_meses: number;
  tipo_jornada: string;
  modalidad_contratacion: string;
  acepto_aviso_privacidad: boolean;
  fecha_acepto_aviso: string | null;
  activo: boolean;
  created_at: string;
}

interface TrabajadoresNOM035TableProps {
  empresaId: string;
  refreshTrigger: number;
  onRefresh: () => void;
}

export const TrabajadoresNOM035Table = ({ 
  empresaId, 
  refreshTrigger,
  onRefresh 
}: TrabajadoresNOM035TableProps) => {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [avisoDialogOpen, setAvisoDialogOpen] = useState(false);
  const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null);

  useEffect(() => {
    loadTrabajadores();
  }, [empresaId, refreshTrigger]);

  const loadTrabajadores = async () => {
    try {
      const { data, error } = await supabase
        .from("trabajadores_nom035")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .order("nombre_completo", { ascending: true });

      if (error) throw error;
      setTrabajadores(data || []);
    } catch (error) {
      console.error("Error loading trabajadores:", error);
      toast.error("Error al cargar trabajadores");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (trabajador: Trabajador) => {
    if (!confirm(`¿Estás seguro de eliminar a ${trabajador.nombre_completo}?`)) return;

    try {
      const { error } = await supabase
        .from("trabajadores_nom035")
        .update({ activo: false })
        .eq("id", trabajador.id);

      if (error) throw error;
      toast.success("Trabajador eliminado");
      onRefresh();
    } catch (error) {
      console.error("Error deleting trabajador:", error);
      toast.error("Error al eliminar trabajador");
    }
  };

  const handleAceptarAviso = async () => {
    if (!selectedTrabajador) return;

    try {
      const { error } = await supabase
        .from("trabajadores_nom035")
        .update({ 
          acepto_aviso_privacidad: true,
          fecha_acepto_aviso: new Date().toISOString()
        })
        .eq("id", selectedTrabajador.id);

      if (error) throw error;
      toast.success("Aviso de privacidad aceptado");
      setAvisoDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error accepting aviso:", error);
      toast.error("Error al registrar aceptación");
    }
  };

  const formatAntiguedad = (meses: number) => {
    if (meses < 12) return `${meses} meses`;
    const years = Math.floor(meses / 12);
    const remainingMonths = meses % 12;
    if (remainingMonths === 0) return `${years} año${years > 1 ? 's' : ''}`;
    return `${years} año${years > 1 ? 's' : ''} ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
  };

  const formatJornada = (tipo: string) => {
    const tipos: Record<string, string> = {
      completa: "Completa",
      parcial: "Parcial",
      nocturna: "Nocturna",
      mixta: "Mixta"
    };
    return tipos[tipo] || tipo;
  };

  const formatContratacion = (modalidad: string) => {
    const modalidades: Record<string, string> = {
      indefinido: "Indefinido",
      temporal: "Temporal",
      obra_determinada: "Obra determinada",
      capacitacion: "Capacitación"
    };
    return modalidades[modalidad] || modalidad;
  };

  const filteredTrabajadores = trabajadores.filter(t =>
    t.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.codigo_trabajador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, código, puesto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {filteredTrabajadores.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? "No se encontraron trabajadores" : "No hay trabajadores registrados"}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Centro de Trabajo</TableHead>
                <TableHead>Antigüedad</TableHead>
                <TableHead>Jornada</TableHead>
                <TableHead>Contratación</TableHead>
                <TableHead>Aviso Privacidad</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrabajadores.map((trabajador) => (
                <TableRow key={trabajador.id}>
                  <TableCell className="font-mono text-sm">
                    {trabajador.codigo_trabajador}
                  </TableCell>
                  <TableCell className="font-medium">
                    {trabajador.nombre_completo}
                  </TableCell>
                  <TableCell>{trabajador.puesto}</TableCell>
                  <TableCell>{trabajador.area}</TableCell>
                  <TableCell>{trabajador.centro_trabajo}</TableCell>
                  <TableCell>{formatAntiguedad(trabajador.antiguedad_meses)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatJornada(trabajador.tipo_jornada)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{formatContratacion(trabajador.modalidad_contratacion)}</Badge>
                  </TableCell>
                  <TableCell>
                    {trabajador.acepto_aviso_privacidad ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aceptado
                      </Badge>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTrabajador(trabajador);
                          setAvisoDialogOpen(true);
                        }}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Mostrar Aviso
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedTrabajador(trabajador);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          disabled={!trabajador.acepto_aviso_privacidad}
                          onClick={() => toast.info("Próximamente: Iniciar evaluación")}
                        >
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Iniciar Evaluación
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(trabajador)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      {selectedTrabajador && (
        <>
          <EditarTrabajadorDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            trabajador={selectedTrabajador}
            onSuccess={() => {
              setEditDialogOpen(false);
              onRefresh();
            }}
          />
          <AvisoPrivacidadNOM035
            open={avisoDialogOpen}
            onOpenChange={setAvisoDialogOpen}
            nombreTrabajador={selectedTrabajador.nombre_completo}
            onAceptar={handleAceptarAviso}
          />
        </>
      )}
    </div>
  );
};