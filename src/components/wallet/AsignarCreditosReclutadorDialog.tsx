import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Gift, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReclutadorVinculado {
  id: string;
  reclutador_id: string;
  nombre_reclutador: string;
  user_id: string;
}

interface AsignarCreditosReclutadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  walletEmpresaId: string;
  creditosDisponibles: number;
  onSuccess?: () => void;
}

export const AsignarCreditosReclutadorDialog = ({
  open,
  onOpenChange,
  empresaId,
  walletEmpresaId,
  creditosDisponibles,
  onSuccess,
}: AsignarCreditosReclutadorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingReclutadores, setLoadingReclutadores] = useState(true);
  const [reclutadores, setReclutadores] = useState<ReclutadorVinculado[]>([]);
  const [selectedReclutadorId, setSelectedReclutadorId] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(10);

  useEffect(() => {
    if (open && empresaId) {
      loadReclutadores();
    }
  }, [open, empresaId]);

  const loadReclutadores = async () => {
    setLoadingReclutadores(true);
    try {
      // Obtener reclutadores vinculados activos a esta empresa
      const { data: asociaciones, error } = await supabase
        .from("reclutador_empresa")
        .select(`
          id,
          reclutador_id,
          perfil_reclutador!inner(id, nombre_reclutador, user_id)
        `)
        .eq("empresa_id", empresaId)
        .eq("estado", "activa");

      if (error) throw error;

      const recs = asociaciones?.map((a: any) => ({
        id: a.id,
        reclutador_id: a.reclutador_id,
        nombre_reclutador: a.perfil_reclutador.nombre_reclutador,
        user_id: a.perfil_reclutador.user_id,
      })) || [];

      setReclutadores(recs);
    } catch (error) {
      console.error("Error loading reclutadores:", error);
      toast.error("Error al cargar reclutadores");
    } finally {
      setLoadingReclutadores(false);
    }
  };

  const handleAsignar = async () => {
    if (!selectedReclutadorId || cantidad <= 0 || cantidad > creditosDisponibles) {
      toast.error("Verifica los datos ingresados");
      return;
    }

    const reclutador = reclutadores.find(r => r.reclutador_id === selectedReclutadorId);
    if (!reclutador) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1. Descontar de wallet empresa
      const { error: walletError } = await supabase
        .from("wallet_empresa")
        .update({
          creditos_disponibles: creditosDisponibles - cantidad,
          creditos_heredados_totales: supabase.rpc ? undefined : 0 // Se actualizará por separado
        })
        .eq("id", walletEmpresaId);

      if (walletError) throw walletError;

      // 2. Actualizar creditos_heredados_totales
      await supabase.rpc("registrar_movimiento_creditos", {
        p_origen_pago: "empresa",
        p_wallet_empresa_id: walletEmpresaId,
        p_wallet_reclutador_id: null,
        p_empresa_id: empresaId,
        p_reclutador_user_id: reclutador.user_id,
        p_tipo_accion: "herencia_creditos",
        p_creditos_cantidad: -cantidad, // Negativo porque sale de la empresa
        p_descripcion: `Asignación de ${cantidad} créditos a ${reclutador.nombre_reclutador}`,
        p_metodo: "manual"
      });

      // 3. Insertar o actualizar en creditos_heredados_reclutador
      const { data: existingCredito } = await supabase
        .from("creditos_heredados_reclutador")
        .select("*")
        .eq("reclutador_id", selectedReclutadorId)
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (existingCredito) {
        await supabase
          .from("creditos_heredados_reclutador")
          .update({
            creditos_disponibles: existingCredito.creditos_disponibles + cantidad,
            creditos_totales_recibidos: existingCredito.creditos_totales_recibidos + cantidad,
          })
          .eq("id", existingCredito.id);
      } else {
        await supabase
          .from("creditos_heredados_reclutador")
          .insert({
            reclutador_id: selectedReclutadorId,
            empresa_id: empresaId,
            creditos_disponibles: cantidad,
            creditos_totales_recibidos: cantidad,
          });
      }

      // 4. Actualizar wallet_reclutador (total heredados)
      const { data: walletReclutador } = await supabase
        .from("wallet_reclutador")
        .select("*")
        .eq("reclutador_id", selectedReclutadorId)
        .maybeSingle();

      if (walletReclutador) {
        await supabase
          .from("wallet_reclutador")
          .update({
            creditos_heredados: walletReclutador.creditos_heredados + cantidad
          })
          .eq("id", walletReclutador.id);
      }

      toast.success(`Se asignaron ${cantidad} créditos a ${reclutador.nombre_reclutador}`);
      onOpenChange(false);
      onSuccess?.();
      
      // Reset
      setSelectedReclutadorId("");
      setCantidad(10);
    } catch (error) {
      console.error("Error asignando créditos:", error);
      toast.error("Error al asignar créditos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Asignar Créditos a Reclutador
          </DialogTitle>
          <DialogDescription>
            Transfiere créditos a un reclutador vinculado. Estos créditos solo podrán usarse en vacantes de tu empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription>
              <strong>Créditos disponibles:</strong> {creditosDisponibles}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Reclutador</Label>
            {loadingReclutadores ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : reclutadores.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No tienes reclutadores vinculados activos.
              </p>
            ) : (
              <Select value={selectedReclutadorId} onValueChange={setSelectedReclutadorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un reclutador" />
                </SelectTrigger>
                <SelectContent>
                  {reclutadores.map((r) => (
                    <SelectItem key={r.reclutador_id} value={r.reclutador_id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {r.nombre_reclutador}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cantidad de créditos</Label>
            <Input
              type="number"
              min={1}
              max={creditosDisponibles}
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
            />
            {cantidad > creditosDisponibles && (
              <p className="text-sm text-destructive">
                No puedes asignar más créditos de los disponibles.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleAsignar}
            disabled={loading || !selectedReclutadorId || cantidad <= 0 || cantidad > creditosDisponibles || reclutadores.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asignar Créditos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
