import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, MapPin, Video, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GestionEstatusPostulacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postulacion: any;
  onSuccess: () => void;
}

const ESTATUS_OPTIONS = [
  { value: "recibida", label: "Recibida" },
  { value: "revision", label: "En Revisión" },
  { value: "entrevista_presencial", label: "Entrevista Presencial" },
  { value: "entrevista_distancia", label: "Entrevista a Distancia" },
  { value: "no_respondio_contacto", label: "No Respondió Contacto" },
  { value: "continua_proceso", label: "Continúa en Proceso" },
  { value: "candidato_abandona", label: "Candidato Abandona Proceso" },
  { value: "no_asistio", label: "No Asistió" },
  { value: "no_viable_filtro", label: "No Viable en Llamada Filtro" },
  { value: "no_viable_entrevista", label: "No Viable en Entrevista" },
  { value: "no_viable_conocimientos", label: "No Viable por Conocimientos" },
  { value: "no_viable_psicometria", label: "No Viable por Psicometría" },
  { value: "no_viable_segunda_entrevista", label: "No Viable en Segunda Entrevista" },
  { value: "contratado", label: "Contratado" },
  { value: "descartado", label: "Descartado" },
];

export const GestionEstatusPostulacionDialog = ({
  open,
  onOpenChange,
  postulacion,
  onSuccess,
}: GestionEstatusPostulacionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [estatus, setEstatus] = useState(postulacion?.etapa || "");
  const [notas, setNotas] = useState("");
  
  // Campos para entrevistas
  const [fechaEntrevista, setFechaEntrevista] = useState<Date>();
  const [horaEntrevista, setHoraEntrevista] = useState("");
  const [lugarEntrevista, setLugarEntrevista] = useState("");
  const [enlaceRemoto, setEnlaceRemoto] = useState("");
  const [detallesReunion, setDetallesReunion] = useState("");

  const requiereEntrevista = estatus === "entrevista_presencial" || estatus === "entrevista_distancia";

  const handleSave = async () => {
    if (!estatus) {
      toast({
        title: "Error",
        description: "Debes seleccionar un estatus",
        variant: "destructive",
      });
      return;
    }

    if (requiereEntrevista && (!fechaEntrevista || !horaEntrevista)) {
      toast({
        title: "Error",
        description: "Debes proporcionar fecha y hora de la entrevista",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Actualizar el estatus de la postulación
      const { error: updateError } = await supabase
        .from("postulaciones")
        .update({
          etapa: estatus,
          estado: estatus === "contratado" ? "aceptado" : "pendiente",
          notas_reclutador: notas,
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id", postulacion.id);

      if (updateError) throw updateError;

      // Si es una entrevista, crear registro de entrevista
      if (requiereEntrevista && fechaEntrevista && horaEntrevista) {
        const [hours, minutes] = horaEntrevista.split(":");
        const fechaCompleta = new Date(fechaEntrevista);
        fechaCompleta.setHours(parseInt(hours), parseInt(minutes));

        const { error: entrevistaError } = await supabase
          .from("entrevistas_candidato")
          .insert({
            postulacion_id: postulacion.id,
            candidato_user_id: postulacion.candidato_user_id,
            reclutador_user_id: user.id,
            fecha_entrevista: fechaCompleta.toISOString(),
            tipo_entrevista: estatus === "entrevista_presencial" ? "presencial" : "virtual",
            detalles_reunion: detallesReunion || (estatus === "entrevista_presencial" ? lugarEntrevista : enlaceRemoto),
            estado: "propuesta",
          });

        if (entrevistaError) throw entrevistaError;
      }

      // Preparar mensaje para el candidato
      let mensajeCandidato = "";
      switch (estatus) {
        case "entrevista_presencial":
          mensajeCandidato = `🎯 ENTREVISTA PRESENCIAL PROGRAMADA\n\n` +
            `📅 Fecha: ${format(fechaEntrevista!, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}\n` +
            `🕐 Hora: ${horaEntrevista}\n` +
            `📍 Lugar: ${lugarEntrevista}\n\n` +
            `${detallesReunion ? `ℹ️ Detalles: ${detallesReunion}\n\n` : ""}` +
            `Por favor, confirma tu asistencia. ¡Te esperamos!`;
          break;

        case "entrevista_distancia":
          mensajeCandidato = `💻 ENTREVISTA REMOTA PROGRAMADA\n\n` +
            `📅 Fecha: ${format(fechaEntrevista!, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}\n` +
            `🕐 Hora: ${horaEntrevista}\n` +
            `🔗 Enlace: ${enlaceRemoto}\n\n` +
            `${detallesReunion ? `ℹ️ Detalles: ${detallesReunion}\n\n` : ""}` +
            `Por favor, confirma tu asistencia y asegúrate de tener una buena conexión a internet.`;
          break;

        case "continua_proceso":
          mensajeCandidato = `✅ Tu proceso continúa avanzando.\n\n${notas ? `Comentarios: ${notas}` : "Pronto tendrás noticias nuestras."}`;
          break;

        case "contratado":
          mensajeCandidato = `🎉 ¡FELICIDADES! Has sido seleccionado para el puesto.\n\n${notas ? `Comentarios: ${notas}\n\n` : ""}Pronto nos contactaremos contigo con los siguientes pasos.`;
          break;

        case "no_respondio_contacto":
        case "candidato_abandona":
        case "no_asistio":
        case "no_viable_filtro":
        case "no_viable_entrevista":
        case "no_viable_conocimientos":
        case "no_viable_psicometria":
        case "no_viable_segunda_entrevista":
        case "descartado":
          mensajeCandidato = `Gracias por tu interés en la posición. ${notas ? `\n\nComentarios: ${notas}` : ""}`;
          break;

        default:
          mensajeCandidato = `Estado de tu postulación actualizado: ${ESTATUS_OPTIONS.find(e => e.value === estatus)?.label}\n\n${notas ? `Comentarios: ${notas}` : ""}`;
      }

      // Enviar mensaje al candidato
      if (mensajeCandidato) {
        const { error: mensajeError } = await supabase
          .from("mensajes_postulacion")
          .insert({
            postulacion_id: postulacion.id,
            remitente_user_id: user.id,
            destinatario_user_id: postulacion.candidato_user_id,
            mensaje: mensajeCandidato,
          });

        if (mensajeError) throw mensajeError;
      }

      // Si es contratado, cerrar la vacante
      if (estatus === "contratado") {
        const { data: publicacion } = await supabase
          .from("publicaciones_marketplace")
          .select("vacante_id")
          .eq("id", postulacion.publicacion_id)
          .single();

        if (publicacion) {
          await supabase
            .from("vacantes")
            .update({
              estatus: "cerrada",
              fecha_cierre: new Date().toISOString(),
            })
            .eq("id", publicacion.vacante_id);

          await supabase.rpc("recalcular_estadisticas_reclutador", {
            p_user_id: user.id,
          });
        }
      }

      toast({
        title: "✅ Estatus actualizado",
        description: "Se ha notificado al candidato del cambio",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al actualizar estatus:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Estatus de Postulación</DialogTitle>
          <DialogDescription>
            Actualiza el estatus del candidato {postulacion?.candidato?.nombre_completo || ""}
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-warning">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription>
            El candidato recibirá una notificación automática sobre cualquier cambio de estatus.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="estatus">Estatus de la Postulación *</Label>
            <Select value={estatus} onValueChange={setEstatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estatus" />
              </SelectTrigger>
              <SelectContent>
                {ESTATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiereEntrevista && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                {estatus === "entrevista_presencial" ? (
                  <>
                    <MapPin className="h-4 w-4" />
                    Detalles de Entrevista Presencial
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Detalles de Entrevista Remota
                  </>
                )}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Entrevista *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaEntrevista ? (
                          format(fechaEntrevista, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fechaEntrevista}
                        onSelect={setFechaEntrevista}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora">Hora *</Label>
                  <div className="flex items-center">
                    <Clock className="absolute ml-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hora"
                      type="time"
                      value={horaEntrevista}
                      onChange={(e) => setHoraEntrevista(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              {estatus === "entrevista_presencial" ? (
                <div className="space-y-2">
                  <Label htmlFor="lugar">Lugar de la Entrevista *</Label>
                  <Input
                    id="lugar"
                    value={lugarEntrevista}
                    onChange={(e) => setLugarEntrevista(e.target.value)}
                    placeholder="Ej: Oficinas principales, Sala de juntas B"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="enlace">Enlace de la Reunión *</Label>
                  <Input
                    id="enlace"
                    value={enlaceRemoto}
                    onChange={(e) => setEnlaceRemoto(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="detalles">Instrucciones Adicionales</Label>
                <Textarea
                  id="detalles"
                  value={detallesReunion}
                  onChange={(e) => setDetallesReunion(e.target.value)}
                  placeholder="Ej: Traer identificación oficial, preparar presentación, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notas">Notas Internas (opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Comentarios adicionales sobre el candidato..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar y Notificar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
