import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, Clock, MapPin, Video, Users, CheckCircle, XCircle, 
  MessageSquare, Send, User, Eye 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CandidateProfileViewModal } from "@/components/candidate/CandidateProfileViewModal";

interface Entrevista {
  id: string;
  fecha_entrevista: string;
  duracion_minutos: number | null;
  tipo_entrevista: string | null;
  detalles_reunion: string | null;
  notas: string | null;
  estado: string;
}

interface Nota {
  id: string;
  tipo: 'reclutador' | 'candidato';
  contenido: string;
  created_at: string;
  autor: string;
}

interface PostulacionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postulacion: any;
  onEtapaChange: (newEtapa: string) => void;
}

export const PostulacionDetailDialog = ({ 
  open, 
  onOpenChange, 
  postulacion,
  onEtapaChange 
}: PostulacionDetailDialogProps) => {
  const { toast } = useToast();
  const [entrevista, setEntrevista] = useState<Entrevista | null>(null);
  const [nuevaNota, setNuevaNota] = useState("");
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (open && postulacion) {
      loadEntrevistaYNotas();
    }
  }, [open, postulacion]);

  const loadEntrevistaYNotas = async () => {
    try {
      // Cargar entrevista
      const { data: entrevistaData } = await supabase
        .from("entrevistas_candidato")
        .select("*")
        .eq("postulacion_id", postulacion.id)
        .maybeSingle();

      setEntrevista(entrevistaData);

      // Simular notas desde notas_reclutador
      const notasArray: Nota[] = [];
      if (postulacion.notas_reclutador) {
        notasArray.push({
          id: "nota-reclutador",
          tipo: 'reclutador',
          contenido: postulacion.notas_reclutador,
          created_at: postulacion.fecha_actualizacion || postulacion.fecha_postulacion,
          autor: "Reclutador"
        });
      }

      setNotas(notasArray);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const handleAgregarNota = async () => {
    if (!nuevaNota.trim()) return;

    setLoading(true);
    try {
      // Agregar la nota a las notas del reclutador
      const notasActuales = postulacion.notas_reclutador || "";
      const nuevasNotas = notasActuales 
        ? `${notasActuales}\n\n[${new Date().toLocaleString('es-MX')}] ${nuevaNota}`
        : `[${new Date().toLocaleString('es-MX')}] ${nuevaNota}`;

      const { error } = await supabase
        .from("postulaciones")
        .update({ 
          notas_reclutador: nuevasNotas,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq("id", postulacion.id);

      if (error) throw error;

      toast({
        title: "Nota agregada",
        description: "La nota se guardó correctamente",
      });

      setNuevaNota("");
      loadEntrevistaYNotas();
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

  const handleAvanzar = async () => {
    const nuevaEtapa = postulacion.etapa === "entrevista" ? "contratada" : "revision";
    await onEtapaChange(nuevaEtapa);
    
    // Si se contrató, cerrar la vacante
    if (nuevaEtapa === "contratada") {
      try {
        const { data: publicacion } = await supabase
          .from("publicaciones_marketplace")
          .select("vacante_id")
          .eq("id", postulacion.publicacion_id)
          .single();

        if (publicacion) {
          await supabase
            .from("vacantes")
            .update({ 
              estatus: "cerrada",
              fecha_cierre: new Date().toISOString()
            })
            .eq("id", publicacion.vacante_id);

          // Recalcular estadísticas
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.rpc("recalcular_estadisticas_reclutador", {
              p_user_id: user.id
            });
          }
        }
      } catch (error) {
        console.error("Error cerrando vacante:", error);
      }
    }

    toast({
      title: "Candidato avanzado",
      description: nuevaEtapa === "contratada" 
        ? "Candidato contratado y vacante cerrada" 
        : "El candidato ha sido movido a la siguiente etapa",
    });
    onOpenChange(false);
  };

  const handleDescartar = async () => {
    await onEtapaChange("rechazada");
    toast({
      title: "Candidato descartado",
      description: "El candidato ha sido rechazado",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {postulacion?.perfil?.nombre_completo || "Candidato"}
            <Badge variant="secondary">{postulacion?.publicacion?.titulo_puesto}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Columna izquierda: Información del candidato */}
          <div className="space-y-4">
            {/* Información del Candidato */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Información del Candidato</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProfileModal(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Perfil Completo
                </Button>
              </div>
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg text-sm">
                {postulacion?.perfil?.email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{postulacion.perfil.email}</p>
                  </div>
                )}
                {postulacion?.perfil?.telefono && (
                  <div>
                    <span className="text-muted-foreground">Teléfono:</span>
                    <p className="font-medium">{postulacion.perfil.telefono}</p>
                  </div>
                )}
                {postulacion?.perfil?.ubicacion && (
                  <div>
                    <span className="text-muted-foreground">Ubicación:</span>
                    <p className="font-medium">{postulacion.perfil.ubicacion}</p>
                  </div>
                )}
                {(postulacion?.perfil?.salario_esperado_min || postulacion?.perfil?.salario_esperado_max) && (
                  <div>
                    <span className="text-muted-foreground">Sueldo Pretendido:</span>
                    <p className="font-medium">
                      ${postulacion.perfil.salario_esperado_min?.toLocaleString() || "0"} - ${postulacion.perfil.salario_esperado_max?.toLocaleString() || "0"}
                    </p>
                  </div>
                )}
                {postulacion?.perfil?.modalidad_preferida && (
                  <div>
                    <span className="text-muted-foreground">Modalidad Preferida:</span>
                    <p className="font-medium capitalize">{postulacion.perfil.modalidad_preferida}</p>
                  </div>
                )}
                {postulacion?.perfil?.disponibilidad && (
                  <div>
                    <span className="text-muted-foreground">Disponibilidad:</span>
                    <p className="font-medium capitalize">{postulacion.perfil.disponibilidad.replace("_", " ")}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Detalles de la Entrevista */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Detalles de la Entrevista</h3>
            
            {entrevista ? (
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(entrevista.fecha_entrevista).toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(entrevista.fecha_entrevista).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {entrevista.duracion_minutos && ` (${entrevista.duracion_minutos} min)`}
                  </span>
                </div>

                {entrevista.tipo_entrevista && (
                  <div className="flex items-center gap-2 text-sm">
                    {entrevista.tipo_entrevista === 'virtual' ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : entrevista.tipo_entrevista === 'presencial' ? (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="capitalize">{entrevista.tipo_entrevista}</span>
                  </div>
                )}

                {entrevista.detalles_reunion && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Detalles de la reunión:</p>
                    <p className="text-sm">{entrevista.detalles_reunion}</p>
                  </div>
                )}

                {entrevista.notas && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Notas de la entrevista:</p>
                    <p className="text-sm">{entrevista.notas}</p>
                  </div>
                )}

                <div className="pt-2">
                  <Badge variant={entrevista.estado === 'aceptada' ? 'default' : 'secondary'}>
                    {entrevista.estado === 'aceptada' ? 'Confirmada' : 
                     entrevista.estado === 'propuesta' ? 'Pendiente de confirmar' : 
                     entrevista.estado}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay entrevista agendada</p>
              </div>
            )}

            {/* Controles de decisión */}
            {postulacion?.etapa === "entrevista" && entrevista && (
              <div className="space-y-2 pt-4">
                <p className="text-sm font-medium text-muted-foreground">Decisión post-entrevista:</p>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleAvanzar}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Avanzar a Contratación
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleDescartar}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Descartar
                  </Button>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Columna derecha: Chat de notas */}
          <div className="flex flex-col h-[500px]">
            <h3 className="font-semibold text-lg mb-4">Notas del Proceso</h3>
            
            <ScrollArea className="flex-1 border rounded-lg p-4 mb-4">
              <div className="space-y-4">
                {notas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay notas aún</p>
                  </div>
                ) : (
                  notas.map((nota) => (
                    <div 
                      key={nota.id} 
                      className={`flex gap-3 ${
                        nota.tipo === 'reclutador' ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        nota.tipo === 'reclutador' ? 'bg-primary/10' : 'bg-blue-500/10'
                      }`}>
                        <User className="h-4 w-4" />
                      </div>
                      <div className={`flex-1 ${
                        nota.tipo === 'reclutador' ? 'text-left' : 'text-right'
                      }`}>
                        <div className={`inline-block rounded-lg px-4 py-2 ${
                          nota.tipo === 'reclutador' 
                            ? 'bg-muted' 
                            : 'bg-blue-500/20'
                        }`}>
                          <p className="text-sm font-medium mb-1">{nota.autor}</p>
                          <p className="text-sm whitespace-pre-wrap">{nota.contenido}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(nota.created_at).toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                placeholder="Escribe una nota sobre el candidato..."
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                className="min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAgregarNota();
                  }
                }}
              />
              <Button 
                onClick={handleAgregarNota} 
                disabled={loading || !nuevaNota.trim()}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {postulacion?.candidato_user_id && (
        <CandidateProfileViewModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          candidatoUserId={postulacion.candidato_user_id}
          hasFullAccess={true}
        />
      )}
    </Dialog>
  );
};
