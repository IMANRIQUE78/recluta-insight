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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, MapPin, Video, AlertTriangle, FileSearch } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GestionEstatusPostulacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postulacion: any;
  onSuccess: () => void;
}

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
  
  // Campos para entrevistas
  const [fechaEntrevista, setFechaEntrevista] = useState<Date>();
  const [horaEntrevista, setHoraEntrevista] = useState("");
  const [lugarEntrevista, setLugarEntrevista] = useState("");
  const [enlaceRemoto, setEnlaceRemoto] = useState("");
  const [detallesReunion, setDetallesReunion] = useState("");

  // Campos para estudio socioeconómico
  const [direccionEstudio, setDireccionEstudio] = useState("");
  const [fechaLimiteEstudio, setFechaLimiteEstudio] = useState<Date>(addDays(new Date(), 7));
  const [observacionesEstudio, setObservacionesEstudio] = useState("");
  const [verificadores, setVerificadores] = useState<any[]>([]);
  const [selectedVerificador, setSelectedVerificador] = useState("");
  const [candidatoData, setCandidatoData] = useState<any>(null);
  const [vacanteData, setVacanteData] = useState<any>(null);

  const requiereEntrevista = estatus === "entrevista_presencial" || estatus === "entrevista_distancia";
  const requiereSocioeconomico = estatus === "solicita_socioeconomico";

  // Cargar datos cuando se selecciona socioeconómico
  useEffect(() => {
    if (requiereSocioeconomico && postulacion) {
      loadSocioeconomicoData();
    }
  }, [requiereSocioeconomico, postulacion]);

  const loadSocioeconomicoData = async () => {
    try {
      // Cargar verificadores disponibles
      const { data: verifData } = await supabase
        .from("perfil_verificador")
        .select("id, nombre_verificador, zona_cobertura, disponible")
        .eq("disponible", true);
      
      if (verifData) setVerificadores(verifData);

      // Cargar datos del candidato
      const { data: candData } = await supabase
        .from("perfil_candidato")
        .select("*")
        .eq("user_id", postulacion.candidato_user_id)
        .single();
      
      if (candData) {
        setCandidatoData(candData);
        setDireccionEstudio(candData.ubicacion || "");
      }

      // Cargar datos de la vacante
      const { data: pubData } = await supabase
        .from("publicaciones_marketplace")
        .select("*, vacantes(*, empresas(nombre_empresa))")
        .eq("id", postulacion.publicacion_id)
        .single();
      
      if (pubData) setVacanteData(pubData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  const handleSave = async () => {
    if (!estatus) {
      toast({
        title: "Error",
        description: "Debes seleccionar un estatus",
        variant: "destructive",
      });
      return;
    }

    if (requiereEntrevista && (!fechaEntrevista || !horaEntrevista)) {
      toast({
        title: "Error",
        description: "Debes proporcionar fecha y hora de la entrevista",
        variant: "destructive",
      });
      return;
    }

    if (requiereSocioeconomico && (!direccionEstudio || !fechaLimiteEstudio)) {
      toast({
        title: "Error",
        description: "Debes proporcionar dirección y fecha límite para el estudio",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Actualizar el estatus de la postulación
      const { error: updateError } = await supabase
        .from("postulaciones")
        .update({
          etapa: estatus,
          estado: estatus === "contratado" ? "aceptado" : "pendiente",
          notas_reclutador: notas,
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id", postulacion.id);

      if (updateError) throw updateError;

      // Si es una entrevista, crear registro de entrevista
      if (requiereEntrevista && fechaEntrevista && horaEntrevista) {
        const [hours, minutes] = horaEntrevista.split(":");
        const fechaCompleta = new Date(fechaEntrevista);
        fechaCompleta.setHours(parseInt(hours), parseInt(minutes));

        const { error: entrevistaError } = await supabase
          .from("entrevistas_candidato")
          .insert({
            postulacion_id: postulacion.id,
            candidato_user_id: postulacion.candidato_user_id,
            reclutador_user_id: user.id,
            fecha_entrevista: fechaCompleta.toISOString(),
            tipo_entrevista: estatus === "entrevista_presencial" ? "presencial" : "virtual",
            detalles_reunion: detallesReunion || (estatus === "entrevista_presencial" ? lugarEntrevista : enlaceRemoto),
            estado: "propuesta",
          });

        if (entrevistaError) throw entrevistaError;
      }

      // Si se solicita estudio socioeconómico, crear registro
      if (requiereSocioeconomico) {
        const { error: estudioError } = await supabase
          .from("estudios_socioeconomicos")
          .insert({
            candidato_user_id: postulacion.candidato_user_id,
            postulacion_id: postulacion.id,
            solicitante_user_id: user.id,
            empresa_id: vacanteData?.vacantes?.empresa_id || null,
            verificador_id: selectedVerificador && selectedVerificador !== "sin_asignar" ? selectedVerificador : null,
            nombre_candidato: candidatoData?.nombre_completo || postulacion?.candidato?.nombre_completo || "Sin nombre",
            vacante_puesto: vacanteData?.titulo_puesto || "Sin puesto",
            direccion_visita: direccionEstudio,
            fecha_limite: fechaLimiteEstudio.toISOString(),
            estatus: selectedVerificador && selectedVerificador !== "sin_asignar" ? "asignado" : "solicitado",
            observaciones_finales: observacionesEstudio || null,
            folio: "", // Auto-generated by trigger
          });

        if (estudioError) throw estudioError;
      }

      // Preparar mensaje para el candidato
      let mensajeCandidato = "";
      switch (estatus) {
        case "entrevista_presencial":
          mensajeCandidato = `🎯 ENTREVISTA PRESENCIAL PROGRAMADA\n\n` +
            `📅 Fecha: ${format(fechaEntrevista!, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}\n` +
            `🕐 Hora: ${horaEntrevista}\n` +
            `📍 Lugar: ${lugarEntrevista}\n\n` +
            `${detallesReunion ? `ℹ️ Detalles: ${detallesReunion}\n\n` : ""}` +
            `Por favor, confirma tu asistencia. ¡Te esperamos!`;
          break;

        case "entrevista_distancia":
          mensajeCandidato = `💻 ENTREVISTA REMOTA PROGRAMADA\n\n` +
            `📅 Fecha: ${format(fechaEntrevista!, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}\n` +
            `🕐 Hora: ${horaEntrevista}\n` +
            `🔗 Enlace: ${enlaceRemoto}\n\n` +
            `${detallesReunion ? `ℹ️ Detalles: ${detallesReunion}\n\n` : ""}` +
            `Por favor, confirma tu asistencia y asegúrate de tener una buena conexión a internet.`;
          break;

        case "continua_proceso":
          mensajeCandidato = `✅ Tu proceso continúa avanzando.\n\n${notas ? `Comentarios: ${notas}` : "Pronto tendrás noticias nuestras."}`;
          break;

        case "contratado":
          mensajeCandidato = `🎉 ¡FELICIDADES! Has sido seleccionado para el puesto.\n\n${notas ? `Comentarios: ${notas}\n\n` : ""}Pronto nos contactaremos contigo con los siguientes pasos.`;
          break;

        case "solicita_socioeconomico":
          mensajeCandidato = `📋 ESTUDIO SOCIOECONÓMICO SOLICITADO\n\n` +
            `Hemos iniciado el proceso de estudio socioeconómico como parte de tu proceso de selección.\n\n` +
            `📍 Dirección de visita: ${direccionEstudio}\n` +
            `📅 Fecha límite: ${format(fechaLimiteEstudio, "PPP", { locale: es })}\n\n` +
            `Un verificador se pondrá en contacto contigo para coordinar la visita. Por favor, asegúrate de tener disponible la documentación necesaria.`;
          break;

        case "no_respondio_contacto":
        case "candidato_abandona":
        case "no_asistio":
        case "no_viable_filtro":
        case "no_viable_entrevista":
        case "no_viable_conocimientos":
        case "no_viable_psicometria":
        case "no_viable_segunda_entrevista":
        case "descartado":
          mensajeCandidato = `Gracias por tu interés en la posición. ${notas ? `\n\nComentarios: ${notas}` : ""}`;
          break;

        default:
          mensajeCandidato = `Estado de tu postulación actualizado: ${ESTATUS_OPTIONS.find(e => e.value === estatus)?.label}\n\n${notas ? `Comentarios: ${notas}` : ""}`;
      }

      // Enviar mensaje al candidato
      if (mensajeCandidato) {
        const { error: mensajeError } = await supabase
          .from("mensajes_postulacion")
          .insert({
            postulacion_id: postulacion.id,
            remitente_user_id: user.id,
            destinatario_user_id: postulacion.candidato_user_id,
            mensaje: mensajeCandidato,
          });

        if (mensajeError) throw mensajeError;
      }

      // Si es contratado, cerrar la vacante
      if (estatus === "contratado") {
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
              fecha_cierre: new Date().toISOString(),
            })
            .eq("id", publicacion.vacante_id);

          // Las estadísticas se calculan dinámicamente en useReclutadorStats
        }
      }

      toast({
        title: "✅ Estatus actualizado",
        description: "Se ha notificado al candidato del cambio",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al actualizar estatus:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Estatus de Postulación</DialogTitle>
          <DialogDescription>
            Actualiza el estatus del candidato {postulacion?.candidato?.nombre_completo || ""}
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-warning">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription>
            El candidato recibirá una notificación automática sobre cualquier cambio de estatus.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
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

          {requiereEntrevista && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                {estatus === "entrevista_presencial" ? (
                  <>
                    <MapPin className="h-4 w-4" />
                    Detalles de Entrevista Presencial
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Detalles de Entrevista Remota
                  </>
                )}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Entrevista *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaEntrevista ? (
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora">Hora *</Label>
                  <div className="flex items-center">
                    <Clock className="absolute ml-2 h-4 w-4 text-muted-foreground" />
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
                  <Label htmlFor="lugar">Lugar de la Entrevista *</Label>
                  <Input
                    id="lugar"
                    value={lugarEntrevista}
                    onChange={(e) => setLugarEntrevista(e.target.value)}
                    placeholder="Ej: Oficinas principales, Sala de juntas B"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="enlace">Enlace de la Reunión *</Label>
                  <Input
                    id="enlace"
                    value={enlaceRemoto}
                    onChange={(e) => setEnlaceRemoto(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="detalles">Instrucciones Adicionales</Label>
                <Textarea
                  id="detalles"
                  value={detallesReunion}
                  onChange={(e) => setDetallesReunion(e.target.value)}
                  placeholder="Ej: Traer identificación oficial, preparar presentación, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          {requiereSocioeconomico && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                Solicitud de Estudio Socioeconómico
              </h3>

              {/* Datos del candidato (solo lectura) */}
              {candidatoData && (
                <div className="p-3 bg-background rounded-lg border space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Candidato</p>
                  <p className="font-medium">{candidatoData.nombre_completo}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span>📧 {candidatoData.email}</span>
                    <span>📞 {candidatoData.telefono || "Sin teléfono"}</span>
                  </div>
                </div>
              )}

              {/* Datos de la vacante (solo lectura) */}
              {vacanteData && (
                <div className="p-3 bg-background rounded-lg border space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vacante relacionada</p>
                  <p className="font-medium">{vacanteData.titulo_puesto}</p>
                  <div className="text-sm text-muted-foreground">
                    <span>🏢 {vacanteData.vacantes?.empresas?.nombre_empresa || "Sin empresa"}</span>
                    {vacanteData.sueldo_bruto_aprobado && (
                      <span className="ml-4">💰 ${vacanteData.sueldo_bruto_aprobado.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección de Visita *</Label>
                <Input
                  id="direccion"
                  value={direccionEstudio}
                  onChange={(e) => setDireccionEstudio(e.target.value)}
                  placeholder="Calle, número, colonia, ciudad, estado, CP"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Límite de Entrega *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaLimiteEstudio ? (
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
                          {v.nombre_verificador}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones para el Verificador</Label>
                <Textarea
                  id="observaciones"
                  value={observacionesEstudio}
                  onChange={(e) => setObservacionesEstudio(e.target.value)}
                  placeholder="Indicaciones especiales para la visita..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notas">Notas Internas (opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Comentarios adicionales sobre el candidato..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
