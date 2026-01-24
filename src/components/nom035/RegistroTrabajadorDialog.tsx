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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Clock, AlertCircle, Gift, Coins, UserCheck, Building2, Briefcase, MapPin } from "lucide-react";
import { differenceInMonths, differenceInYears, parseISO } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface RegistroTrabajadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  onSuccess: () => void;
}

interface PersonalEmpresa {
  id: string;
  nombre_completo: string;
  email_personal: string | null;
  email_corporativo: string | null;
  telefono_movil: string | null;
  puesto: string | null;
  area: string | null;
  centro_trabajo: string | null;
  fecha_ingreso: string | null;
  tipo_jornada: string | null;
  modalidad_contratacion: string | null;
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
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [workerCount, setWorkerCount] = useState(0);
  const [walletCredits, setWalletCredits] = useState(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [personalList, setPersonalList] = useState<PersonalEmpresa[]>([]);
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>("");
  const [registeredPersonalIds, setRegisteredPersonalIds] = useState<Set<string>>(new Set());

  // Cargar lista de personal y datos de wallet
  useEffect(() => {
    const loadData = async () => {
      if (!empresaId || !open) return;
      
      setLoadingPersonal(true);

      try {
        // Cargar personal activo de la empresa
        const { data: personal, error: personalError } = await supabase
          .from("personal_empresa")
          .select("id, nombre_completo, email_personal, email_corporativo, telefono_movil, puesto, area, centro_trabajo, fecha_ingreso, tipo_jornada, modalidad_contratacion")
          .eq("empresa_id", empresaId)
          .eq("estatus", "activo")
          .order("nombre_completo", { ascending: true });

        if (personalError) throw personalError;
        setPersonalList(personal || []);

        // Cargar IDs de personal ya registrados en NOM-035
        const { data: registered } = await supabase
          .from("trabajadores_nom035")
          .select("personal_id")
          .eq("empresa_id", empresaId)
          .eq("activo", true)
          .not("personal_id", "is", null);

        setRegisteredPersonalIds(new Set(registered?.map(r => r.personal_id).filter(Boolean) as string[]));

        // Contar trabajadores actuales NOM-035
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
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoadingPersonal(false);
      }
    };

    loadData();
  }, [empresaId, open]);

  const requiresCredits = workerCount >= FREE_WORKER_LIMIT;
  const hasEnoughCredits = walletCredits >= CREDIT_COST_PER_WORKER;
  const freeWorkersRemaining = Math.max(0, FREE_WORKER_LIMIT - workerCount);

  // Obtener el personal seleccionado
  const selectedPersonal = useMemo(() => {
    return personalList.find(p => p.id === selectedPersonalId);
  }, [personalList, selectedPersonalId]);

  // Filtrar personal que no está registrado
  const availablePersonal = useMemo(() => {
    return personalList.filter(p => !registeredPersonalIds.has(p.id));
  }, [personalList, registeredPersonalIds]);

  // Calcular antigüedad automáticamente
  const antiguedadCalculada = useMemo(() => {
    if (!selectedPersonal?.fecha_ingreso) return null;
    
    try {
      const fechaIngreso = parseISO(selectedPersonal.fecha_ingreso);
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
  }, [selectedPersonal]);

  const formatJornada = (tipo: string | null) => {
    if (!tipo) return "No especificada";
    const tipos: Record<string, string> = {
      completa: "Jornada Completa",
      parcial: "Jornada Parcial",
      nocturna: "Jornada Nocturna",
      mixta: "Jornada Mixta"
    };
    return tipos[tipo] || tipo;
  };

  const formatContratacion = (modalidad: string | null) => {
    if (!modalidad) return "No especificada";
    const modalidades: Record<string, string> = {
      indefinido: "Contrato Indefinido",
      temporal: "Contrato Temporal",
      obra_determinada: "Obra Determinada",
      capacitacion: "Capacitación Inicial"
    };
    return modalidades[modalidad] || modalidad;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPersonal) {
      toast.error("Selecciona un trabajador");
      return;
    }

    // Validar campos requeridos
    if (!selectedPersonal.puesto) {
      toast.error("El trabajador no tiene puesto asignado en la base de personal");
      return;
    }
    if (!selectedPersonal.area) {
      toast.error("El trabajador no tiene área asignada en la base de personal");
      return;
    }
    if (!selectedPersonal.centro_trabajo) {
      toast.error("El trabajador no tiene centro de trabajo asignado. Edítalo en la base de personal.");
      return;
    }
    if (!selectedPersonal.fecha_ingreso) {
      toast.error("El trabajador no tiene fecha de ingreso en la base de personal");
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
            descripcion: `Registro de trabajador NOM-035: ${selectedPersonal.nombre_completo}`,
            metadata: {
              modulo: "nom035",
              accion: "registro_trabajador",
              trabajador_nombre: selectedPersonal.nombre_completo,
              personal_id: selectedPersonal.id
            }
          });

        if (movimientoError) {
          console.error("Error registrando movimiento:", movimientoError);
          await supabase
            .from("wallet_empresa")
            .update({ creditos_disponibles: walletCredits })
            .eq("id", walletId);
          throw movimientoError;
        }
      }

