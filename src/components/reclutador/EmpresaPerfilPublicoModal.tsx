import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, MapPin, Users, Briefcase, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface EmpresaPerfilPublicoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: {
    id: string;
    nombre_empresa: string;
    sector?: string;
    descripcion_empresa?: string;
    sitio_web?: string;
    tamano_empresa?: string;
    ciudad?: string;
    estado?: string;
    pais?: string;
  } | null;
}

export const EmpresaPerfilPublicoModal = ({ open, onOpenChange, empresa }: EmpresaPerfilPublicoModalProps) => {
  if (!empresa) return null;

  const getTamanoLabel = (tamano?: string) => {
    const tamanos: Record<string, string> = {
      pequeña: "1-50 empleados",
      mediana: "51-250 empleados",
      grande: "251-1000 empleados",
      corporativo: "1000+ empleados"
    };
    return tamanos[tamano || ""] || "No especificado";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">{empresa.nombre_empresa}</DialogTitle>
                  {empresa.sector && (
                    <Badge variant="secondary" className="mt-1">
                      {empresa.sector}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Información de la Empresa */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Acerca de la Empresa
            </h3>
            <Separator />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {empresa.descripcion_empresa || "Esta empresa aún no ha agregado una descripción."}
            </p>
          </section>

          {/* Detalles de la Empresa */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Detalles
            </h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {empresa.tamano_empresa && (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tamaño</p>
                    <p className="text-sm font-semibold">{getTamanoLabel(empresa.tamano_empresa)}</p>
                  </div>
                </div>
              )}

              {(empresa.ciudad || empresa.estado || empresa.pais) && (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Ubicación</p>
                    <p className="text-sm font-semibold">
                      {[empresa.ciudad, empresa.estado, empresa.pais].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {empresa.sitio_web && (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg md:col-span-2">
                  <Globe className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">Sitio Web</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm font-semibold"
                      onClick={() => window.open(empresa.sitio_web, '_blank')}
                    >
                      {empresa.sitio_web}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Employer Branding */}
          <section className="bg-gradient-to-br from-primary/5 to-background p-6 rounded-lg border border-primary/10">
            <h3 className="text-lg font-semibold mb-3">¿Por qué trabajar aquí?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {empresa.descripcion_empresa 
                ? `${empresa.nombre_empresa} ofrece un ambiente de trabajo profesional y oportunidades de crecimiento en el sector ${empresa.sector || "de su industria"}.`
                : `Conoce más sobre ${empresa.nombre_empresa} y las oportunidades que ofrece.`
              }
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
