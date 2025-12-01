import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DesvincularEmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asociacionId: string;
  empresaNombre: string;
  onSuccess?: () => void;
}

export const DesvincularEmpresaDialog = ({
  open,
  onOpenChange,
  asociacionId,
  empresaNombre,
  onSuccess,
}: DesvincularEmpresaDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [vacantesAsignadas, setVacantesAsignadas] = useState<number>(0);
  const [canDesvincular, setCanDesvincular] = useState(false);

  useEffect(() => {
    if (open && asociacionId) {
      // Reset states when dialog opens or asociacionId changes
      setChecking(true);
      setVacantesAsignadas(0);
      setCanDesvincular(false);
      checkVacantesAsignadas();
    } else if (!open) {
      // Reset states when dialog closes
      setVacantesAsignadas(0);
      setCanDesvincular(false);
    }
  }, [open, asociacionId]);

  const checkVacantesAsignadas = async () => {
    setChecking(true);
    try {
      // Obtener información de la asociación
      const { data: asociacion } = await supabase
        .from("reclutador_empresa")
        .select("reclutador_id, empresa_id")
        .eq("id", asociacionId)
        .single();

      if (!asociacion) {
        setCanDesvincular(false);
        setChecking(false);
        return;
      }

      // Obtener usuarios que pertenecen a esta empresa (para verificar vacantes sin empresa_id)
      const { data: empresaUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("empresa_id", asociacion.empresa_id)
        .in("role", ["admin_empresa", "rrhh"]);

      const empresaUserIds = empresaUsers?.map(u => u.user_id) || [];

      // Obtener todas las vacantes abiertas asignadas al reclutador
      const { data: vacantes, error: vacantesError } = await supabase
        .from("vacantes")
        .select("id, empresa_id, user_id")
        .eq("reclutador_asignado_id", asociacion.reclutador_id)
        .eq("estatus", "abierta");

      if (vacantesError) {
        console.error("Error cargando vacantes asignadas:", vacantesError);
        setVacantesAsignadas(0);
        setCanDesvincular(false);
      } else {
        // Filtrar vacantes que pertenecen a esta empresa:
        // 1. Vacantes con empresa_id que coincide
        // 2. Vacantes sin empresa_id pero creadas por usuarios de esta empresa
        const vacantesDeEmpresa = vacantes?.filter(v => 
          v.empresa_id === asociacion.empresa_id ||
          (v.empresa_id === null && empresaUserIds.includes(v.user_id))
        ) || [];

        const totalVacantes = vacantesDeEmpresa.length;
        console.log("Vacantes abiertas encontradas para desvinculación (reclutador):", {
          asociacion,
          empresa_id: asociacion.empresa_id,
          empresaUserIds,
          totalVacantes,
          vacantesDeEmpresa,
        });
        setVacantesAsignadas(totalVacantes);
        setCanDesvincular(totalVacantes === 0);
      }
    } catch (error) {
      console.error("Error verificando vacantes:", error);
      setCanDesvincular(false);
    } finally {
      setChecking(false);
    }
  };

  const handleDesvincular = async () => {
    if (!canDesvincular) return;

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
        description: `Has dejado de colaborar con ${empresaNombre}. Tus estadísticas generadas se mantienen en tu perfil.`,
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

  if (checking) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desvincular de {empresaNombre}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {!canDesvincular ? (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>No puedes desvincularte en este momento.</strong>
                    <br />
                    Tienes {vacantesAsignadas} {vacantesAsignadas === 1 ? 'vacante abierta asignada' : 'vacantes abiertas asignadas'} por esta empresa.
                  </AlertDescription>
                </Alert>
                <p className="text-sm">
                  Para desvincularte, primero debes solicitar a {empresaNombre} que reasigne tus vacantes abiertas a otro reclutador o las cierre.
                </p>
                <p className="text-sm font-medium">
                  Contacta al administrador de la empresa para coordinar la reasignación de vacantes.
                </p>
              </>
            ) : (
              <>
                <p>
                  Estás a punto de finalizar tu colaboración con esta empresa.
                </p>
                <p className="font-medium">
                  Las estadísticas que generaste durante esta colaboración se mantendrán en tu perfil y en el de la empresa, pero no se generarán nuevas estadísticas.
                </p>
                <p>
                  Para volver a colaborar con esta empresa, ellos deberán enviarte una nueva invitación.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {canDesvincular ? "Cancelar" : "Entendido"}
          </AlertDialogCancel>
          {canDesvincular && (
            <AlertDialogAction
              onClick={handleDesvincular}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desvincular
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