      // Registrar trabajador en NOM-035 referenciando personal_empresa
      const email = selectedPersonal.email_corporativo || selectedPersonal.email_personal || "";
      const telefono = selectedPersonal.telefono_movil?.replace(/\D/g, '') || "";

      const { error } = await supabase
        .from("trabajadores_nom035")
        .insert({
          empresa_id: empresaId,
          personal_id: selectedPersonal.id,
          codigo_trabajador: "",
          nombre_completo: selectedPersonal.nombre_completo,
          email: email.toLowerCase(),
          telefono: telefono,
          puesto: selectedPersonal.puesto,
          area: selectedPersonal.area,
          centro_trabajo: selectedPersonal.centro_trabajo,
          fecha_ingreso: selectedPersonal.fecha_ingreso,
          antiguedad_meses: antiguedadCalculada?.totalMeses || 0,
          tipo_jornada: selectedPersonal.tipo_jornada || "completa",
          modalidad_contratacion: selectedPersonal.modalidad_contratacion || "indefinido",
        });

      if (error) throw error;

      const successMessage = requiresCredits 
        ? `${selectedPersonal.nombre_completo} registrado. Se descontaron ${CREDIT_COST_PER_WORKER} créditos.`
        : `${selectedPersonal.nombre_completo} registrado exitosamente`;
      
      toast.success(successMessage);
      setSelectedPersonalId("");
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
          <DialogTitle>Registrar Trabajador para NOM-035</DialogTitle>
          <DialogDescription>
            Selecciona un trabajador de la base de personal para habilitarlo en las evaluaciones NOM-035.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Aviso de créditos */}
          {freeWorkersRemaining > 0 ? (
            <Alert className="bg-green-50 border-green-200">
              <Gift className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong>¡Registros gratuitos!</strong> Te quedan {freeWorkersRemaining} registro{freeWorkersRemaining !== 1 ? 's' : ''} sin costo.
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
                    <strong>Créditos insuficientes.</strong> Necesitas {CREDIT_COST_PER_WORKER} créditos.
                    <a href="/wallet-empresa" className="underline font-medium ml-1">Comprar créditos</a>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Selector de trabajador */}
          <div className="space-y-2">
            <Label>Seleccionar Trabajador *</Label>
            {loadingPersonal ? (
              <div className="flex items-center gap-2 py-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando personal...
              </div>
            ) : availablePersonal.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay trabajadores disponibles. {personalList.length > 0 
                    ? "Todos ya están registrados en NOM-035." 
                    : "Primero registra trabajadores en la base de personal."}
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un trabajador" />
                </SelectTrigger>
                <SelectContent>
                  {availablePersonal.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-primary" />
                        <span>{persona.nombre_completo}</span>
                        {persona.puesto && (
                          <span className="text-muted-foreground text-xs">— {persona.puesto}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Vista previa de datos */}
          {selectedPersonal && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Datos del trabajador seleccionado
              </h4>
              
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Puesto:</span>
                  <span className="font-medium">{selectedPersonal.puesto || <Badge variant="destructive">Sin asignar</Badge>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Área:</span>
                  <span className="font-medium">{selectedPersonal.area || <Badge variant="destructive">Sin asignar</Badge>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Centro de trabajo:</span>
                  <span className="font-medium">{selectedPersonal.centro_trabajo || <Badge variant="destructive">Sin asignar</Badge>}</span>
                </div>
                {antiguedadCalculada && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Antigüedad:</span>
                    <span className="font-medium">{antiguedadCalculada.texto}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Jornada:</span>
                  <Badge variant="outline">{formatJornada(selectedPersonal.tipo_jornada)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Contratación:</span>
                  <Badge variant="outline">{formatContratacion(selectedPersonal.modalidad_contratacion)}</Badge>
                </div>
              </div>

              {(!selectedPersonal.puesto || !selectedPersonal.area || !selectedPersonal.centro_trabajo || !selectedPersonal.fecha_ingreso) && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Faltan datos requeridos. Edita el trabajador en la base de personal antes de registrarlo.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={
                loading || 
                !selectedPersonal || 
                (requiresCredits && !hasEnoughCredits) ||
                !selectedPersonal?.puesto ||
                !selectedPersonal?.area ||
                !selectedPersonal?.centro_trabajo ||
                !selectedPersonal?.fecha_ingreso
              }
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {requiresCredits ? `Registrar (${CREDIT_COST_PER_WORKER} créditos)` : "Registrar Trabajador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
