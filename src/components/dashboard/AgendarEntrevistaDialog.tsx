import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgendarEntrevistaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postulacionId: string;
  candidatoUserId: string;
  candidatoNombre: string;
  onSuccess: () => void;
}

export function AgendarEntrevistaDialog({
  open,
  onOpenChange,
  postulacionId,
  candidatoUserId,
  candidatoNombre,
  onSuccess,
}: AgendarEntrevistaDialogProps) {
  const [fecha, setFecha] = useState<Date>();
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [tipoEntrevista, setTipoEntrevista] = useState<string>("virtual");
  const [notas, setNotas] = useState("");
  const [detallesReunion, setDetallesReunion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!fecha || !hora) {
      toast({
        title: "Error",
        description: "Debes seleccionar fecha y hora",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      // Combinar fecha y hora
      const [hours, minutes] = hora.split(":");
      const fechaEntrevista = new Date(fecha);
      fechaEntrevista.setHours(parseInt(hours), parseInt(minutes));

      // Insertar entrevista
      const { error: entrevistaError } = await supabase
        .from("entrevistas_candidato")
        .insert({
          postulacion_id: postulacionId,
          candidato_user_id: candidatoUserId,
          reclutador_user_id: user.id,
          fecha_entrevista: fechaEntrevista.toISOString(),
          tipo_entrevista: tipoEntrevista,
          duracion_minutos: parseInt(duracion),
          notas,
          detalles_reunion: detallesReunion || null,
          estado: "propuesta",
        });

      if (entrevistaError) throw entrevistaError;

      // Actualizar etapa de la postulación a "entrevista"
      const { error: postulacionError } = await supabase
        .from("postulaciones")
        .update({ 
          etapa: "entrevista",
          fecha_actualizacion: new Date().toISOString() 
        })
        .eq("id", postulacionId);

      if (postulacionError) throw postulacionError;

      toast({
        title: "Propuesta enviada",
        description: `La propuesta de entrevista fue enviada a ${candidatoNombre}`,
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFecha(undefined);
      setHora("");
      setDuracion("60");
      setTipoEntrevista("virtual");
      setNotas("");
      setDetallesReunion("");
    } catch (error) {
      console.error("Error al crear propuesta:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la propuesta de entrevista",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Entrevista</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Candidato</Label>
            <Input value={candidatoNombre} disabled />
          </div>

          <div>
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={setFecha}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Hora</Label>
            <Input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>

          <div>
            <Label>Duración (minutos)</Label>
            <Select value={duracion} onValueChange={setDuracion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de Entrevista</Label>
            <Select value={tipoEntrevista} onValueChange={setTipoEntrevista}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="telefonica">Telefónica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Temas a tratar, preparación necesaria, etc."
              rows={3}
            />
          </div>

          <div>
            <Label>Detalles de la Reunión (opcional)</Label>
            <Textarea
              value={detallesReunion}
              onChange={(e) => setDetallesReunion(e.target.value)}
              placeholder="Link de Zoom/Meet, dirección, instrucciones de acceso, etc."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Propuesta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
