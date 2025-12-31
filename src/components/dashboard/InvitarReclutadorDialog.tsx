import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Clock, XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

interface PendingInvitation {
  id: string;
  codigo_reclutador: string;
  tipo_vinculacion: string;
  created_at: string;
  mensaje?: string;
  reclutador?: {
    nombre_reclutador: string;
    email: string;
  };
}

interface InvitarReclutadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  viewInvitationId?: string; // ID de invitación pendiente a mostrar
}

export const InvitarReclutadorDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  viewInvitationId 
}: InvitarReclutadorDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [codigoReclutador, setCodigoReclutador] = useState("");
  const [tipoVinculacion, setTipoVinculacion] = useState<"interno" | "freelance">("freelance");
  const [mensaje, setMensaje] = useState("");
  
  // Estado para vista de invitación pendiente
  const [viewMode, setViewMode] = useState<"create" | "view">("create");
  const [pendingInvitation, setPendingInvitation] = useState<PendingInvitation | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<"cancel" | "resend" | null>(null);

  // Cargar invitación pendiente si se proporciona ID
  useEffect(() => {
    if (open && viewInvitationId) {
      loadPendingInvitation(viewInvitationId);
      setViewMode("view");
    } else if (open) {
      setViewMode("create");
      setPendingInvitation(null);
    }
  }, [open, viewInvitationId]);

  const loadPendingInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invitaciones_reclutador")
        .select(`
          id,
          codigo_reclutador,
          tipo_vinculacion,
          created_at,
          mensaje,
          perfil_reclutador:reclutador_id (
            nombre_reclutador,
            email
          )
        `)
        .eq("id", invitationId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPendingInvitation({
          id: data.id,
          codigo_reclutador: data.codigo_reclutador,
          tipo_vinculacion: data.tipo_vinculacion,
          created_at: data.created_at,
          mensaje: data.mensaje || undefined,
          reclutador: data.perfil_reclutador as any
        });
      }
    } catch (error) {
      console.error("Error loading invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!pendingInvitation) return;
    
    setActionLoading("cancel");
    try {
      const { error } = await supabase
        .from("invitaciones_reclutador")
        .update({ estado: "expirada" })
        .eq("id", pendingInvitation.id);

      if (error) throw error;

      toast({
        title: "Invitación cancelada",
        description: "La invitación ha sido cancelada exitosamente",
      });

      setShowCancelConfirm(false);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error al cancelar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async () => {
    if (!pendingInvitation) return;
    
    setActionLoading("resend");
    try {
      // Actualizar fecha de expiración (extender 7 días más)
      const newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + 7);

      const { error } = await supabase
        .from("invitaciones_reclutador")
        .update({ 
          fecha_expiracion: newExpiration.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", pendingInvitation.id);

      if (error) throw error;

      toast({
        title: "Invitación reenviada",
        description: "La invitación ha sido reenviada y extendida por 7 días más",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error al reenviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      console.log("=== INICIO INVITACIÓN RECLUTADOR ===");
      console.log("Usuario actual:", user.id);
      console.log("Código ingresado:", codigoReclutador);

      // Obtener empresa del usuario (buscar en empresas donde el usuario es el creador)
      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .select("id, nombre_empresa")
        .eq("created_by", user.id)
        .maybeSingle();

      console.log("Empresa encontrada:", empresa, empresaError);

      if (empresaError) {
        console.error("Error buscando empresa:", empresaError);
        throw new Error("Error al buscar la empresa");
      }

      if (!empresa) {
        throw new Error("No se encontró la empresa asociada. Por favor completa tu perfil de empresa primero.");
      }

      // Buscar reclutador por código (normalizar: trim, uppercase, sin espacios)
      const codigoNormalizado = codigoReclutador.trim().toUpperCase().replace(/\s+/g, '');
      
      console.log("Código normalizado para búsqueda:", codigoNormalizado);
      
      // Primero verificar que la búsqueda funcione sin RLS
      const { data: reclutador, error: reclutadorError } = await supabase
        .from("perfil_reclutador")
        .select("id, nombre_reclutador, email, codigo_reclutador")
        .eq("codigo_reclutador", codigoNormalizado)
        .maybeSingle();
      
      console.log("Reclutador encontrado:", reclutador);
      console.log("Error en búsqueda:", reclutadorError);

      if (reclutadorError) {
        console.error("Error buscando reclutador:", reclutadorError);
        throw new Error("Error al buscar el reclutador: " + reclutadorError.message);
      }

      if (!reclutador) {
        throw new Error(`No se encontró un reclutador con el código "${codigoNormalizado}". Verifica que el código sea correcto (formato: REC-XXXXXX).`);
      }

      console.log("Reclutador encontrado:", reclutador);

      // Crear invitación
      const { error: invitacionError } = await supabase
        .from("invitaciones_reclutador")
        .insert([{
          empresa_id: empresa.id,
          reclutador_id: reclutador.id,
          codigo_reclutador: codigoNormalizado,
          tipo_vinculacion: tipoVinculacion as "interno" | "freelance",
          mensaje: mensaje || null,
          estado: "pendiente",
        }]);

      if (invitacionError) {
        console.error("Error creando invitación:", invitacionError);
        throw invitacionError;
      }

      console.log("=== INVITACIÓN CREADA EXITOSAMENTE ===");

      toast({
        title: "✅ Invitación enviada",
        description: `Invitación enviada a ${reclutador.nombre_reclutador || reclutador.email}`,
      });

      onSuccess?.();
      onOpenChange(false);
      setCodigoReclutador("");
      setMensaje("");
      setTipoVinculacion("freelance");
    } catch (error: any) {
      console.error("=== ERROR EN INVITACIÓN ===", error);
      toast({
        title: "Error al enviar invitación",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToCreate = () => {
    setViewMode("create");
    setPendingInvitation(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewMode === "view" ? (
                <>
                  <Clock className="h-5 w-5 text-amber-500" />
                  Invitación Pendiente
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Invitar Reclutador
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {viewMode === "view" 
                ? "Gestiona esta invitación pendiente de respuesta"
                : "Invita a un reclutador para que colabore en tus procesos de reclutamiento"
              }
            </DialogDescription>
          </DialogHeader>
          
          {viewMode === "view" && pendingInvitation ? (
            <div className="space-y-4 mt-4">
              {/* Info de la invitación pendiente */}
              <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendiente
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Código</span>
                  <span className="font-mono font-medium">{pendingInvitation.codigo_reclutador}</span>
                </div>

                {pendingInvitation.reclutador && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reclutador</span>
                    <span className="font-medium">{pendingInvitation.reclutador.nombre_reclutador}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <Badge variant="secondary">
                    {pendingInvitation.tipo_vinculacion === "interno" ? "Interno" : "Freelance"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Enviada</span>
                  <span className="text-sm">
                    {format(new Date(pendingInvitation.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>

                {pendingInvitation.mensaje && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground block mb-1">Mensaje:</span>
                    <p className="text-sm italic">"{pendingInvitation.mensaje}"</p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button
                  onClick={handleResendInvitation}
                  disabled={actionLoading !== null}
                  className="w-full"
                >
                  {actionLoading === "resend" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reenviar Invitación
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={actionLoading !== null}
                  className="w-full"
                >
                  {actionLoading === "cancel" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar Invitación
                </Button>

                <Button
                  variant="ghost"
                  onClick={resetToCreate}
                  disabled={actionLoading !== null}
                  className="w-full mt-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Nueva Invitación
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código del Reclutador *</Label>
                <Input
                  id="codigo"
                  placeholder="REC-ABC123"
                  value={codigoReclutador}
                  onChange={(e) => setCodigoReclutador(e.target.value.trim().toUpperCase().replace(/\s+/g, ''))}
                  required
                  disabled={loading}
                  maxLength={10}
                  className="font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el código único del reclutador (formato: REC-XXXXXX)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Vinculación *</Label>
                <Select value={tipoVinculacion} onValueChange={(v: any) => setTipoVinculacion(v)}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interno">Interno (empleado de la empresa)</SelectItem>
                    <SelectItem value="freelance">Freelance (externo o agencia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje (opcional)</Label>
                <Textarea
                  id="mensaje"
                  placeholder="ej. Nos gustaría que colabores en nuestros procesos de reclutamiento..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  disabled={loading}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Invitación
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmación de cancelación */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta invitación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la invitación como cancelada. El reclutador ya no podrá aceptarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>No, mantener</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelInvitation}
              disabled={actionLoading !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === "cancel" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, cancelar invitación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
