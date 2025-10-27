import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CalificarEntrevistaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrevistaId: string;
  candidatoUserId: string;
  postulacionId: string;
  onSuccess: () => void;
}

export function CalificarEntrevistaDialog({
  open,
  onOpenChange,
  entrevistaId,
  candidatoUserId,
  postulacionId,
  onSuccess,
}: CalificarEntrevistaDialogProps) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (puntuacion === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar una puntuación",
        variant: "destructive",
      });
      return;
    }

    if (!comentario.trim()) {
      toast({
        title: "Error",
        description: "Debes agregar un comentario",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("feedback_candidato")
        .insert({
          candidato_user_id: candidatoUserId,
          postulacion_id: postulacionId,
          reclutador_user_id: session.user.id,
          puntuacion,
          comentario,
        });

      if (error) throw error;

      toast({
        title: "Calificación enviada",
        description: "Tu feedback ha sido guardado exitosamente",
      });

      onSuccess();
      onOpenChange(false);
      setPuntuacion(0);
      setComentario("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la calificación",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calificar Entrevista</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Puntuación del candidato</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPuntuacion(value)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      value <= puntuacion
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Comentarios sobre el candidato</Label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Describe el desempeño del candidato en la entrevista..."
              rows={5}
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando..." : "Enviar Calificación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
