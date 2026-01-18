import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  Plus, 
  Search, 
  ArrowLeft, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  UserCheck,
  UserX,
  RefreshCw,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RegistrarPersonalDialog } from "@/components/personal/RegistrarPersonalDialog";
import { EditarPersonalDialog } from "@/components/personal/EditarPersonalDialog";
import { VerPersonalModal } from "@/components/personal/VerPersonalModal";
import { differenceInYears, differenceInMonths, differenceInDays, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

interface PersonalEmpleado {
  id: string;
  codigo_empleado: string;
  estatus: string;
  nombre_completo: string;
  genero: string | null;
  puesto: string | null;
  area: string | null;
  jefe_directo: string | null;
  fecha_nacimiento: string | null;
  fecha_ingreso: string | null;
  fecha_salida: string | null;
  domicilio: string | null;
  colonia: string | null;
  alcaldia_municipio: string | null;
  telefono_movil: string | null;
  telefono_emergencia: string | null;
  email_personal: string | null;
  email_corporativo: string | null;
  estado_civil: string | null;
  escolaridad: string | null;
  enfermedades_alergias: string | null;
  nss: string | null;
  cuenta_bancaria: string | null;
  curp: string | null;
  rfc: string | null;
  reclutador_asignado: string | null;
  sueldo_asignado: number | null;
  finiquito: number | null;
  observaciones: string | null;
  created_at: string;
}

const PersonalEmpresaDashboard = () => {
  const navigate = useNavigate();
  const [personal, setPersonal] = useState<PersonalEmpleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [verOpen, setVerOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<PersonalEmpleado | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadEmpresaAndPersonal();
  }, [refreshTrigger]);

  const loadEmpresaAndPersonal = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Obtener empresa del usuario
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (!userRole?.empresa_id) {
        toast.error("No tienes una empresa asociada");
        navigate("/dashboard");
        return;
      }

      setEmpresaId(userRole.empresa_id);

      // Cargar personal - using type assertion since table was just created
      const { data: personalData, error } = await (supabase
        .from("personal_empresa" as any)
        .select("*")
        .eq("empresa_id", userRole.empresa_id)
        .order("nombre_completo", { ascending: true }) as any);

      if (error) throw error;
      setPersonal(personalData || []);
    } catch (error: any) {
      console.error("Error loading personal:", error);
      toast.error("Error al cargar el personal");
    } finally {
      setLoading(false);
    }
  };

  const calcularEdad = (fechaNacimiento: string | null): string => {
    if (!fechaNacimiento) return "-";
    const edad = differenceInYears(new Date(), parseISO(fechaNacimiento));
    return `${edad} años`;
  };

  const calcularAntiguedad = (fechaIngreso: string | null, fechaSalida: string | null): string => {
    if (!fechaIngreso) return "-";
    const fechaFin = fechaSalida ? parseISO(fechaSalida) : new Date();
    const fechaInicio = parseISO(fechaIngreso);
    
    const years = differenceInYears(fechaFin, fechaInicio);
    const months = differenceInMonths(fechaFin, fechaInicio) % 12;
    const days = differenceInDays(fechaFin, fechaInicio) % 30;

    const parts = [];
    if (years > 0) parts.push(`${years} año${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mes${months > 1 ? 'es' : ''}`);
    if (days > 0 && years === 0) parts.push(`${days} día${days > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(' ') : 'Menos de 1 día';
  };

  const handleDelete = async (empleado: PersonalEmpleado) => {
    if (!confirm(`¿Estás seguro de eliminar a ${empleado.nombre_completo}?`)) return;
    
    try {
      const { error } = await (supabase
        .from("personal_empresa" as any)
        .delete()
        .eq("id", empleado.id) as any);

      if (error) throw error;
      toast.success("Empleado eliminado correctamente");
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar el empleado");
    }
  };

  const getEstatusBadge = (estatus: string) => {
    switch (estatus) {
      case 'activo':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><UserCheck className="h-3 w-3 mr-1" />Activo</Badge>;
      case 'inactivo':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20"><UserX className="h-3 w-3 mr-1" />Inactivo</Badge>;
      case 'reingreso':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><RefreshCw className="h-3 w-3 mr-1" />Reingreso</Badge>;
      default:
        return <Badge variant="outline">{estatus}</Badge>;
    }
  };

  const filteredPersonal = personal.filter(emp => 
    emp.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.codigo_empleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: personal.length,
    activos: personal.filter(p => p.estatus === 'activo').length,
    inactivos: personal.filter(p => p.estatus === 'inactivo').length,
    reingresos: personal.filter(p => p.estatus === 'reingreso').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Base de Datos de Personal</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Datos sensibles encriptados en repositorio y tránsito
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setRegistrarOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Registrar Empleado
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Personal</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-green-500" /> Activos
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.activos}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-red-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <UserX className="h-3 w-3 text-red-500" /> Inactivos
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.inactivos}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-blue-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 text-blue-500" /> Reingresos
              </CardDescription>
              <CardTitle className="text-3xl text-blue-600">{stats.reingresos}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Directorio de Empleados</CardTitle>
                <CardDescription>Gestiona la información de tu personal</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código, puesto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPersonal.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? "No se encontraron empleados con ese criterio" : "No hay empleados registrados. ¡Agrega el primero!"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Puesto</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Estatus</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Antigüedad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersonal.map((empleado) => (
                      <TableRow key={empleado.id}>
                        <TableCell className="font-mono text-xs">{empleado.codigo_empleado}</TableCell>
                        <TableCell className="font-medium">{empleado.nombre_completo}</TableCell>
                        <TableCell>{empleado.puesto || "-"}</TableCell>
                        <TableCell>{empleado.area || "-"}</TableCell>
                        <TableCell>{getEstatusBadge(empleado.estatus)}</TableCell>
                        <TableCell>{calcularEdad(empleado.fecha_nacimiento)}</TableCell>
                        <TableCell>{calcularAntiguedad(empleado.fecha_ingreso, empleado.fecha_salida)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedEmpleado(empleado);
                                setVerOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedEmpleado(empleado);
                                setEditarOpen(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(empleado)}
                                className="text-red-600"
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
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {empresaId && (
        <RegistrarPersonalDialog
          open={registrarOpen}
          onOpenChange={setRegistrarOpen}
          empresaId={empresaId}
          onSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}

      {selectedEmpleado && (
        <>
          <EditarPersonalDialog
            open={editarOpen}
            onOpenChange={setEditarOpen}
            empleado={selectedEmpleado}
            onSuccess={() => setRefreshTrigger(prev => prev + 1)}
          />
          <VerPersonalModal
            open={verOpen}
            onOpenChange={setVerOpen}
            empleado={selectedEmpleado}
          />
        </>
      )}
    </div>
  );
};

export default PersonalEmpresaDashboard;
