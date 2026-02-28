import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, Video, Phone, Check, X, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// ─── Constantes ───────────────────────────────────────────────────────────────
const MAX_MOTIVO_RECHAZO = 500;
const MAX_DETALLES_REUNION = 1000;

// Estados válidos de entrevista — cualquier otro se trata como desconocido
const ESTADOS_VALIDOS = new Set(["propuesta", "aceptada", "rechazada", "completada"]);

// ─── Esquemas de validación ───────────────────────────────────────────────────
const motivoRechazoSchema = z
  .string()
  .min(5, "El motivo debe tener al menos 5 caracteres")
  .max(MAX_MOTIVO_RECHAZO, `El motivo no puede exceder ${MAX_MOTIVO_RECHAZO} caracteres`);

const detallesReunionSchema = z
  .string()
  .min(3, "Los detalles deben tener al menos 3 caracteres")
  .max(MAX_DETALLES_REUNION, `Los detalles no pueden exceder ${MAX_DETALLES_REUNION} caracteres`);

// ─── Helpers de seguridad ─────────────────────────────────────────────────────
const sanitizeText = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.replace(/[<>{}\[\]\\;`'"&|$^%*=+~]/g, "").trim();
};

// Formatea fecha de forma segura — nunca muestra "Invalid Date"
const formatFechaSafe = (dateStr: string, formatStr: string): string => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return "Fecha no disponible";
    return format(date, formatStr, { locale: es });
  } catch {
    return "Fecha no disponible";
  }
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface EntrevistaPropuesta {
  id: string;
  fecha_entrevista: string;
  tipo_entrevista: string;
  duracion_minutos: number;
  notas: string;
  estado: string;
  detalles_reunion?: string;
  titulo_puesto: string;
  empresa: string;
}

interface EntrevistaPropuestaCardProps {
  entrevista: EntrevistaPropuesta;
  onUpdate: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function EntrevistaPropuestaCard({ entrevista, onUpdate }: EntrevistaPropuestaCardProps) {
  // Estado separado para cada operación — evita conflicto entre
  // "mostrando formulario de rechazo" y "esperando respuesta del servidor"
  const [showRechazarForm, setShowRechazarForm] = useState(false);
  const [showDetallesForm, setShowDetallesForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [detallesReunion, setDetallesReunion] = useState("");
  const { toast } = useToast();

  // ── Aceptar entrevista ───────────────────────────────────────────────────────
  const handleAceptar = async () => {
    setSubmitting(true);
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
        description: "Has aceptado la propuesta de entrevista.",
      });
      onUpdate();
    } catch (error: any) {
      console.error("Error aceptando entrevista:", error.message);
      toast({
        title: "Error al aceptar",
        description: "No se pudo aceptar la entrevista. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Rechazar entrevista ──────────────────────────────────────────────────────
  const handleRechazar = async () => {
    // Validar con Zod antes de guardar
    const validation = motivoRechazoSchema.safeParse(motivoRechazo);
    if (!validation.success) {
      toast({
        title: "Motivo inválido",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("entrevistas_candidato")
        .update({
          estado: "rechazada",
          motivo_rechazo: sanitizeText(motivoRechazo),
          updated_at: new Date().toISOString(),
        })
        .eq("id", entrevista.id);

      if (error) throw error;

      toast({
        title: "Entrevista rechazada",
        description: "Tu respuesta ha sido enviada.",
      });
      setShowRechazarForm(false);
      setMotivoRechazo("");
      onUpdate();
    } catch (error: any) {
      console.error("Error rechazando entrevista:", error.message);
      toast({
        title: "Error al rechazar",
        description: "No se pudo enviar tu respuesta. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Guardar detalles de reunión ──────────────────────────────────────────────
  const handleGuardarDetalles = async () => {
    // Validar con Zod antes de guardar
    const validation = detallesReunionSchema.safeParse(detallesReunion);
    if (!validation.success) {
      toast({
        title: "Detalles inválidos",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("entrevistas_candidato")
        .update({
          detalles_reunion: sanitizeText(detallesReunion),
          updated_at: new Date().toISOString(),
        })
        .eq("id", entrevista.id);

      if (error) throw error;

      toast({
        title: "Detalles guardados",
        description: "Los detalles de la reunión han sido guardados.",
      });
      setShowDetallesForm(false);
      setDetallesReunion("");
      onUpdate();
    } catch (error: any) {
      console.error("Error guardando detalles:", error.message);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los detalles. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers de UI ─────────────────────────────────────────────────────────────
  const getTipoIcon = () => {
    switch (entrevista.tipo_entrevista?.toLowerCase()) {
      case "virtual":
        return <Video className="h-4 w-4" />;
      case "presencial":
        return <MapPin className="h-4 w-4" />;
      case "telefonica":
        return <Phone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEstadoBadge = () => {
    const estado = entrevista.estado?.toLowerCase().trim();
    // Solo renderizar estados conocidos — nunca texto arbitrario de la BD
    if (!ESTADOS_VALIDOS.has(estado)) {
      return <Badge variant="outline">Desconocido</Badge>;
    }
    switch (estado) {
      case "propuesta":
        return <Badge variant="outline">Propuesta</Badge>;
      case "aceptada":
        return <Badge className="bg-green-500">Aceptada</Badge>;
      case "rechazada":
        return <Badge variant="destructive">Rechazada</Badge>;
      case "completada":
        return <Badge>Completada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  // Datos sanitizados para renderizado
  const safe = {
    titulo_puesto: sanitizeText(entrevista.titulo_puesto),
    empresa: sanitizeText(entrevista.empresa),
    tipo_entrevista: sanitizeText(entrevista.tipo_entrevista),
    notas: sanitizeText(entrevista.notas),
    detalles_reunion: sanitizeText(entrevista.detalles_reunion),
  };

  const estadoNormalizado = entrevista.estado?.toLowerCase().trim();

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{safe.titulo_puesto}</CardTitle>
            <p className="text-sm text-muted-foreground">{safe.empresa}</p>
          </div>
          {getEstadoBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Fecha */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatFechaSafe(entrevista.fecha_entrevista, "PPP")}</span>
        </div>

        {/* Hora y duración */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {formatFechaSafe(entrevista.fecha_entrevista, "p")} (
            {Math.max(0, Math.floor(entrevista.duracion_minutos || 0))} min)
          </span>
        </div>

        {/* Tipo de entrevista */}
        {safe.tipo_entrevista && (
          <div className="flex items-center gap-2 text-sm capitalize">
            {getTipoIcon()}
            <span>{safe.tipo_entrevista}</span>
          </div>
        )}

        {/* Notas del reclutador — sanitizadas */}
        {safe.notas && (
          <div className="text-sm">
            <Label>Notas del reclutador:</Label>
            <p className="text-muted-foreground mt-1">{safe.notas}</p>
          </div>
        )}

        {/* Detalles de reunión ya guardados — sanitizados */}
        {safe.detalles_reunion && (
          <div className="text-sm bg-muted p-3 rounded-md">
            <Label>Detalles de la reunión:</Label>
            <p className="mt-1 whitespace-pre-wrap">{safe.detalles_reunion}</p>
          </div>
        )}

        {/* ── ACCIONES: Estado "propuesta" ── */}
        {estadoNormalizado === "propuesta" && (
          <div className="space-y-3 pt-3 border-t">
            <Label>¿Aceptas esta propuesta?</Label>

            {/* Formulario de rechazo */}
            {showRechazarForm ? (
              <div className="space-y-2">
                <Label>
                  Motivo del rechazo{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({motivoRechazo.length}/{MAX_MOTIVO_RECHAZO})
                  </span>
                </Label>
                <Textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Explica por qué no puedes asistir..."
                  rows={3}
                  maxLength={MAX_MOTIVO_RECHAZO}
                  disabled={submitting}
                />
                <div className="flex gap-2">
                  <Button onClick={handleRechazar} variant="destructive" disabled={submitting}>
                    {submitting ? "Enviando..." : "Confirmar Rechazo"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={submitting}
                    onClick={() => {
                      setShowRechazarForm(false);
                      setMotivoRechazo("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              /* Botones iniciales de aceptar / rechazar */
              <div className="flex gap-2">
                <Button onClick={handleAceptar} disabled={submitting} className="flex-1">
                  {submitting ? (
                    "Procesando..."
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Aceptar
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  disabled={submitting}
                  className="flex-1"
                  onClick={() => setShowRechazarForm(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── ACCIONES: Estado "aceptada" sin detalles aún ── */}
        {estadoNormalizado === "aceptada" && !showDetallesForm && !safe.detalles_reunion && (
          <div className="space-y-2 pt-3 border-t">
            <Label>Coordinar detalles:</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Agrega los detalles de cómo se llevará a cabo la entrevista
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowDetallesForm(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Agregar detalles de la reunión
            </Button>
          </div>
        )}

        {/* Formulario de detalles de reunión */}
        {showDetallesForm && (
          <div className="space-y-2 pt-3 border-t">
            <Label>
              Detalles de la reunión{" "}
              <span className="text-xs text-muted-foreground font-normal">
                ({detallesReunion.length}/{MAX_DETALLES_REUNION})
              </span>
            </Label>
            <Textarea
              value={detallesReunion}
              onChange={(e) => setDetallesReunion(e.target.value)}
              placeholder="Link de Zoom, dirección, instrucciones, etc..."
              rows={4}
              maxLength={MAX_DETALLES_REUNION}
              disabled={submitting}
            />
            <div className="flex gap-2">
              <Button onClick={handleGuardarDetalles} disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar Detalles"}
              </Button>
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setShowDetallesForm(false);
                  setDetallesReunion("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
