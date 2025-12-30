import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileSearch, 
  Eye, 
  Calendar, 
  MapPin, 
  Building,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import EstudioDetalleModal from "@/components/verificador/EstudioDetalleModal";

interface EstudiosSolicitadosCardProps {
  reclutadorUserId: string;
}

const estatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  solicitado: { label: "Solicitado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Clock },
  asignado: { label: "Asignado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: User },
  en_proceso: { label: "En Proceso", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: Loader2 },
  pendiente_carga: { label: "Pendiente Carga", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: AlertTriangle },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle },
};

const riesgoConfig: Record<string, { label: string; color: string }> = {
  bajo: { label: "Bajo", color: "bg-green-500" },
  medio: { label: "Medio", color: "bg-yellow-500" },
  alto: { label: "Alto", color: "bg-orange-500" },
  muy_alto: { label: "Muy Alto", color: "bg-red-500" },
};

export function EstudiosSolicitadosCard({ reclutadorUserId }: EstudiosSolicitadosCardProps) {
  const [selectedEstudio, setSelectedEstudio] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filtroEstatus, setFiltroEstatus] = useState<string>("todos");

  const { data: estudios = [], isLoading } = useQuery({
    queryKey: ["estudios-solicitados", reclutadorUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estudios_socioeconomicos")
        .select(`
          *,
          perfil_verificador:verificador_id (
            nombre_verificador
          )
        `)
        .eq("solicitante_user_id", reclutadorUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!reclutadorUserId,
  });

  const handleVerDetalle = (estudio: any) => {
    setSelectedEstudio(estudio);
    setDetailModalOpen(true);
  };

  const getUrgencyBadge = (fechaLimite: string, estatus: string) => {
    if (estatus === "entregado") return null;
    
    const diasRestantes = differenceInDays(new Date(fechaLimite), new Date());
    
    if (diasRestantes < 0) {
      return <Badge variant="destructive" className="text-xs">Vencido</Badge>;
    } else if (diasRestantes <= 2) {
      return <Badge className="bg-red-500 text-white text-xs">{diasRestantes}d restantes</Badge>;
    } else if (diasRestantes <= 5) {
      return <Badge className="bg-orange-500 text-white text-xs">{diasRestantes}d restantes</Badge>;
    } else if (diasRestantes <= 7) {
      return <Badge className="bg-yellow-500 text-black text-xs">{diasRestantes}d restantes</Badge>;
    }
    return null;
  };

  const filteredEstudios = estudios.filter(estudio => {
    if (filtroEstatus === "todos") return true;
    if (filtroEstatus === "pendientes") return estudio.estatus !== "entregado";
    if (filtroEstatus === "entregados") return estudio.estatus === "entregado";
    return true;
  });

  const contadores = {
    todos: estudios.length,
    pendientes: estudios.filter(e => e.estatus !== "entregado").length,
    entregados: estudios.filter(e => e.estatus === "entregado").length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (estudios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            Estudios Socioeconómicos
          </CardTitle>
          <CardDescription>
            Gestiona los estudios socioeconómicos que has solicitado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No has solicitado estudios socioeconómicos aún.</p>
            <p className="text-sm mt-1">Cuando solicites uno, aparecerá aquí.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            Estudios Socioeconómicos
            <Badge variant="secondary" className="ml-2">{estudios.length}</Badge>
          </CardTitle>
          <CardDescription>
            Gestiona y visualiza los estudios que has solicitado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filtroEstatus} onValueChange={setFiltroEstatus} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="todos" className="text-xs">
                Todos ({contadores.todos})
              </TabsTrigger>
              <TabsTrigger value="pendientes" className="text-xs">
                Pendientes ({contadores.pendientes})
              </TabsTrigger>
              <TabsTrigger value="entregados" className="text-xs">
                Entregados ({contadores.entregados})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredEstudios.map((estudio) => {
                  const estatusInfo = estatusConfig[estudio.estatus] || estatusConfig.solicitado;
                  const IconComponent = estatusInfo.icon;
                  const riesgoInfo = estudio.calificacion_riesgo ? riesgoConfig[estudio.calificacion_riesgo] : null;

                  return (
                    <div
                      key={estudio.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-xs text-muted-foreground">
                              {estudio.folio}
                            </span>
                            <Badge className={estatusInfo.color}>
                              <IconComponent className="h-3 w-3 mr-1" />
                              {estatusInfo.label}
                            </Badge>
                            {getUrgencyBadge(estudio.fecha_limite, estudio.estatus)}
                            {riesgoInfo && (
                              <Badge variant="outline" className="gap-1">
                                <div className={`h-2 w-2 rounded-full ${riesgoInfo.color}`} />
                                {riesgoInfo.label}
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-semibold flex items-center gap-2 truncate">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            {estudio.nombre_candidato}
                          </h4>
                          
                          <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                            <p className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {estudio.vacante_puesto}
                            </p>
                            <p className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{estudio.direccion_visita}</span>
                            </p>
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Límite: {format(new Date(estudio.fecha_limite), "dd MMM yyyy", { locale: es })}
                            </p>
                            {estudio.perfil_verificador?.nombre_verificador && (
                              <p className="flex items-center gap-1 text-primary">
                                <User className="h-3 w-3" />
                                Verificador: {estudio.perfil_verificador.nombre_verificador}
                              </p>
                            )}
                            {estudio.fecha_entrega && (
                              <p className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Entregado: {format(new Date(estudio.fecha_entrega), "dd MMM yyyy", { locale: es })}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerDetalle(estudio)}
                          className="shrink-0"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {filteredEstudios.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay estudios con este filtro.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      <EstudioDetalleModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        estudio={selectedEstudio}
      />
    </>
  );
}
