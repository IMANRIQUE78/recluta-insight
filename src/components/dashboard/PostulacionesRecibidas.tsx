import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Mail, Phone, Briefcase, GraduationCap, Edit2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    anos_experiencia: number | null;
    nivel_seniority: string | null;
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
  const [editingPostulacion, setEditingPostulacion] = useState<string | null>(null);
  const [notasTemp, setNotasTemp] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadPostulaciones();
  }, []);

  const handleEtapaChange = async (postulacionId: string, newEtapa: string) => {
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

  const handleNotasChange = (postulacionId: string, notas: string) => {
    setNotasTemp({ ...notasTemp, [postulacionId]: notas });
  };

  const handleSaveNotas = async (postulacionId: string) => {
    try {
      const { error } = await supabase
        .from("postulaciones")
        .update({ 
          notas_reclutador: notasTemp[postulacionId] || "",
          fecha_actualizacion: new Date().toISOString()
        })
        .eq("id", postulacionId);

      if (error) throw error;

      toast({
        title: "Notas guardadas",
        description: "Las notas se guardaron correctamente",
      });
      setEditingPostulacion(null);
      loadPostulaciones();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadPostulaciones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener postulaciones a mis publicaciones
      const { data, error } = await supabase
        .from("postulaciones")
        .select(`
          id,
          fecha_postulacion,
          estado,
          etapa,
          notas_reclutador,
          candidato_user_id,
          publicacion:publicaciones_marketplace(
            id,
            titulo_puesto,
            vacante_id
          )
        `)
        .order("fecha_postulacion", { ascending: false });

      if (error) throw error;

      // Cargar perfiles de candidatos
      if (data && data.length > 0) {
        const candidatoIds = data.map(p => p.candidato_user_id);
        const { data: perfiles, error: perfilesError } = await supabase
          .from("perfil_candidato")
          .select("*")
          .in("user_id", candidatoIds);

        if (perfilesError) throw perfilesError;

        // Combinar datos
        const postulacionesConPerfil = data.map(p => ({
          ...p,
          perfil: perfiles?.find(pf => pf.user_id === p.candidato_user_id),
        }));

        setPostulaciones(postulacionesConPerfil);
      } else {
        setPostulaciones([]);
      }
    } catch (error: any) {
      console.error("Error loading postulaciones:", error);
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
                      <TableHead>Contacto</TableHead>
                      <TableHead>Vacante</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Notas Reclutador</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPostulaciones.map((postulacion) => (
                      <TableRow key={postulacion.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {postulacion.perfil?.nombre_completo || "Sin perfil"}
                            </span>
                            {postulacion.perfil?.anos_experiencia && (
                              <span className="text-xs text-muted-foreground">
                                {postulacion.perfil.anos_experiencia} años exp.
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {postulacion.perfil?.email || "N/A"}
                            </div>
                            {postulacion.perfil?.telefono && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {postulacion.perfil.telefono}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{postulacion.publicacion.titulo_puesto}</TableCell>
                        <TableCell>
                          {new Date(postulacion.fecha_postulacion).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={postulacion.etapa}
                            onValueChange={(value) => handleEtapaChange(postulacion.id, value)}
                          >
                            <SelectTrigger className="w-[140px] bg-background">
                              <SelectValue>
                                <Badge className={etapaColors[postulacion.etapa]}>
                                  {etapaLabels[postulacion.etapa]}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              {Object.entries(etapaLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  <Badge className={etapaColors[key]}>
                                    {label}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {editingPostulacion === postulacion.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={notasTemp[postulacion.id] ?? postulacion.notas_reclutador ?? ""}
                                onChange={(e) => handleNotasChange(postulacion.id, e.target.value)}
                                placeholder="Añadir notas privadas sobre el candidato..."
                                className="min-h-[80px]"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveNotas(postulacion.id)}>
                                  Guardar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setEditingPostulacion(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <p className="text-sm text-muted-foreground flex-1 line-clamp-2">
                                {postulacion.notas_reclutador || "Sin notas"}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setEditingPostulacion(postulacion.id);
                                  setNotasTemp({ 
                                    ...notasTemp, 
                                    [postulacion.id]: postulacion.notas_reclutador || "" 
                                  });
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerDetalle(postulacion)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Perfil
                          </Button>
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
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Perfil del Candidato - {selectedPostulacion.publicacion.titulo_puesto}
              </DialogTitle>
            </DialogHeader>
            
            {selectedPostulacion.perfil ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Información de Contacto</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPostulacion.perfil.email}</span>
                      </div>
                      {selectedPostulacion.perfil.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPostulacion.perfil.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Experiencia</h3>
                    <div className="space-y-2 text-sm">
                      {selectedPostulacion.perfil.puesto_actual && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPostulacion.perfil.puesto_actual}</span>
                        </div>
                      )}
                      {selectedPostulacion.perfil.empresa_actual && (
                        <div className="text-muted-foreground">
                          {selectedPostulacion.perfil.empresa_actual}
                        </div>
                      )}
                      <div>
                        <Badge variant="secondary">
                          {selectedPostulacion.perfil.anos_experiencia || 0} años de experiencia
                        </Badge>
                      </div>
                      {selectedPostulacion.perfil.nivel_seniority && (
                        <div>
                          <Badge variant="outline">
                            {selectedPostulacion.perfil.nivel_seniority}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedPostulacion.perfil.resumen_profesional && (
                  <div>
                    <h3 className="font-semibold mb-2">Resumen Profesional</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPostulacion.perfil.resumen_profesional}
                    </p>
                  </div>
                )}

                {selectedPostulacion.perfil.habilidades_tecnicas && 
                 selectedPostulacion.perfil.habilidades_tecnicas.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Habilidades Técnicas</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPostulacion.perfil.habilidades_tecnicas.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPostulacion.perfil.nivel_educacion && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Educación
                    </h3>
                    <p className="text-sm">{selectedPostulacion.perfil.nivel_educacion}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Estado de la Postulación</h3>
                  <div className="flex items-center gap-4">
                    <Badge className={etapaColors[selectedPostulacion.etapa]}>
                      {etapaLabels[selectedPostulacion.etapa]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Postulado el {new Date(selectedPostulacion.fecha_postulacion).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  {selectedPostulacion.notas_reclutador && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-semibold mb-1">Notas:</p>
                      <p className="text-sm">{selectedPostulacion.notas_reclutador}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                El candidato no ha completado su perfil
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
