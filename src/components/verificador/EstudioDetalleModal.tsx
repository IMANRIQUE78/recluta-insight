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
  Briefcase,
  Users,
  Phone,
  Mail,
  Shield
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

const formatLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateStr;
  }
};

const renderValue = (value: any): string | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return null;
};

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-muted/40 last:border-b-0">
      <span className="text-xs text-muted-foreground font-medium shrink-0">{label}</span>
      <span className="text-xs text-right break-words">{value}</span>
    </div>
  );
}

function renderJsonSection(data: any) {
  if (!data || typeof data !== "object") return null;

  const simpleEntries: [string, string][] = [];
  const arrayEntries: [string, any[]][] = [];

  Object.entries(data).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      arrayEntries.push([key, val]);
    } else {
      const rendered = renderValue(val);
      if (rendered) {
        simpleEntries.push([formatLabel(key), rendered]);
      }
    }
  });

  return (
    <div className="space-y-3">
      {simpleEntries.length > 0 && (
        <div className="space-y-0">
          {simpleEntries.map(([label, val], i) => (
            <DataRow key={i} label={label} value={val} />
          ))}
        </div>
      )}
      {arrayEntries.map(([key, arr]) => (
        <div key={key}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {formatLabel(key)}
          </p>
          {arr.filter((item) => {
            if (typeof item !== "object") return true;
            return Object.values(item).some((v) => v !== null && v !== undefined && v !== "");
          }).map((item, idx) => {
            if (typeof item !== "object") return <p key={idx} className="text-xs">{String(item)}</p>;
            const entries = Object.entries(item)
              .filter(([, v]) => v !== null && v !== undefined && v !== "")
              .map(([k, v]) => [formatLabel(k), typeof v === "boolean" ? (v ? "Sí" : "No") : String(v)] as [string, string]);
            if (entries.length === 0) return null;
            return (
              <Card key={idx} className="mb-2 bg-muted/20">
                <CardContent className="py-2 px-3">
                  {entries.map(([l, v], j) => (
                    <DataRow key={j} label={l} value={v} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, icon, data }: { title: string; icon: React.ReactNode; data: any }) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) return null;
  const hasContent = Object.values(data).some((v) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));
  if (!hasContent) return null;

  return (
    <Card className="mb-3">
      <CardHeader className="py-2.5 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {renderJsonSection(data)}
      </CardContent>
    </Card>
  );
}

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
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            Detalle del Estudio Socioeconómico
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-5 pb-5 max-h-[75vh]">
          {/* Header Card */}
          <Card className="bg-muted/30 mb-3">
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground font-mono">{estudio.folio}</p>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {estudio.nombre_candidato}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge className={estatusInfo.color}>{estatusInfo.label}</Badge>
                  {riesgoInfo && <Badge className={riesgoInfo.color}>{riesgoInfo.label}</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building className="h-3.5 w-3.5" />
                  <span>{estudio.vacante_puesto}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{estudio.direccion_visita}</span>
                </div>
                {estudio.cliente_empresa && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    <span>{estudio.cliente_empresa}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Límite: {formatDate(estudio.fecha_limite)}</span>
                </div>
                {estudio.telefono_candidato && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{estudio.telefono_candidato}</span>
                  </div>
                )}
                {estudio.email_candidato && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{estudio.email_candidato}</span>
                  </div>
                )}
                {estudio.fecha_entrega && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    <span>Entregado: {formatDate(estudio.fecha_entrega)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datos de la Visita */}
          {(estudio.fecha_visita || estudio.observaciones_visita) && (
            <Card className="mb-3">
              <CardHeader className="py-2.5 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Datos de la Visita
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-0">
                {estudio.fecha_visita && <DataRow label="Fecha de visita" value={formatDate(estudio.fecha_visita) || "—"} />}
                {estudio.hora_visita && <DataRow label="Hora de visita" value={estudio.hora_visita} />}
                <DataRow label="Candidato presente" value={estudio.candidato_presente ? "Sí" : "No"} />
                {!estudio.candidato_presente && estudio.motivo_ausencia && <DataRow label="Motivo de ausencia" value={estudio.motivo_ausencia} />}
                {estudio.observaciones_visita && <DataRow label="Observaciones" value={estudio.observaciones_visita} />}
              </CardContent>
            </Card>
          )}

          {/* Dynamic sections */}
          <SectionCard title="Datos Sociodemográficos" icon={<User className="h-4 w-4 text-primary" />} data={estudio.datos_sociodemograficos} />
          <SectionCard title="Datos de Vivienda" icon={<Home className="h-4 w-4 text-primary" />} data={estudio.datos_vivienda} />
          <SectionCard title="Datos Económicos" icon={<DollarSign className="h-4 w-4 text-primary" />} data={estudio.datos_economicos} />
          <SectionCard title="Datos Laborales" icon={<Briefcase className="h-4 w-4 text-primary" />} data={estudio.datos_laborales} />
          <SectionCard title="Referencias" icon={<Users className="h-4 w-4 text-primary" />} data={estudio.datos_referencias} />

          {/* Resultado */}
          {(estudio.resultado_general || estudio.observaciones_finales) && (
            <Card className="mb-3">
              <CardHeader className="py-2.5 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Resultado del Estudio
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-0">
                {estudio.resultado_general && <DataRow label="Resultado" value={estudio.resultado_general} />}
                {estudio.observaciones_finales && <DataRow label="Observaciones finales" value={estudio.observaciones_finales} />}
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
