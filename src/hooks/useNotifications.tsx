import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: 'postulacion' | 'entrevista' | 'mensaje' | 'feedback' | 'requisicion';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = (userId: string | null, reclutadorId?: string | null) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Suscripción a nuevas postulaciones (para reclutadores)
    const postulacionesChannel = supabase
      .channel('postulaciones_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'postulaciones',
        },
        async (payload) => {
          // Verificar si el reclutador es dueño de la publicación
          const { data: publicacion } = await supabase
            .from('publicaciones_marketplace')
            .select('user_id, titulo_puesto')
            .eq('id', payload.new.publicacion_id)
            .single();

          if (publicacion?.user_id === userId) {
            toast({
              title: "Nueva postulación",
              description: `Tienes una nueva postulación para ${publicacion.titulo_puesto}`,
            });
          }
        }
      )
      .subscribe();

    // Suscripción a nuevas entrevistas (para candidatos)
    const entrevistasChannel = supabase
      .channel('entrevistas_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'entrevistas_candidato',
          filter: `candidato_user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.estado === 'propuesta') {
            toast({
              title: "Nueva propuesta de entrevista",
              description: "Tienes una nueva propuesta de entrevista pendiente",
            });
          }
        }
      )
      .subscribe();

    // Suscripción a nuevos mensajes
    const mensajesChannel = supabase
      .channel('mensajes_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_postulacion',
          filter: `destinatario_user_id=eq.${userId}`,
        },
        (payload) => {
          toast({
            title: "Nuevo mensaje",
            description: "Tienes un nuevo mensaje en una postulación",
          });
        }
      )
      .subscribe();

    // Suscripción a nuevo feedback (para candidatos)
    const feedbackChannel = supabase
      .channel('feedback_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback_candidato',
          filter: `candidato_user_id=eq.${userId}`,
        },
        (payload) => {
          toast({
            title: "Nuevo feedback recibido",
            description: "Has recibido feedback sobre tu entrevista",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postulacionesChannel);
      supabase.removeChannel(entrevistasChannel);
      supabase.removeChannel(mensajesChannel);
      supabase.removeChannel(feedbackChannel);
    };
  }, [userId, toast]);

  // Suscripción a nuevas requisiciones asignadas (para reclutadores)
  useEffect(() => {
    if (!reclutadorId) return;

    const vacantesChannel = supabase
      .channel('vacantes_asignadas_reclutador')
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
            toast({
              title: "🆕 Nueva requisición asignada",
              description: `Se te ha asignado la vacante "${payload.new.titulo_puesto}". Revisa tu bandeja para publicarla.`,
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vacantesChannel);
    };
  }, [reclutadorId, toast]);

  return { notifications, unreadCount };
};