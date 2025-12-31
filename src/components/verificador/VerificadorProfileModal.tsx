import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Star,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VerificadorProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verificadorId: string; // perfil_verificador.id
}

export function VerificadorProfileModal({
  open,
  onOpenChange,
  verificadorId,
}: VerificadorProfileModalProps) {
  // Fetch perfil verificador
  const { data: perfil, isLoading } = useQuery({
    queryKey: ["verificador-profile-readonly", verificadorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfil_verificador")
        .select("*")
        .eq("id", verificadorId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!verificadorId && open,
  });

  // Fetch estudios para conteos
  const { data: estudios = [] } = useQuery({
    queryKey: ["verificador-estudios-readonly", verificadorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estudios_socioeconomicos")
        .select("id, estatus, fecha_limite, fecha_entrega")
        .eq("verificador_id", verificadorId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!verificadorId && open,
  });

  // Fetch calificaciones
  const { data: calificaciones = [] } = useQuery({
    queryKey: ["verificador-calificaciones-readonly", verificadorId],
    queryFn: async () => {
      const estudiosEntregados = estudios.filter(e => e.estatus === "entregado");
      if (estudiosEntregados.length === 0) return [];
      
      const { data, error } = await supabase
        .from("calificaciones_estudio")
        .select("calificacion, comentario")
        .in("estudio_id", estudiosEntregados.map(e => e.id));
      if (error) return [];
      return data || [];
    },
    enabled: estudios.length > 0 && open,
  });

  // Calculate metrics
  const estudiosCompletados = estudios.filter(e => e.estatus === "entregado").length;
  const estudiosEnProceso = estudios.filter(e => 
    ["asignado", "en_proceso", "pendiente_carga"].includes(e.estatus)
  ).length;
  
  const entregasATiempo = estudios.filter(e => {
    if (e.estatus !== "entregado" || !e.fecha_entrega || !e.fecha_limite) return false;
    return new Date(e.fecha_entrega) <= new Date(e.fecha_limite);
  }).length;
  
  const porcentajeATiempo = estudiosCompletados > 0 
    ? Math.round((entregasATiempo / estudiosCompletados) * 100) 
    : 0;

  const promedioCalificacion = calificaciones.length > 0
    ? (calificaciones.reduce((acc, c) => acc + c.calificacion, 0) / calificaciones.length).toFixed(1)
    : "N/A";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCalificacionColor = (rating: string) => {
    const num = parseFloat(rating);
    if (isNaN(num)) return "text-muted-foreground";
    if (num >= 4.5) return "text-green-600";
    if (num >= 3.5) return "text-yellow-600";
    return "text-orange-600";
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!perfil) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verificador no encontrado</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Perfil del Verificador
          </DialogTitle>
          <DialogDescription>
            Información y estadísticas del verificador
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials(perfil.nombre_verificador)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{perfil.nombre_verificador}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={perfil.disponible ? "default" : "secondary"}>
                  {perfil.disponible ? "Disponible" : "No disponible"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {perfil.codigo_verificador}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Métricas principales */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Desempeño
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{estudiosCompletados}</p>
                  <p className="text-xs text-muted-foreground">Estudios Realizados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-2xl font-bold">{estudiosEnProceso}</p>
                  <p className="text-xs text-muted-foreground">En Proceso</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
                  <p className="text-2xl font-bold">{porcentajeATiempo}%</p>
                  <p className="text-xs text-muted-foreground">Entregas a Tiempo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                  <p className={`text-2xl font-bold ${getCalificacionColor(promedioCalificacion as string)}`}>
                    {promedioCalificacion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Calificación ({calificaciones.length} {calificaciones.length === 1 ? 'reseña' : 'reseñas'})
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Información de contacto */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Información de Contacto
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{perfil.email}</span>
              </div>
              {perfil.telefono && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{perfil.telefono}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Registrado el {format(new Date(perfil.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Zonas de cobertura */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zonas de Cobertura
            </h4>
            
            <div className="flex flex-wrap gap-2">
              {perfil.zona_cobertura && perfil.zona_cobertura.length > 0 ? (
                perfil.zona_cobertura.map((zona: string) => (
                  <Badge key={zona} variant="secondary">
                    {zona}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin zonas especificadas</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
