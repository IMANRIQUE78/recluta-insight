import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const sectoresLatam = [
  "Agroindustria", "Tecnología", "Manufactura", "Servicios Financieros",
  "Retail", "Salud", "Educación", "Construcción", "Energía", "Minería",
  "Turismo y Hospitalidad", "Telecomunicaciones", "Transporte y Logística",
  "Bienes Raíces", "Consultoría"
];

const tamanoEmpresaOptions = [
  { value: "startup", label: "Startup (1-10)" },
  { value: "pyme", label: "PyME (11-50)" },
  { value: "mediana", label: "Mediana (51-250)" },
  { value: "grande", label: "Grande (250+)" },
  { value: "corporativo", label: "Corporativo (1000+)" }
];

export const UserProfileModal = ({ open, onOpenChange, onSuccess }: UserProfileModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_empresa: "",
    razon_social: "",
    rfc: "",
    sector: "",
    tamano_empresa: "",
    email_contacto: "",
    telefono_contacto: "",
    direccion_fiscal: "",
    ciudad: "",
    estado: "",
    codigo_postal: "",
    pais: "México",
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
        .from("empresas")
        .select("*")
        .eq("created_by", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfileExists(true);
        setFormData({
          nombre_empresa: data.nombre_empresa || "",
          razon_social: data.razon_social || "",
          rfc: data.rfc || "",
          sector: data.sector || "",
          tamano_empresa: data.tamano_empresa || "",
          email_contacto: data.email_contacto || "",
          telefono_contacto: data.telefono_contacto || "",
          direccion_fiscal: data.direccion_fiscal || "",
          ciudad: data.ciudad || "",
          estado: data.estado || "",
          codigo_postal: data.codigo_postal || "",
          pais: data.pais || "México",
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
        // Actualizar empresa existente
        const { error } = await supabase
          .from("empresas")
          .update({
            nombre_empresa: formData.nombre_empresa,
            razon_social: formData.razon_social || formData.nombre_empresa,
            rfc: formData.rfc,
            sector: formData.sector,
            tamano_empresa: formData.tamano_empresa,
            email_contacto: formData.email_contacto,
            telefono_contacto: formData.telefono_contacto,
            direccion_fiscal: formData.direccion_fiscal,
            ciudad: formData.ciudad,
            estado: formData.estado,
            codigo_postal: formData.codigo_postal,
            pais: formData.pais,
            sitio_web: formData.sitio_web,
            descripcion_empresa: formData.descripcion_empresa,
          })
          .eq("created_by", user.id);

        if (error) throw error;
      } else {
        // Crear nueva empresa
        const { data: empresaData, error: empresaError } = await supabase
          .from("empresas")
          .insert({
            ...formData,
            razon_social: formData.razon_social || formData.nombre_empresa,
            created_by: user.id,
          })
          .select()
          .single();

        if (empresaError) throw empresaError;

        // Crear rol de admin_empresa
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            role: "admin_empresa",
            empresa_id: empresaData.id,
          });

        if (roleError) throw roleError;

        // Crear suscripción profesional
        const { error: suscripcionError } = await supabase
          .from("suscripcion_empresa")
          .insert({
            empresa_id: empresaData.id,
            plan: "profesional",
            activa: true,
            publicaciones_mes: 999,
            publicaciones_usadas: 0,
            acceso_marketplace: true,
            acceso_analytics_avanzado: true,
            soporte_prioritario: true,
          });

        if (suscripcionError) throw suscripcionError;
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
          <DialogTitle>Perfil de Empresa - Employer Branding</DialogTitle>
          <DialogDescription>
            Configura el perfil completo de tu empresa. Esta información se mostrará en tus publicaciones de vacantes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información Básica</h3>
            
            <div className="space-y-2">
              <Label htmlFor="nombre_empresa">Nombre Comercial de la Empresa*</Label>
              <Input
                id="nombre_empresa"
                value={formData.nombre_empresa}
                onChange={(e) => setFormData({ ...formData, nombre_empresa: e.target.value })}
                placeholder="Nombre comercial de tu empresa"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  placeholder="Razón social legal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                  placeholder="ABC123456XXX"
                  maxLength={13}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {tamanoEmpresaOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Employer Branding */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Employer Branding</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sitio_web">Sitio Web Corporativo</Label>
              <Input
                id="sitio_web"
                type="url"
                value={formData.sitio_web}
                onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                placeholder="https://www.tuempresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion_empresa">Descripción de la Empresa (Employer Branding)</Label>
              <Textarea
                id="descripcion_empresa"
                value={formData.descripcion_empresa}
                onChange={(e) => setFormData({ ...formData, descripcion_empresa: e.target.value })}
                rows={4}
                placeholder="Describe tu empresa, cultura, valores y beneficios que ofreces..."
              />
              <p className="text-xs text-muted-foreground">
                Esta descripción aparecerá en tus publicaciones de vacantes para atraer talento.
              </p>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información de Contacto</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email_contacto">Email de Contacto*</Label>
                <Input
                  id="email_contacto"
                  type="email"
                  value={formData.email_contacto}
                  onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
                  placeholder="contacto@empresa.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono_contacto">Teléfono de Contacto</Label>
                <Input
                  id="telefono_contacto"
                  value={formData.telefono_contacto}
                  onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value })}
                  placeholder="+52 55 1234 5678"
                />
              </div>
            </div>
          </div>

          {/* Dirección Fiscal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Dirección Fiscal</h3>
            
            <div className="space-y-2">
              <Label htmlFor="direccion_fiscal">Dirección Completa</Label>
              <Input
                id="direccion_fiscal"
                value={formData.direccion_fiscal}
                onChange={(e) => setFormData({ ...formData, direccion_fiscal: e.target.value })}
                placeholder="Calle, número, colonia"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  placeholder="Ciudad de México"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="CDMX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input
                  id="codigo_postal"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                  placeholder="01234"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Select
                value={formData.pais}
                onValueChange={(value) => setFormData({ ...formData, pais: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="México">México</SelectItem>
                  <SelectItem value="Colombia">Colombia</SelectItem>
                  <SelectItem value="Argentina">Argentina</SelectItem>
                  <SelectItem value="Chile">Chile</SelectItem>
                  <SelectItem value="Perú">Perú</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
