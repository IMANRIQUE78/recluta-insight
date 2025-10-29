import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, MapPin, Phone, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProximaEntrevista {
  id: string;
  fecha_entrevista: string;
  tipo_entrevista: string;
  duracion_minutos: number;
  notas: string;
  detalles_reunion: string | null;
  estado: string;
  candidato_nombre: string;
  titulo_puesto: string;
}

export function ProximasEntrevistasCard() {
  const [entrevistas, setEntrevistas] = useState<ProximaEntrevista[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntrevista, setSelectedEntrevista] = useState<ProximaEntrevista | null>(null);
  const [completarDialogOpen, setCompletarDialogOpen] = useState(false);
  const [comentarios, setComentarios] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadEntrevistas();
  }, []);

  const loadEntrevistas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const ahora = new Date().toISOString();

      const { data, error } = await supabase
        .from("entrevistas_candidato")
        .select(`
          id,
          fecha_entrevista,
          tipo_entrevista,
          duracion_minutos,
          notas,
          detalles_reunion,
          estado,
          postulacion:postulaciones(
            candidato:perfil_candidato(nombre_completo),
            publicacion:publicaciones_marketplace(titulo_puesto)
          )
        `)
        .eq("reclutador_user_id", session.user.id)
        .eq("estado", "aceptada")
        .gte("fecha_entrevista", ahora)
        .order("fecha_entrevista", { ascending: true })
        .limit(5);

      if (error) throw error;

      const formattedData = (data || []).map((e: any) => ({
        id: e.id,
        fecha_entrevista: e.fecha_entrevista,
        tipo_entrevista: e.tipo_entrevista,
        duracion_minutos: e.duracion_minutos,
        notas: e.notas,
        detalles_reunion: e.detalles_reunion,
        estado: e.estado,
        candidato_nombre: e.postulacion?.candidato?.nombre_completo || "Sin nombre",
        titulo_puesto: e.postulacion?.publicacion?.titulo_puesto || "Sin título",
      }));

      setEntrevistas(formattedData);
    } catch (error) {
      console.error("Error loading entrevistas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletar = (entrevista: ProximaEntrevista) => {
    setSelectedEntrevista(entrevista);
    setCompletarDialogOpen(true);
  };

  const handleGuardarCompletar = async () => {
    if (!selectedEntrevista) return;

    try {
      // Actualizar estado de entrevista
      const { error: entrevistaError } = await supabase
        .from("entrevistas_candidato")
        .update({
          estado: "completada",
          asistio: true,
          notas: comentarios || selectedEntrevista.notas,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedEntrevista.id);

      if (entrevistaError) throw entrevistaError;

      // Obtener postulacion_id de la entrevista
      const { data: entrevistaData } = await supabase
        .from("entrevistas_candidato")
        .select("postulacion_id")
        .eq("id", selectedEntrevista.id)
        .single();

      if (entrevistaData) {
        // Actualizar etapa de postulación a "revision" (post-entrevista)
        const { error: postulacionError } = await supabase
          .from("postulaciones")
          .update({ 
            etapa: "revision",
            fecha_actualizacion: new Date().toISOString()
          })
          .eq("id", entrevistaData.postulacion_id);

        if (postulacionError) console.error("Error actualizando postulación:", postulacionError);
      }

      toast({
        title: "Entrevista completada",
        description: "La entrevista ha sido marcada como completada",
      });

      setCompletarDialogOpen(false);
      setComentarios("");
      setSelectedEntrevista(null);
      loadEntrevistas();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la entrevista",
        variant: "destructive",
      });
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "virtual": return <Video className="h-4 w-4" />;
      case "presencial": return <MapPin className="h-4 w-4" />;
      case "telefonica": return <Phone className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Entrevistas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Próximas Entrevistas</CardTitle>
        </CardHeader>
        <CardContent>
          {entrevistas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tienes entrevistas programadas</p>
          ) : (
            <div className="space-y-4">
              {entrevistas.map((entrevista) => (
                <div key={entrevista.id} className="flex items-start justify-between border-l-4 border-primary pl-4 py-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getTipoIcon(entrevista.tipo_entrevista)}
                      <span className="font-medium">{entrevista.titulo_puesto}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entrevista.candidato_nombre}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entrevista.fecha_entrevista), "PPP", { locale: es })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(entrevista.fecha_entrevista), "p", { locale: es })}
                      </div>
                    </div>
                    {entrevista.detalles_reunion && (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded mt-1">
                        {entrevista.detalles_reunion}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleCompletar(entrevista)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Completar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={completarDialogOpen} onOpenChange={setCompletarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar Entrevista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Comentarios adicionales (opcional)</Label>
              <Textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Agrega comentarios sobre cómo fue la entrevista..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarCompletar}>
              Marcar como Completada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
