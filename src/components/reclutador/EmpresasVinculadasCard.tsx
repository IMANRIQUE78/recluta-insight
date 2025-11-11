import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Briefcase, Globe, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface EmpresaVinculada {
  id: string;
  tipo_vinculacion: string;
  estado: string;
  fecha_inicio: string;
  empresa_id: string;
  empresas: {
    id: string;
    nombre_empresa: string;
    sector?: string;
    descripcion_empresa?: string;
    sitio_web?: string;
    tamano_empresa?: string;
    ciudad?: string;
    estado?: string;
    pais?: string;
  };
}

interface EmpresasVinculadasCardProps {
  asociaciones: EmpresaVinculada[];
}

export const EmpresasVinculadasCard = ({ asociaciones }: EmpresasVinculadasCardProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getTipoVinculacionBadge = (tipo: string) => {
    const badges = {
      interno: { variant: "default" as const, label: "Interno" },
      freelance: { variant: "secondary" as const, label: "Freelance" },
      externo: { variant: "outline" as const, label: "Externo" }
    };
    return badges[tipo as keyof typeof badges] || badges.freelance;
  };

  const getTamanoLabel = (tamano?: string) => {
    const tamanos: Record<string, string> = {
      pequeña: "1-50 empleados",
      mediana: "51-250 empleados",
      grande: "251-1000 empleados",
      corporativo: "1000+ empleados"
    };
    return tamanos[tamano || ""] || "No especificado";
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
              const isExpanded = expandedId === asociacion.id;
              
              return (
                <div
                  key={asociacion.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          {asociacion.empresas?.nombre_empresa || "Empresa"}
                        </h4>
                        {asociacion.empresas?.sector && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 ml-6">
                            <Briefcase className="h-3 w-3" />
                            {asociacion.empresas.sector}
                          </p>
                        )}
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Desde {format(new Date(asociacion.fecha_inicio), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(asociacion.id)}
                        className="h-8 text-xs"
                      >
                        {isExpanded ? (
                          <>
                            Ocultar <ChevronUp className="ml-1 h-3 w-3" />
                          </>
                        ) : (
                          <>
                            Ver más <ChevronDown className="ml-1 h-3 w-3" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/20 p-4 space-y-4">
                      {/* Descripción */}
                      {asociacion.empresas?.descripcion_empresa && (
                        <div>
                          <h5 className="text-sm font-semibold mb-2">Acerca de la Empresa</h5>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {asociacion.empresas.descripcion_empresa}
                          </p>
                        </div>
                      )}

                      <Separator />

                      {/* Detalles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {asociacion.empresas?.tamano_empresa && (
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Tamaño</p>
                              <p className="text-sm font-semibold">{getTamanoLabel(asociacion.empresas.tamano_empresa)}</p>
                            </div>
                          </div>
                        )}

                        {(asociacion.empresas?.ciudad || asociacion.empresas?.estado || asociacion.empresas?.pais) && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Ubicación</p>
                              <p className="text-sm font-semibold">
                                {[asociacion.empresas.ciudad, asociacion.empresas.estado, asociacion.empresas.pais]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          </div>
                        )}

                        {asociacion.empresas?.sitio_web && (
                          <div className="flex items-start gap-2 sm:col-span-2">
                            <Globe className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Sitio Web</p>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-sm font-semibold"
                                onClick={() => window.open(asociacion.empresas.sitio_web, '_blank')}
                              >
                                {asociacion.empresas.sitio_web}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
