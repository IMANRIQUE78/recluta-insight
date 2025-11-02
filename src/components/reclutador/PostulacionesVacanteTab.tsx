import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { AgendarEntrevistaDialog } from "@/components/dashboard/AgendarEntrevistaDialog";

interface PostulacionesVacanteTabProps {
  publicacionId: string;
}

export const PostulacionesVacanteTab = ({ publicacionId }: PostulacionesVacanteTabProps) => {
  const { toast } = useToast();
  const [postulaciones, setPostulaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostulacion, setSelectedPostulacion] = useState<any>(null);
  const [showEntrevistaDialog, setShowEntrevistaDialog] = useState(false);

  useEffect(() => {
    loadPostulaciones();
  }, [publicacionId]);

  const loadPostulaciones = async () => {
    try {
      const { data, error } = await supabase
        .from("postulaciones")
        .select(`
          *,
          perfil_candidato (
            nombre_completo,
            email,
            telefono,
            ubicacion,
            anos_experiencia,
            nivel_seniority,
            salario_esperado_min,
            salario_esperado_max,
            modalidad_preferida,
            disponibilidad
          )
        `)
        .eq("publicacion_id", publicacionId)
        .order("fecha_postulacion", { ascending: false });

      if (error) throw error;
      setPostulaciones(data || []);
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

  const handleDescartar = async (postulacionId: string) => {
    try {
      const { error } = await supabase
        .from("postulaciones")
        .update({
          estado: "descartado",
          etapa: "descartado",
          notas_reclutador: "Gracias por tu interés. En esta ocasión hemos decidido continuar con otros perfiles que se ajustan más a los requerimientos específicos de la posición. Te deseamos éxito en tu búsqueda laboral.",
        })
        .eq("id", postulacionId);

      if (error) throw error;

      toast({
        title: "✅ Candidato descartado",
        description: "Se ha enviado un mensaje de agradecimiento al candidato",
      });

      loadPostulaciones();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAvanzarEntrevista = (postulacion: any) => {
    setSelectedPostulacion(postulacion);
    setShowEntrevistaDialog(true);
  };

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case "recibida": return "secondary";
      case "revision": return "default";
      case "entrevista": return "default";
      case "descartado": return "destructive";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 bg-muted rounded animate-pulse"></div>
        <div className="h-20 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (postulaciones.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Aún no hay postulaciones para esta vacante</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {postulaciones.map((postulacion) => (
          <Card key={postulacion.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">
                      {postulacion.perfil_candidato?.nombre_completo || "Candidato"}
                    </p>
                    <Badge variant={getEtapaColor(postulacion.etapa)}>
                      {postulacion.etapa}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {postulacion.perfil_candidato?.email}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(postulacion.fecha_postulacion).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Ubicación:</span>
                  <p>{postulacion.perfil_candidato?.ubicacion || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teléfono:</span>
                  <p>{postulacion.perfil_candidato?.telefono || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sueldo Pretendido:</span>
                  <p className="font-medium">
                    {postulacion.perfil_candidato?.salario_esperado_min && postulacion.perfil_candidato?.salario_esperado_max
                      ? `$${postulacion.perfil_candidato.salario_esperado_min.toLocaleString()} - $${postulacion.perfil_candidato.salario_esperado_max.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Modalidad:</span>
                  <p className="capitalize">{postulacion.perfil_candidato?.modalidad_preferida || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Disponibilidad:</span>
                  <p className="capitalize">{postulacion.perfil_candidato?.disponibilidad?.replace("_", " ") || "N/A"}</p>
                </div>
              </div>

              {postulacion.notas_reclutador && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold">Notas:</p>
                      <p className="text-xs text-muted-foreground">{postulacion.notas_reclutador}</p>
                    </div>
                  </div>
                </div>
              )}

              {postulacion.etapa !== "descartado" && postulacion.etapa !== "entrevista" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAvanzarEntrevista(postulacion)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Agendar Entrevista
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDescartar(postulacion.id)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Descartar
                  </Button>
                </div>
              )}

              {postulacion.etapa === "entrevista" && (
                <Badge variant="default" className="w-full justify-center">
                  Entrevista programada
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedPostulacion && (
        <AgendarEntrevistaDialog
          open={showEntrevistaDialog}
          onOpenChange={setShowEntrevistaDialog}
          postulacionId={selectedPostulacion.id}
          candidatoUserId={selectedPostulacion.candidato_user_id}
          candidatoNombre={selectedPostulacion.perfil_candidato?.nombre_completo || "Candidato"}
          onSuccess={() => {
            loadPostulaciones();
            setShowEntrevistaDialog(false);
          }}
        />
      )}
    </>
  );
};