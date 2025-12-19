import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Briefcase, Globe, MapPin, ChevronDown, ChevronUp, UserX, Users, Mail, Phone, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DesvincularEmpresaDialog } from "./DesvincularEmpresaDialog";

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
    email_contacto?: string;
    telefono_contacto?: string;
  };
}

interface EmpresasVinculadasCardProps {
  asociaciones: EmpresaVinculada[];
  onDesvincularSuccess?: () => void;
}

export const EmpresasVinculadasCard = ({ asociaciones, onDesvincularSuccess }: EmpresasVinculadasCardProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [desvincularDialog, setDesvincularDialog] = useState<{
    open: boolean;
    asociacionId: string;
    empresaNombre: string;
  }>({ open: false, asociacionId: "", empresaNombre: "" });

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
      micro: "1-10 empleados",
      pyme: "11-50 empleados",
      mediana: "51-250 empleados",
      grande: "251+ empleados"
    };
    return tamanos[tamano || ""] || tamano || "No especificado";
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
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
          <div className="space-y-4">
            {asociaciones.map((asociacion) => {
              const badge = getTipoVinculacionBadge(asociacion.tipo_vinculacion);
              const isExpanded = expandedId === asociacion.id;
              const empresa = asociacion.empresas;
              
              return (
                <div
                  key={asociacion.id}
                  className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
                >
                  {/* Header de la empresa */}
                  <div className="p-4 border-b border-border/50 bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {empresa?.nombre_empresa || "Empresa"}
                          </h4>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          {empresa?.sector && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />
                              {empresa.sector}
                            </span>
                          )}
                          {empresa?.tamano_empresa && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {getTamanoLabel(empresa.tamano_empresa)}
                            </span>
                          )}
                          {(empresa?.ciudad || empresa?.estado) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {[empresa.ciudad, empresa.estado].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employer Branding - Descripción siempre visible */}
                  {empresa?.descripcion_empresa && (
                    <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/30">
                      <h5 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                        Acerca de la Empresa
                      </h5>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {empresa.descripcion_empresa}
                      </p>
                    </div>
                  )}

                  {/* Información de contacto y detalles expandibles */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Colaborando desde {format(new Date(asociacion.fecha_inicio), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {empresa?.sitio_web && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(empresa.sitio_web, '_blank')}
                            className="h-8 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Sitio Web
                          </Button>
                        )}
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
                              Más info <ChevronDown className="ml-1 h-3 w-3" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Detalles expandidos */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                        {/* Información de contacto */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {empresa?.email_contacto && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                              <Mail className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Email de contacto</p>
                                <a href={`mailto:${empresa.email_contacto}`} className="text-sm font-medium text-primary hover:underline">
                                  {empresa.email_contacto}
                                </a>
                              </div>
                            </div>
                          )}

                          {empresa?.telefono_contacto && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                              <Phone className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Teléfono</p>
                                <a href={`tel:${empresa.telefono_contacto}`} className="text-sm font-medium">
                                  {empresa.telefono_contacto}
                                </a>
                              </div>
                            </div>
                          )}

                          {empresa?.sitio_web && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                              <Globe className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Sitio Web</p>
                                <a 
                                  href={empresa.sitio_web} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-primary hover:underline"
                                >
                                  {empresa.sitio_web}
                                </a>
                              </div>
                            </div>
                          )}

                          {empresa?.pais && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                              <MapPin className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">País</p>
                                <p className="text-sm font-medium">{empresa.pais}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Acción de desvincular */}
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDesvincularDialog({
                              open: true,
                              asociacionId: asociacion.id,
                              empresaNombre: empresa?.nombre_empresa || "Empresa"
                            })}
                            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Desvincular de esta empresa
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <DesvincularEmpresaDialog
        open={desvincularDialog.open}
        onOpenChange={(open) => setDesvincularDialog({ ...desvincularDialog, open })}
        asociacionId={desvincularDialog.asociacionId}
        empresaNombre={desvincularDialog.empresaNombre}
        onSuccess={onDesvincularSuccess}
      />
    </Card>
  );
};
