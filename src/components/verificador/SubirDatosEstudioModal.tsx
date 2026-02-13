import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Tabs removed - using scroll view
// ScrollArea removed - using native scroll
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Save, 
  Send, 
  User, 
  Home, 
  DollarSign, 
  Briefcase, 
  Users,
  Calendar,
  MapPin,
  Building,
  FileText,
  Heart,
  Scale,
  GraduationCap,
  Phone,
  Mail,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Lock,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface SubirDatosEstudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudio: any;
  onSuccess: () => void;
}

interface FamiliarData {
  parentesco: string;
  nombre: string;
  vive: boolean;
  edad: string;
  ocupacion: string;
}

interface EscolaridadData {
  nivel: string;
  nombre_escuela: string;
  anos: string;
  certificado: boolean;
  muestra_documento: boolean;
}

interface ReferenciaLaboral {
  nombre_empresa: string;
  nombre_jefe: string;
  sector: string;
  fecha_ingreso: string;
  fecha_salida: string;
  sueldo: string;
  motivo_salida: string;
}

interface ReferenciaPersonal {
  nombre: string;
  edad: string;
  parentesco: string;
  ocupacion: string;
  tiempo_conocerlo: string;
  telefono: string;
  observaciones: string;
}

export default function SubirDatosEstudioModal({
  open,
  onOpenChange,
  estudio,
  onSuccess,
}: SubirDatosEstudioModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [candidatoData, setCandidatoData] = useState<any>(null);
  const [loadingCandidato, setLoadingCandidato] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, control } = useForm({
    defaultValues: {
      // Datos de la visita
      fecha_visita: estudio?.fecha_visita || format(new Date(), "yyyy-MM-dd"),
      hora_visita: estudio?.hora_visita || "",
      candidato_presente: estudio?.candidato_presente ?? true,
      motivo_ausencia: estudio?.motivo_ausencia || "",
      observaciones_visita: estudio?.observaciones_visita || "",
      
      // Datos sociodemográficos verificados
      estado_civil_verificado: estudio?.datos_sociodemograficos?.estado_civil_verificado || "",
      lugar_nacimiento: estudio?.datos_sociodemograficos?.lugar_nacimiento || "",
      curp: estudio?.datos_sociodemograficos?.curp || "",
      rfc: estudio?.datos_sociodemograficos?.rfc || "",
      folio_ine: estudio?.datos_sociodemograficos?.folio_ine || "",
      telefono_fijo: estudio?.datos_sociodemograficos?.telefono_fijo || "",
      ocupacion_actual: estudio?.datos_sociodemograficos?.ocupacion_actual || "",
      ubicacion_google: estudio?.datos_sociodemograficos?.ubicacion_google || "",
      
      // Familiares
      familiares: estudio?.datos_sociodemograficos?.familiares || [
        { parentesco: "Madre", nombre: "", vive: true, edad: "", ocupacion: "" },
        { parentesco: "Padre", nombre: "", vive: true, edad: "", ocupacion: "" },
        { parentesco: "Pareja", nombre: "", vive: true, edad: "", ocupacion: "" },
      ],
      
      // Escolaridad
      estudia_actualmente: estudio?.datos_sociodemograficos?.estudia_actualmente || false,
      que_estudia: estudio?.datos_sociodemograficos?.que_estudia || "",
      idioma_adicional: estudio?.datos_sociodemograficos?.idioma_adicional || "",
      escolaridad_detalle: estudio?.datos_sociodemograficos?.escolaridad_detalle || [
        { nivel: "", nombre_escuela: "", anos: "", certificado: false, muestra_documento: false },
      ],
      
      // Domicilio
      calle_numero: estudio?.datos_vivienda?.calle_numero || "",
      colonia: estudio?.datos_vivienda?.colonia || "",
      codigo_postal: estudio?.datos_vivienda?.codigo_postal || "",
      alcaldia_municipio: estudio?.datos_vivienda?.alcaldia_municipio || "",
      ciudad: estudio?.datos_vivienda?.ciudad || "",
      telefono_fijo_casa: estudio?.datos_vivienda?.telefono_fijo_casa || "",
      anos_residencia: estudio?.datos_vivienda?.anos_residencia || "",
      personas_en_domicilio: estudio?.datos_vivienda?.personas_en_domicilio || "",
      
      // Características vivienda
      tipo_dominio: estudio?.datos_vivienda?.tipo_dominio || "",
      tipo_vivienda: estudio?.datos_vivienda?.tipo_vivienda || "",
      zona: estudio?.datos_vivienda?.zona || "",
      nombre_propietario: estudio?.datos_vivienda?.nombre_propietario || "",
      parentesco_propietario: estudio?.datos_vivienda?.parentesco_propietario || "",
      clase_vivienda: estudio?.datos_vivienda?.clase_vivienda || "",
      pisos_construccion: estudio?.datos_vivienda?.pisos_construccion || "",
      piso_cemento: estudio?.datos_vivienda?.piso_cemento || false,
      tiene_sala: estudio?.datos_vivienda?.tiene_sala || false,
      tiene_comedor: estudio?.datos_vivienda?.tiene_comedor || false,
      tiene_cocina: estudio?.datos_vivienda?.tiene_cocina || false,
      numero_banos: estudio?.datos_vivienda?.numero_banos || "",
      tiene_patio: estudio?.datos_vivienda?.tiene_patio || false,
      numero_recamaras: estudio?.datos_vivienda?.numero_recamaras || "",
      otros_espacios: estudio?.datos_vivienda?.otros_espacios || "",
      descripcion_vivienda: estudio?.datos_vivienda?.descripcion_vivienda || "",
      
      // Electrodomésticos
      tiene_refrigerador: estudio?.datos_vivienda?.tiene_refrigerador || false,
      tiene_microondas: estudio?.datos_vivienda?.tiene_microondas || false,
      tiene_audio: estudio?.datos_vivienda?.tiene_audio || false,
      tiene_tv: estudio?.datos_vivienda?.tiene_tv || false,
      tiene_estufa: estudio?.datos_vivienda?.tiene_estufa || false,
      tiene_computadora: estudio?.datos_vivienda?.tiene_computadora || false,
      otros_electrodomesticos: estudio?.datos_vivienda?.otros_electrodomesticos || "",
      
      // Datos económicos
      personas_contribuyen_gasto: estudio?.datos_economicos?.personas_contribuyen_gasto || "",
      ocupacion_candidato: estudio?.datos_economicos?.ocupacion_candidato || "",
      ocupacion_pareja: estudio?.datos_economicos?.ocupacion_pareja || "",
      tiene_dependientes: estudio?.datos_economicos?.tiene_dependientes || false,
      cuantos_dependientes: estudio?.datos_economicos?.cuantos_dependientes || "",
      fuente_ingresos_principal: estudio?.datos_economicos?.fuente_ingresos_principal || "",
      otra_fuente_ingresos: estudio?.datos_economicos?.otra_fuente_ingresos || false,
      
      // Ingresos (dynamic list)
      ingresos: estudio?.datos_economicos?.ingresos || [{ concepto: "", monto: "" }],
      
      // Egresos (dynamic list)
      egresos: estudio?.datos_economicos?.egresos || [{ concepto: "", monto: "" }],
      
      // Propiedades y créditos
      tiene_auto_propio: estudio?.datos_economicos?.tiene_auto_propio || false,
      valor_auto_propio: estudio?.datos_economicos?.valor_auto_propio || "",
      tiene_auto_familiar: estudio?.datos_economicos?.tiene_auto_familiar || false,
      valor_auto_familiar: estudio?.datos_economicos?.valor_auto_familiar || "",
      tiene_casa_terreno: estudio?.datos_economicos?.tiene_casa_terreno || false,
      valor_casa_terreno: estudio?.datos_economicos?.valor_casa_terreno || "",
      tiene_hipoteca: estudio?.datos_economicos?.tiene_hipoteca || false,
      valor_hipoteca: estudio?.datos_economicos?.valor_hipoteca || "",
      tiene_deuda_bancaria: estudio?.datos_economicos?.tiene_deuda_bancaria || false,
      monto_deuda_bancaria: estudio?.datos_economicos?.monto_deuda_bancaria || "",
      
      // Datos de salud
      peso: estudio?.datos_sociodemograficos?.peso || "",
      talla: estudio?.datos_sociodemograficos?.talla || "",
      estado_salud: estudio?.datos_sociodemograficos?.estado_salud || "",
      padece_enfermedad: estudio?.datos_sociodemograficos?.padece_enfermedad || "",
      alergias: estudio?.datos_sociodemograficos?.alergias || "",
      servicio_medico: estudio?.datos_sociodemograficos?.servicio_medico || "",
      intervencion_quirurgica: estudio?.datos_sociodemograficos?.intervencion_quirurgica || "",
      hospitalizacion: estudio?.datos_sociodemograficos?.hospitalizacion || "",
      toma_medicamento: estudio?.datos_sociodemograficos?.toma_medicamento || "",
      tratamiento_neurologico: estudio?.datos_sociodemograficos?.tratamiento_neurologico || false,
      tratamiento_psicologico: estudio?.datos_sociodemograficos?.tratamiento_psicologico || false,
      tratamiento_psiquiatrico: estudio?.datos_sociodemograficos?.tratamiento_psiquiatrico || false,
      usa_lentes: estudio?.datos_sociodemograficos?.usa_lentes || false,
      fuma: estudio?.datos_sociodemograficos?.fuma || false,
      bebe_alcohol: estudio?.datos_sociodemograficos?.bebe_alcohol || false,
      consumo_drogas: estudio?.datos_sociodemograficos?.consumo_drogas || false,
      acepta_toxicologico: estudio?.datos_sociodemograficos?.acepta_toxicologico || true,
      practica_deporte: estudio?.datos_sociodemograficos?.practica_deporte || "",
      club_social: estudio?.datos_sociodemograficos?.club_social || "",
      lee_libros: estudio?.datos_sociodemograficos?.lee_libros || false,
      habitos_salud: estudio?.datos_sociodemograficos?.habitos_salud || "",
      
      // Información legal
      proceso_judicial: estudio?.datos_sociodemograficos?.proceso_judicial || false,
      situacion_juridica: estudio?.datos_sociodemograficos?.situacion_juridica || "",
      proceso_administrativo: estudio?.datos_sociodemograficos?.proceso_administrativo || false,
      familiares_prision: estudio?.datos_sociodemograficos?.familiares_prision || false,
      
      // Referencias laborales
      referencias_laborales: estudio?.datos_laborales?.referencias || [
        { nombre_empresa: "", nombre_jefe: "", sector: "", fecha_ingreso: "", fecha_salida: "", sueldo: "", motivo_salida: "" },
        { nombre_empresa: "", nombre_jefe: "", sector: "", fecha_ingreso: "", fecha_salida: "", sueldo: "", motivo_salida: "" },
      ],
      
      // Referencias personales
      referencias_personales: estudio?.datos_referencias?.referencias || [
        { nombre: "", edad: "", parentesco: "", ocupacion: "", tiempo_conocerlo: "", telefono: "", observaciones: "" },
        { nombre: "", edad: "", parentesco: "", ocupacion: "", tiempo_conocerlo: "", telefono: "", observaciones: "" },
      ],
      
      // Resultado final
      resultado_general: estudio?.resultado_general || "",
      calificacion_riesgo: estudio?.calificacion_riesgo || "",
      observaciones_finales: estudio?.observaciones_finales || "",
    },
  });

  // Load candidate data and reset form when estudio changes
  useEffect(() => {
    const loadCandidatoData = async () => {
      if (estudio?.candidato_user_id) {
        setLoadingCandidato(true);
        try {
          const { data, error } = await supabase
            .from("perfil_candidato")
            .select("*")
            .eq("user_id", estudio.candidato_user_id)
            .maybeSingle();
          
          if (!error && data) {
            setCandidatoData(data);
          }
        } catch (err) {
          console.error("Error loading candidate data:", err);
        } finally {
          setLoadingCandidato(false);
        }
      }
    };
    
    if (open && estudio) {
      loadCandidatoData();
    } else {
      setCandidatoData(null);
    }
  }, [estudio?.id, estudio?.candidato_user_id, open]);

  const candidatoPresente = watch("candidato_presente");

  const guardarBorrador = async (data: any) => {
    if (!estudio?.id) return;
    
    setIsSubmitting(true);
    try {
      const updateData = buildUpdateData(data, true);

      const { error } = await supabase
        .from("estudios_socioeconomicos")
        .update(updateData)
        .eq("id", estudio.id);

      if (error) throw error;

      toast({
        title: "Borrador guardado",
        description: "Los datos se han guardado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const enviarEstudio = async (data: any) => {
    if (!estudio?.id) return;
    
    setIsSubmitting(true);
    try {
      const updateData = buildUpdateData(data, false);

      const { error } = await supabase
        .from("estudios_socioeconomicos")
        .update(updateData)
        .eq("id", estudio.id);

      if (error) throw error;

      toast({
        title: "Estudio enviado",
        description: "El estudio socioeconómico ha sido entregado exitosamente",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildUpdateData = (data: any, isBorrador: boolean) => {
    return {
      fecha_visita: data.fecha_visita,
      hora_visita: data.hora_visita,
      candidato_presente: data.candidato_presente,
      motivo_ausencia: data.motivo_ausencia,
      observaciones_visita: data.observaciones_visita,
      datos_sociodemograficos: {
        estado_civil_verificado: data.estado_civil_verificado,
        lugar_nacimiento: data.lugar_nacimiento,
        curp: data.curp,
        rfc: data.rfc,
        folio_ine: data.folio_ine,
        telefono_fijo: data.telefono_fijo,
        ocupacion_actual: data.ocupacion_actual,
        ubicacion_google: data.ubicacion_google,
        familiares: data.familiares,
        estudia_actualmente: data.estudia_actualmente,
        que_estudia: data.que_estudia,
        idioma_adicional: data.idioma_adicional,
        escolaridad_detalle: data.escolaridad_detalle,
        peso: data.peso,
        talla: data.talla,
        estado_salud: data.estado_salud,
        padece_enfermedad: data.padece_enfermedad,
        alergias: data.alergias,
        servicio_medico: data.servicio_medico,
        intervencion_quirurgica: data.intervencion_quirurgica,
        hospitalizacion: data.hospitalizacion,
        toma_medicamento: data.toma_medicamento,
        tratamiento_neurologico: data.tratamiento_neurologico,
        tratamiento_psicologico: data.tratamiento_psicologico,
        tratamiento_psiquiatrico: data.tratamiento_psiquiatrico,
        usa_lentes: data.usa_lentes,
        fuma: data.fuma,
        bebe_alcohol: data.bebe_alcohol,
        consumo_drogas: data.consumo_drogas,
        acepta_toxicologico: data.acepta_toxicologico,
        practica_deporte: data.practica_deporte,
        club_social: data.club_social,
        lee_libros: data.lee_libros,
        habitos_salud: data.habitos_salud,
        proceso_judicial: data.proceso_judicial,
        situacion_juridica: data.situacion_juridica,
        proceso_administrativo: data.proceso_administrativo,
        familiares_prision: data.familiares_prision,
      },
      datos_vivienda: {
        calle_numero: data.calle_numero,
        colonia: data.colonia,
        codigo_postal: data.codigo_postal,
        alcaldia_municipio: data.alcaldia_municipio,
        ciudad: data.ciudad,
        telefono_fijo_casa: data.telefono_fijo_casa,
        anos_residencia: data.anos_residencia,
        personas_en_domicilio: data.personas_en_domicilio,
        tipo_dominio: data.tipo_dominio,
        tipo_vivienda: data.tipo_vivienda,
        zona: data.zona,
        nombre_propietario: data.nombre_propietario,
        parentesco_propietario: data.parentesco_propietario,
        clase_vivienda: data.clase_vivienda,
        pisos_construccion: data.pisos_construccion,
        piso_cemento: data.piso_cemento,
        tiene_sala: data.tiene_sala,
        tiene_comedor: data.tiene_comedor,
        tiene_cocina: data.tiene_cocina,
        numero_banos: data.numero_banos,
        tiene_patio: data.tiene_patio,
        numero_recamaras: data.numero_recamaras,
        otros_espacios: data.otros_espacios,
        descripcion_vivienda: data.descripcion_vivienda,
        tiene_refrigerador: data.tiene_refrigerador,
        tiene_microondas: data.tiene_microondas,
        tiene_audio: data.tiene_audio,
        tiene_tv: data.tiene_tv,
        tiene_estufa: data.tiene_estufa,
        tiene_computadora: data.tiene_computadora,
        otros_electrodomesticos: data.otros_electrodomesticos,
      },
      datos_economicos: {
        personas_contribuyen_gasto: data.personas_contribuyen_gasto,
        ocupacion_candidato: data.ocupacion_candidato,
        ocupacion_pareja: data.ocupacion_pareja,
        tiene_dependientes: data.tiene_dependientes,
        cuantos_dependientes: data.cuantos_dependientes,
        fuente_ingresos_principal: data.fuente_ingresos_principal,
        otra_fuente_ingresos: data.otra_fuente_ingresos,
        ingresos: data.ingresos?.filter((i: any) => i.concepto || i.monto) || [],
        egresos: data.egresos?.filter((e: any) => e.concepto || e.monto) || [],
        total_ingresos: data.ingresos?.reduce((sum: number, i: any) => sum + (parseFloat(i.monto) || 0), 0) || 0,
        total_egresos: data.egresos?.reduce((sum: number, e: any) => sum + (parseFloat(e.monto) || 0), 0) || 0,
        tiene_auto_propio: data.tiene_auto_propio,
        valor_auto_propio: data.valor_auto_propio,
        tiene_auto_familiar: data.tiene_auto_familiar,
        valor_auto_familiar: data.valor_auto_familiar,
        tiene_casa_terreno: data.tiene_casa_terreno,
        valor_casa_terreno: data.valor_casa_terreno,
        tiene_hipoteca: data.tiene_hipoteca,
        valor_hipoteca: data.valor_hipoteca,
        tiene_deuda_bancaria: data.tiene_deuda_bancaria,
        monto_deuda_bancaria: data.monto_deuda_bancaria,
      },
      datos_laborales: {
        referencias: data.referencias_laborales,
      },
      datos_referencias: {
        referencias: data.referencias_personales,
      },
      resultado_general: data.resultado_general,
      calificacion_riesgo: data.calificacion_riesgo,
      observaciones_finales: data.observaciones_finales,
      estatus: isBorrador ? "en_proceso" : "entregado",
      borrador: isBorrador,
      fecha_entrega: isBorrador ? null : new Date().toISOString(),
    };
  };

  if (!estudio) return null;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b shrink-0 bg-background">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Estudio Socioeconómico
            <Badge variant="outline" className="ml-2 font-mono text-xs">{estudio.folio}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-muted/20 hover:scrollbar-thumb-primary/50">
          <form className="p-4 space-y-6">
            {/* Sección: Información de la Solicitud (Solo Lectura) */}
            <div className="space-y-4">
                  <Card className="bg-muted/30 border-primary/20">
                    <CardHeader className="py-3">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Datos de la Solicitud</CardTitle>
                        <Badge variant="secondary" className="text-xs">Solo lectura</Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Información precargada del sistema - No editable
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Nombre del candidato destacado */}
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Candidato
                        </Label>
                        <p className="text-lg font-semibold text-primary">{estudio.nombre_candidato || "Sin nombre"}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            Empresa Solicitante
                          </Label>
                          <p className="text-sm font-medium">{estudio.empresas?.nombre_empresa || estudio.empresa_nombre || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Puesto</Label>
                          <p className="text-sm font-medium">{estudio.vacante_puesto || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Sueldo Ofertado</Label>
                          <p className="text-sm font-medium">{estudio.sueldo_ofertado ? `$${estudio.sueldo_ofertado}` : "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Fecha Solicitud</Label>
                          <p className="text-sm font-medium">{estudio.fecha_solicitud ? format(new Date(estudio.fecha_solicitud), "dd/MM/yyyy") : "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Fecha Límite</Label>
                          <p className="text-sm font-medium text-destructive">{estudio.fecha_limite ? format(new Date(estudio.fecha_limite), "dd/MM/yyyy") : "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Folio Estudio</Label>
                          <p className="text-sm font-mono font-medium">{estudio.folio || "—"}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Dirección a Visitar
                        </Label>
                        <p className="text-sm font-medium">{estudio.direccion_visita || "—"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Información Personal del candidato precargada */}
                  <Card className="bg-muted/30 border-primary/20">
                    <CardHeader className="py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">Información de Contacto del Candidato</CardTitle>
                        <Badge variant="secondary" className="text-xs">Desde perfil</Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Datos de contacto del candidato precargados desde su perfil
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingCandidato ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Cargando datos del candidato...</span>
                        </div>
                      ) : candidatoData ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Nombre Completo
                              </Label>
                              <p className="text-sm font-medium">{candidatoData.nombre_completo || estudio.nombre_candidato}</p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                Email
                              </Label>
                              <p className="text-sm font-medium">{candidatoData.email || "—"}</p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Teléfono
                              </Label>
                              <p className="text-sm font-medium">{candidatoData.telefono || "—"}</p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Ubicación
                              </Label>
                              <p className="text-sm font-medium">{candidatoData.ubicacion || "—"}</p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Nivel Educación</Label>
                              <p className="text-sm font-medium">{candidatoData.nivel_educacion || "—"}</p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Código Candidato</Label>
                              <p className="text-sm font-mono font-medium">{candidatoData.codigo_candidato || "—"}</p>
                            </div>
                          </div>
                          
                          {/* Información profesional adicional */}
                          {(candidatoData.puesto_actual || candidatoData.empresa_actual) && (
                            <>
                              <Separator />
                              <div className="grid grid-cols-2 gap-4">
                                {candidatoData.puesto_actual && (
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Briefcase className="h-3 w-3" />
                                      Puesto Actual
                                    </Label>
                                    <p className="text-sm font-medium">{candidatoData.puesto_actual}</p>
                                  </div>
                                )}
                                {candidatoData.empresa_actual && (
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      Empresa Actual
                                    </Label>
                                    <p className="text-sm font-medium">{candidatoData.empresa_actual}</p>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Nombre Completo
                              </Label>
                              <p className="text-sm font-medium">{estudio.nombre_candidato || "—"}</p>
                            </div>
                          </div>
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              No se encontró perfil de candidato registrado. Los datos de contacto deberán capturarse durante la visita.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sección: Datos de la Visita */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Datos de la Visita
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fecha_visita">Fecha de Visita *</Label>
                          <Input
                            id="fecha_visita"
                            type="date"
                            {...register("fecha_visita")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hora_visita">Hora de Visita *</Label>
                          <Input
                            id="hora_visita"
                            type="time"
                            {...register("hora_visita")}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>¿Se encontró al candidato en el domicilio? *</Label>
                        <RadioGroup
                          value={candidatoPresente ? "si" : "no"}
                          onValueChange={(value) => setValue("candidato_presente", value === "si")}
                          className="flex gap-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="si" id="presente-si" />
                            <Label htmlFor="presente-si" className="font-normal">Sí</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="presente-no" />
                            <Label htmlFor="presente-no" className="font-normal">No</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {!candidatoPresente && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <Label htmlFor="motivo_ausencia" className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            Motivo de ausencia *
                          </Label>
                          <Textarea
                            id="motivo_ausencia"
                            placeholder="Explique el motivo por el cual no se encontró al candidato..."
                            {...register("motivo_ausencia")}
                            className="mt-2"
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="observaciones_visita">Observaciones de la visita</Label>
                        <Textarea
                          id="observaciones_visita"
                          placeholder="Observaciones generales sobre la visita, vecindario, accesos..."
                          rows={3}
                          {...register("observaciones_visita")}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sección: Datos Candidato Verificados */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Datos Personales Verificados
                      </CardTitle>
                      <CardDescription className="text-xs">Datos verificados durante la visita</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Estado Civil</Label>
                          <Select 
                            value={watch("estado_civil_verificado")} 
                            onValueChange={(v) => setValue("estado_civil_verificado", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="soltero">Soltero/a</SelectItem>
                              <SelectItem value="casado">Casado/a</SelectItem>
                              <SelectItem value="union_libre">Unión Libre</SelectItem>
                              <SelectItem value="divorciado">Divorciado/a</SelectItem>
                              <SelectItem value="viudo">Viudo/a</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="lugar_nacimiento">Lugar de Nacimiento</Label>
                          <Input {...register("lugar_nacimiento")} placeholder="Ciudad, Estado" />
                        </div>
                        <div>
                          <Label htmlFor="ocupacion_actual">Ocupación Actual</Label>
                          <Input {...register("ocupacion_actual")} placeholder="Empleo actual" />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="curp">CURP</Label>
                          <Input {...register("curp")} placeholder="18 caracteres" maxLength={18} className="font-mono" />
                        </div>
                        <div>
                          <Label htmlFor="rfc">RFC</Label>
                          <Input {...register("rfc")} placeholder="13 caracteres" maxLength={13} className="font-mono" />
                        </div>
                        <div>
                          <Label htmlFor="folio_ine">Folio INE</Label>
                          <Input {...register("folio_ine")} placeholder="Folio de credencial" className="font-mono" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="telefono_fijo">Teléfono Fijo</Label>
                          <Input {...register("telefono_fijo")} placeholder="10 dígitos" type="tel" />
                        </div>
                        <div>
                          <Label htmlFor="ubicacion_google">Ubicación Google Maps</Label>
                          <Input {...register("ubicacion_google")} placeholder="URL de Google Maps" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Escolaridad */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        Escolaridad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                          <Checkbox
                            id="estudia_actualmente"
                            checked={watch("estudia_actualmente")}
                            onCheckedChange={(checked) => setValue("estudia_actualmente", checked === true)}
                          />
                          <Label htmlFor="estudia_actualmente" className="font-normal cursor-pointer">
                            Actualmente estudia
                          </Label>
                        </div>
                        {watch("estudia_actualmente") && (
                          <div>
                            <Label>¿Qué estudia?</Label>
                            <Input {...register("que_estudia")} placeholder="Carrera/Curso" />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="idioma_adicional">Idioma adicional al español</Label>
                        <Input {...register("idioma_adicional")} placeholder="Inglés, Francés, etc." />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sección: Datos Familiares */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Datos Familiares del Núcleo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {["Madre", "Padre", "Pareja", "Hijo 1", "Hijo 2", "Hermano"].map((parentesco, idx) => (
                          <div key={idx} className="grid grid-cols-5 gap-2 items-end p-2 bg-muted/30 rounded">
                            <div>
                              <Label className="text-xs">{parentesco}</Label>
                              <Input 
                                placeholder="Nombre"
                                {...register(`familiares.${idx}.nombre` as any)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Vive</Label>
                              <Select
                                value={watch(`familiares.${idx}.vive` as any) ? "si" : "no"}
                                onValueChange={(v) => setValue(`familiares.${idx}.vive` as any, v === "si")}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="si">Sí</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Edad</Label>
                              <Input 
                                type="number"
                                placeholder="Edad"
                                {...register(`familiares.${idx}.edad` as any)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Ocupación</Label>
                              <Input 
                                placeholder="Ocupación"
                                {...register(`familiares.${idx}.ocupacion` as any)}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sección: Vivienda */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Domicilio
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Label>Calle y Número</Label>
                          <Input {...register("calle_numero")} placeholder="Calle y número" />
                        </div>
                        <div>
                          <Label>Colonia</Label>
                          <Input {...register("colonia")} placeholder="Colonia" />
                        </div>
                        <div>
                          <Label>Código Postal</Label>
                          <Input {...register("codigo_postal")} placeholder="00000" maxLength={5} />
                        </div>
                        <div>
                          <Label>Alcaldía/Municipio</Label>
                          <Input {...register("alcaldia_municipio")} placeholder="Municipio" />
                        </div>
                        <div>
                          <Label>Ciudad</Label>
                          <Input {...register("ciudad")} placeholder="Ciudad" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Años de Residencia</Label>
                          <Input {...register("anos_residencia")} type="number" placeholder="Años" />
                        </div>
                        <div>
                          <Label>Personas en Domicilio</Label>
                          <Input {...register("personas_en_domicilio")} type="number" placeholder="Número" />
                        </div>
                        <div>
                          <Label>Teléfono Fijo Casa</Label>
                          <Input {...register("telefono_fijo_casa")} placeholder="10 dígitos" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Home className="h-4 w-4 text-primary" />
                        Características de la Vivienda
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Tipo de Dominio</Label>
                          <Select value={watch("tipo_dominio")} onValueChange={(v) => setValue("tipo_dominio", v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="propia">Propia</SelectItem>
                              <SelectItem value="rentada">Rentada</SelectItem>
                              <SelectItem value="prestada">Prestada</SelectItem>
                              <SelectItem value="familiar">Familiar</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tipo de Vivienda</Label>
                          <Select value={watch("tipo_vivienda")} onValueChange={(v) => setValue("tipo_vivienda", v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="casa">Casa</SelectItem>
                              <SelectItem value="departamento">Departamento</SelectItem>
                              <SelectItem value="multifamiliar">Multifamiliar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Zona</Label>
                          <Select value={watch("zona")} onValueChange={(v) => setValue("zona", v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="baja">Baja</SelectItem>
                              <SelectItem value="vulnerable">Vulnerable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Pisos de Construcción</Label>
                          <Input {...register("pisos_construccion")} type="number" placeholder="Número" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre del Propietario</Label>
                          <Input {...register("nombre_propietario")} placeholder="Nombre completo" />
                        </div>
                        <div>
                          <Label>Parentesco con Propietario</Label>
                          <Input {...register("parentesco_propietario")} placeholder="Padre, Madre, etc." />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Espacios de la vivienda</Label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {[
                            { key: "tiene_sala", label: "Sala" },
                            { key: "tiene_comedor", label: "Comedor" },
                            { key: "tiene_cocina", label: "Cocina" },
                            { key: "tiene_patio", label: "Patio/Jardín" },
                            { key: "piso_cemento", label: "Piso Cemento" },
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={watch(key as any)}
                                onCheckedChange={(checked) => setValue(key as any, checked === true)}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Número de Baños</Label>
                          <Input {...register("numero_banos")} type="number" placeholder="Número" />
                        </div>
                        <div>
                          <Label>Número de Recámaras</Label>
                          <Input {...register("numero_recamaras")} type="number" placeholder="Número" />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Electrodomésticos</Label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {[
                            { key: "tiene_refrigerador", label: "Refrigerador" },
                            { key: "tiene_microondas", label: "Microondas" },
                            { key: "tiene_estufa", label: "Estufa" },
                            { key: "tiene_tv", label: "TV" },
                            { key: "tiene_audio", label: "Sistema Audio" },
                            { key: "tiene_computadora", label: "Computadora" },
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={watch(key as any)}
                                onCheckedChange={(checked) => setValue(key as any, checked === true)}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Descripción de la Vivienda</Label>
                        <Textarea 
                          {...register("descripcion_vivienda")} 
                          placeholder="Descripción general del estado, limpieza, orden..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sección: Datos Económicos */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Datos Económicos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Personas que Contribuyen al Gasto</Label>
                          <Input {...register("personas_contribuyen_gasto")} type="number" placeholder="Número" />
                        </div>
                        <div>
                          <Label>Ocupación Candidato</Label>
                          <Input {...register("ocupacion_candidato")} placeholder="Ocupación actual" />
                        </div>
                        <div>
                          <Label>Ocupación Pareja</Label>
                          <Input {...register("ocupacion_pareja")} placeholder="Ocupación pareja" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="tiene_dependientes"
                            checked={watch("tiene_dependientes")}
                            onCheckedChange={(checked) => setValue("tiene_dependientes", checked === true)}
                          />
                          <Label htmlFor="tiene_dependientes" className="font-normal cursor-pointer">
                            Tiene dependientes económicos
                          </Label>
                        </div>
                        {watch("tiene_dependientes") && (
                          <div>
                            <Label>¿Cuántos?</Label>
                            <Input {...register("cuantos_dependientes")} type="number" placeholder="Número" />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Principal Fuente de Ingresos</Label>
                        <Input {...register("fuente_ingresos_principal")} placeholder="Empleo, negocio, etc." />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ingresos Card */}
                    <Card>
                      <CardHeader className="py-3 bg-green-500/10">
                        <CardTitle className="text-sm text-green-700 dark:text-green-400">Ingresos Mensuales</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-4">
                        {(watch("ingresos") as any[])?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={item.concepto}
                              onChange={(e) => {
                                const updated = [...(watch("ingresos") as any[])];
                                updated[index] = { ...updated[index], concepto: e.target.value };
                                setValue("ingresos", updated);
                              }}
                              placeholder="Concepto"
                              className="h-8 flex-1"
                            />
                            <Input
                              value={item.monto}
                              onChange={(e) => {
                                const updated = [...(watch("ingresos") as any[])];
                                updated[index] = { ...updated[index], monto: e.target.value };
                                setValue("ingresos", updated);
                              }}
                              type="number"
                              placeholder="$0.00"
                              className="h-8 w-28"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => {
                                const updated = (watch("ingresos") as any[]).filter((_: any, i: number) => i !== index);
                                setValue("ingresos", updated.length ? updated : [{ concepto: "", monto: "" }]);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const current = watch("ingresos") as any[];
                            setValue("ingresos", [...current, { concepto: "", monto: "" }]);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar Ingreso
                        </Button>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-sm">
                          <span>TOTAL INGRESOS:</span>
                          <span className="text-green-700 dark:text-green-400">
                            ${((watch("ingresos") as any[])?.reduce((sum: number, i: any) => sum + (parseFloat(i.monto) || 0), 0) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Egresos Card */}
                    <Card>
                      <CardHeader className="py-3 bg-red-500/10">
                        <CardTitle className="text-sm text-red-700 dark:text-red-400">Egresos Mensuales</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-4">
                        {(watch("egresos") as any[])?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={item.concepto}
                              onChange={(e) => {
                                const updated = [...(watch("egresos") as any[])];
                                updated[index] = { ...updated[index], concepto: e.target.value };
                                setValue("egresos", updated);
                              }}
                              placeholder="Concepto"
                              className="h-8 flex-1"
                            />
                            <Input
                              value={item.monto}
                              onChange={(e) => {
                                const updated = [...(watch("egresos") as any[])];
                                updated[index] = { ...updated[index], monto: e.target.value };
                                setValue("egresos", updated);
                              }}
                              type="number"
                              placeholder="$0.00"
                              className="h-8 w-28"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => {
                                const updated = (watch("egresos") as any[]).filter((_: any, i: number) => i !== index);
                                setValue("egresos", updated.length ? updated : [{ concepto: "", monto: "" }]);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const current = watch("egresos") as any[];
                            setValue("egresos", [...current, { concepto: "", monto: "" }]);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar Egreso
                        </Button>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-sm">
                          <span>TOTAL EGRESOS:</span>
                          <span className="text-red-700 dark:text-red-400">
                            ${((watch("egresos") as any[])?.reduce((sum: number, e: any) => sum + (parseFloat(e.monto) || 0), 0) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Propiedades y Créditos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { check: "tiene_auto_propio", value: "valor_auto_propio", label: "Auto Propio" },
                          { check: "tiene_auto_familiar", value: "valor_auto_familiar", label: "Auto Familiar" },
                          { check: "tiene_casa_terreno", value: "valor_casa_terreno", label: "Casa/Terreno" },
                          { check: "tiene_hipoteca", value: "valor_hipoteca", label: "Hipoteca" },
                          { check: "tiene_deuda_bancaria", value: "monto_deuda_bancaria", label: "Deuda Bancaria" },
                        ].map(({ check, value, label }) => (
                          <div key={check} className="space-y-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={watch(check as any)}
                                onCheckedChange={(checked) => setValue(check as any, checked === true)}
                              />
                              {label}
                            </label>
                            {watch(check as any) && (
                              <Input {...register(value as any)} type="number" placeholder="Valor $" className="h-8" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sección: Salud e Información Legal */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        Datos de Salud
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Peso (kg)</Label>
                          <Input {...register("peso")} type="number" placeholder="70" />
                        </div>
                        <div>
                          <Label>Talla (m)</Label>
                          <Input {...register("talla")} placeholder="1.75" />
                        </div>
                        <div>
                          <Label>Estado de Salud General</Label>
                          <Select value={watch("estado_salud")} onValueChange={(v) => setValue("estado_salud", v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excelente">Excelente</SelectItem>
                              <SelectItem value="bueno">Bueno</SelectItem>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="malo">Malo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>¿Padece alguna enfermedad?</Label>
                          <Input {...register("padece_enfermedad")} placeholder="Especificar o N/A" />
                        </div>
                        <div>
                          <Label>Alergias</Label>
                          <Input {...register("alergias")} placeholder="Especificar o N/A" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Servicio Médico que Frecuenta</Label>
                          <Input {...register("servicio_medico")} placeholder="IMSS, ISSSTE, Particular..." />
                        </div>
                        <div>
                          <Label>Medicamentos que Toma</Label>
                          <Input {...register("toma_medicamento")} placeholder="Especificar o N/A" />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {[
                          { key: "tratamiento_neurologico", label: "Tratamiento Neurológico" },
                          { key: "tratamiento_psicologico", label: "Tratamiento Psicológico" },
                          { key: "tratamiento_psiquiatrico", label: "Tratamiento Psiquiátrico" },
                          { key: "usa_lentes", label: "Usa Lentes" },
                          { key: "fuma", label: "Fuma" },
                          { key: "bebe_alcohol", label: "Bebe Alcohol" },
                          { key: "consumo_drogas", label: "Ha Consumido Drogas" },
                          { key: "acepta_toxicologico", label: "Acepta Toxicológico" },
                          { key: "lee_libros", label: "Lee Libros" },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox
                              checked={watch(key as any)}
                              onCheckedChange={(checked) => setValue(key as any, checked === true)}
                            />
                            {label}
                          </label>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>¿Practica algún deporte?</Label>
                          <Input {...register("practica_deporte")} placeholder="Especificar o N/A" />
                        </div>
                        <div>
                          <Label>Club Social / Actividades</Label>
                          <Input {...register("club_social")} placeholder="Especificar o N/A" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        Información Legal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: "proceso_judicial", label: "¿Ha estado sujeto a proceso judicial?" },
                          { key: "proceso_administrativo", label: "¿Ha estado sujeto a proceso administrativo?" },
                          { key: "familiares_prision", label: "¿Tiene familiares en prisión?" },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={watch(key as any)}
                              onCheckedChange={(checked) => setValue(key as any, checked === true)}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                      {watch("proceso_judicial") && (
                        <div>
                          <Label>Situación Jurídica Actual</Label>
                          <Textarea {...register("situacion_juridica")} placeholder="Describir situación..." />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sección: Referencias */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Referencias Laborales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[0, 1].map((idx) => (
                        <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-3">
                          <p className="text-xs font-medium text-muted-foreground">Referencia {idx + 1}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Empresa</Label>
                              <Input {...register(`referencias_laborales.${idx}.nombre_empresa` as any)} placeholder="Nombre empresa" className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Jefe Directo</Label>
                              <Input {...register(`referencias_laborales.${idx}.nombre_jefe` as any)} placeholder="Nombre jefe" className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Sector</Label>
                              <Input {...register(`referencias_laborales.${idx}.sector` as any)} placeholder="Industria" className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Fecha Ingreso</Label>
                              <Input {...register(`referencias_laborales.${idx}.fecha_ingreso` as any)} type="date" className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Fecha Salida</Label>
                              <Input {...register(`referencias_laborales.${idx}.fecha_salida` as any)} type="date" className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Sueldo</Label>
                              <Input {...register(`referencias_laborales.${idx}.sueldo` as any)} type="number" placeholder="$0.00" className="h-8" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Referencias Personales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[0, 1].map((idx) => (
                        <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-3">
                          <p className="text-xs font-medium text-muted-foreground">Referencia {idx + 1}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Nombre</Label>
                              <Input {...register(`referencias_personales.${idx}.nombre` as any)} placeholder="Nombre completo" className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Edad</Label>
                              <Input {...register(`referencias_personales.${idx}.edad` as any)} type="number" placeholder="Edad" className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Parentesco/Relación</Label>
                              <Input {...register(`referencias_personales.${idx}.parentesco` as any)} placeholder="Amigo, vecino..." className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Ocupación</Label>
                              <Input {...register(`referencias_personales.${idx}.ocupacion` as any)} placeholder="Ocupación" className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Tiempo de Conocerlo</Label>
                              <Input {...register(`referencias_personales.${idx}.tiempo_conocerlo` as any)} placeholder="2 años" className="h-8" />
                            </div>
                            <div>
                              <Label className="text-xs">Teléfono</Label>
                              <Input {...register(`referencias_personales.${idx}.telefono` as any)} placeholder="10 dígitos" className="h-8" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Observaciones</Label>
                            <Textarea {...register(`referencias_personales.${idx}.observaciones` as any)} placeholder="Comentarios..." rows={2} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Sección: Resultado Final */}
                <div className="space-y-4">
                  <Card className="border-primary/30">
                    <CardHeader className="py-3 bg-primary/5">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Resultado del Estudio
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Conclusiones finales del estudio socioeconómico
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <Label>Resultado General *</Label>
                        <Select value={watch("resultado_general")} onValueChange={(v) => setValue("resultado_general", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar resultado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="favorable">Favorable - Sin observaciones relevantes</SelectItem>
                            <SelectItem value="favorable_observaciones">Favorable con Observaciones</SelectItem>
                            <SelectItem value="no_favorable">No Favorable</SelectItem>
                            <SelectItem value="pendiente_info">Pendiente de Información</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Calificación de Riesgo *</Label>
                        <Select value={watch("calificacion_riesgo")} onValueChange={(v) => setValue("calificacion_riesgo", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar nivel de riesgo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bajo">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                Bajo
                              </span>
                            </SelectItem>
                            <SelectItem value="medio">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                Medio
                              </span>
                            </SelectItem>
                            <SelectItem value="alto">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                Alto
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Observaciones Finales y Recomendaciones</Label>
                        <Textarea 
                          {...register("observaciones_finales")} 
                          placeholder="Incluya todas las observaciones relevantes, banderas rojas encontradas, recomendaciones para el reclutador..."
                          rows={5}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </form>
            </div>

        {/* Footer con botones */}
        <div className="p-4 border-t shrink-0 flex justify-between gap-3 bg-muted/30">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSubmit(guardarBorrador)}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Borrador
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(enviarEstudio)}
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Estudio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
