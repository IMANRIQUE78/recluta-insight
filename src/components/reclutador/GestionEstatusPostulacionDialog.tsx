import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, MapPin, Video, AlertTriangle, FileSearch } from "lucide-react";
import { format, addDays, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Constantes ───────────────────────────────────────────────────────────────
const MAX_NOTAS = 1000;
const MAX_LUGAR = 300;
const MAX_ENLACE = 500;
const MAX_DETALLES = 800;
const MAX_DIRECCION = 400;
const MAX_OBSERVACIONES = 800;

const ESTATUS_OPTIONS = [
  { value: "recibida", label: "Recibida" },
  { value: "revision", label: "En Revisión" },
  { value: "entrevista_presencial", label: "Entrevista Presencial" },
  { value: "entrevista_distancia", label: "Entrevista a Distancia" },
  { value: "solicita_socioeconomico", label: "Se solicita socioeconómico" },
  { value: "no_respondio_contacto", label: "No Respondió Contacto" },
  { value: "continua_proceso", label: "Continúa en Proceso" },
  { value: "candidato_abandona", label: "Candidato Abandona Proceso" },
  { value: "no_asistio", label: "No Asistió" },
  { value: "no_viable_filtro", label: "No Viable en Llamada Filtro" },
  { value: "no_viable_entrevista", label: "No Viable en Entrevista" },
  { value: "no_viable_conocimientos", label: "No Viable por Conocimientos" },
  { value: "no_viable_psicometria", label: "No Viable por Psicometría" },
  { value: "no_viable_segunda_entrevista", label: "No Viable en Segunda Entrevista" },
  { value: "contratado", label: "Contratado" },
  { value: "descartado", label: "Descartado" },
];

const ESTATUS_VALIDOS = new Set(ESTATUS_OPTIONS.map((o) => o.value));

// ─── Helpers de seguridad ─────────────────────────────────────────────────────
const sanitizeText = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.replace(/[<>{}\[\]\\;`'"&|$^%*=+~]/g, "").trim();
};

// Valida que una URL sea https antes de usarla o guardarla
const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// Parsea "HH:MM" de forma segura — devuelve null si el formato es inválido
const parseHora = (hora: string): { hours: number; minutes: number } | null => {
  const match = hora.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface GestionEstatusPostulacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postulacion: {
    id: string;
    candidato_user_id: string;
    publicacion_id: string;
    etapa?: string | null;
    candidato?: { nombre_completo?: string } | null;
  };
  onSuccess: () => void;
}

interface Verificador {
  id: string;
  nombre_verificador: string;
  zona_cobertura: string | null;
  disponible: boolean;
}

interface CandidatoData {
  nombre_completo: string;
  email: string;
  telefono: string | null;
  ubicacion: string | null;
}

interface VacanteData {
  titulo_puesto: string;
  sueldo_bruto_aprobado: number | null;
  vacante_id: string | null;
  vacantes?: {
    empresa_id?: string;
    empresas?: { nombre_empresa?: string };
  } | null;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const GestionEstatusPostulacionDialog = ({
  open,
  onOpenChange,
  postulacion,
  onSuccess,
}: GestionEstatusPostulacionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [estatus, setEstatus] = useState(postulacion?.etapa || "");
  const [notas, setNotas] = useState("");

  // Entrevista
  const [fechaEntrevista, setFechaEntrevista] = useState<Date>();
  const [horaEntrevista, setHoraEntrevista] = useState("");
  const [lugarEntrevista, setLugarEntrevista] = useState("");
  const [enlaceRemoto, setEnlaceRemoto] = useState("");
  const [detallesReunion, setDetallesReunion] = useState("");

  // Estudio socioeconómico
  const [direccionEstudio, setDireccionEstudio] = useState("");
  const [fechaLimiteEstudio, setFechaLimiteEstudio] = useState<Date>(addDays(new Date(), 7));
  const [observacionesEstudio, setObservacionesEstudio] = useState("");
  const [verificadores, setVerificadores] = useState<Verificador[]>([]);
  const [selectedVerificador, setSelectedVerificador] = useState("");
  const [candidatoData, setCandidatoData] = useState<CandidatoData | null>(null);
  const [vacanteData, setVacanteData] = useState<VacanteData | null>(null);

  const requiereEntrevista = estatus === "entrevista_presencial" || estatus === "entrevista_distancia";
  const requiereSocioeconomico = estatus === "solicita_socioeconomico";

  useEffect(() => {
    if (requiereSocioeconomico && postulacion) {
      loadSocioeconomicoData();
    }
  }, [requiereSocioeconomico]);

  // ── Cargar datos para estudio socioeconómico ──────────────────────────────────
  const loadSocioeconomicoData = async () => {
    try {
      const { data: verifData } = await supabase
        .from("perfil_verificador")
        .select("id, nombre_verificador, zona_cobertura, disponible")
        .eq("disponible", true);

      if (verifData) setVerificadores(verifData as Verificador[]);

      // maybeSingle() en lugar de single() — no lanza error si no hay datos
      const { data: candData } = await supabase
        .from("perfil_candidato")
        .select("nombre_completo, email, telefono, ubicacion")
        .eq("user_id", postulacion.candidato_user_id)
        .maybeSingle();

      if (candData) {
        const safe: CandidatoData = {
          nombre_completo: sanitizeText(candData.nombre_completo),
          email: sanitizeText(candData.email),
          telefono: sanitizeText(candData.telefono),
          ubicacion: sanitizeText(candData.ubicacion),
        };
        setCandidatoData(safe);
        setDireccionEstudio(safe.ubicacion || "");
      }

      const { data: pubData } = await supabase
        .from("publicaciones_marketplace")
        .select("titulo_puesto, sueldo_bruto_aprobado, vacante_id, vacantes(empresa_id, empresas(nombre_empresa))")
        .eq("id", postulacion.publicacion_id)
        .maybeSingle();

      if (pubData) setVacanteData(pubData as unknown as VacanteData);
    } catch (error: any) {
      console.error("Error cargando datos socioeconómicos:", error.message);
    }
  };

  // ── Validaciones antes de guardar ────────────────────────────────────────────
  const validarFormulario = (): string | null => {
    if (!estatus || !ESTATUS_VALIDOS.has(estatus)) {
      return "Debes seleccionar un estatus válido";
    }

    if (requiereEntrevista) {
      if (!fechaEntrevista || !isValid(fechaEntrevista)) {
        return "Debes seleccionar una fecha válida para la entrevista";
      }
      if (!horaEntrevista || !parseHora(horaEntrevista)) {
        return "Debes ingresar una hora válida (HH:MM)";
      }
      if (estatus === "entrevista_presencial" && !lugarEntrevista.trim()) {
        return "Debes indicar el lugar de la entrevista";
      }
      if (estatus === "entrevista_distancia") {
        if (!enlaceRemoto.trim()) return "Debes proporcionar el enlace de la reunión";
        if (!isSafeUrl(enlaceRemoto)) return "El enlace debe comenzar con https://";
      }
    }

    if (requiereSocioeconomico) {
      if (!direccionEstudio.trim()) return "Debes proporcionar la dirección de visita";
      if (!fechaLimiteEstudio || !isValid(fechaLimiteEstudio)) {
        return "Debes seleccionar una fecha límite válida";
      }
    }

    return null;
  };

  // ── Guardar cambios ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      toast({ title: "Datos incompletos", description: errorValidacion, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no válida");

      // 1. Actualizar estatus de la postulación
      const { error: updateError } = await supabase
        .from("postulaciones")
        .update({
          etapa: estatus,
          estado: estatus === "contratado" ? "aceptado" : "pendiente",
          notas_reclutador: sanitizeText(notas),
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id", postulacion.id);

      if (updateError) throw updateError;

      // 2. Crear entrevista si aplica
      if (requiereEntrevista && fechaEntrevista) {
        const horaParseada = parseHora(horaEntrevista)!;
        const fechaCompleta = new Date(fechaEntrevista);
        fechaCompleta.setHours(horaParseada.hours, horaParseada.minutes, 0, 0);

        // Detalles de reunión: lugar o enlace según tipo, más detalles adicionales
        const detallesFinales =
          sanitizeText(detallesReunion) ||
          (estatus === "entrevista_presencial" ? sanitizeText(lugarEntrevista) : sanitizeText(enlaceRemoto));

        const { error: entrevistaError } = await supabase.from("entrevistas_candidato").insert({
          postulacion_id: postulacion.id,
          candidato_user_id: postulacion.candidato_user_id,
          reclutador_user_id: user.id,
          fecha_entrevista: fechaCompleta.toISOString(),
          tipo_entrevista: estatus === "entrevista_presencial" ? "presencial" : "virtual",
          detalles_reunion: detallesFinales,
          estado: "propuesta",
        });

        if (entrevistaError) throw entrevistaError;
      }

      // 3. Crear estudio socioeconómico si aplica
      if (requiereSocioeconomico) {
        const { error: estudioError } = await supabase.from("estudios_socioeconomicos").insert({
          candidato_user_id: postulacion.candidato_user_id,
          postulacion_id: postulacion.id,
          solicitante_user_id: user.id,
          empresa_id: (vacanteData?.vacantes as any)?.empresa_id || null,
          verificador_id: selectedVerificador && selectedVerificador !== "sin_asignar" ? selectedVerificador : null,
          nombre_candidato:
            candidatoData?.nombre_completo || sanitizeText(postulacion?.candidato?.nombre_completo) || "Sin nombre",
          vacante_puesto: sanitizeText(vacanteData?.titulo_puesto) || "Sin puesto",
          direccion_visita: sanitizeText(direccionEstudio),
          fecha_limite: fechaLimiteEstudio.toISOString(),
          estatus: selectedVerificador && selectedVerificador !== "sin_asignar" ? "asignado" : "solicitado",
          observaciones_finales: sanitizeText(observacionesEstudio) || null,
          folio: "",
        });

        if (estudioError) throw estudioError;
      }

      // 4. Construir mensaje para el candidato — todo sanitizado
      const mensajeCandidato = buildMensajeCandidato();

      if (mensajeCandidato) {
        const { error: mensajeError } = await supabase.from("mensajes_postulacion").insert({
          postulacion_id: postulacion.id,
          remitente_user_id: user.id,
          destinatario_user_id: postulacion.candidato_user_id,
          mensaje: mensajeCandidato,
        });

        if (mensajeError) throw mensajeError;
      }

      // 5. Si contratado, cerrar la vacante
      if (estatus === "contratado") {
        const { data: publicacion } = await supabase
          .from("publicaciones_marketplace")
          .select("vacante_id")
          .eq("id", postulacion.publicacion_id)
          .maybeSingle();

        if (publicacion?.vacante_id) {
          await supabase
            .from("vacantes")
            .update({ estatus: "cerrada", fecha_cierre: new Date().toISOString() })
            .eq("id", publicacion.vacante_id);
        }
      }

      toast({
        title: "✅ Estatus actualizado",
        description: "Se ha notificado al candidato del cambio.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al actualizar estatus:", error.message);
      toast({
        title: "Error al guardar",
        description: "No se pudo actualizar el estatus. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Construir mensaje al candidato — todo texto sanitizado ────────────────────
  const buildMensajeCandidato = (): string => {
    const notasSafe = sanitizeText(notas);
    const lugarSafe = sanitizeText(lugarEntrevista);
    // Enlace remoto: solo se incluye si pasó la validación https
    const enlaceSafe = isSafeUrl(enlaceRemoto) ? enlaceRemoto.trim() : "[enlace no disponible]";
    const detallesSafe = sanitizeText(detallesReunion);
    const direccionSafe = sanitizeText(direccionEstudio);

    const fechaFormateada =
      fechaEntrevista && isValid(fechaEntrevista)
        ? format(fechaEntrevista, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
        : "fecha por confirmar";

    const fechaLimiteFormateada =
      fechaLimiteEstudio && isValid(fechaLimiteEstudio)
        ? format(fechaLimiteEstudio, "PPP", { locale: es })
        : "fecha por confirmar";

    switch (estatus) {
      case "entrevista_presencial":
        return (
          `ENTREVISTA PRESENCIAL PROGRAMADA\n\n` +
          `Fecha: ${fechaFormateada}\n` +
          `Hora: ${horaEntrevista}\n` +
          `Lugar: ${lugarSafe}\n\n` +
          (detallesSafe ? `Detalles: ${detallesSafe}\n\n` : "") +
          `Por favor, confirma tu asistencia.`
        );

      case "entrevista_distancia":
        return (
          `ENTREVISTA REMOTA PROGRAMADA\n\n` +
          `Fecha: ${fechaFormateada}\n` +
          `Hora: ${horaEntrevista}\n` +
          `Enlace: ${enlaceSafe}\n\n` +
          (detallesSafe ? `Detalles: ${detallesSafe}\n\n` : "") +
          `Por favor, confirma tu asistencia y verifica tu conexión a internet.`
        );

      case "continua_proceso":
        return notasSafe
          ? `Tu proceso continúa avanzando.\n\nComentarios: ${notasSafe}`
          : `Tu proceso continúa avanzando. Pronto tendrás noticias nuestras.`;

      case "contratado":
        return (
          `FELICIDADES: Has sido seleccionado para el puesto.\n\n` +
          (notasSafe ? `Comentarios: ${notasSafe}\n\n` : "") +
          `Pronto nos contactaremos contigo con los siguientes pasos.`
        );

      case "solicita_socioeconomico":
        return (
          `ESTUDIO SOCIOECONOMICO SOLICITADO\n\n` +
          `Hemos iniciado el proceso de estudio socioeconómico como parte de tu selección.\n\n` +
          `Dirección de visita: ${direccionSafe}\n` +
          `Fecha límite: ${fechaLimiteFormateada}\n\n` +
          `Un verificador se pondrá en contacto contigo para coordinar la visita.`
        );

      case "no_respondio_contacto":
      case "candidato_abandona":
      case "no_asistio":
      case "no_viable_filtro":
      case "no_viable_entrevista":
      case "no_viable_conocimientos":
      case "no_viable_psicometria":
      case "no_viable_segunda_entrevista":
      case "descartado":
        return notasSafe
          ? `Gracias por tu interés en la posición.\n\nComentarios: ${notasSafe}`
          : `Gracias por tu interés en la posición.`;

      default: {
        const label = ESTATUS_OPTIONS.find((e) => e.value === estatus)?.label ?? estatus;
        return (
          `Estado de tu postulación actualizado: ${sanitizeText(label)}\n\n` +
          (notasSafe ? `Comentarios: ${notasSafe}` : "")
        );
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Estatus de Postulación</DialogTitle>
          <DialogDescription>
            Actualiza el estatus del candidato {sanitizeText(postulacion?.candidato?.nombre_completo) || ""}
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-warning">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription>
            El candidato recibirá una notificación automática sobre cualquier cambio de estatus.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          {/* ── Selector de estatus ── */}
          <div className="space-y-2">
            <Label htmlFor="estatus">Estatus de la Postulación *</Label>
            <Select value={estatus} onValueChange={setEstatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estatus" />
              </SelectTrigger>
              <SelectContent>
                {ESTATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Detalles de entrevista ── */}
          {requiereEntrevista && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                {estatus === "entrevista_presencial" ? (
                  <>
                    <MapPin className="h-4 w-4" /> Detalles de Entrevista Presencial
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" /> Detalles de Entrevista Remota
                  </>
                )}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Entrevista *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaEntrevista && isValid(fechaEntrevista) ? (
                          format(fechaEntrevista, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fechaEntrevista}
                        onSelect={setFechaEntrevista}
                        initialFocus
                        locale={es}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora">Hora * (HH:MM)</Label>
                  <div className="relative flex items-center">
                    <Clock className="absolute left-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hora"
                      type="time"
                      value={horaEntrevista}
                      onChange={(e) => setHoraEntrevista(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              {estatus === "entrevista_presencial" ? (
                <div className="space-y-2">
                  <Label htmlFor="lugar">
                    Lugar de la Entrevista *{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({lugarEntrevista.length}/{MAX_LUGAR})
                    </span>
                  </Label>
                  <Input
                    id="lugar"
                    value={lugarEntrevista}
                    onChange={(e) => setLugarEntrevista(e.target.value)}
                    placeholder="Ej: Oficinas principales, Sala de juntas B"
                    maxLength={MAX_LUGAR}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="enlace">
                    Enlace de la Reunión * (debe comenzar con https://)
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      ({enlaceRemoto.length}/{MAX_ENLACE})
                    </span>
                  </Label>
                  <Input
                    id="enlace"
                    value={enlaceRemoto}
                    onChange={(e) => setEnlaceRemoto(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    maxLength={MAX_ENLACE}
                  />
                  {enlaceRemoto && !isSafeUrl(enlaceRemoto) && (
                    <p className="text-xs text-destructive">El enlace debe comenzar con https://</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="detalles">
                  Instrucciones Adicionales{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({detallesReunion.length}/{MAX_DETALLES})
                  </span>
                </Label>
                <Textarea
                  id="detalles"
                  value={detallesReunion}
                  onChange={(e) => setDetallesReunion(e.target.value)}
                  placeholder="Ej: Traer identificación oficial, preparar presentación, etc."
                  rows={3}
                  maxLength={MAX_DETALLES}
                />
              </div>
            </div>
          )}

          {/* ── Detalles de estudio socioeconómico ── */}
          {requiereSocioeconomico && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                Solicitud de Estudio Socioeconómico
              </h3>

              {candidatoData && (
                <div className="p-3 bg-background rounded-lg border space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Candidato</p>
                  <p className="font-medium">{candidatoData.nombre_completo}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span>{candidatoData.email}</span>
                    <span>{candidatoData.telefono || "Sin teléfono"}</span>
                  </div>
                </div>
              )}

              {vacanteData && (
                <div className="p-3 bg-background rounded-lg border space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vacante relacionada</p>
                  <p className="font-medium">{sanitizeText(vacanteData.titulo_puesto)}</p>
                  <div className="text-sm text-muted-foreground">
                    <span>
                      {sanitizeText((vacanteData.vacantes as any)?.empresas?.nombre_empresa) || "Sin empresa"}
                    </span>
                    {vacanteData.sueldo_bruto_aprobado && (
                      <span className="ml-4">${vacanteData.sueldo_bruto_aprobado.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="direccion">
                  Dirección de Visita *{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({direccionEstudio.length}/{MAX_DIRECCION})
                  </span>
                </Label>
                <Input
                  id="direccion"
                  value={direccionEstudio}
                  onChange={(e) => setDireccionEstudio(e.target.value)}
                  placeholder="Calle, número, colonia, ciudad, estado, CP"
                  maxLength={MAX_DIRECCION}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Límite de Entrega *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaLimiteEstudio && isValid(fechaLimiteEstudio) ? (
                          format(fechaLimiteEstudio, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fechaLimiteEstudio}
                        onSelect={(date) => date && setFechaLimiteEstudio(date)}
                        initialFocus
                        locale={es}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Verificador (opcional)</Label>
                  <Select value={selectedVerificador} onValueChange={setSelectedVerificador}>
                    <SelectTrigger>
                      <SelectValue placeholder="Asignar verificador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin_asignar">Sin asignar por ahora</SelectItem>
                      {verificadores.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {sanitizeText(v.nombre_verificador)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">
                  Observaciones para el Verificador{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({observacionesEstudio.length}/{MAX_OBSERVACIONES})
                  </span>
                </Label>
                <Textarea
                  id="observaciones"
                  value={observacionesEstudio}
                  onChange={(e) => setObservacionesEstudio(e.target.value)}
                  placeholder="Indicaciones especiales para la visita..."
                  rows={3}
                  maxLength={MAX_OBSERVACIONES}
                />
              </div>
            </div>
          )}

          {/* ── Notas internas ── */}
          <div className="space-y-2">
            <Label htmlFor="notas">
              Notas Internas (opcional){" "}
              <span className="text-xs text-muted-foreground font-normal">
                ({notas.length}/{MAX_NOTAS})
              </span>
            </Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Comentarios adicionales sobre el candidato..."
              rows={4}
              maxLength={MAX_NOTAS}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar y Notificar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
