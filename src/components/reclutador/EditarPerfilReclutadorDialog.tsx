import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Linkedin, Twitter, Globe } from "lucide-react";

interface EditarPerfilReclutadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reclutadorId: string;
  onUpdate?: () => void;
}

export function EditarPerfilReclutadorDialog({
  open,
  onOpenChange,
  reclutadorId,
  onUpdate,
}: EditarPerfilReclutadorDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [telefono, setTelefono] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [semblanza, setSemblanza] = useState("");
  const [mostrarTelefono, setMostrarTelefono] = useState(true);

  useEffect(() => {
    if (open && reclutadorId) {
      loadPerfilData();
    }
  }, [open, reclutadorId]);

  const loadPerfilData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("perfil_reclutador")
        .select("*")
        .eq("id", reclutadorId)
        .single();

      if (error) throw error;

      if (data) {
        setTelefono(data.telefono || "");
        setLinkedinUrl(data.linkedin_url || "");
        setTwitterUrl(data.twitter_url || "");
        setWebsiteUrl(data.website_url || "");
        setSemblanza(data.semblanza_profesional || "");
        setMostrarTelefono(data.mostrar_telefono ?? true);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("perfil_reclutador")
        .update({
          telefono,
          linkedin_url: linkedinUrl || null,
          twitter_url: twitterUrl || null,
          website_url: websiteUrl || null,
          semblanza_profesional: semblanza || null,
          mostrar_telefono: mostrarTelefono,
        })
        .eq("id", reclutadorId);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tu información se guardó correctamente",
      });

      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error guardando perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil Profesional</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+52 55 1234 5678"
              />
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="mostrar-telefono"
                  checked={mostrarTelefono}
                  onCheckedChange={setMostrarTelefono}
                />
                <Label htmlFor="mostrar-telefono" className="text-sm font-normal">
                  Mostrar teléfono en perfil público
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Redes Sociales</h3>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/tu-perfil"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter / X
                </Label>
                <Input
                  id="twitter"
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/tu-usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Sitio Web / Portfolio
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://tu-sitio.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semblanza">Semblanza Profesional</Label>
              <Textarea
                id="semblanza"
                value={semblanza}
                onChange={(e) => setSemblanza(e.target.value)}
                placeholder="Describe brevemente tu trayectoria profesional, experiencia en reclutamiento, sectores en los que te especializas..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Esta información será visible en tu perfil público
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
