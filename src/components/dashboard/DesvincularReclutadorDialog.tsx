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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [checking, setChecking] = useState(true);
  const [vacantesAsignadas, setVacantesAsignadas] = useState<number>(0);
  const [creditosPendientes, setCreditosPendientes] = useState<number>(0);
  const [canDesvincular, setCanDesvincular] = useState(false);
  const [blockReason, setBlockReason] = useState<"vacantes" | "creditos" | "ambos" | null>(null);

  useEffect(() => {
    if (open && asociacionId) {
      setChecking(true);
      setVacantesAsignadas(0);
      setCreditosPendientes(0);
      setCanDesvincular(false);
      setBlockReason(null);
      checkDesvinculacion();
    }
  }, [open, asociacionId]);

  const checkDesvinculacion = async () => {
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

      // 1. Contar vacantes asignadas (solo abiertas) para esta empresa
      const { data: vacantes } = await supabase
        .from("vacantes")
        .select("id")
        .eq("reclutador_asignado_id", asociacion.reclutador_id)
        .eq("empresa_id", asociacion.empresa_id)
        .eq("estatus", "abierta");

      const totalVacantes = vacantes?.length || 0;
      setVacantesAsignadas(totalVacantes);

      // 2. Verificar créditos heredados pendientes de esta empresa
      const { data: creditosHeredados } = await supabase
        .from("creditos_heredados_reclutador")
        .select("creditos_disponibles")
        .eq("reclutador_id", asociacion.reclutador_id)
        .eq("empresa_id", asociacion.empresa_id)
        .maybeSingle();

      const creditosPend = creditosHeredados?.creditos_disponibles || 0;
      setCreditosPendientes(creditosPend);

      // Determinar si puede desvincularse
      const puedeDesvincular = totalVacantes === 0 && creditosPend === 0;
      setCanDesvincular(puedeDesvincular);

      // Determinar razón de bloqueo
      if (!puedeDesvincular) {
        if (totalVacantes > 0 && creditosPend > 0) {
          setBlockReason("ambos");
        } else if (totalVacantes > 0) {
          setBlockReason("vacantes");
        } else {
          setBlockReason("creditos");
        }
      }
    } catch (error) {
      console.error("Error verificando desvinculación:", error);
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
          <AlertDialogTitle>¿Desvincular a {reclutadorNombre}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {!canDesvincular ? (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>No puedes desvincular a este reclutador en este momento.</strong>
                    <br />
                    {blockReason === "ambos" && (
                      <>
                        {reclutadorNombre} tiene {vacantesAsignadas} {vacantesAsignadas === 1 ? 'vacante abierta asignada' : 'vacantes abiertas asignadas'} y {creditosPendientes} créditos asignados sin usar.
                      </>
                    )}
                    {blockReason === "vacantes" && (
                      <>
                        {reclutadorNombre} tiene {vacantesAsignadas} {vacantesAsignadas === 1 ? 'vacante abierta asignada' : 'vacantes abiertas asignadas'}.
                      </>
                    )}
                    {blockReason === "creditos" && (
                      <>
                        {reclutadorNombre} tiene {creditosPendientes} créditos asignados sin usar que deben ser devueltos.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
                <p className="text-sm">
                  {blockReason === "vacantes" || blockReason === "ambos" ? (
                    <>Para desvincular a este reclutador, primero debes reasignar sus vacantes abiertas a otro reclutador o cerrarlas.</>
                  ) : null}
                  {blockReason === "creditos" || blockReason === "ambos" ? (
                    <> El reclutador debe devolver los créditos no utilizados desde su Wallet antes de poder desvincularse.</>
                  ) : null}
                </p>
                <p className="text-sm font-medium">
                  {blockReason === "creditos" ? (
                    <>Solicita al reclutador que devuelva los créditos desde su Wallet.</>
                  ) : (
                    <>Ve al panel de gestión de vacantes para cambiar la asignación o cerrar las vacantes pendientes.</>
                  )}
                </p>
              </>
            ) : (
              <>
                <p>
                  Estás a punto de finalizar la colaboración con este reclutador.
                </p>
                <p className="font-medium">
                  Las estadísticas generadas durante esta colaboración se mantendrán en ambos perfiles, pero no se generarán nuevas estadísticas.
                </p>
                <p>
                  Para volver a colaborar con este reclutador, deberás enviarle una nueva invitación.
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
