import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Briefcase, Users, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GestionVacanteDialog } from "./GestionVacanteDialog";

interface VacantesAsignadasCardProps {
  reclutadorId: string;
}

export const VacantesAsignadasCard = ({ reclutadorId }: VacantesAsignadasCardProps) => {
  const [vacantesAsignadas, setVacantesAsignadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacante, setSelectedVacante] = useState<any>(null);
  const [showGestionDialog, setShowGestionDialog] = useState(false);

  useEffect(() => {
    if (reclutadorId) {
      loadVacantesAsignadas();
    }
  }, [reclutadorId]);

  const loadVacantesAsignadas = async () => {
    try {
      // Obtener el perfil del reclutador para obtener el user_id
      const { data: perfil, error: perfilError } = await supabase
        .from("perfil_reclutador")
        .select("user_id")
        .eq("id", reclutadorId)
        .single();

      if (perfilError) throw perfilError;

      // Cargar vacantes asignadas al reclutador
      const { data: vacantes, error } = await supabase
        .from("vacantes")
        .select(`
          *,
          clientes_areas (
            cliente_nombre,
            area
          ),
          empresas (
            nombre_empresa
          )
        `)
        .eq("reclutador_asignado_id", reclutadorId)
        .eq("estatus", "abierta")
        .order("fecha_solicitud", { ascending: false });

      if (error) throw error;

      // Obtener el conteo de postulaciones para cada vacante
      const vacantesConPostulaciones = await Promise.all(
        (vacantes || []).map(async (vacante) => {
          // Verificar si ya está publicada
          const { data: publicacion } = await supabase
            .from("publicaciones_marketplace")
            .select("id")
            .eq("vacante_id", vacante.id)
            .maybeSingle();

          let postulacionesCount = 0;
          if (publicacion) {
            const { count } = await supabase
              .from("postulaciones")
              .select("*", { count: "exact", head: true })
              .eq("publicacion_id", publicacion.id);
            postulacionesCount = count || 0;
          }

          return {
            ...vacante,
            postulaciones: postulacionesCount,
            publicada: !!publicacion,
            publicacion_id: publicacion?.id,
          };
        })
      );

      setVacantesAsignadas(vacantesConPostulaciones);
    } catch (error: any) {
      console.error("Error cargando vacantes asignadas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (vacante: any) => {
    setSelectedVacante(vacante);
    setShowGestionDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Vacantes Asignadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Vacantes Asignadas
          </CardTitle>
          <CardDescription>
            Requisiciones de empresas que debes cubrir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vacantesAsignadas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Aún no tienes vacantes asignadas</p>
              <p className="text-xs mt-1">Las empresas te asignarán requisiciones una vez aceptes sus invitaciones</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {vacantesAsignadas.map((vacante: any) => (
                <div key={vacante.id} className="p-3 border rounded-lg space-y-2">
                  {/* Folio prominente para trazabilidad */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs bg-primary/10">
                      {vacante.folio}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {vacante.solicitud_cierre && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Cierre solicitado
                        </Badge>
                      )}
                      <Badge variant={vacante.publicada ? "default" : "secondary"}>
                        {vacante.publicada ? "Publicada" : "Por publicar"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{vacante.titulo_puesto}</p>
                      <p className="text-sm text-muted-foreground">
                        {vacante.empresas?.nombre_empresa || `${vacante.clientes_areas?.cliente_nombre} - ${vacante.clientes_areas?.area}`}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(vacante.fecha_solicitud).toLocaleDateString()}
                    </span>
                    {vacante.publicada && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {vacante.postulaciones} candidatos
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    variant="outline"
                    onClick={() => handleVerDetalles(vacante)}
                  >
                    <Eye className="mr-2 h-3 w-3" />
                    {vacante.publicada ? "Gestionar" : "Detallar y Publicar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVacante && (
        <GestionVacanteDialog
          open={showGestionDialog}
          onOpenChange={setShowGestionDialog}
          vacante={selectedVacante}
          onSuccess={loadVacantesAsignadas}
        />
      )}
    </>
  );
};
