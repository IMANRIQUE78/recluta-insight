import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  Star,
  TrendingUp,
  Calendar,
  MapPin,
  Building,
  User,
  LogOut,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, differenceInDays, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import SubirDatosEstudioModal from "@/components/verificador/SubirDatosEstudioModal";
import EstudioDetalleModal from "@/components/verificador/EstudioDetalleModal";
import { EditarPerfilVerificadorDialog } from "@/components/verificador/EditarPerfilVerificadorDialog";
import vvgiLogo from "@/assets/vvgi-logo.png";

const estatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  solicitado: { label: "Solicitado", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-3 w-3" /> },
  asignado: { label: "Asignado", color: "bg-purple-100 text-purple-800", icon: <ClipboardList className="h-3 w-3" /> },
  en_proceso: { label: "En Proceso", color: "bg-yellow-100 text-yellow-800", icon: <TrendingUp className="h-3 w-3" /> },
  pendiente_carga: { label: "Pendiente de Carga", color: "bg-orange-100 text-orange-800", icon: <AlertTriangle className="h-3 w-3" /> },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function VerificadorDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const scrollDirection = useScrollDirection();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [estatusFilter, setEstatusFilter] = useState<string>("todos");
  const [ordenarPor, setOrdenarPor] = useState<string>("fecha_limite");
  const [selectedEstudio, setSelectedEstudio] = useState<any>(null);
  const [modalSubirDatos, setModalSubirDatos] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);

  // Fetch verificador profile
  const { data: perfilVerificador } = useQuery({
    queryKey: ["perfil-verificador", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("perfil_verificador")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch estudios asignados
  const { data: estudios = [], refetch: refetchEstudios } = useQuery({
    queryKey: ["estudios-verificador", perfilVerificador?.id],
    queryFn: async () => {
      if (!perfilVerificador?.id) return [];
      const { data, error } = await supabase
        .from("estudios_socioeconomicos")
        .select(`
          *,
          empresas:empresa_id (nombre_empresa)
        `)
        .eq("verificador_id", perfilVerificador.id)
        .order("fecha_limite", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!perfilVerificador?.id,
  });

  // Fetch estadísticas
  const { data: estadisticas } = useQuery({
    queryKey: ["estadisticas-verificador", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("estadisticas_verificador")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const pendientes = estudios.filter(e => e.estatus === "asignado" || e.estatus === "solicitado").length;
    const enProceso = estudios.filter(e => e.estatus === "en_proceso" || e.estatus === "pendiente_carga").length;
    const completados30Dias = estudios.filter(e => {
      if (e.estatus !== "entregado" || !e.fecha_entrega) return false;
      const fechaEntrega = new Date(e.fecha_entrega);
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      return isAfter(fechaEntrega, hace30Dias);
    }).length;
    
    return { pendientes, enProceso, completados30Dias };
  }, [estudios]);

  // Filter and sort estudios
  const estudiosFiltrados = useMemo(() => {
    let filtered = estudios.filter(e => e.estatus !== "entregado" && e.estatus !== "cancelado");
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.nombre_candidato.toLowerCase().includes(term) ||
        e.folio.toLowerCase().includes(term)
      );
    }
    
    if (estatusFilter !== "todos") {
      filtered = filtered.filter(e => e.estatus === estatusFilter);
    }
    
    filtered.sort((a, b) => {
      if (ordenarPor === "fecha_limite") {
        return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
      }
      return new Date(a.fecha_asignacion || a.created_at).getTime() - new Date(b.fecha_asignacion || b.created_at).getTime();
    });
    
    return filtered;
  }, [estudios, searchTerm, estatusFilter, ordenarPor]);

  // Historial
  const historial = useMemo(() => {
    return estudios
      .filter(e => e.estatus === "entregado")
      .sort((a, b) => new Date(b.fecha_entrega!).getTime() - new Date(a.fecha_entrega!).getTime());
  }, [estudios]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDiasRestantes = (fechaLimite: string) => {
    const dias = differenceInDays(new Date(fechaLimite), new Date());
    return dias;
  };

  const getSLAColor = (fechaLimite: string) => {
    const dias = getDiasRestantes(fechaLimite);
    if (dias < 0) return "bg-red-500";
    if (dias <= 1) return "bg-orange-500";
    if (dias <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getCardStyle = (fechaLimite: string) => {
    const dias = getDiasRestantes(fechaLimite);
    if (dias < 0) return "border-l-red-500 bg-red-50/50 dark:bg-red-950/20";
    if (dias <= 1) return "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20";
    if (dias <= 3) return "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20";
    return "border-l-green-500 bg-green-50/30 dark:bg-green-950/10";
  };

  const getUrgenciaBadge = (fechaLimite: string) => {
    const dias = getDiasRestantes(fechaLimite);
    if (dias < 0) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Vencido</Badge>;
    }
    if (dias <= 1) {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Urgente</Badge>;
    }
    if (dias <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Próximo</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 border-green-200">En tiempo</Badge>;
  };

  const handleAbrirSubirDatos = (estudio: any) => {
    setSelectedEstudio(estudio);
    setModalSubirDatos(true);
  };

  const handleVerDetalle = (estudio: any) => {
    setSelectedEstudio(estudio);
    setModalDetalle(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 bg-card border-b border-border transition-transform duration-300 ${
          scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={vvgiLogo} alt="VVGI" className="h-8 object-contain" />
            <div className="hidden sm:block">
              <h1 className="font-semibold text-foreground">
                Oficina de {perfilVerificador?.nombre_verificador || "Verificador"}
              </h1>
              <p className="text-xs text-muted-foreground">Técnico Verificador</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setModalPerfil(true)}
              title="Mi perfil"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Avatar 
              className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setModalPerfil(true)}
            >
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {perfilVerificador?.nombre_verificador?.charAt(0) || "V"}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-20 pb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendientes}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.enProceso}</p>
                  <p className="text-xs text-muted-foreground">En Proceso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completados30Dias}</p>
                  <p className="text-xs text-muted-foreground">Completados (30d)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold">{estadisticas?.calificacion_promedio?.toFixed(1) || "0.0"}</p>
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Calificación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prestigio Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Resumen de Prestigio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Estudios Completados</p>
                <p className="text-lg font-semibold">{estadisticas?.estudios_completados || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tiempo Respuesta Prom.</p>
                <p className="text-lg font-semibold">{estadisticas?.tiempo_respuesta_promedio_horas?.toFixed(1) || 0}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Entregados a Tiempo</p>
                <p className="text-lg font-semibold">{estadisticas?.porcentaje_a_tiempo?.toFixed(0) || 100}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Calificación Promedio</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${
                        star <= (estadisticas?.calificacion_promedio || 0) 
                          ? "text-yellow-500 fill-yellow-500" 
                          : "text-gray-300"
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="activos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activos">Estudios Activos</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="activos" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o folio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={estatusFilter} onValueChange={setEstatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estatus</SelectItem>
                  <SelectItem value="solicitado">Solicitado</SelectItem>
                  <SelectItem value="asignado">Asignado</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="pendiente_carga">Pendiente de Carga</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ordenarPor} onValueChange={setOrdenarPor}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fecha_limite">Fecha límite</SelectItem>
                  <SelectItem value="fecha_asignacion">Fecha asignación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estudios Cards - Grid similar a vacantes */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {estudiosFiltrados.length === 0 ? (
                <Card className="md:col-span-2 xl:col-span-3">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Sin estudios pendientes</p>
                    <p className="text-sm">Los estudios asignados aparecerán aquí</p>
                  </CardContent>
                </Card>
              ) : (
              estudiosFiltrados.map((estudio) => {
                  const diasRestantes = getDiasRestantes(estudio.fecha_limite);
                  const estatusInfo = estatusConfig[estudio.estatus];
                  
                  return (
                    <div
                      key={estudio.id}
                      className={`p-4 border-l-4 rounded-lg border shadow-sm hover:shadow-md transition-all ${getCardStyle(estudio.fecha_limite)}`}
                    >
                      {/* Header con folio, estatus y urgencia */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {estudio.folio}
                          </Badge>
                          <Badge className={`${estatusInfo.color} text-xs`}>
                            {estatusInfo.icon}
                            <span className="ml-1">{estatusInfo.label}</span>
                          </Badge>
                        </div>
                        {getUrgenciaBadge(estudio.fecha_limite)}
                      </div>

                      {/* Candidato */}
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-primary shrink-0" />
                        <h4 className="font-semibold text-base">{estudio.nombre_candidato}</h4>
                      </div>

                      {/* Empresa y puesto */}
                      <div className="bg-background/60 rounded-md p-2 mb-2 border space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">{estudio.empresas?.nombre_empresa || "Sin empresa"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="ml-5">Puesto: {estudio.vacante_puesto}</span>
                        </div>
                      </div>

                      {/* Dirección de visita */}
                      <div className="bg-background/60 rounded-md p-2 mb-2 border">
                        <div className="flex items-start gap-2 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <span className="text-muted-foreground font-medium">Dirección de visita:</span>
                            <p className="text-foreground mt-0.5">{estudio.direccion_visita}</p>
                          </div>
                        </div>
                      </div>

                      {/* Métricas de tiempo */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="bg-background/80 rounded-md p-2 text-center border">
                          <p className={`text-xl font-bold ${
                            diasRestantes < 0 ? "text-red-600" : 
                            diasRestantes <= 1 ? "text-orange-600" : 
                            diasRestantes <= 3 ? "text-yellow-600" : 
                            "text-green-600"
                          }`}>
                            {diasRestantes < 0 ? Math.abs(diasRestantes) : diasRestantes}
                          </p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                            {diasRestantes < 0 ? "Días vencido" : diasRestantes === 0 ? "Vence hoy" : "Días rest."}
                          </p>
                        </div>
                        <div className="bg-background/80 rounded-md p-2 text-center border">
                          <p className="text-xs font-medium">{format(new Date(estudio.fecha_solicitud), "dd/MM", { locale: es })}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Solicitado</p>
                        </div>
                        <div className="bg-background/80 rounded-md p-2 text-center border">
                          <p className="text-xs font-medium">{format(new Date(estudio.fecha_limite), "dd/MM", { locale: es })}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Límite</p>
                        </div>
                      </div>

                      {/* Fecha de visita programada si existe */}
                      {estudio.fecha_visita && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-md p-2 mb-2 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                            <Calendar className="h-3 w-3" />
                            <span>Visita programada: {format(new Date(estudio.fecha_visita), "dd/MM/yyyy", { locale: es })} {estudio.hora_visita && `a las ${estudio.hora_visita}`}</span>
                          </div>
                        </div>
                      )}

                      {/* Observaciones si existen */}
                      {estudio.observaciones_visita && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-md p-2 mb-2 border border-amber-200 dark:border-amber-800">
                          <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium mb-0.5">Observaciones:</p>
                          <p className="text-xs text-amber-800 dark:text-amber-200 line-clamp-2">{estudio.observaciones_visita}</p>
                        </div>
                      )}

                      {/* Botón único para capturar */}
                      <Button 
                        size="sm"
                        className="w-full"
                        onClick={() => handleAbrirSubirDatos(estudio)}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Capturar Datos del Estudio
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Folio</th>
                        <th className="text-left p-3 font-medium">Candidato</th>
                        <th className="text-left p-3 font-medium hidden sm:table-cell">Resultado</th>
                        <th className="text-left p-3 font-medium hidden md:table-cell">Fecha Visita</th>
                        <th className="text-left p-3 font-medium">Fecha Entrega</th>
                        <th className="text-left p-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No hay estudios en el historial
                          </td>
                        </tr>
                      ) : (
                        historial.map((estudio) => (
                          <tr key={estudio.id} className="border-t">
                            <td className="p-3 font-mono text-xs">{estudio.folio}</td>
                            <td className="p-3">{estudio.nombre_candidato}</td>
                            <td className="p-3 hidden sm:table-cell">
                              <span className="text-muted-foreground">
                                {estudio.resultado_general || "Sin resultado"}
                              </span>
                            </td>
                            <td className="p-3 hidden md:table-cell">
                              {estudio.fecha_visita 
                                ? format(new Date(estudio.fecha_visita), "dd/MM/yyyy", { locale: es })
                                : "-"
                              }
                            </td>
                            <td className="p-3">
                              {estudio.fecha_entrega 
                                ? format(new Date(estudio.fecha_entrega), "dd/MM/yyyy", { locale: es })
                                : "-"
                              }
                            </td>
                            <td className="p-3">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleVerDetalle(estudio)}
                              >
                                Ver
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <SubirDatosEstudioModal
        open={modalSubirDatos}
        onOpenChange={setModalSubirDatos}
        estudio={selectedEstudio}
        onSuccess={() => {
          refetchEstudios();
          setModalSubirDatos(false);
        }}
      />

      <EstudioDetalleModal
        open={modalDetalle}
        onOpenChange={setModalDetalle}
        estudio={selectedEstudio}
      />

      {user?.id && (
        <EditarPerfilVerificadorDialog
          open={modalPerfil}
          onOpenChange={setModalPerfil}
          verificadorUserId={user.id}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
