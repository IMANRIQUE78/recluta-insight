import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";

interface InvitarReclutadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const InvitarReclutadorDialog = ({ open, onOpenChange, onSuccess }: InvitarReclutadorDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [codigoReclutador, setCodigoReclutador] = useState("");
  const [tipoVinculacion, setTipoVinculacion] = useState<"interno" | "freelance">("freelance");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Obtener empresa del usuario (buscar en empresas donde el usuario es el creador)
      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .select("id")
        .eq("created_by", user.id)
        .maybeSingle();

      if (empresaError) {
        console.error("Error buscando empresa:", empresaError);
        throw new Error("Error al buscar la empresa");
      }

      if (!empresa) {
        throw new Error("No se encontró la empresa asociada. Por favor completa tu perfil de empresa primero.");
      }

      // Buscar reclutador por código (convertir a minúsculas para búsqueda case-insensitive)
      const { data: reclutador, error: reclutadorError } = await supabase
        .from("perfil_reclutador")
        .select("id, nombre_reclutador, email")
        .ilike("codigo_reclutador", codigoReclutador.trim())
        .maybeSingle();

      if (reclutadorError) {
        console.error("Error buscando reclutador:", reclutadorError);
        throw new Error("Error al buscar el reclutador");
      }

      if (!reclutador) {
        throw new Error(`No se encontró un reclutador con el código "${codigoReclutador.trim().toUpperCase()}". Verifica que el código sea correcto.`);
      }

      console.log("Reclutador encontrado:", reclutador);

      // Crear invitación
      const { error: invitacionError } = await supabase
        .from("invitaciones_reclutador")
        .insert([{
          empresa_id: empresa.id,
          reclutador_id: reclutador.id,
          codigo_reclutador: codigoReclutador.trim(),
          tipo_vinculacion: tipoVinculacion as "interno" | "freelance",
          mensaje: mensaje || null,
          estado: "pendiente",
        }]);

      if (invitacionError) throw invitacionError;

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
      toast({
        title: "Error al enviar invitación",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invitar Reclutador
          </DialogTitle>
          <DialogDescription>
            Invita a un reclutador para que colabore en tus procesos de reclutamiento
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código del Reclutador *</Label>
            <Input
              id="codigo"
              placeholder="ej. ABC12345 (8 caracteres)"
              value={codigoReclutador}
              onChange={(e) => setCodigoReclutador(e.target.value.toUpperCase())}
              required
              disabled={loading}
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Solicita al reclutador su código único de 8 caracteres. No distingue entre mayúsculas y minúsculas.
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
      </DialogContent>
    </Dialog>
  );
};
