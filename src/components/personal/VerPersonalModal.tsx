import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Briefcase, 
  MapPin, 
  Phone, 
  CreditCard, 
  HeartPulse,
  DollarSign,
  UserCheck,
  UserX,
  RefreshCw,
  FileText,
  Download
} from "lucide-react";
import { differenceInYears, differenceInMonths, differenceInDays, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { usePersonalPdf } from "@/hooks/usePersonalPdf";
import { toast } from "sonner";

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
  // Campos NOM-035
  centro_trabajo?: string | null;
  tipo_jornada?: string | null;
  modalidad_contratacion?: string | null;
  fecha_fin_contrato?: string | null;
  es_supervisor?: boolean;
  empresa_id?: string;
  codigo_postal?: string | null;
}

interface VerPersonalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empleado: PersonalEmpleado;
  nombreEmpresa?: string;
}

export const VerPersonalModal = ({
  open,
  onOpenChange,
  empleado,
  nombreEmpresa = "Empresa",
}: VerPersonalModalProps) => {
  const { generarExpedientePdf } = usePersonalPdf();

  const handleDescargarPdf = () => {
    try {
      generarExpedientePdf(empleado, nombreEmpresa);
      toast.success("Expediente descargado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF");
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

  const formatDate = (date: string | null): string => {
    if (!date) return "-";
    return format(parseISO(date), "dd/MM/yyyy", { locale: es });
  };

  const formatCurrency = (amount: number | null): string => {
    if (!amount) return "-";
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
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

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between py-2 border-b border-dashed border-muted last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm text-right">{value || "-"}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{empleado.nombre_completo}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="font-mono">{empleado.codigo_empleado}</span>
                {getEstatusBadge(empleado.estatus)}
              </DialogDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDescargarPdf}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Datos Personales */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <User className="h-4 w-4" />
                Datos Personales
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <InfoRow label="Género" value={empleado.genero} />
                <InfoRow label="Fecha de Nacimiento" value={formatDate(empleado.fecha_nacimiento)} />
                <InfoRow label="Edad" value={calcularEdad(empleado.fecha_nacimiento)} />
                <InfoRow label="Estado Civil" value={empleado.estado_civil} />
                <InfoRow label="Escolaridad" value={empleado.escolaridad} />
              </div>
            </div>

            <Separator />

            {/* Datos Laborales */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Briefcase className="h-4 w-4" />
                Datos Laborales
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <InfoRow label="Puesto" value={empleado.puesto} />
                <InfoRow label="Área" value={empleado.area} />
                <InfoRow label="Jefe Directo" value={empleado.jefe_directo} />
                <InfoRow label="Fecha de Ingreso" value={formatDate(empleado.fecha_ingreso)} />
                <InfoRow label="Antigüedad" value={calcularAntiguedad(empleado.fecha_ingreso, empleado.fecha_salida)} />
                {empleado.fecha_salida && (
                  <>
                    <InfoRow label="Fecha de Salida" value={formatDate(empleado.fecha_salida)} />
                    <InfoRow label="Permanencia Total" value={calcularAntiguedad(empleado.fecha_ingreso, empleado.fecha_salida)} />
                  </>
                )}
                <InfoRow label="Reclutador Asignado" value={empleado.reclutador_asignado} />
              </div>
            </div>

            <Separator />

            {/* Compensación */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <DollarSign className="h-4 w-4" />
                Compensación
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <InfoRow label="Sueldo Asignado" value={formatCurrency(empleado.sueldo_asignado)} />
                {empleado.finiquito && (
                  <InfoRow label="Finiquito" value={formatCurrency(empleado.finiquito)} />
                )}
              </div>
            </div>

            <Separator />

            {/* Dirección */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4" />
                Dirección
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <InfoRow label="Domicilio" value={empleado.domicilio} />
                <InfoRow label="Colonia" value={empleado.colonia} />
                <InfoRow label="Alcaldía/Municipio" value={empleado.alcaldia_municipio} />
              </div>
            </div>

            <Separator />

            {/* Contacto */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Phone className="h-4 w-4" />
                Contacto
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <InfoRow label="Teléfono Móvil" value={empleado.telefono_movil} />
                <InfoRow label="Teléfono de Emergencia" value={empleado.telefono_emergencia} />
                <InfoRow label="Email Personal" value={empleado.email_personal} />
                <InfoRow label="Email Corporativo" value={empleado.email_corporativo} />
              </div>
            </div>

            <Separator />

            {/* Datos Fiscales */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CreditCard className="h-4 w-4" />
                Datos Fiscales y Bancarios
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <InfoRow label="NSS" value={empleado.nss} />
                <InfoRow label="Cuenta Bancaria" value={empleado.cuenta_bancaria} />
                <InfoRow label="CURP" value={empleado.curp} />
                <InfoRow label="RFC" value={empleado.rfc} />
              </div>
            </div>

            {/* Salud */}
            {empleado.enfermedades_alergias && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <HeartPulse className="h-4 w-4" />
                    Salud
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <InfoRow label="Enfermedades/Alergias" value={empleado.enfermedades_alergias} />
                  </div>
                </div>
              </>
            )}

            {/* Observaciones */}
            {empleado.observaciones && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <FileText className="h-4 w-4" />
                    Observaciones
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm">{empleado.observaciones}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
