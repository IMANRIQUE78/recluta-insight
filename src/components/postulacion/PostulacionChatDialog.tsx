import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PostulacionChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postulacionId: string;
  destinatarioUserId: string;
  destinatarioNombre: string;
  tituloVacante: string;
}

interface Mensaje {
  id: string;
  mensaje: string;
  remitente_user_id: string;
  created_at: string;
  leido: boolean;
}

export const PostulacionChatDialog = ({
  open,
  onOpenChange,
  postulacionId,
  destinatarioUserId,
  destinatarioNombre,
  tituloVacante,
}: PostulacionChatDialogProps) => {
  const { toast } = useToast();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadMensajes();
      setupRealtimeSubscription();
      getCurrentUser();
    }
  }, [open, postulacionId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const loadMensajes = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("mensajes_postulacion")
        .select("*")
        .eq("postulacion_id", postulacionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMensajes(data || []);

      // Marcar como leídos los mensajes recibidos
      await marcarComoLeido(user.id);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeido = async (userId: string) => {
    await supabase
      .from("mensajes_postulacion")
      .update({ leido: true })
      .eq("postulacion_id", postulacionId)
      .eq("destinatario_user_id", userId)
      .eq("leido", false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`mensajes_${postulacionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_postulacion",
          filter: `postulacion_id=eq.${postulacionId}`,
        },
        (payload) => {
          setMensajes((prev) => [...prev, payload.new as Mensaje]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!nuevoMensaje.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("mensajes_postulacion")
        .insert([{
          postulacion_id: postulacionId,
          remitente_user_id: user.id,
          destinatario_user_id: destinatarioUserId,
          mensaje: nuevoMensaje.trim(),
        }]);

      if (error) throw error;

      setNuevoMensaje("");
    } catch (error: any) {
      toast({
        title: "Error al enviar mensaje",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat - {tituloVacante}</DialogTitle>
          <DialogDescription>
            Conversación con {destinatarioNombre}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : mensajes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay mensajes aún. ¡Inicia la conversación!
              </div>
            ) : (
              <div className="space-y-4">
                {mensajes.map((mensaje) => {
                  const isOwn = mensaje.remitente_user_id === currentUserId;
                  return (
                    <div
                      key={mensaje.id}
                      className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback>
                          {isOwn ? "Tú" : destinatarioNombre.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{mensaje.mensaje}</p>
                        </div>
                        <span className="text-xs text-muted-foreground px-2">
                          {formatDistanceToNow(new Date(mensaje.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Textarea
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              className="min-h-[60px] max-h-[120px]"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!nuevoMensaje.trim() || sending}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};