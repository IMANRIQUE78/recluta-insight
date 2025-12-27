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
import { Loader2, ArrowLeftRight, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreditoHeredado {
  id: string;
  empresa_id: string;
  empresa_nombre: string;
  creditos_disponibles: number;
}

interface DevolverCreditosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reclutadorId: string;
  reclutadorUserId: string;
  onSuccess?: () => void;
}

export const DevolverCreditosDialog = ({
  open,
  onOpenChange,
  reclutadorId,
  reclutadorUserId,
  onSuccess,
}: DevolverCreditosDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingCreditos, setLoadingCreditos] = useState(true);
  const [creditosHeredados, setCreditosHeredados] = useState<CreditoHeredado[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(0);

  const selectedCredito = creditosHeredados.find(c => c.empresa_id === selectedEmpresaId);
  const maxDevolucion = selectedCredito?.creditos_disponibles || 0;

  useEffect(() => {
    if (open && reclutadorId) {
      loadCreditosHeredados();
    }
  }, [open, reclutadorId]);

  const loadCreditosHeredados = async () => {
    setLoadingCreditos(true);
    try {
      const { data: creditos, error } = await supabase
        .from("creditos_heredados_reclutador")
        .select("*")
        .eq("reclutador_id", reclutadorId)
        .gt("creditos_disponibles", 0);

      if (error) throw error;

      // Obtener nombres de empresas
      const empresaIds = creditos?.map(c => c.empresa_id) || [];
      let empresasMap: Record<string, string> = {};

      if (empresaIds.length > 0) {
        const { data: empresas } = await supabase
          .from("empresas")
          .select("id, nombre_empresa")
          .in("id", empresaIds);

        empresas?.forEach(e => {
          empresasMap[e.id] = e.nombre_empresa;
        });
      }

      const creditosConNombre = creditos?.map(c => ({
        ...c,
        empresa_nombre: empresasMap[c.empresa_id] || "Empresa desconocida"
      })) || [];

      setCreditosHeredados(creditosConNombre);
    } catch (error) {
      console.error("Error loading créditos heredados:", error);
      toast.error("Error al cargar créditos");
    } finally {
      setLoadingCreditos(false);
    }
  };

  const handleDevolver = async () => {
    if (!selectedEmpresaId || !selectedCredito || cantidad <= 0 || cantidad > maxDevolucion) {
      toast.error("Verifica los datos ingresados");
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener wallet de la empresa
      const { data: walletEmpresa } = await supabase
        .from("wallet_empresa")
        .select("*")
        .eq("empresa_id", selectedEmpresaId)
        .single();

      if (!walletEmpresa) throw new Error("No se encontró la wallet de la empresa");

      // 2. Registrar movimiento en auditoría (devolución para empresa)
      await supabase.rpc("registrar_movimiento_creditos", {
        p_origen_pago: "empresa",
        p_wallet_empresa_id: walletEmpresa.id,
        p_wallet_reclutador_id: null,
        p_empresa_id: selectedEmpresaId,
        p_reclutador_user_id: reclutadorUserId,
        p_tipo_accion: "devolucion_creditos",
        p_creditos_cantidad: cantidad, // Positivo porque entra a la empresa
        p_descripcion: `Devolución de ${cantidad} créditos por reclutador`,
        p_metodo: "manual"
      });

      // 3. Actualizar wallet de empresa (sumar créditos devueltos)
      await supabase
        .from("wallet_empresa")
        .update({
          creditos_disponibles: walletEmpresa.creditos_disponibles + cantidad
        })
        .eq("id", walletEmpresa.id);

      // 4. Actualizar créditos heredados del reclutador
      await supabase
        .from("creditos_heredados_reclutador")
        .update({
          creditos_disponibles: selectedCredito.creditos_disponibles - cantidad
        })
        .eq("id", selectedCredito.id);

      // 5. Actualizar wallet_reclutador
      const { data: walletReclutador } = await supabase
        .from("wallet_reclutador")
        .select("*")
        .eq("reclutador_id", reclutadorId)
        .single();

      if (walletReclutador) {
        await supabase
          .from("wallet_reclutador")
          .update({
            creditos_heredados: Math.max(0, walletReclutador.creditos_heredados - cantidad)
          })
          .eq("id", walletReclutador.id);
      }

      toast.success(`Se devolvieron ${cantidad} créditos a ${selectedCredito.empresa_nombre}`);
      onOpenChange(false);
      onSuccess?.();

      // Reset
      setSelectedEmpresaId("");
      setCantidad(0);
    } catch (error) {
      console.error("Error devolviendo créditos:", error);
      toast.error("Error al devolver créditos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Devolver Créditos a Empresa
          </DialogTitle>
          <DialogDescription>
            Devuelve créditos no utilizados a la empresa que te los asignó.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingCreditos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : creditosHeredados.length === 0 ? (
            <Alert>
              <AlertDescription>
                No tienes créditos heredados disponibles para devolver.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select 
                  value={selectedEmpresaId} 
                  onValueChange={(val) => {
                    setSelectedEmpresaId(val);
                    setCantidad(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditosHeredados.map((c) => (
                      <SelectItem key={c.empresa_id} value={c.empresa_id}>
                        <div className="flex items-center justify-between gap-4 w-full">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {c.empresa_nombre}
                          </div>
                          <span className="text-muted-foreground text-sm">
                            ({c.creditos_disponibles} disponibles)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCredito && (
                <Alert>
                  <AlertDescription>
                    <strong>Créditos disponibles de {selectedCredito.empresa_nombre}:</strong> {selectedCredito.creditos_disponibles}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Cantidad a devolver</Label>
                <Input
                  type="number"
                  min={1}
                  max={maxDevolucion}
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
                  disabled={!selectedEmpresaId}
                />
                {cantidad > maxDevolucion && (
                  <p className="text-sm text-destructive">
                    No puedes devolver más créditos de los disponibles.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDevolver}
            disabled={loading || !selectedEmpresaId || cantidad <= 0 || cantidad > maxDevolucion}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Devolver Créditos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
