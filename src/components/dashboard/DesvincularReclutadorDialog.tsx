import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DesvincularReclutadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asociacionId: string;
  reclutadorNombre: string;
  onSuccess?: () => void;
}

export const DesvincularReclutadorDialog = ({
  open,
  onOpenChange,
  asociacionId,
  reclutadorNombre,
  onSuccess,
}: DesvincularReclutadorDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDesvincular = async () => {
    try {
      setLoading(true);

      // Actualizar estado de la asociación
      const { error } = await supabase
        .from("reclutador_empresa")
        .update({
          estado: "finalizada",
          fecha_fin: new Date().toISOString(),
        })
        .eq("id", asociacionId);

      if (error) throw error;

      toast.success("Desvinculación exitosa", {
        description: `${reclutadorNombre} ha sido desvinculado. Las estadísticas generadas se mantienen en ambos perfiles.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error desvinculando:", error);
      toast.error("Error al desvincular", {
        description: "No se pudo completar la desvinculación. Intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desvincular a {reclutadorNombre}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Estás a punto de finalizar la colaboración con este reclutador.
            </p>
            <p className="font-medium">
              Las estadísticas generadas durante esta colaboración se mantendrán en ambos perfiles, pero no se generarán nuevas estadísticas.
            </p>
            <p>
              Para volver a colaborar con este reclutador, deberás enviarle una nueva invitación.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDesvincular}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Desvincular
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
