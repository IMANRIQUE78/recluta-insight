import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe } from "lucide-react";

interface PublishToMarketplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacante: any;
  onSuccess: () => void;
}

export const PublishToMarketplaceDialog = ({ 
  open, 
  onOpenChange, 
  vacante, 
  onSuccess 
}: PublishToMarketplaceDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publicationId, setPublicationId] = useState<string | null>(null);
  
  const [selectedFields, setSelectedFields] = useState({
    sueldo_bruto_aprobado: true,
    cliente_area: false,
    ubicacion: false,
    perfil_requerido: true,
    observaciones: false,
  });
  const [ubicacion, setUbicacion] = useState("");

  useEffect(() => {
    if (open && vacante) {
      checkIfPublished();
    }
  }, [open, vacante]);

  const checkIfPublished = async () => {
    const { data } = await supabase
      .from("publicaciones_marketplace")
      .select("id")
      .eq("vacante_id", vacante.id)
      .maybeSingle();
    
    if (data) {
      setIsPublished(true);
      setPublicationId(data.id);
    } else {
      setIsPublished(false);
      setPublicationId(null);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const publicationData = {
        vacante_id: vacante.id,
        user_id: user.id,
        titulo_puesto: vacante.titulo_puesto,
        sueldo_bruto_aprobado: selectedFields.sueldo_bruto_aprobado ? vacante.sueldo_bruto_aprobado : null,
        cliente_area: selectedFields.cliente_area ? vacante.clientes_areas?.cliente_nombre : null,
        ubicacion: selectedFields.ubicacion ? ubicacion : null,
        lugar_trabajo: vacante.lugar_trabajo,
        perfil_requerido: selectedFields.perfil_requerido ? vacante.perfil_requerido : null,
        observaciones: selectedFields.observaciones ? vacante.observaciones : null,
        publicada: true,
      };

      const { error } = await supabase
        .from("publicaciones_marketplace")
        .upsert(publicationData, { onConflict: "vacante_id" });

      if (error) throw error;

      toast({
        title: "Vacante publicada",
        description: "La vacante se ha publicado en el marketplace correctamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("publicaciones_marketplace")
        .delete()
        .eq("vacante_id", vacante.id);

      if (error) throw error;

      toast({
        title: "Vacante despublicada",
        description: "La vacante se ha removido del marketplace",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {isPublished ? "Vacante Publicada" : "Publicar en Marketplace"}
          </DialogTitle>
          <DialogDescription>
            {isPublished 
              ? "Esta vacante está publicada en el marketplace público"
              : "Selecciona qué información deseas hacer pública"
            }
          </DialogDescription>
        </DialogHeader>

        {!isPublished && (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Información siempre pública:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Nombre de la vacante</li>
                <li>• Lugar de trabajo</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Información opcional:</p>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sueldo"
                  checked={selectedFields.sueldo_bruto_aprobado}
                  onCheckedChange={(checked) =>
                    setSelectedFields({ ...selectedFields, sueldo_bruto_aprobado: checked as boolean })
                  }
                />
                <Label htmlFor="sueldo" className="cursor-pointer">Sueldo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cliente"
                  checked={selectedFields.cliente_area}
                  onCheckedChange={(checked) =>
                    setSelectedFields({ ...selectedFields, cliente_area: checked as boolean })
                  }
                />
                <Label htmlFor="cliente" className="cursor-pointer">Cliente/Área</Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ubicacion"
                    checked={selectedFields.ubicacion}
                    onCheckedChange={(checked) =>
                      setSelectedFields({ ...selectedFields, ubicacion: checked as boolean })
                    }
                  />
                  <Label htmlFor="ubicacion" className="cursor-pointer">Ubicación/Ciudad</Label>
                </div>
                {selectedFields.ubicacion && (
                  <Input
                    placeholder="Ej: Ciudad de México, CDMX"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    className="ml-6"
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="perfil"
                  checked={selectedFields.perfil_requerido}
                  onCheckedChange={(checked) =>
                    setSelectedFields({ ...selectedFields, perfil_requerido: checked as boolean })
                  }
                />
                <Label htmlFor="perfil" className="cursor-pointer">Perfil requerido</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="observaciones"
                  checked={selectedFields.observaciones}
                  onCheckedChange={(checked) =>
                    setSelectedFields({ ...selectedFields, observaciones: checked as boolean })
                  }
                />
                <Label htmlFor="observaciones" className="cursor-pointer">Observaciones</Label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          {isPublished ? (
            <Button
              variant="destructive"
              onClick={handleUnpublish}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Despublicar
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
