import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VacantePublicaCardProps {
  publicacion: any;
  onClick: () => void;
}

export const VacantePublicaCard = ({ publicacion, onClick }: VacantePublicaCardProps) => {
  const [nombreEmpresa, setNombreEmpresa] = useState<string>("Confidencial");

  useEffect(() => {
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
  }, [publicacion.user_id]);

  const formatSalary = (salary: number | null) => {
    if (!salary) return null;
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
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-xl">{publicacion.titulo_puesto}</CardTitle>
        <div className="flex items-center gap-3 mt-1">
          <CardDescription className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {nombreEmpresa}
          </CardDescription>
          {publicacion.ubicacion && (
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {publicacion.ubicacion}
            </CardDescription>
          )}
        </div>
        <Badge variant="secondary" className="w-fit">
          {getModalidadLabel(publicacion.lugar_trabajo)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {publicacion.sueldo_bruto_aprobado && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{formatSalary(publicacion.sueldo_bruto_aprobado)}</span>
            </div>
          )}
          {publicacion.perfil_requerido && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {publicacion.perfil_requerido}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Publicado {new Date(publicacion.fecha_publicacion).toLocaleDateString('es-MX')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
