import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertTriangle, 
  Calendar, 
  FileText, 
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttentionItem {
  id: string;
  type: "entrevista_pendiente" | "postulacion_nueva" | "feedback_pendiente" | "requisicion_sin_publicar";
  title: string;
  subtitle: string;
  urgency: "alta" | "media" | "baja";
  data?: any;
}

interface AttentionBadgesReclutadorProps {
  reclutadorUserId: string;
  reclutadorId?: string;
  onItemClick?: (item: AttentionItem) => void;
  refreshTrigger?: number;
}

export const AttentionBadgesReclutador = ({ 
  reclutadorUserId, 
  reclutadorId,
  onItemClick, 
  refreshTrigger 
}: AttentionBadgesReclutadorProps) => {
  const [items, setItems] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reclutadorUserId) {
      loadAttentionItems();
    }
  }, [reclutadorUserId, reclutadorId, refreshTrigger]);

  // Suscripción en tiempo real a nuevas vacantes asignadas
  useEffect(() => {
    if (!reclutadorId) return;

    const channel = supabase
      .channel('vacantes_asignadas_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vacantes',
        },
        async (payload) => {
          // Verificar si la vacante fue asignada a este reclutador
          if (payload.new.reclutador_asignado_id === reclutadorId && 
              payload.old.reclutador_asignado_id !== reclutadorId) {
            // Recargar items
            loadAttentionItems();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reclutadorId]);

  const loadAttentionItems = async () => {
    try {
      const attentionItems: AttentionItem[] = [];

      // Obtener el reclutador_id si no lo tenemos
      let currentReclutadorId = reclutadorId;
      if (!currentReclutadorId) {
        const { data: perfil } = await supabase
          .from("perfil_reclutador")
          .select("id")
          .eq("user_id", reclutadorUserId)
          .single();
        currentReclutadorId = perfil?.id;
      }

      // 0. NUEVO: Requisiciones asignadas pendientes de publicar
      if (currentReclutadorId) {
        const { data: vacantesAsignadas } = await supabase
          .from("vacantes")
          .select(`
            id,
            folio,
            titulo_puesto,
            fecha_solicitud,
            empresas (
              nombre_empresa
            ),
            clientes_areas (
              cliente_nombre,
              area
            )
          `)
          .eq("reclutador_asignado_id", currentReclutadorId)
          .eq("estatus", "abierta");

        if (vacantesAsignadas && vacantesAsignadas.length > 0) {
          // Verificar cuáles NO tienen publicación en marketplace
          const vacanteIds = vacantesAsignadas.map(v => v.id);
          const { data: publicaciones } = await supabase
            .from("publicaciones_marketplace")
            .select("vacante_id")
            .in("vacante_id", vacanteIds);

          const vacantesPublicadas = new Set(publicaciones?.map(p => p.vacante_id) || []);

          vacantesAsignadas.forEach((vac: any) => {
            if (!vacantesPublicadas.has(vac.id)) {
              const empresa = vac.empresas?.nombre_empresa || 
                            `${vac.clientes_areas?.cliente_nombre} - ${vac.clientes_areas?.area}`;
              attentionItems.push({
                id: vac.id,
                type: "requisicion_sin_publicar",
                title: vac.titulo_puesto,
                subtitle: `${empresa} • ${vac.folio} • Pendiente de publicar`,
                urgency: "alta",
                data: vac
              });
            }
          });
        }
      }

      // 1. Entrevistas propuestas pendientes de respuesta del candidato
      const { data: entrevistasPendientes } = await supabase
        .from("entrevistas_candidato")
        .select(`
          id,
          fecha_entrevista,
          tipo_entrevista,
          postulacion_id,
          postulaciones:postulacion_id (
            publicacion_id,
            publicaciones_marketplace:publicacion_id (
              titulo_puesto
            )
          ),
          perfil_candidato:candidato_user_id (
            nombre_completo
          )
        `)
        .eq("reclutador_user_id", reclutadorUserId)
        .eq("estado", "propuesta");

      if (entrevistasPendientes) {
        entrevistasPendientes.forEach((ent: any) => {
          const tituloPuesto = ent.postulaciones?.publicaciones_marketplace?.titulo_puesto || "Vacante";
          const nombreCandidato = ent.perfil_candidato?.nombre_completo || "Candidato";
          attentionItems.push({
            id: ent.id,
            type: "entrevista_pendiente",
            title: nombreCandidato,
            subtitle: `${tituloPuesto} • Esperando confirmación`,
            urgency: "alta",
            data: ent
          });
        });
      }

      // 2. Postulaciones nuevas sin revisar (etapa = 'recibida')
      const { data: postulacionesNuevas } = await supabase
        .from("publicaciones_marketplace")
        .select(`
          id,
          titulo_puesto,
          postulaciones (
            id,
            fecha_postulacion,
            etapa,
            perfil_candidato:candidato_user_id (
              nombre_completo
            )
          )
        `)
        .eq("user_id", reclutadorUserId)
        .eq("publicada", true);

      if (postulacionesNuevas) {
        postulacionesNuevas.forEach((pub: any) => {
          const postulacionesSinRevisar = pub.postulaciones?.filter(
            (p: any) => p.etapa === "recibida"
          ) || [];
          
          postulacionesSinRevisar.forEach((post: any) => {
            attentionItems.push({
              id: post.id,
              type: "postulacion_nueva",
              title: post.perfil_candidato?.nombre_completo || "Candidato",
              subtitle: `${pub.titulo_puesto} • Nueva postulación`,
              urgency: "media",
              data: { ...post, titulo_puesto: pub.titulo_puesto, publicacion_id: pub.id }
            });
          });
        });
      }

      // 3. Entrevistas completadas sin feedback
      const { data: entrevistasCompletadas } = await supabase
        .from("entrevistas_candidato")
        .select(`
          id,
          candidato_user_id,
          postulacion_id,
          fecha_entrevista,
          postulaciones:postulacion_id (
            publicacion_id,
            publicaciones_marketplace:publicacion_id (
              titulo_puesto
            )
          ),
          perfil_candidato:candidato_user_id (
            nombre_completo
          )
        `)
        .eq("reclutador_user_id", reclutadorUserId)
        .eq("estado", "completada")
        .eq("asistio", true);

      if (entrevistasCompletadas) {
        // Verificar cuáles no tienen feedback
        const postulacionIds = entrevistasCompletadas.map((e: any) => e.postulacion_id);
        
        if (postulacionIds.length > 0) {
          const { data: feedbacksExistentes } = await supabase
            .from("feedback_candidato")
            .select("postulacion_id")
            .in("postulacion_id", postulacionIds)
            .eq("reclutador_user_id", reclutadorUserId);

          const postulacionesConFeedback = new Set(
            feedbacksExistentes?.map((f: any) => f.postulacion_id) || []
          );

          entrevistasCompletadas.forEach((ent: any) => {
            if (!postulacionesConFeedback.has(ent.postulacion_id)) {
              const tituloPuesto = ent.postulaciones?.publicaciones_marketplace?.titulo_puesto || "Vacante";
              const nombreCandidato = ent.perfil_candidato?.nombre_completo || "Candidato";
              attentionItems.push({
                id: ent.id,
                type: "feedback_pendiente",
                title: nombreCandidato,
                subtitle: `${tituloPuesto} • Feedback pendiente`,
                urgency: "baja",
                data: ent
              });
            }
          });
        }
      }

      setItems(attentionItems);
    } catch (error) {
      console.error("Error loading attention items:", error);
    } finally {
      setLoading(false);
    }
  };

  const requisicionSinPublicarItems = items.filter(i => i.type === "requisicion_sin_publicar");
  const entrevistaPendienteItems = items.filter(i => i.type === "entrevista_pendiente");
  const postulacionNuevaItems = items.filter(i => i.type === "postulacion_nueva");
  const feedbackPendienteItems = items.filter(i => i.type === "feedback_pendiente");

  const renderCard = (
    title: string,
    icon: React.ReactNode,
    sectionItems: AttentionItem[],
    emptyColor: string,
    alertColor: string
  ) => {
    const isEmpty = sectionItems.length === 0;
    
    return (
      <Card className={cn(
        "transition-all",
        isEmpty 
          ? `border-dashed ${emptyColor}` 
          : alertColor
      )}>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              {icon}
              {title}
            </div>
            {!isEmpty && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {sectionItems.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {loading ? (
            <div className="text-sm text-muted-foreground animate-pulse">Cargando...</div>
          ) : isEmpty ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Todo al día</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sectionItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick?.(item)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-background/60 hover:bg-background border border-border/50 transition-all cursor-pointer text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
              {sectionItems.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{sectionItems.length - 5} más
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold">Lo que requiere mi atención</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {renderCard(
          "Requisiciones por Publicar",
          <Megaphone className="h-4 w-4 text-purple-600" />,
          requisicionSinPublicarItems,
          "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
          "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20"
        )}
        {renderCard(
          "Entrevistas Sin Confirmar",
          <Calendar className="h-4 w-4 text-red-600" />,
          entrevistaPendienteItems,
          "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
          "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
        )}
        {renderCard(
          "Postulaciones Nuevas",
          <FileText className="h-4 w-4 text-amber-600" />,
          postulacionNuevaItems,
          "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
          "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
        )}
        {renderCard(
          "Feedback Pendiente",
          <MessageSquare className="h-4 w-4 text-blue-600" />,
          feedbackPendienteItems,
          "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
          "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
        )}
      </div>
    </div>
  );
};
