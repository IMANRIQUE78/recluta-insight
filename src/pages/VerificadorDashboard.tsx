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
  LogOut
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
            <Avatar className="h-8 w-8">
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

            {/* Estudios Cards */}
            <div className="grid gap-4">
              {estudiosFiltrados.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No hay estudios que coincidan con los filtros
                  </CardContent>
                </Card>
              ) : (
                estudiosFiltrados.map((estudio) => {
                  const diasRestantes = getDiasRestantes(estudio.fecha_limite);
                  const estatusInfo = estatusConfig[estudio.estatus];
                  
                  return (
                    <Card key={estudio.id} className="overflow-hidden">
                      <div className={`h-1 ${getSLAColor(estudio.fecha_limite)}`} />
                      <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground font-mono">{estudio.folio}</p>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {estudio.nombre_candidato}
                                </h3>
                              </div>
                              <Badge className={estatusInfo.color}>
                                {estatusInfo.icon}
                                <span className="ml-1">{estatusInfo.label}</span>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <ClipboardList className="h-3 w-3" />
                                <span>{estudio.vacante_puesto}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span>{estudio.empresas?.nombre_empresa || "Sin empresa"}</span>
                              </div>
                              <div className="flex items-center gap-1 col-span-full sm:col-span-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{estudio.direccion_visita}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className={diasRestantes < 0 ? "text-red-600 font-medium" : diasRestantes <= 1 ? "text-orange-600 font-medium" : ""}>
                                  {diasRestantes < 0 
                                    ? `Vencido hace ${Math.abs(diasRestantes)} días`
                                    : diasRestantes === 0
                                      ? "Vence hoy"
                                      : `${diasRestantes} días restantes`
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 sm:flex-col">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleVerDetalle(estudio)}
                            >
                              Ver detalles
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleAbrirSubirDatos(estudio)}
                            >
                              Subir datos
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
    </div>
  );
}
