import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const sectoresLatam = [
  "Agroindustria",
  "Tecnología",
  "Manufactura",
  "Servicios Financieros",
  "Retail",
  "Salud",
  "Educación",
  "Construcción",
  "Energía",
  "Minería",
  "Turismo y Hospitalidad",
  "Telecomunicaciones",
  "Transporte y Logística",
  "Bienes Raíces",
  "Consultoría"
];

export const UserProfileModal = ({ open, onOpenChange, onSuccess }: UserProfileModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_usuario: "",
    nombre_empresa: "",
    sector: "",
    tamano_empresa: "",
    mostrar_empresa_publica: true,
    sitio_web: "",
    descripcion_empresa: "",
  });

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("perfil_usuario")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfileExists(true);
        setFormData({
          nombre_usuario: data.nombre_usuario || "",
          nombre_empresa: data.nombre_empresa || "",
          sector: data.sector || "",
          tamano_empresa: data.tamano_empresa || "",
          mostrar_empresa_publica: data.mostrar_empresa_publica ?? true,
          sitio_web: data.sitio_web || "",
          descripcion_empresa: data.descripcion_empresa || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      if (profileExists) {
        const { error } = await supabase
          .from("perfil_usuario")
          .update({
            ...formData,
            tamano_empresa: formData.tamano_empresa as any,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("perfil_usuario")
          .insert({
            user_id: user.id,
            ...formData,
            tipo_usuario: "profesional_rrhh" as any,
            tamano_empresa: formData.tamano_empresa as any,
            vacantes_promedio_mes: 10,
            miden_indicadores: false,
            horizonte_planeacion: 6,
            pais: "México",
            frecuencia_actualizacion: "mensual",
          });

        if (error) throw error;
        setProfileExists(true);
      }

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mi Perfil</DialogTitle>
          <DialogDescription>
            Administra tu información personal y de empresa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_usuario">Nombre del Administrador*</Label>
            <Input
              id="nombre_usuario"
              value={formData.nombre_usuario}
              onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
              placeholder="Nombre del administrador de la cuenta"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_empresa">Nombre de la Empresa*</Label>
            <Input
              id="nombre_empresa"
              value={formData.nombre_empresa}
              onChange={(e) => setFormData({ ...formData, nombre_empresa: e.target.value })}
              placeholder="Nombre de tu empresa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sector*</Label>
            <Select
              value={formData.sector}
              onValueChange={(value) => setFormData({ ...formData, sector: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un sector" />
              </SelectTrigger>
              <SelectContent>
                {sectoresLatam.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tamano_empresa">Tamaño de Empresa*</Label>
            <Select
              value={formData.tamano_empresa}
              onValueChange={(value) => setFormData({ ...formData, tamano_empresa: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tamaño" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="micro">Micro (1-10 empleados)</SelectItem>
                <SelectItem value="pyme">PyME (11-50 empleados)</SelectItem>
                <SelectItem value="mediana">Mediana (51-250 empleados)</SelectItem>
                <SelectItem value="grande">Grande (250+ empleados)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sitio_web">Sitio Web</Label>
            <Input
              id="sitio_web"
              type="url"
              value={formData.sitio_web}
              onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
              placeholder="https://ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion_empresa">Descripción de la Empresa</Label>
            <Textarea
              id="descripcion_empresa"
              value={formData.descripcion_empresa}
              onChange={(e) => setFormData({ ...formData, descripcion_empresa: e.target.value })}
              rows={3}
              placeholder="Breve descripción de tu empresa..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="mostrar_empresa"
              checked={formData.mostrar_empresa_publica}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, mostrar_empresa_publica: checked as boolean })
              }
            />
            <Label htmlFor="mostrar_empresa" className="cursor-pointer">
              Mostrar nombre de empresa en vacantes públicas
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Si desactivas esta opción, las vacantes públicas mostrarán "Confidencial" en lugar del nombre de tu empresa.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
