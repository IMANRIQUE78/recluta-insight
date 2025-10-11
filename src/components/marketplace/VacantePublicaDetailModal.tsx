import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Briefcase, DollarSign, FileText, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface VacantePublicaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicacion: any;
}

export const VacantePublicaDetailModal = ({ 
  open, 
  onOpenChange, 
  publicacion 
}: VacantePublicaDetailModalProps) => {
  const { user } = useAuth();
  const [nombreEmpresa, setNombreEmpresa] = useState<string>("Confidencial");

  useEffect(() => {
    if (publicacion && open) {
      const loadNombreEmpresa = async () => {
        const { data } = await supabase
          .from("perfil_usuario")
          .select("nombre_empresa, mostrar_empresa_publica")
          .eq("user_id", publicacion.user_id)
          .maybeSingle();

        if (data) {
          setNombreEmpresa(
            data.mostrar_empresa_publica && data.nombre_empresa 
              ? data.nombre_empresa 
              : "Confidencial"
          );
        }
      };

      loadNombreEmpresa();
    }
  }, [publicacion, open]);

  if (!publicacion) return null;

  const formatSalary = (salary: number | null) => {
    if (!salary) return "No especificado";
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(salary);
  };

  const getModalidadLabel = (modalidad: string) => {
    const labels: Record<string, string> = {
      remoto: "Remoto",
      presencial: "Presencial",
      hibrido: "Híbrido",
    };
    return labels[modalidad] || modalidad;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{publicacion.titulo_puesto}</DialogTitle>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{nombreEmpresa}</span>
            </div>
            {publicacion.ubicacion && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{publicacion.ubicacion}</span>
              </div>
            )}
          </div>
          <DialogDescription>
            Publicado el {new Date(publicacion.fecha_publicacion).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Badges principales */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {getModalidadLabel(publicacion.lugar_trabajo)}
            </Badge>
          </div>

          <Separator />

          {/* Sueldo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Compensación
            </div>
            <p className="text-lg font-semibold ml-6">
              {formatSalary(publicacion.sueldo_bruto_aprobado)}
            </p>
          </div>

          {/* Perfil requerido */}
          {publicacion.perfil_requerido && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Perfil Requerido
                </div>
                <p className="text-sm text-muted-foreground ml-6 whitespace-pre-wrap">
                  {publicacion.perfil_requerido}
                </p>
              </div>
            </>
          )}

          {/* Observaciones */}
          {publicacion.observaciones && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Información Adicional
                </div>
                <p className="text-sm text-muted-foreground ml-6 whitespace-pre-wrap">
                  {publicacion.observaciones}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Botón de postulación */}
          <div className="flex justify-end">
            {user ? (
              <Button size="lg" disabled>
                Postularme (Próximamente)
              </Button>
            ) : (
              <Button size="lg" variant="outline" onClick={() => window.location.href = '/auth'}>
                Inicia sesión para postularte
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
