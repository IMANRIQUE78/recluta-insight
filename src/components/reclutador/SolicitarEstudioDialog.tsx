import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, FileSearch, User, Briefcase, MapPin, Building, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SolicitarEstudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reclutadorId: string;
  onSuccess?: () => void;
}

export function SolicitarEstudioDialog({ 
  open, 
  onOpenChange, 
  reclutadorId,
  onSuccess 
}: SolicitarEstudioDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedVacante, setSelectedVacante] = useState<string>("");
  const [selectedCandidato, setSelectedCandidato] = useState<string>("");
  const [selectedVerificador, setSelectedVerificador] = useState<string>("");
  const [direccionVisita, setDireccionVisita] = useState("");
  const [fechaLimite, setFechaLimite] = useState<Date>(addDays(new Date(), 7));
  const [observaciones, setObservaciones] = useState("");

  // Fetch vacantes asignadas al reclutador
  const { data: vacantes = [] } = useQuery({
    queryKey: ["vacantes-reclutador", reclutadorId],
    queryFn: async () => {
      const { data: perfil } = await supabase
        .from("perfil_reclutador")
        .select("id")
        .eq("user_id", reclutadorId)
        .single();

      if (!perfil) return [];

      const { data, error } = await supabase
        .from("vacantes")
        .select(`
          id,
          folio,
          titulo_puesto,
          empresa_id,
          empresas:empresa_id (nombre_empresa)
        `)
        .eq("reclutador_asignado_id", perfil.id)
        .eq("estatus", "abierta");

      if (error) throw error;
      return data || [];
    },
    enabled: !!reclutadorId && open,
  });

  // Fetch postulaciones de la vacante seleccionada
  const { data: postulaciones = [] } = useQuery({
    queryKey: ["postulaciones-vacante", selectedVacante],
    queryFn: async () => {
      if (!selectedVacante) return [];
      
      // Buscar publicación de la vacante
      const { data: publicacion } = await supabase
        .from("publicaciones_marketplace")
        .select("id")
        .eq("vacante_id", selectedVacante)
        .single();

      if (!publicacion) return [];

      const { data, error } = await supabase
        .from("postulaciones")
        .select(`
          id,
          candidato_user_id,
          perfil_candidato:candidato_user_id (
            user_id,
            nombre_completo,
            email,
            telefono,
            ubicacion
          )
        `)
        .eq("publicacion_id", publicacion.id)
        .in("estado", ["en_proceso", "entrevista"]);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedVacante,
  });

  // Fetch verificadores disponibles
  const { data: verificadores = [] } = useQuery({
    queryKey: ["verificadores-disponibles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfil_verificador")
        .select("id, nombre_verificador, zona_cobertura, disponible")
        .eq("disponible", true);

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Cuando se selecciona un candidato, pre-llenar dirección
  useEffect(() => {
    if (selectedCandidato) {
      const postulacion = postulaciones.find(p => p.candidato_user_id === selectedCandidato);
      if (postulacion?.perfil_candidato?.ubicacion) {
        setDireccionVisita(postulacion.perfil_candidato.ubicacion);
      }
    }
  }, [selectedCandidato, postulaciones]);

  const handleSubmit = async () => {
    if (!selectedVacante || !selectedCandidato || !direccionVisita || !fechaLimite) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const vacante = vacantes.find(v => v.id === selectedVacante);
      const postulacion = postulaciones.find(p => p.candidato_user_id === selectedCandidato);

      if (!vacante || !postulacion?.perfil_candidato) {
        throw new Error("Datos incompletos");
      }

      const { error } = await supabase
        .from("estudios_socioeconomicos")
        .insert([{
          candidato_user_id: selectedCandidato,
          postulacion_id: postulacion.id,
          solicitante_user_id: reclutadorId,
          empresa_id: vacante.empresa_id,
          verificador_id: selectedVerificador || null,
          nombre_candidato: postulacion.perfil_candidato.nombre_completo,
          vacante_puesto: vacante.titulo_puesto,
          direccion_visita: direccionVisita,
          fecha_limite: fechaLimite.toISOString(),
          estatus: selectedVerificador ? "asignado" : "solicitado",
          observaciones_finales: observaciones || null,
          folio: "", // Will be auto-generated by trigger
        }]);

      if (error) throw error;

      toast({
        title: "✅ Estudio solicitado",
        description: selectedVerificador 
          ? "El estudio ha sido asignado al verificador seleccionado"
          : "El estudio ha sido registrado y está pendiente de asignación",
      });

      // Reset form
      setSelectedVacante("");
      setSelectedCandidato("");
      setSelectedVerificador("");
      setDireccionVisita("");
      setFechaLimite(addDays(new Date(), 7));
      setObservaciones("");
      onOpenChange(false);
      onSuccess?.();
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

  const selectedVacanteData = vacantes.find(v => v.id === selectedVacante);
  const selectedPostulacion = postulaciones.find(p => p.candidato_user_id === selectedCandidato);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            Solicitar Estudio Socioeconómico
          </DialogTitle>
          <DialogDescription>
            Selecciona la vacante, candidato y verificador para iniciar el proceso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vacante */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Vacante *
            </Label>
            <Select value={selectedVacante} onValueChange={setSelectedVacante}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una vacante" />
              </SelectTrigger>
              <SelectContent>
                {vacantes.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.folio} - {v.titulo_puesto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVacanteData && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building className="h-3 w-3" />
                {selectedVacanteData.empresas?.nombre_empresa}
              </p>
            )}
          </div>

          {/* Candidato */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Candidato *
            </Label>
            <Select 
              value={selectedCandidato} 
              onValueChange={setSelectedCandidato}
              disabled={!selectedVacante}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedVacante ? "Selecciona un candidato" : "Primero selecciona una vacante"} />
              </SelectTrigger>
              <SelectContent>
                {postulaciones.map((p: any) => (
                  <SelectItem key={p.candidato_user_id} value={p.candidato_user_id}>
                    {p.perfil_candidato?.nombre_completo || "Sin nombre"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPostulacion?.perfil_candidato && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📧 {selectedPostulacion.perfil_candidato.email}</p>
                {selectedPostulacion.perfil_candidato.telefono && (
                  <p>📞 {selectedPostulacion.perfil_candidato.telefono}</p>
                )}
              </div>
            )}
          </div>

          {/* Dirección de Visita */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección de Visita *
            </Label>
            <Textarea
              value={direccionVisita}
              onChange={(e) => setDireccionVisita(e.target.value)}
              placeholder="Dirección completa para la visita domiciliaria"
              rows={2}
            />
          </div>

          {/* Fecha Límite */}
          <div className="space-y-2">
            <Label>Fecha Límite de Entrega *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fechaLimite && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaLimite ? format(fechaLimite, "PPP", { locale: es }) : "Selecciona fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaLimite}
                  onSelect={(date) => date && setFechaLimite(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Verificador (opcional) */}
          <div className="space-y-2">
            <Label>Verificador (opcional)</Label>
            <Select value={selectedVerificador} onValueChange={setSelectedVerificador}>
              <SelectTrigger>
                <SelectValue placeholder="Asignar verificador ahora o después" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar por ahora</SelectItem>
                {verificadores.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nombre_verificador}
                    {v.zona_cobertura?.length > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({v.zona_cobertura.slice(0, 2).join(", ")})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales para el verificador..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Solicitar Estudio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
