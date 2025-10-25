import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, Video, Phone, Check, X, Mail, MessageSquare, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EntrevistaPropuesta {
  id: string;
  fecha_entrevista: string;
  tipo_entrevista: string;
  duracion_minutos: number;
  notas: string;
  estado: string;
  detalles_reunion?: string;
  postulaciones: {
    publicaciones_marketplace: {
      titulo_puesto: string;
      vacantes: {
        perfil_usuario: {
          nombre_empresa: string;
        };
      };
    };
  };
}

interface EntrevistaPropuestaCardProps {
  entrevista: EntrevistaPropuesta;
  onUpdate: () => void;
}

export function EntrevistaPropuestaCard({ entrevista, onUpdate }: EntrevistaPropuestaCardProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [detallesReunion, setDetallesReunion] = useState("");
  const [showDetallesForm, setShowDetallesForm] = useState(false);
  const { toast } = useToast();

  const handleAceptar = async () => {
    setIsResponding(true);
    try {
      const { error } = await supabase
        .from("entrevistas_candidato")
        .update({ 
          estado: "aceptada",
          updated_at: new Date().toISOString(),
        })
        .eq("id", entrevista.id);

      if (error) throw error;

      toast({
        title: "Entrevista aceptada",
        description: "Has aceptado la propuesta de entrevista",
      });

      onUpdate();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudo aceptar la entrevista",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar un motivo",
        variant: "destructive",
      });
      return;
    }

    setIsResponding(true);
    try {
      const { error } = await supabase
        .from("entrevistas_candidato")
        .update({ 
          estado: "rechazada",
          motivo_rechazo: motivoRechazo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entrevista.id);

      if (error) throw error;

      toast({
        title: "Entrevista rechazada",
        description: "Tu respuesta ha sido enviada",
      });

      onUpdate();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la entrevista",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
      setMotivoRechazo("");
    }
  };

  const handleEnviarDetalles = async (tipo: "correo" | "mensaje" | "zoom") => {
    // Aquí se implementaría la lógica para enviar detalles
    // Por ahora solo mostramos el formulario para capturar los detalles
    setShowDetallesForm(true);
  };

  const handleGuardarDetalles = async () => {
    if (!detallesReunion.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar los detalles",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("entrevistas_candidato")
        .update({ 
          detalles_reunion: detallesReunion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entrevista.id);

      if (error) throw error;

      toast({
        title: "Detalles guardados",
        description: "Los detalles de la reunión han sido guardados",
      });

      setShowDetallesForm(false);
      onUpdate();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los detalles",
        variant: "destructive",
      });
    }
  };

  const getTipoIcon = () => {
    switch (entrevista.tipo_entrevista) {
      case "virtual": return <Video className="h-4 w-4" />;
      case "presencial": return <MapPin className="h-4 w-4" />;
      case "telefonica": return <Phone className="h-4 w-4" />;
      default: return null;
    }
  };

  const getEstadoBadge = () => {
    switch (entrevista.estado) {
      case "propuesta":
        return <Badge variant="outline">Propuesta</Badge>;
      case "aceptada":
        return <Badge className="bg-green-500">Aceptada</Badge>;
      case "rechazada":
        return <Badge variant="destructive">Rechazada</Badge>;
      case "completada":
        return <Badge>Completada</Badge>;
      default:
        return <Badge variant="outline">{entrevista.estado}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {entrevista.postulaciones.publicaciones_marketplace.titulo_puesto}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {entrevista.postulaciones.publicaciones_marketplace.vacantes.perfil_usuario.nombre_empresa}
            </p>
          </div>
          {getEstadoBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(entrevista.fecha_entrevista), "PPP", { locale: es })}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(new Date(entrevista.fecha_entrevista), "p", { locale: es })} 
            {" "}({entrevista.duracion_minutos} min)
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm capitalize">
          {getTipoIcon()}
          <span>{entrevista.tipo_entrevista}</span>
        </div>

        {entrevista.notas && (
          <div className="text-sm">
            <Label>Notas del reclutador:</Label>
            <p className="text-muted-foreground mt-1">{entrevista.notas}</p>
          </div>
        )}

        {entrevista.detalles_reunion && (
          <div className="text-sm bg-muted p-3 rounded-md">
            <Label>Detalles de la reunión:</Label>
            <p className="mt-1 whitespace-pre-wrap">{entrevista.detalles_reunion}</p>
          </div>
        )}

        {entrevista.estado === "propuesta" && (
          <div className="space-y-3 pt-3 border-t">
            <Label>¿Aceptas esta propuesta?</Label>
            {!isResponding ? (
              <div className="flex gap-2">
                <Button 
                  onClick={handleAceptar} 
                  disabled={isResponding}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aceptar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsResponding(true)}
                  disabled={isResponding}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Motivo del rechazo</Label>
                <Textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Explica por qué no puedes asistir..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleRechazar} variant="destructive">
                    Confirmar Rechazo
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsResponding(false);
                    setMotivoRechazo("");
                  }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {entrevista.estado === "aceptada" && !showDetallesForm && !entrevista.detalles_reunion && (
          <div className="space-y-2 pt-3 border-t">
            <Label>Coordinar detalles:</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Agrega los detalles de cómo se llevará a cabo la entrevista
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDetallesForm(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Agregar detalles de la reunión
              </Button>
            </div>
          </div>
        )}

        {showDetallesForm && (
          <div className="space-y-2 pt-3 border-t">
            <Label>Detalles de la reunión</Label>
            <Textarea
              value={detallesReunion}
              onChange={(e) => setDetallesReunion(e.target.value)}
              placeholder="Link de Zoom, dirección, instrucciones, etc..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleGuardarDetalles}>
                Guardar Detalles
              </Button>
              <Button variant="outline" onClick={() => {
                setShowDetallesForm(false);
                setDetallesReunion("");
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
