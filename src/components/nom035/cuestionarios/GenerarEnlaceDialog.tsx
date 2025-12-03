import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Link2, Copy, Mail, MessageCircle, Check, AlertTriangle, Brain } from "lucide-react";

interface Trabajador {
  id: string;
  codigo_trabajador: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
}

interface GenerarEnlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trabajador: Trabajador | null;
  empresaId: string;
}

export const GenerarEnlaceDialog = ({
  open,
  onOpenChange,
  trabajador,
  empresaId,
}: GenerarEnlaceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [tipoGuia, setTipoGuia] = useState<"guia_i" | "guia_iii">("guia_i");
  const [enlaceGenerado, setEnlaceGenerado] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerarEnlace = async () => {
    if (!trabajador) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tokens_cuestionario_nom035")
        .insert({
          trabajador_id: trabajador.id,
          empresa_id: empresaId,
          tipo_guia: tipoGuia,
        })
        .select("token")
        .single();

      if (error) throw error;

      const baseUrl = window.location.origin;
      const enlace = `${baseUrl}/cuestionario/${data.token}`;
      setEnlaceGenerado(enlace);
      toast.success("Enlace generado exitosamente");
    } catch (error: any) {
      console.error("Error generating link:", error);
      toast.error("Error al generar el enlace");
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = async () => {
    if (!enlaceGenerado) return;
    
    try {
      await navigator.clipboard.writeText(enlaceGenerado);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Error al copiar el enlace");
    }
  };

  const handleEnviarWhatsApp = () => {
    if (!enlaceGenerado || !trabajador?.telefono) return;
    
    const mensaje = encodeURIComponent(
      `Hola ${trabajador.nombre_completo}, te compartimos el enlace para responder el cuestionario NOM-035:\n\n${enlaceGenerado}\n\nEste enlace es personal e intransferible. Tu información será tratada de forma confidencial.`
    );
    const telefono = trabajador.telefono.replace(/\D/g, '');
    window.open(`https://wa.me/52${telefono}?text=${mensaje}`, '_blank');
  };

  const handleEnviarEmail = () => {
    if (!enlaceGenerado || !trabajador?.email) return;
    
    const asunto = encodeURIComponent("Evaluación NOM-035 - Enlace de Acceso");
    const cuerpo = encodeURIComponent(
      `Estimado(a) ${trabajador.nombre_completo},\n\nTe compartimos el enlace para responder el cuestionario de evaluación NOM-035:\n\n${enlaceGenerado}\n\nEste enlace es personal e intransferible y tiene una vigencia de 7 días.\nTu información será tratada de forma estrictamente confidencial conforme a la normativa vigente.\n\nSaludos,\nDepartamento de Recursos Humanos`
    );
    window.open(`mailto:${trabajador.email}?subject=${asunto}&body=${cuerpo}`, '_blank');
  };

  const handleClose = () => {
    setEnlaceGenerado(null);
    setCopied(false);
    setTipoGuia("guia_i");
    onOpenChange(false);
  };

  if (!trabajador) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Generar Enlace de Cuestionario
          </DialogTitle>
          <DialogDescription>
            Genera un enlace único para que {trabajador.nombre_completo} responda el cuestionario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info del trabajador */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <p className="font-medium">{trabajador.nombre_completo}</p>
            <p className="text-sm text-muted-foreground">{trabajador.codigo_trabajador}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {trabajador.email && (
                <Badge variant="outline" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  {trabajador.email}
                </Badge>
              )}
              {trabajador.telefono && (
                <Badge variant="outline" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {trabajador.telefono}
                </Badge>
              )}
            </div>
          </div>

          {!enlaceGenerado ? (
            <>
              {/* Selector de tipo de guía */}
              <div className="space-y-2">
                <Label>Tipo de Cuestionario</Label>
                <Select
                  value={tipoGuia}
                  onValueChange={(v) => setTipoGuia(v as "guia_i" | "guia_iii")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guia_i">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Guía I - Acontecimientos Traumáticos
                      </div>
                    </SelectItem>
                    <SelectItem value="guia_iii">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        Guía III - Factores Psicosociales
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-muted-foreground">
                El enlace tendrá una vigencia de 7 días y solo podrá ser utilizado una vez.
              </p>
            </>
          ) : (
            <>
              {/* Enlace generado */}
              <div className="space-y-2">
                <Label>Enlace Generado</Label>
                <div className="flex gap-2">
                  <Input value={enlaceGenerado} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopiar}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Opciones de envío */}
              <div className="space-y-2">
                <Label>Compartir vía</Label>
                <div className="flex gap-2">
                  {trabajador.telefono && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleEnviarWhatsApp}
                    >
                      <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                      WhatsApp
                    </Button>
                  )}
                  {trabajador.email && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleEnviarEmail}
                    >
                      <Mail className="h-4 w-4 mr-2 text-blue-500" />
                      Email
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                El trabajador deberá verificar su identidad ingresando su nombre, correo y teléfono 
                registrados antes de acceder al cuestionario.
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {enlaceGenerado ? "Cerrar" : "Cancelar"}
          </Button>
          {!enlaceGenerado && (
            <Button onClick={handleGenerarEnlace} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generar Enlace
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
