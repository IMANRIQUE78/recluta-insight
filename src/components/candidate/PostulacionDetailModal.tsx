import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Calendar, MessageSquare, ChevronDown, Briefcase } from "lucide-react";
import { PostulacionChatDialog } from "@/components/postulacion/PostulacionChatDialog";
import { PostulacionTimeline } from "@/components/postulacion/PostulacionTimeline";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Postulacion {
  id: string;
  fecha_postulacion: string;
  estado: string;
  etapa: string;
  notas_reclutador: string | null;
  publicacion: {
    id: string;
    titulo_puesto: string;
    ubicacion: string | null;
    lugar_trabajo: string;
    sueldo_bruto_aprobado: number | null;
    perfil_requerido: string | null;
    observaciones: string | null;
    fecha_publicacion: string;
    user_id: string;
  };
}

interface PostulacionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postulacion: Postulacion;
}

const etapaLabels: Record<string, string> = {
  recibida: "Recibida",
  revision: "En Revisión",
  entrevista: "Entrevista",
  rechazada: "Rechazada",
  contratada: "Contratada",
};

const etapaColors: Record<string, string> = {
  recibida: "bg-blue-500",
  revision: "bg-yellow-500",
  entrevista: "bg-purple-500",
  rechazada: "bg-red-500",
  contratada: "bg-green-500",
};

export const PostulacionDetailModal = ({ open, onOpenChange, postulacion }: PostulacionDetailModalProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const formatSalary = (salary: number | null) => {
    if (!salary) return "No especificado";
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(salary);
  };

  const getModalidadLabel = (modalidad: string) => {
    const labels: Record<string, string> = {
      remoto: "Remoto",
      presencial: "Presencial",
      hibrido: "Híbrido",
    };
    return labels[modalidad] || modalidad;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{postulacion.publicacion.titulo_puesto}</DialogTitle>
                <div className="flex items-center gap-3 mt-3">
                  {postulacion.publicacion.ubicacion && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {postulacion.publicacion.ubicacion}
                    </span>
                  )}
                  <Badge variant="secondary">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {getModalidadLabel(postulacion.publicacion.lugar_trabajo)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <Badge className={etapaColors[postulacion.etapa]}>
                  {etapaLabels[postulacion.etapa]}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 justify-end">
                  <Calendar className="h-3 w-3" />
                  {new Date(postulacion.fecha_postulacion).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Información de la vacante */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Salario</p>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{formatSalary(postulacion.publicacion.sueldo_bruto_aprobado)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Fecha de publicación</p>
                  <p className="mt-1">{new Date(postulacion.publicacion.fecha_publicacion).toLocaleDateString('es-MX')}</p>
                </div>
              </div>

              {postulacion.publicacion.perfil_requerido && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Perfil Requerido</p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{postulacion.publicacion.perfil_requerido}</p>
                  </div>
                </div>
              )}

              {postulacion.publicacion.observaciones && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Observaciones</p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{postulacion.publicacion.observaciones}</p>
                  </div>
                </div>
              )}

              {postulacion.notas_reclutador && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Notas del Reclutador</p>
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <p className="text-sm">{postulacion.notas_reclutador}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Proceso de selección */}
            <div>
              <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                  >
                    <span className="font-semibold">Proceso de Selección</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${timelineOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <PostulacionTimeline 
                    etapaActual={postulacion.etapa}
                    estado={postulacion.estado}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="default"
                onClick={() => setChatOpen(true)}
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat con Reclutador
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PostulacionChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        postulacionId={postulacion.id}
        destinatarioUserId={postulacion.publicacion.user_id}
        destinatarioNombre="Reclutador"
        tituloVacante={postulacion.publicacion.titulo_puesto}
      />
    </>
  );
};
