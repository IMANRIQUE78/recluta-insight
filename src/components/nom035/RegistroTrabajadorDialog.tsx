import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Clock, AlertCircle, Gift, Coins } from "lucide-react";
import { differenceInMonths, differenceInYears, format, parseISO } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RegistroTrabajadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  onSuccess: () => void;
}

const FREE_WORKER_LIMIT = 5;
const CREDIT_COST_PER_WORKER = 2;

export const RegistroTrabajadorDialog = ({
  open,
  onOpenChange,
  empresaId,
  onSuccess,
}: RegistroTrabajadorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [workerCount, setWorkerCount] = useState(0);
  const [walletCredits, setWalletCredits] = useState(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    puesto: "",
    area: "",
    centro_trabajo: "",
    fecha_ingreso: "",
    tipo_jornada: "completa",
    modalidad_contratacion: "indefinido",
  });

  // Cargar conteo de trabajadores y créditos de wallet
  useEffect(() => {
    const loadData = async () => {
      if (!empresaId || !open) return;

      // Contar trabajadores actuales
      const { count } = await supabase
        .from("trabajadores_nom035")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("activo", true);

      setWorkerCount(count || 0);

      // Obtener wallet de empresa
      const { data: wallet } = await supabase
        .from("wallet_empresa")
        .select("id, creditos_disponibles")
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (wallet) {
        setWalletId(wallet.id);
        setWalletCredits(wallet.creditos_disponibles);
      }
    };

    loadData();
  }, [empresaId, open]);

  const requiresCredits = workerCount >= FREE_WORKER_LIMIT;
  const hasEnoughCredits = walletCredits >= CREDIT_COST_PER_WORKER;
  const freeWorkersRemaining = Math.max(0, FREE_WORKER_LIMIT - workerCount);

  // Calcular antigüedad automáticamente
  const antiguedadCalculada = useMemo(() => {
    if (!formData.fecha_ingreso) return null;
    
    try {
      const fechaIngreso = parseISO(formData.fecha_ingreso);
      const hoy = new Date();
      
      if (fechaIngreso > hoy) return null;
      
      const anos = differenceInYears(hoy, fechaIngreso);
      const mesesTotales = differenceInMonths(hoy, fechaIngreso);
      const mesesRestantes = mesesTotales % 12;
      
      return {
        anos,
        meses: mesesRestantes,
        totalMeses: mesesTotales,
        texto: anos > 0 
          ? `${anos} año${anos !== 1 ? 's' : ''} y ${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`
          : `${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`
      };
    } catch {
      return null;
    }
  }, [formData.fecha_ingreso]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre_completo.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("El correo electrónico es requerido");
      return;
    }
    if (!formData.telefono.trim()) {
      toast.error("El teléfono es requerido");
      return;
    }
    if (!formData.puesto.trim()) {
      toast.error("El puesto es requerido");
      return;
    }
    if (!formData.area.trim()) {
      toast.error("El área es requerida");
      return;
    }
    if (!formData.centro_trabajo.trim()) {
      toast.error("El centro de trabajo es requerido");
      return;
    }
    if (!formData.fecha_ingreso) {
      toast.error("La fecha de ingreso es requerida");
      return;
    }

    // Validación de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("El formato del correo electrónico no es válido");
      return;
    }

    // Validación de teléfono (10 dígitos)
    const telefonoLimpio = formData.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length < 10) {
      toast.error("El teléfono debe tener al menos 10 dígitos");
      return;
    }

    // Verificar créditos si es necesario
    if (requiresCredits && !hasEnoughCredits) {
      toast.error("No tienes suficientes créditos para registrar más trabajadores");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Si requiere créditos, descontar de la wallet
      if (requiresCredits && walletId) {
        // Actualizar wallet
        const { error: walletError } = await supabase
          .from("wallet_empresa")
          .update({ 
            creditos_disponibles: walletCredits - CREDIT_COST_PER_WORKER,
            updated_at: new Date().toISOString()
          })
          .eq("id", walletId);

        if (walletError) throw walletError;

        // Registrar movimiento en auditoría
        const { error: movimientoError } = await supabase
          .from("movimientos_creditos")
          .insert({
            origen_pago: "empresa",
            wallet_empresa_id: walletId,
            empresa_id: empresaId,
            reclutador_user_id: user.id,
            tipo_accion: "ajuste_manual",
            metodo: "sistema",
            creditos_cantidad: -CREDIT_COST_PER_WORKER,
            creditos_antes: walletCredits,
            creditos_despues: walletCredits - CREDIT_COST_PER_WORKER,
            descripcion: `Registro de trabajador NOM-035: ${formData.nombre_completo.trim()}`,
            metadata: {
              modulo: "nom035",
              accion: "registro_trabajador",
              trabajador_nombre: formData.nombre_completo.trim(),
              trabajador_email: formData.email.trim().toLowerCase()
            }
          });

        if (movimientoError) {
          console.error("Error registrando movimiento:", movimientoError);
          // Revertir cambio en wallet
          await supabase
            .from("wallet_empresa")
            .update({ creditos_disponibles: walletCredits })
            .eq("id", walletId);
          throw movimientoError;
        }
      }

      // Registrar trabajador
      const { error } = await supabase
        .from("trabajadores_nom035")
        .insert({
          empresa_id: empresaId,
          codigo_trabajador: "",
          nombre_completo: formData.nombre_completo.trim(),
          email: formData.email.trim().toLowerCase(),
          telefono: telefonoLimpio,
          puesto: formData.puesto.trim(),
          area: formData.area.trim(),
          centro_trabajo: formData.centro_trabajo.trim(),
          fecha_ingreso: formData.fecha_ingreso,
          antiguedad_meses: antiguedadCalculada?.totalMeses || 0,
          tipo_jornada: formData.tipo_jornada,
          modalidad_contratacion: formData.modalidad_contratacion,
        });

      if (error) throw error;

      const successMessage = requiresCredits 
        ? `Trabajador registrado exitosamente. Se descontaron ${CREDIT_COST_PER_WORKER} créditos.`
        : "Trabajador registrado exitosamente";
      
      toast.success(successMessage);
      setFormData({
        nombre_completo: "",
        email: "",
        telefono: "",
        puesto: "",
        area: "",
        centro_trabajo: "",
        fecha_ingreso: "",
        tipo_jornada: "completa",
        modalidad_contratacion: "indefinido",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error registering trabajador:", error);
      toast.error(error.message || "Error al registrar trabajador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Trabajador</DialogTitle>
          <DialogDescription>
            Ingresa los datos del trabajador para su registro en el sistema NOM-035. 
            El trabajador deberá aceptar el aviso de privacidad antes de iniciar cualquier evaluación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Aviso de créditos */}
          {freeWorkersRemaining > 0 ? (
            <Alert className="bg-green-50 border-green-200">
              <Gift className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong>¡Registros gratuitos!</strong> Te quedan {freeWorkersRemaining} registro{freeWorkersRemaining !== 1 ? 's' : ''} sin costo.
                Después del 5° trabajador, cada registro costará {CREDIT_COST_PER_WORKER} créditos.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className={hasEnoughCredits ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}>
              {hasEnoughCredits ? (
                <Coins className="h-4 w-4 text-amber-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={hasEnoughCredits ? "text-amber-700" : "text-red-700"}>
                {hasEnoughCredits ? (
                  <>
                    <strong>Costo: {CREDIT_COST_PER_WORKER} créditos</strong> — Tienes {walletCredits} créditos disponibles.
                  </>
                ) : (
                  <>
                    <strong>Créditos insuficientes.</strong> Necesitas {CREDIT_COST_PER_WORKER} créditos para registrar más trabajadores.
                    Tienes {walletCredits} créditos. <a href="/wallet-empresa" className="underline font-medium">Comprar créditos</a>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Juan Pérez García"
              value={formData.nombre_completo}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                placeholder="trabajador@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">WhatsApp / Teléfono *</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="55 1234 5678"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="puesto">Puesto *</Label>
              <Input
                id="puesto"
                placeholder="Ej: Analista de Sistemas"
                value={formData.puesto}
                onChange={(e) => setFormData(prev => ({ ...prev, puesto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Área *</Label>
              <Input
                id="area"
                placeholder="Ej: Tecnología"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="centro_trabajo">Centro de Trabajo *</Label>
            <Input
              id="centro_trabajo"
              placeholder="Ej: Oficinas Corporativas CDMX"
              value={formData.centro_trabajo}
              onChange={(e) => setFormData(prev => ({ ...prev, centro_trabajo: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  id="fecha_ingreso"
                  type="date"
                  max={format(new Date(), 'yyyy-MM-dd')}
                  value={formData.fecha_ingreso}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                />
              </div>
              {antiguedadCalculada && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{antiguedadCalculada.texto}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jornada">Tipo de Jornada</Label>
              <Select
                value={formData.tipo_jornada}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_jornada: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completa">Jornada Completa</SelectItem>
                  <SelectItem value="parcial">Jornada Parcial</SelectItem>
                  <SelectItem value="nocturna">Jornada Nocturna</SelectItem>
                  <SelectItem value="mixta">Jornada Mixta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contratacion">Modalidad de Contratación</Label>
              <Select
                value={formData.modalidad_contratacion}
                onValueChange={(value) => setFormData(prev => ({ ...prev, modalidad_contratacion: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinido">Contrato Indefinido</SelectItem>
                  <SelectItem value="temporal">Contrato Temporal</SelectItem>
                  <SelectItem value="obra_determinada">Obra Determinada</SelectItem>
                  <SelectItem value="capacitacion">Capacitación Inicial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || (requiresCredits && !hasEnoughCredits)}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {requiresCredits ? `Registrar (${CREDIT_COST_PER_WORKER} créditos)` : "Registrar Trabajador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
