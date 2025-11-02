import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmpresaVinculada {
  id: string;
  tipo_vinculacion: string;
  estado: string;
  fecha_inicio: string;
  empresas: {
    nombre_empresa: string;
    sector?: string;
  };
}

interface EmpresasVinculadasCardProps {
  asociaciones: EmpresaVinculada[];
}

export const EmpresasVinculadasCard = ({ asociaciones }: EmpresasVinculadasCardProps) => {
  const getTipoVinculacionBadge = (tipo: string) => {
    const badges = {
      interno: { variant: "default" as const, label: "Interno" },
      freelance: { variant: "secondary" as const, label: "Freelance" },
      externo: { variant: "outline" as const, label: "Externo" }
    };
    return badges[tipo as keyof typeof badges] || badges.freelance;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Empresas en las que Colaboro
        </CardTitle>
        <CardDescription>
          {asociaciones.length === 0 
            ? "Todavía no tienes empresas vinculadas" 
            : `Actualmente colaboras con ${asociaciones.length} ${asociaciones.length === 1 ? 'empresa' : 'empresas'}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {asociaciones.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Comparte tu código único con empresas para recibir invitaciones
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {asociaciones.map((asociacion) => {
              const badge = getTipoVinculacionBadge(asociacion.tipo_vinculacion);
              return (
                <div
                  key={asociacion.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {asociacion.empresas?.nombre_empresa || "Empresa"}
                      </h4>
                      {asociacion.empresas?.sector && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {asociacion.empresas.sector}
                        </p>
                      )}
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Desde {format(new Date(asociacion.fecha_inicio), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
