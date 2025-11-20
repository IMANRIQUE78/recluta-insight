import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar as CalendarIcon, Clock, Trash2, CalendarClock, AlertTriangle } from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GestionarEntrevistaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrevista: {
    id: string;
    fecha_entrevista: string;
    candidato_user_id: string;
    candidato_nombre: string;
    titulo_puesto: string;
    postulacion_id: string;
    tipo_entrevista?: string;
    duracion_minutos?: number;
    notas?: string;
  } | null;
  onSuccess: () => void;
}

export const GestionarEntrevistaDialog = ({
  open,
  onOpenChange,
  entrevista,
  onSuccess,
}: GestionarEntrevistaDialogProps) => {
  const { toast } = useToast();
  const [fecha, setFecha] = useState<Date>();
  const [hora, setHora] = useState<string>("09:00");
  const [motivo, setMotivo] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (entrevista && open) {
      const fechaEntrevista = new Date(entrevista.fecha_entrevista);
      setFecha(fechaEntrevista);
      setHora(format(fechaEntrevista, "HH:mm"));
      setMotivo("");
    }
  }, [entrevista, open]);

  const handleReagendar = async () => {
    if (!entrevista || !fecha || !motivo.trim()) {
      toast({
        title: "Campos incompletos",
        description: "Por favor selecciona una fecha y explica el motivo del cambio",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Combinar fecha y hora
      const [horas, minutos] = hora.split(":").map(Number);
      const nuevaFecha = setMinutes(setHours(fecha, horas), minutos);

      // Actualizar la entrevista
      const { error: updateError } = await supabase
        .from("entrevistas_candidato")
        .update({
          fecha_entrevista: nuevaFecha.toISOString(),
          estado: "reagendada",
          updated_at: new Date().toISOString(),
        })
        .eq("id", entrevista.id);

      if (updateError) throw updateError;

      // Enviar notificación al candidato
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const mensaje = `⚠️ ENTREVISTA REAGENDADA\n\nTu entrevista para "${entrevista.titulo_puesto}" ha sido reagendada.\n\n📅 Nueva fecha: ${format(nuevaFecha, "PPP 'a las' HH:mm", { locale: es })}\n\n📝 Motivo: ${motivo}\n\nPor favor confirma tu disponibilidad.`;

      const { error: mensajeError } = await supabase
        .from("mensajes_postulacion")
        .insert({
          postulacion_id: entrevista.postulacion_id,
          remitente_user_id: user.id,
          destinatario_user_id: entrevista.candidato_user_id,
          mensaje,
        });

      if (mensajeError) throw mensajeError;

      toast({
        title: "✅ Entrevista reagendada",
        description: `La entrevista se reagendó para el ${format(nuevaFecha, "PPP 'a las' HH:mm", { locale: es })}. El candidato ha sido notificado.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error al reagendar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePosponer = async () => {
    if (!entrevista || !motivo.trim()) {
      toast({
        title: "Campo incompleto",
        description: "Por favor explica el motivo de la postergación",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Posponer 7 días
      const fechaActual = new Date(entrevista.fecha_entrevista);
      const nuevaFecha = addDays(fechaActual, 7);

      // Actualizar la entrevista
      const { error: updateError } = await supabase
        .from("entrevistas_candidato")
        .update({
          fecha_entrevista: nuevaFecha.toISOString(),
          estado: "pospuesta",
          updated_at: new Date().toISOString(),
        })
        .eq("id", entrevista.id);

      if (updateError) throw updateError;

      // Enviar notificación al candidato
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const mensaje = `⚠️ ENTREVISTA POSPUESTA\n\nTu entrevista para "${entrevista.titulo_puesto}" ha sido pospuesta temporalmente.\n\n📅 Nueva fecha tentativa: ${format(nuevaFecha, "PPP 'a las' HH:mm", { locale: es })}\n\n📝 Motivo: ${motivo}\n\nEn breve te confirmaremos la fecha definitiva.`;

      const { error: mensajeError } = await supabase
        .from("mensajes_postulacion")
        .insert({
          postulacion_id: entrevista.postulacion_id,
          remitente_user_id: user.id,
          destinatario_user_id: entrevista.candidato_user_id,
          mensaje,
        });

      if (mensajeError) throw mensajeError;

      toast({
        title: "✅ Entrevista pospuesta",
        description: `La entrevista se pospuso por 7 días. El candidato ha sido notificado.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error al posponer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    if (!entrevista) return;

    setIsSubmitting(true);
    try {
      // Enviar notificación al candidato ANTES de eliminar
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const mensaje = `❌ ENTREVISTA CANCELADA\n\nLamentamos informarte que tu entrevista para "${entrevista.titulo_puesto}" programada para el ${format(new Date(entrevista.fecha_entrevista), "PPP 'a las' HH:mm", { locale: es })} ha sido cancelada.\n\n📝 Motivo: ${motivo || "No especificado"}\n\nTe contactaremos si hay novedades.`;

      const { error: mensajeError } = await supabase
        .from("mensajes_postulacion")
        .insert({
          postulacion_id: entrevista.postulacion_id,
          remitente_user_id: user.id,
          destinatario_user_id: entrevista.candidato_user_id,
          mensaje,
        });

      if (mensajeError) throw mensajeError;

      // Eliminar la entrevista
      const { error: deleteError } = await supabase
        .from("entrevistas_candidato")
        .delete()
        .eq("id", entrevista.id);

      if (deleteError) throw deleteError;

      toast({
        title: "✅ Entrevista cancelada",
        description: "La entrevista ha sido cancelada y el candidato ha sido notificado.",
      });

      onSuccess();
      onOpenChange(false);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error al cancelar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!entrevista) return null;

  const horasDisponibles = Array.from({ length: 24 }, (_, i) => {
    const hora = i.toString().padStart(2, "0");
    return [`${hora}:00`, `${hora}:30`];
  }).flat();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Gestionar Entrevista
            </DialogTitle>
            <DialogDescription>
              <div className="mt-2 space-y-1">
                <p className="font-medium text-foreground">
                  {entrevista.candidato_nombre} - {entrevista.titulo_puesto}
                </p>
                <p className="text-sm">
                  Fecha actual: {format(new Date(entrevista.fecha_entrevista), "PPP 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
              Cualquier cambio que realices será notificado al candidato automáticamente
            </AlertDescription>
          </Alert>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nueva-fecha">Nueva Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="nueva-fecha"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fecha && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={setFecha}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Select value={hora} onValueChange={setHora}>
                <SelectTrigger id="hora">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {hora}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {horasDisponibles.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">
                Motivo del cambio <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo"
                placeholder="Explica por qué necesitas reagendar/posponer la entrevista..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Este mensaje será enviado al candidato
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isSubmitting}
              className="sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancelar Entrevista
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePosponer}
                disabled={isSubmitting || !motivo.trim()}
              >
                Posponer 7 días
              </Button>
              <Button
                onClick={handleReagendar}
                disabled={isSubmitting || !fecha || !motivo.trim()}
              >
                Reagendar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar entrevista?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la entrevista con{" "}
              <span className="font-semibold">{entrevista.candidato_nombre}</span> programada para el{" "}
              {format(new Date(entrevista.fecha_entrevista), "PPP 'a las' HH:mm", { locale: es })}.
              <br />
              <br />
              El candidato será notificado de la cancelación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar entrevista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
