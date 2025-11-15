import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, Calendar, MessageSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgendarEntrevistaDialog } from "./AgendarEntrevistaDialog";
import { PostulacionDetailDialog } from "./PostulacionDetailDialog";
import { PostulacionChatDialog } from "@/components/postulacion/PostulacionChatDialog";
import { CandidateProfileViewModal } from "@/components/candidate/CandidateProfileViewModal";

interface Postulacion {
  id: string;
  fecha_postulacion: string;
  estado: string;
  etapa: string;
  notas_reclutador: string | null;
  candidato_user_id: string;
  publicacion: {
    id: string;
    titulo_puesto: string;
    vacante_id: string;
  };
  perfil?: {
    nombre_completo: string;
    email: string;
    telefono: string | null;
    puesto_actual: string | null;
    empresa_actual: string | null;
    habilidades_tecnicas: string[] | null;
    nivel_educacion: string | null;
    resumen_profesional: string | null;
  };
}

const etapaLabels: Record<string, string> = {
  recibida: "Recibida",
  revision: "En Revisión",
  entrevista: "Entrevista",
  rechazada: "Rechazada",
  contratada: "Contratada",
};

const etapaColors: Record<string, string> = {
  recibida: "bg-blue-500",
  revision: "bg-yellow-500",
  entrevista: "bg-purple-500",
  rechazada: "bg-red-500",
  contratada: "bg-green-500",
};

