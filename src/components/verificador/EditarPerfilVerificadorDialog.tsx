import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVerificadorStats } from "@/hooks/useVerificadorStats";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Star,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Loader2,
  Save,
  X,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EditarPerfilVerificadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verificadorUserId: string;
  onSuccess?: () => void;
}

export function EditarPerfilVerificadorDialog({
  open,
  onOpenChange,
  verificadorUserId,
  onSuccess,
}: EditarPerfilVerificadorDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newZona, setNewZona] = useState("");
  
  const [formData, setFormData] = useState({
    nombre_verificador: "",
    email: "",
    telefono: "",
    zona_cobertura: [] as string[],
    disponible: true,
  });

  // Fetch perfil verificador
  const { data: perfil, refetch } = useQuery({
    queryKey: ["perfil-verificador-edit", verificadorUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfil_verificador")
        .select("*")
        .eq("user_id", verificadorUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!verificadorUserId && open,
  });

  // Use centralized stats hook
  const { stats } = useVerificadorStats(perfil?.id);

  useEffect(() => {
    if (perfil) {
      setFormData({
        nombre_verificador: perfil.nombre_verificador || "",
        email: perfil.email || "",
        telefono: perfil.telefono || "",
        zona_cobertura: perfil.zona_cobertura || [],
        disponible: perfil.disponible ?? true,
      });
    }
  }, [perfil]);

  const handleAddZona = () => {
    if (newZona.trim() && !formData.zona_cobertura.includes(newZona.trim())) {
      setFormData(prev => ({
        ...prev,
        zona_cobertura: [...prev.zona_cobertura, newZona.trim()]
      }));
      setNewZona("");
    }
  };

  const handleRemoveZona = (zona: string) => {
    setFormData(prev => ({
      ...prev,
      zona_cobertura: prev.zona_cobertura.filter(z => z !== zona)
    }));
  };

  const handleSave = async () => {
    if (!perfil?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("perfil_verificador")
        .update({
          nombre_verificador: formData.nombre_verificador,
          email: formData.email,
          telefono: formData.telefono,
          zona_cobertura: formData.zona_cobertura,
          disponible: formData.disponible,
        })
        .eq("id", perfil.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tus datos se han guardado correctamente",
      });

      refetch();
      onSuccess?.();
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
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Mi Perfil de Verificador
          </DialogTitle>
          <DialogDescription>
            Administra tu información y revisa tus estadísticas de desempeño
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de solo lectura */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Código de Verificador</span>
                <Badge variant="outline">{perfil?.codigo_verificador || "---"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Fecha de registro</span>
                <span className="text-sm font-medium">
                  {perfil?.created_at 
                    ? format(new Date(perfil.created_at), "dd 'de' MMMM, yyyy", { locale: es })
                    : "---"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de desempeño */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Métricas de Desempeño</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.estudiosCompletados}</p>
                  <p className="text-xs text-muted-foreground">Estudios Realizados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.estudiosEnProceso}</p>
                  <p className="text-xs text-muted-foreground">En Proceso</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.porcentajeATiempo}%</p>
                  <p className="text-xs text-muted-foreground">Entregas a Tiempo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.promedioCalificacion > 0 ? stats.promedioCalificacion.toFixed(1) : "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Calificación ({stats.totalCalificaciones})</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Datos editables */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Datos de Contacto</h3>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nombre"
                    value={formData.nombre_verificador}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre_verificador: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Zonas de cobertura */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zonas de Cobertura
            </h3>
            
            <div className="flex gap-2">
              <Input
                placeholder="Agregar nueva zona (ej: CDMX Norte)"
                value={newZona}
                onChange={(e) => setNewZona(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddZona()}
              />
              <Button type="button" variant="outline" onClick={handleAddZona}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.zona_cobertura.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay zonas registradas</p>
              ) : (
                formData.zona_cobertura.map((zona) => (
                  <Badge key={zona} variant="secondary" className="gap-1">
                    {zona}
                    <button
                      type="button"
                      onClick={() => handleRemoveZona(zona)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Disponibilidad */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Disponible para nuevos estudios</Label>
              <p className="text-sm text-muted-foreground">
                Si está desactivado, no aparecerás en la lista de verificadores disponibles
              </p>
            </div>
            <Switch
              checked={formData.disponible}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, disponible: checked }))}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
