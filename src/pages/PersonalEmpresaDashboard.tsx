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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Users, 
  Plus, 
  Search, 
  ArrowLeft, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  RefreshCw,
  Shield,
  Crown,
  Filter,
  AlertTriangle,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
  codigo_postal: string | null;
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
  es_supervisor: boolean;
  empresa_id: string;
  created_at: string;
  // Campos NOM-035
  centro_trabajo: string | null;
  tipo_jornada: string | null;
  modalidad_contratacion: string | null;
  fecha_fin_contrato: string | null;
}

const PersonalEmpresaDashboard = () => {
  const navigate = useNavigate();
  const [personal, setPersonal] = useState<PersonalEmpleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [nombreEmpresa, setNombreEmpresa] = useState<string>("");
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [verOpen, setVerOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<PersonalEmpleado | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Filtros
  const [filterEstatus, setFilterEstatus] = useState<string>("todos");
  const [filterArea, setFilterArea] = useState<string>("todas");
  const [filterSupervisor, setFilterSupervisor] = useState<string>("todos");
  
  // Ordenamiento
  type SortColumn = 'codigo_empleado' | 'nombre_completo' | 'puesto' | 'area' | 'es_supervisor' | 'estatus' | 'fecha_nacimiento' | 'fecha_ingreso';
  const [sortColumn, setSortColumn] = useState<SortColumn>('nombre_completo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

      // Obtener nombre de empresa
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("nombre_empresa")
        .eq("id", userRole.empresa_id)
        .single();
      
      if (empresaData) {
        setNombreEmpresa(empresaData.nombre_empresa);
      }

      // Cargar personal
      const { data: personalData, error } = await supabase
        .from("personal_empresa")
        .select("*")
        .eq("empresa_id", userRole.empresa_id)
        .order("nombre_completo", { ascending: true });

      if (error) throw error;
      setPersonal((personalData as PersonalEmpleado[]) || []);
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
      const { error } = await supabase
        .from("personal_empresa")
        .delete()
        .eq("id", empleado.id);

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

  const filteredPersonal = personal.filter(emp => {
    const matchesSearch = 
      emp.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.codigo_empleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.area?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstatus = filterEstatus === "todos" || emp.estatus === filterEstatus;
    const matchesArea = filterArea === "todas" || emp.area === filterArea;
    const matchesSupervisor = filterSupervisor === "todos" || 
      (filterSupervisor === "supervisores" && emp.es_supervisor) ||
      (filterSupervisor === "no_supervisores" && !emp.es_supervisor);
    
    return matchesSearch && matchesEstatus && matchesArea && matchesSupervisor;
  });

  // Aplicar ordenamiento
  const sortedPersonal = [...filteredPersonal].sort((a, b) => {
    let comparison = 0;
    
    switch (sortColumn) {
      case 'codigo_empleado':
        comparison = a.codigo_empleado.localeCompare(b.codigo_empleado);
        break;
      case 'nombre_completo':
        comparison = a.nombre_completo.localeCompare(b.nombre_completo);
        break;
      case 'puesto':
        comparison = (a.puesto || '').localeCompare(b.puesto || '');
        break;
      case 'area':
        comparison = (a.area || '').localeCompare(b.area || '');
        break;
      case 'es_supervisor':
        comparison = (a.es_supervisor === b.es_supervisor) ? 0 : a.es_supervisor ? -1 : 1;
        break;
      case 'estatus':
        comparison = a.estatus.localeCompare(b.estatus);
        break;
      case 'fecha_nacimiento':
        const fechaNacA = a.fecha_nacimiento ? new Date(a.fecha_nacimiento).getTime() : 0;
        const fechaNacB = b.fecha_nacimiento ? new Date(b.fecha_nacimiento).getTime() : 0;
        comparison = fechaNacA - fechaNacB;
        break;
      case 'fecha_ingreso':
        const fechaIngA = a.fecha_ingreso ? new Date(a.fecha_ingreso).getTime() : 0;
        const fechaIngB = b.fecha_ingreso ? new Date(b.fecha_ingreso).getTime() : 0;
        comparison = fechaIngA - fechaIngB;
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ column, children }: { column: SortColumn; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortColumn === column ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );

  // Obtener áreas únicas para el filtro
  const areasUnicas = [...new Set(personal.map(p => p.area).filter(Boolean) as string[])].sort();

  const personalActivo = personal.filter(p => p.estatus === 'activo');

  // Calcular contratos próximos a vencer (30 días)
  const calcularContratosProximosVencer = () => {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);
    
    return personalActivo.filter(emp => {
      if (!emp.fecha_fin_contrato) return false;
      const fechaFin = parseISO(emp.fecha_fin_contrato);
      return fechaFin >= hoy && fechaFin <= en30Dias;
    }).sort((a, b) => {
      const fechaA = parseISO(a.fecha_fin_contrato!);
      const fechaB = parseISO(b.fecha_fin_contrato!);
      return fechaA.getTime() - fechaB.getTime();
    });
  };

  const contratosProximosVencer = calcularContratosProximosVencer();

  // Calcular días restantes del contrato
  const calcularDiasRestantes = (fechaFin: string) => {
    const hoy = new Date();
    const fecha = parseISO(fechaFin);
    const dias = differenceInDays(fecha, hoy);
    return dias;
  };

  // Calcular promedio de edad
  const calcularPromedioEdad = (): number => {
    const activosConFecha = personalActivo.filter(p => p.fecha_nacimiento);
    if (activosConFecha.length === 0) return 0;
    const totalEdades = activosConFecha.reduce((sum, p) => {
      return sum + differenceInYears(new Date(), parseISO(p.fecha_nacimiento!));
    }, 0);
    return Math.round(totalEdades / activosConFecha.length);
  };

  // Calcular permanencia promedio en años
  const calcularPermanenciaPromedio = (): number => {
    const activosConIngreso = personalActivo.filter(p => p.fecha_ingreso);
    if (activosConIngreso.length === 0) return 0;
    const totalMeses = activosConIngreso.reduce((sum, p) => {
      return sum + differenceInMonths(new Date(), parseISO(p.fecha_ingreso!));
    }, 0);
    return Math.round((totalMeses / activosConIngreso.length / 12) * 10) / 10;
  };

  // Calcular porcentaje por género
  const calcularPorcentajeGenero = (): { hombres: number; mujeres: number } => {
    if (personalActivo.length === 0) return { hombres: 0, mujeres: 0 };
    const hombres = personalActivo.filter(p => p.genero?.toLowerCase() === 'masculino').length;
    const mujeres = personalActivo.filter(p => p.genero?.toLowerCase() === 'femenino').length;
    return {
      hombres: Math.round((hombres / personalActivo.length) * 100),
      mujeres: Math.round((mujeres / personalActivo.length) * 100),
    };
  };

  const stats = {
    total: personal.length,
    activos: personalActivo.length,
    inactivos: personal.filter(p => p.estatus === 'inactivo').length,
    reingresos: personal.filter(p => p.estatus === 'reingreso').length,
    supervisores: personal.filter(p => p.es_supervisor).length,
    promedioEdad: calcularPromedioEdad(),
    permanenciaPromedio: calcularPermanenciaPromedio(),
    genero: calcularPorcentajeGenero(),
    contratosProximosVencer: contratosProximosVencer.length,
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
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
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

        {/* Stats Cards Row 2 */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="border-purple-500/20">
            <CardHeader className="pb-2">
              <CardDescription>Promedio de Edad</CardDescription>
              <CardTitle className="text-3xl text-purple-600">
                {stats.promedioEdad} <span className="text-lg font-normal text-muted-foreground">años</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2">
              <CardDescription>Permanencia Promedio</CardDescription>
              <CardTitle className="text-3xl text-amber-600">
                {stats.permanenciaPromedio} <span className="text-lg font-normal text-muted-foreground">años</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-sky-500/20">
            <CardHeader className="pb-2">
              <CardDescription>Hombres (Activos)</CardDescription>
              <CardTitle className="text-3xl text-sky-600">
                {stats.genero.hombres}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-pink-500/20">
            <CardHeader className="pb-2">
              <CardDescription>Mujeres (Activos)</CardDescription>
              <CardTitle className="text-3xl text-pink-600">
                {stats.genero.mujeres}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Alertas de vencimiento de contratos */}
        {contratosProximosVencer.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 dark:text-orange-300">
              Contratos próximos a vencer ({contratosProximosVencer.length})
            </AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-400">
              <div className="mt-2 space-y-2">
                {contratosProximosVencer.map((emp) => {
                  const diasRestantes = calcularDiasRestantes(emp.fecha_fin_contrato!);
                  const esUrgente = diasRestantes <= 7;
                  return (
                    <div 
                      key={emp.id} 
                      className={`flex items-center justify-between p-2 rounded-md ${esUrgente ? 'bg-red-100 dark:bg-red-950/50' : 'bg-orange-100 dark:bg-orange-900/30'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className={`h-4 w-4 ${esUrgente ? 'text-red-600' : 'text-orange-600'}`} />
                        <span className="font-medium">{emp.nombre_completo}</span>
                        <span className="text-sm text-muted-foreground">({emp.puesto || 'Sin puesto'})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={esUrgente ? 'bg-red-500/20 text-red-700 border-red-500/30' : 'bg-orange-500/20 text-orange-700 border-orange-500/30'}>
                          {diasRestantes === 0 ? '¡Vence hoy!' : diasRestantes === 1 ? 'Vence mañana' : `${diasRestantes} días restantes`}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(emp.fecha_fin_contrato!), "dd/MM/yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Table Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Directorio de Trabajadores</CardTitle>
                <CardDescription>Gestiona la información de tu personal</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro por Estatus */}
                <Select value={filterEstatus} onValueChange={setFilterEstatus}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activos</SelectItem>
                    <SelectItem value="inactivo">Inactivos</SelectItem>
                    <SelectItem value="reingreso">Reingresos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro por Área */}
                <Select value={filterArea} onValueChange={setFilterArea}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las áreas</SelectItem>
                    {areasUnicas.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro por Supervisor */}
                <Select value={filterSupervisor} onValueChange={setFilterSupervisor}>
                  <SelectTrigger className="w-[150px]">
                    <Crown className="h-4 w-4 mr-2 text-amber-500" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="supervisores">Solo Supervisores</SelectItem>
                    <SelectItem value="no_supervisores">No Supervisores</SelectItem>
                  </SelectContent>
                </Select>

                {/* Buscador */}
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
                      <SortableHeader column="codigo_empleado">Código</SortableHeader>
                      <SortableHeader column="nombre_completo">Nombre</SortableHeader>
                      <SortableHeader column="puesto">Puesto</SortableHeader>
                      <SortableHeader column="area">Área</SortableHeader>
                      <SortableHeader column="es_supervisor">Supervisor</SortableHeader>
                      <SortableHeader column="estatus">Estatus</SortableHeader>
                      <SortableHeader column="fecha_nacimiento">Edad</SortableHeader>
                      <SortableHeader column="fecha_ingreso">Antigüedad</SortableHeader>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPersonal.map((empleado) => (
                      <TableRow key={empleado.id}>
                        <TableCell className="font-mono text-xs">{empleado.codigo_empleado}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {empleado.nombre_completo}
                            {empleado.es_supervisor && (
                              <span title="Supervisor">
                                <Crown className="h-4 w-4 text-amber-500" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{empleado.puesto || "-"}</TableCell>
                        <TableCell>{empleado.area || "-"}</TableCell>
                        <TableCell>
                          {empleado.es_supervisor ? (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                              <Crown className="h-3 w-3 mr-1" />
                              Sí
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
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
            nombreEmpresa={nombreEmpresa}
          />
        </>
      )}
    </div>
  );
};

export default PersonalEmpresaDashboard;
