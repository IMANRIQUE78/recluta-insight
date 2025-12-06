import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  User, 
  Home, 
  DollarSign, 
  Calendar,
  MapPin,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EstudioDetalleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudio: any;
}

const estatusConfig: Record<string, { label: string; color: string }> = {
  solicitado: { label: "Solicitado", color: "bg-blue-100 text-blue-800" },
  asignado: { label: "Asignado", color: "bg-purple-100 text-purple-800" },
  en_proceso: { label: "En Proceso", color: "bg-yellow-100 text-yellow-800" },
  pendiente_carga: { label: "Pendiente de Carga", color: "bg-orange-100 text-orange-800" },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

const riesgoConfig: Record<string, { label: string; color: string }> = {
  bajo: { label: "Riesgo Bajo", color: "bg-green-100 text-green-800" },
  medio: { label: "Riesgo Medio", color: "bg-yellow-100 text-yellow-800" },
  alto: { label: "Riesgo Alto", color: "bg-orange-100 text-orange-800" },
  muy_alto: { label: "Riesgo Muy Alto", color: "bg-red-100 text-red-800" },
};

export default function EstudioDetalleModal({
  open,
  onOpenChange,
  estudio,
}: EstudioDetalleModalProps) {
  if (!estudio) return null;

  const estatusInfo = estatusConfig[estudio.estatus] || estatusConfig.solicitado;
  const riesgoInfo = estudio.calificacion_riesgo ? riesgoConfig[estudio.calificacion_riesgo] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detalle del Estudio Socioeconómico
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6 max-h-[75vh]">
          {/* Info General */}
          <Card className="bg-muted/30 mb-4">
            <CardContent className="py-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">{estudio.folio}</p>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {estudio.nombre_candidato}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={estatusInfo.color}>{estatusInfo.label}</Badge>
                  {riesgoInfo && (
                    <Badge className={riesgoInfo.color}>{riesgoInfo.label}</Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{estudio.vacante_puesto}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{estudio.direccion_visita}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Límite: {format(new Date(estudio.fecha_limite), "dd/MM/yyyy", { locale: es })}</span>
                </div>
                {estudio.fecha_entrega && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Entregado: {format(new Date(estudio.fecha_entrega), "dd/MM/yyyy", { locale: es })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datos de la Visita */}
          {(estudio.fecha_visita || estudio.observaciones_visita) && (
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Datos de la Visita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {estudio.fecha_visita && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de visita:</span>
                    <span>{format(new Date(estudio.fecha_visita), "dd/MM/yyyy", { locale: es })}</span>
                  </div>
                )}
                {estudio.hora_visita && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hora de visita:</span>
                    <span>{estudio.hora_visita}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Candidato presente:</span>
                  <span>{estudio.candidato_presente ? "Sí" : "No"}</span>
                </div>
                {!estudio.candidato_presente && estudio.motivo_ausencia && (
                  <div>
                    <p className="text-muted-foreground">Motivo de ausencia:</p>
                    <p className="mt-1">{estudio.motivo_ausencia}</p>
                  </div>
                )}
                {estudio.observaciones_visita && (
                  <div>
                    <p className="text-muted-foreground">Observaciones:</p>
                    <p className="mt-1">{estudio.observaciones_visita}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Datos Sociodemográficos */}
          {estudio.datos_sociodemograficos && Object.keys(estudio.datos_sociodemograficos).length > 0 && (
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Datos Sociodemográficos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {estudio.datos_sociodemograficos.estado_civil && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado civil:</span>
                    <span>{estudio.datos_sociodemograficos.estado_civil}</span>
                  </div>
                )}
                {estudio.datos_sociodemograficos.numero_dependientes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dependientes:</span>
                    <span>{estudio.datos_sociodemograficos.numero_dependientes}</span>
                  </div>
                )}
                {estudio.datos_sociodemograficos.escolaridad && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escolaridad:</span>
                    <span>{estudio.datos_sociodemograficos.escolaridad}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Datos de Vivienda */}
          {estudio.datos_vivienda && Object.keys(estudio.datos_vivienda).length > 0 && (
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  Datos de Vivienda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {estudio.datos_vivienda.tipo_vivienda && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{estudio.datos_vivienda.tipo_vivienda}</span>
                  </div>
                )}
                {estudio.datos_vivienda.propiedad_vivienda && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Propiedad:</span>
                    <span>{estudio.datos_vivienda.propiedad_vivienda}</span>
                  </div>
                )}
                {estudio.datos_vivienda.antiguedad_vivienda && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Antigüedad:</span>
                    <span>{estudio.datos_vivienda.antiguedad_vivienda}</span>
                  </div>
                )}
                {estudio.datos_vivienda.estado_vivienda && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <span>{estudio.datos_vivienda.estado_vivienda}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Datos Económicos */}
          {estudio.datos_economicos && Object.keys(estudio.datos_economicos).length > 0 && (
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Datos Económicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {estudio.datos_economicos.ingreso_mensual && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ingreso mensual:</span>
                    <span>{estudio.datos_economicos.ingreso_mensual}</span>
                  </div>
                )}
                {estudio.datos_economicos.gastos_mensuales && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gastos mensuales:</span>
                    <span>{estudio.datos_economicos.gastos_mensuales}</span>
                  </div>
                )}
                {estudio.datos_economicos.deudas_pendientes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deudas:</span>
                    <span>{estudio.datos_economicos.deudas_pendientes}</span>
                  </div>
                )}
                {estudio.datos_economicos.vehiculo_propio && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehículo propio:</span>
                    <span>{estudio.datos_economicos.vehiculo_propio}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Referencias */}
          {estudio.datos_referencias && Object.keys(estudio.datos_referencias).length > 0 && (
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Referencias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {estudio.datos_referencias.referencias_verificadas && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verificadas:</span>
                    <span>{estudio.datos_referencias.referencias_verificadas}</span>
                  </div>
                )}
                {estudio.datos_referencias.referencias_comentarios && (
                  <div>
                    <p className="text-muted-foreground">Comentarios:</p>
                    <p className="mt-1">{estudio.datos_referencias.referencias_comentarios}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resultado */}
          {(estudio.resultado_general || estudio.observaciones_finales) && (
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Resultado del Estudio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {estudio.resultado_general && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resultado:</span>
                    <span className="font-medium">{estudio.resultado_general}</span>
                  </div>
                )}
                {estudio.observaciones_finales && (
                  <div>
                    <p className="text-muted-foreground">Observaciones finales:</p>
                    <p className="mt-1">{estudio.observaciones_finales}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
