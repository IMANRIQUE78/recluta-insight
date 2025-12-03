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
  DropdownMenuSeparator,
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
  Edit,
  Link2,
  Mail,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { EditarTrabajadorDialog } from "./EditarTrabajadorDialog";
import { AvisoPrivacidadNOM035 } from "./AvisoPrivacidadNOM035";
import { GenerarEnlaceDialog } from "./cuestionarios/GenerarEnlaceDialog";

interface Trabajador {
  id: string;
  codigo_trabajador: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
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
  const [enlaceDialogOpen, setEnlaceDialogOpen] = useState(false);
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

  const formatTelefono = (telefono: string | null) => {
    if (!telefono) return null;
    const digits = telefono.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0,2)} ${digits.slice(2,6)} ${digits.slice(6)}`;
    }
    return telefono;
  };

  const filteredTrabajadores = trabajadores.filter(t =>
    t.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.codigo_trabajador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
          placeholder="Buscar por nombre, código, puesto, email..."
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
                <TableHead>Contacto</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Centro</TableHead>
                <TableHead>Antigüedad</TableHead>
                <TableHead>Aviso</TableHead>
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
                  <TableCell>
                    <div className="space-y-1">
                      {trabajador.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{trabajador.email}</span>
                        </div>
                      )}
                      {trabajador.telefono && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{formatTelefono(trabajador.telefono)}</span>
                        </div>
                      )}
                      {!trabajador.email && !trabajador.telefono && (
                        <span className="text-xs text-muted-foreground">Sin datos</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{trabajador.puesto}</TableCell>
                  <TableCell>{trabajador.area}</TableCell>
                  <TableCell className="text-sm">{trabajador.centro_trabajo}</TableCell>
                  <TableCell>{formatAntiguedad(trabajador.antiguedad_meses)}</TableCell>
                  <TableCell>
                    {trabajador.acepto_aviso_privacidad ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
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
                        Mostrar
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          disabled={!trabajador.email && !trabajador.telefono}
                          onClick={() => {
                            setSelectedTrabajador(trabajador);
                            setEnlaceDialogOpen(true);
                          }}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          Generar Enlace Cuestionario
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
          <GenerarEnlaceDialog
            open={enlaceDialogOpen}
            onOpenChange={setEnlaceDialogOpen}
            trabajador={selectedTrabajador}
            empresaId={empresaId}
          />
        </>
      )}
    </div>
  );
};
