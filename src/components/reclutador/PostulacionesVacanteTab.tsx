import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Settings, MessageSquare } from "lucide-react";
import { CandidateProfileViewModal } from "@/components/candidate/CandidateProfileViewModal";
import { GestionEstatusPostulacionDialog } from "./GestionEstatusPostulacionDialog";

interface PostulacionesVacanteTabProps {
  publicacionId: string;
}

export const PostulacionesVacanteTab = ({ publicacionId }: PostulacionesVacanteTabProps) => {
  const { toast } = useToast();
  const [postulaciones, setPostulaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostulacion, setSelectedPostulacion] = useState<any>(null);
  const [showGestionDialog, setShowGestionDialog] = useState(false);
  const [selectedCandidatoUserId, setSelectedCandidatoUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    loadPostulaciones();
  }, [publicacionId]);

  const loadPostulaciones = async () => {
    try {
      console.log("🔍 Cargando postulaciones para publicación:", publicacionId);

      const { data, error } = await supabase
        .from("postulaciones")
        .select(`
          id,
          candidato_user_id,
          publicacion_id,
          fecha_postulacion,
          estado,
          etapa,
          notas_reclutador,
          fecha_actualizacion,
          candidato:perfil_candidato!candidato_user_id(
            nombre_completo,
            email,
            telefono,
            ubicacion,
            salario_esperado_min,
            salario_esperado_max,
            modalidad_preferida,
            disponibilidad
          )
        `)
        .eq("publicacion_id", publicacionId)
        .order("fecha_postulacion", { ascending: false });

      if (error) {
        console.error("❌ Error loading postulaciones:", error);
        throw error;
      }

      console.log("✅ Postulaciones cargadas:", data);
      setPostulaciones(data || []);
    } catch (error: any) {
      console.error("❌ Error en loadPostulaciones:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGestionarEstatus = (postulacion: any) => {
    setSelectedPostulacion(postulacion);
    setShowGestionDialog(true);
  };

  const getEtapaColor = (etapa: string) => {
    if (etapa?.includes("entrevista")) return "default";
    if (etapa === "contratado") return "default";
    if (etapa?.includes("no_viable") || etapa === "descartado" || etapa?.includes("no_")) return "destructive";
    if (etapa === "continua_proceso") return "secondary";
    return "outline";
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
                    <button
                      onClick={() => {
                        setSelectedCandidatoUserId(postulacion.candidato_user_id);
                        setShowProfileModal(true);
                      }}
                      className="font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {postulacion.candidato?.nombre_completo || "Candidato"}
                    </button>
                    <Badge variant={getEtapaColor(postulacion.etapa)}>
                      {postulacion.etapa}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {postulacion.candidato?.email}
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
                  <p>{postulacion.candidato?.ubicacion || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teléfono:</span>
                  <p>{postulacion.candidato?.telefono || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sueldo Pretendido:</span>
                  <p className="font-medium">
                    {postulacion.candidato?.salario_esperado_min && postulacion.candidato?.salario_esperado_max
                      ? `$${postulacion.candidato.salario_esperado_min.toLocaleString()} - $${postulacion.candidato.salario_esperado_max.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Modalidad:</span>
                  <p className="capitalize">{postulacion.candidato?.modalidad_preferida || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Disponibilidad:</span>
                  <p className="capitalize">{postulacion.candidato?.disponibilidad?.replace("_", " ") || "N/A"}</p>
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

              <Button
                size="sm"
                className="w-full"
                onClick={() => handleGestionarEstatus(postulacion)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Gestionar Estatus
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedPostulacion && (
        <GestionEstatusPostulacionDialog
          open={showGestionDialog}
          onOpenChange={setShowGestionDialog}
          postulacion={selectedPostulacion}
          onSuccess={loadPostulaciones}
        />
      )}

      {selectedCandidatoUserId && (
        <CandidateProfileViewModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          candidatoUserId={selectedCandidatoUserId}
        />
      )}
    </>
  );
};