export const PostulacionesRecibidas = () => {
  const { toast } = useToast();
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostulacion, setSelectedPostulacion] = useState<Postulacion | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [etapaFilter, setEtapaFilter] = useState<string>("todas");
  const [agendarDialogOpen, setAgendarDialogOpen] = useState(false);
  const [agendarPostulacion, setAgendarPostulacion] = useState<{
    id: string;
    candidato_user_id: string;
    candidato_nombre: string;
  } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{
    postulacionId: string;
    candidatoUserId: string;
    candidatoNombre: string;
    tituloVacante: string;
  } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedCandidatoUserId, setSelectedCandidatoUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPostulaciones();
  }, []);

  const handleEtapaChange = async (
    postulacionId: string, 
    newEtapa: string, 
    candidatoUserId: string,
    candidatoNombre: string
  ) => {
    // Si la nueva etapa es "entrevista", abrir el diálogo de agendamiento
    if (newEtapa === "entrevista") {
      setAgendarPostulacion({
        id: postulacionId,
        candidato_user_id: candidatoUserId,
        candidato_nombre: candidatoNombre,
      });
      setAgendarDialogOpen(true);
      return;
    }

    try {
      const { error } = await supabase
        .from("postulaciones")
        .update({ 
          etapa: newEtapa,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq("id", postulacionId);

      if (error) throw error;

      toast({
        title: "Etapa actualizada",
        description: "La etapa se actualizó correctamente",
      });
      loadPostulaciones();
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAgendarSuccess = async () => {
    // Actualizar la etapa a "entrevista" después de agendar
    if (agendarPostulacion) {
      try {
        const { error } = await supabase
          .from("postulaciones")
          .update({ 
            etapa: "entrevista",
            fecha_actualizacion: new Date().toISOString()
          })
          .eq("id", agendarPostulacion.id);

        if (error) throw error;

        loadPostulaciones();
      } catch (error: any) {
        console.error("Error al actualizar etapa:", error);
      }
    }
  };

  const handleEtapaChangeFromDetail = async (postulacionId: string, newEtapa: string) => {
    try {
      const { error } = await supabase
        .from("postulaciones")
        .update({ 
          etapa: newEtapa,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq("id", postulacionId);

      if (error) throw error;

      toast({
        title: "Etapa actualizada",
        description: "La etapa se actualizó correctamente",
      });
      loadPostulaciones();
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadPostulaciones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("🔍 Cargando postulaciones para user:", user.id);

      // Obtener publicaciones marketplace del reclutador
      const { data: publicaciones, error: pubError } = await supabase
        .from("publicaciones_marketplace")
        .select("id, titulo_puesto, vacante_id")
        .eq("user_id", user.id);

      if (pubError) {
        console.error("Error obteniendo publicaciones:", pubError);
        throw pubError;
      }

      console.log("📋 Publicaciones encontradas:", publicaciones);

      const publicacionIds = publicaciones?.map(p => p.id) || [];

      if (publicacionIds.length === 0) {
        console.log("⚠️ No hay publicaciones para este reclutador");
        setPostulaciones([]);
        setLoading(false);
        return;
      }

      // Obtener postulaciones con perfil de candidato
      const { data: postulacionesData, error: postError } = await supabase
        .from("postulaciones")
        .select(`
          id,
          fecha_postulacion,
          estado,
          etapa,
          notas_reclutador,
          candidato_user_id,
          publicacion_id,
          candidato:perfil_candidato!candidato_user_id(
            nombre_completo,
            email,
            telefono,
            puesto_actual,
            empresa_actual,
            habilidades_tecnicas,
            nivel_educacion,
            resumen_profesional
          )
        `)
        .in("publicacion_id", publicacionIds)
        .order("fecha_postulacion", { ascending: false });

      if (postError) {
        console.error("Error obteniendo postulaciones:", postError);
        throw postError;
      }

      console.log("✅ Postulaciones obtenidas:", postulacionesData);

      // Combinar datos
      const postulacionesCompletas = (postulacionesData || []).map(p => ({
        ...p,
        publicacion: publicaciones?.find(pub => pub.id === p.publicacion_id) || {
          id: p.publicacion_id,
          titulo_puesto: "Vacante sin título",
          vacante_id: ""
        },
        perfil: p.candidato,
      }));

      console.log("📊 Postulaciones completas:", postulacionesCompletas);
      setPostulaciones(postulacionesCompletas);
    } catch (error: any) {
      console.error("❌ Error loading postulaciones:", error);
      toast({
        title: "Error al cargar postulaciones",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (postulacion: Postulacion) => {
    setSelectedPostulacion(postulacion);
    setDetailModalOpen(true);
  };

  const filteredPostulaciones = etapaFilter === "todas" 
    ? postulaciones 
    : postulaciones.filter(p => p.etapa === etapaFilter);

  const countByEtapa = (etapa: string) => {
    return postulaciones.filter(p => p.etapa === etapa).length;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Cargando postulaciones...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Postulaciones Recibidas</CardTitle>
        </CardHeader>
        <CardContent>
          {postulaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No has recibido postulaciones aún
            </div>
          ) : (
            <>
              <Tabs value={etapaFilter} onValueChange={setEtapaFilter} className="mb-4">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="todas">
                    Todas ({postulaciones.length})
                  </TabsTrigger>
                  <TabsTrigger value="recibida">
                    Nuevas ({countByEtapa("recibida")})
                  </TabsTrigger>
                  <TabsTrigger value="revision">
                    Revisión ({countByEtapa("revision")})
                  </TabsTrigger>
                  <TabsTrigger value="entrevista">
                    Entrevista ({countByEtapa("entrevista")})
                  </TabsTrigger>
                  <TabsTrigger value="rechazada">
                    Rechazadas ({countByEtapa("rechazada")})
                  </TabsTrigger>
                  <TabsTrigger value="contratada">
                    Contratadas ({countByEtapa("contratada")})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Vacante</TableHead>
                      <TableHead>Fecha Postulación</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPostulaciones.map((postulacion) => (
                      <TableRow key={postulacion.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                setSelectedCandidatoUserId(postulacion.candidato_user_id);
                                setShowProfileModal(true);
                              }}
                              className="font-medium text-primary hover:underline cursor-pointer text-left"
                            >
                              {postulacion.perfil?.nombre_completo || "Sin perfil"}
                            </button>
                            <span className="text-xs text-muted-foreground">
                              {postulacion.perfil?.puesto_actual || "Sin puesto actual"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {postulacion.publicacion.titulo_puesto}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(postulacion.fecha_postulacion).toLocaleDateString('es-MX')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={etapaColors[postulacion.etapa]}>
                            {etapaLabels[postulacion.etapa]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerDetalle(postulacion)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedChat({
                                  postulacionId: postulacion.id,
                                  candidatoUserId: postulacion.candidato_user_id,
                                  candidatoNombre: postulacion.perfil?.nombre_completo || "Candidato",
                                  tituloVacante: postulacion.publicacion.titulo_puesto,
                                });
                                setChatOpen(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                            {postulacion.etapa === "recibida" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setAgendarPostulacion({
                                    id: postulacion.id,
                                    candidato_user_id: postulacion.candidato_user_id,
                                    candidato_nombre: postulacion.perfil?.nombre_completo || "Candidato",
                                  });
                                  setAgendarDialogOpen(true);
                                }}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Agendar Entrevista
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedPostulacion && (
        <PostulacionDetailDialog
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          postulacion={selectedPostulacion}
          onEtapaChange={(newEtapa) => handleEtapaChangeFromDetail(selectedPostulacion.id, newEtapa)}
        />
      )}

      {agendarPostulacion && (
        <AgendarEntrevistaDialog
          open={agendarDialogOpen}
          onOpenChange={setAgendarDialogOpen}
          postulacionId={agendarPostulacion.id}
          candidatoUserId={agendarPostulacion.candidato_user_id}
          candidatoNombre={agendarPostulacion.candidato_nombre}
          onSuccess={handleAgendarSuccess}
        />
      )}

      {selectedChat && (
        <PostulacionChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          postulacionId={selectedChat.postulacionId}
          destinatarioUserId={selectedChat.candidatoUserId}
          destinatarioNombre={selectedChat.candidatoNombre}
          tituloVacante={selectedChat.tituloVacante}
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
