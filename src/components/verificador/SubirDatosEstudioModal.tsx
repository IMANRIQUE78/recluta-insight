import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText
} from "lucide-react";
import { format } from "date-fns";

interface SubirDatosEstudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudio: any;
  onSuccess: () => void;
}

export default function SubirDatosEstudioModal({
  open,
  onOpenChange,
  estudio,
  onSuccess,
}: SubirDatosEstudioModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      fecha_visita: estudio?.fecha_visita || format(new Date(), "yyyy-MM-dd"),
      hora_visita: estudio?.hora_visita || "",
      candidato_presente: estudio?.candidato_presente ?? true,
      motivo_ausencia: estudio?.motivo_ausencia || "",
      observaciones_visita: estudio?.observaciones_visita || "",
      // Datos sociodemográficos
      estado_civil: estudio?.datos_sociodemograficos?.estado_civil || "",
      numero_dependientes: estudio?.datos_sociodemograficos?.numero_dependientes || "",
      escolaridad: estudio?.datos_sociodemograficos?.escolaridad || "",
      tipo_vivienda: estudio?.datos_vivienda?.tipo_vivienda || "",
      propiedad_vivienda: estudio?.datos_vivienda?.propiedad_vivienda || "",
      antiguedad_vivienda: estudio?.datos_vivienda?.antiguedad_vivienda || "",
      estado_vivienda: estudio?.datos_vivienda?.estado_vivienda || "",
      // Datos económicos
      ingreso_mensual: estudio?.datos_economicos?.ingreso_mensual || "",
      gastos_mensuales: estudio?.datos_economicos?.gastos_mensuales || "",
      deudas_pendientes: estudio?.datos_economicos?.deudas_pendientes || "",
      vehiculo_propio: estudio?.datos_economicos?.vehiculo_propio || "",
      // Referencias
      referencias_verificadas: estudio?.datos_referencias?.referencias_verificadas || "",
      referencias_comentarios: estudio?.datos_referencias?.referencias_comentarios || "",
      // Resultado
      resultado_general: estudio?.resultado_general || "",
      calificacion_riesgo: estudio?.calificacion_riesgo || "",
      observaciones_finales: estudio?.observaciones_finales || "",
    },
  });

  const candidatoPresente = watch("candidato_presente");

  const guardarBorrador = async (data: any) => {
    if (!estudio?.id) return;
    
    setIsSubmitting(true);
    try {
      const updateData = {
        fecha_visita: data.fecha_visita,
        hora_visita: data.hora_visita,
        candidato_presente: data.candidato_presente,
        motivo_ausencia: data.motivo_ausencia,
        observaciones_visita: data.observaciones_visita,
        datos_sociodemograficos: {
          estado_civil: data.estado_civil,
          numero_dependientes: data.numero_dependientes,
          escolaridad: data.escolaridad,
        },
        datos_vivienda: {
          tipo_vivienda: data.tipo_vivienda,
          propiedad_vivienda: data.propiedad_vivienda,
          antiguedad_vivienda: data.antiguedad_vivienda,
          estado_vivienda: data.estado_vivienda,
        },
        datos_economicos: {
          ingreso_mensual: data.ingreso_mensual,
          gastos_mensuales: data.gastos_mensuales,
          deudas_pendientes: data.deudas_pendientes,
          vehiculo_propio: data.vehiculo_propio,
        },
        datos_referencias: {
          referencias_verificadas: data.referencias_verificadas,
          referencias_comentarios: data.referencias_comentarios,
        },
        resultado_general: data.resultado_general,
        calificacion_riesgo: data.calificacion_riesgo,
        observaciones_finales: data.observaciones_finales,
        estatus: "en_proceso",
        borrador: true,
      };

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
      const updateData = {
        fecha_visita: data.fecha_visita,
        hora_visita: data.hora_visita,
        candidato_presente: data.candidato_presente,
        motivo_ausencia: data.motivo_ausencia,
        observaciones_visita: data.observaciones_visita,
        datos_sociodemograficos: {
          estado_civil: data.estado_civil,
          numero_dependientes: data.numero_dependientes,
          escolaridad: data.escolaridad,
        },
        datos_vivienda: {
          tipo_vivienda: data.tipo_vivienda,
          propiedad_vivienda: data.propiedad_vivienda,
          antiguedad_vivienda: data.antiguedad_vivienda,
          estado_vivienda: data.estado_vivienda,
        },
        datos_economicos: {
          ingreso_mensual: data.ingreso_mensual,
          gastos_mensuales: data.gastos_mensuales,
          deudas_pendientes: data.deudas_pendientes,
          vehiculo_propio: data.vehiculo_propio,
        },
        datos_referencias: {
          referencias_verificadas: data.referencias_verificadas,
          referencias_comentarios: data.referencias_comentarios,
        },
        resultado_general: data.resultado_general,
        calificacion_riesgo: data.calificacion_riesgo,
        observaciones_finales: data.observaciones_finales,
        estatus: "entregado",
        borrador: false,
        fecha_entrega: new Date().toISOString(),
      };

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

  if (!estudio) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Subir Datos del Estudio Socioeconómico
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          {/* Info del estudio (solo lectura) */}
          <Card className="bg-muted/30">
            <CardContent className="py-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Folio</p>
                  <p className="font-mono font-medium">{estudio.folio}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Candidato</p>
                  <p className="font-medium">{estudio.nombre_candidato}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Puesto</p>
                  <p className="font-medium">{estudio.vacante_puesto}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Dirección</p>
                  <p className="font-medium truncate">{estudio.direccion_visita}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <ScrollArea className="flex-1 px-6 max-h-[55vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-5 mb-4">
              <TabsTrigger value="general" className="text-xs">
                <Calendar className="h-3 w-3 mr-1 hidden sm:inline" />
                General
              </TabsTrigger>
              <TabsTrigger value="sociodemograficos" className="text-xs">
                <User className="h-3 w-3 mr-1 hidden sm:inline" />
                Datos
              </TabsTrigger>
              <TabsTrigger value="vivienda" className="text-xs">
                <Home className="h-3 w-3 mr-1 hidden sm:inline" />
                Vivienda
              </TabsTrigger>
              <TabsTrigger value="economicos" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1 hidden sm:inline" />
                Económico
              </TabsTrigger>
              <TabsTrigger value="resultado" className="text-xs">
                <FileText className="h-3 w-3 mr-1 hidden sm:inline" />
                Resultado
              </TabsTrigger>
            </TabsList>

            <form className="space-y-4 pb-4">
              {/* Tab: Datos Generales */}
              <TabsContent value="general" className="space-y-4 mt-0">
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
                        <Label htmlFor="fecha_visita">Fecha de Visita</Label>
                        <Input
                          id="fecha_visita"
                          type="date"
                          {...register("fecha_visita")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hora_visita">Hora de Visita</Label>
                        <Input
                          id="hora_visita"
                          type="time"
                          {...register("hora_visita")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>¿Se encontró al candidato en el domicilio?</Label>
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
                      <div>
                        <Label htmlFor="motivo_ausencia">Motivo de ausencia</Label>
                        <Textarea
                          id="motivo_ausencia"
                          placeholder="Explique el motivo por el cual no se encontró al candidato..."
                          {...register("motivo_ausencia")}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="observaciones_visita">Observaciones de la visita</Label>
                      <Textarea
                        id="observaciones_visita"
                        placeholder="Observaciones generales sobre la visita..."
                        {...register("observaciones_visita")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Datos Sociodemográficos */}
              <TabsContent value="sociodemograficos" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Datos Sociodemográficos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="estado_civil">Estado Civil</Label>
                        <Input
                          id="estado_civil"
                          placeholder="Soltero, Casado, etc."
                          {...register("estado_civil")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero_dependientes">Número de Dependientes</Label>
                        <Input
                          id="numero_dependientes"
                          type="number"
                          min="0"
                          {...register("numero_dependientes")}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="escolaridad">Escolaridad</Label>
                      <Input
                        id="escolaridad"
                        placeholder="Preparatoria, Licenciatura, etc."
                        {...register("escolaridad")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Vivienda */}
              <TabsContent value="vivienda" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      Datos de Vivienda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tipo_vivienda">Tipo de Vivienda</Label>
                        <Input
                          id="tipo_vivienda"
                          placeholder="Casa, Departamento, etc."
                          {...register("tipo_vivienda")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="propiedad_vivienda">Propiedad</Label>
                        <Input
                          id="propiedad_vivienda"
                          placeholder="Propia, Rentada, Prestada"
                          {...register("propiedad_vivienda")}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="antiguedad_vivienda">Antigüedad en la Vivienda</Label>
                        <Input
                          id="antiguedad_vivienda"
                          placeholder="2 años, 6 meses, etc."
                          {...register("antiguedad_vivienda")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="estado_vivienda">Estado de la Vivienda</Label>
                        <Input
                          id="estado_vivienda"
                          placeholder="Bueno, Regular, etc."
                          {...register("estado_vivienda")}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Económicos */}
              <TabsContent value="economicos" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Datos Económicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ingreso_mensual">Ingreso Mensual Familiar</Label>
                        <Input
                          id="ingreso_mensual"
                          placeholder="$15,000"
                          {...register("ingreso_mensual")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gastos_mensuales">Gastos Mensuales</Label>
                        <Input
                          id="gastos_mensuales"
                          placeholder="$10,000"
                          {...register("gastos_mensuales")}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="deudas_pendientes">Deudas Pendientes</Label>
                        <Input
                          id="deudas_pendientes"
                          placeholder="Sin deudas, Crédito auto, etc."
                          {...register("deudas_pendientes")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehiculo_propio">Vehículo Propio</Label>
                        <Input
                          id="vehiculo_propio"
                          placeholder="Sí/No, Tipo"
                          {...register("vehiculo_propio")}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Referencias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="referencias_verificadas">Referencias Verificadas</Label>
                      <Input
                        id="referencias_verificadas"
                        placeholder="3 de 3 verificadas"
                        {...register("referencias_verificadas")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="referencias_comentarios">Comentarios de Referencias</Label>
                      <Textarea
                        id="referencias_comentarios"
                        placeholder="Resumen de las referencias verificadas..."
                        {...register("referencias_comentarios")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Resultado */}
              <TabsContent value="resultado" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Resultado del Estudio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="resultado_general">Resultado General</Label>
                      <Input
                        id="resultado_general"
                        placeholder="Sin red flags, Observaciones relevantes, etc."
                        {...register("resultado_general")}
                      />
                    </div>
                    
                    <div>
                      <Label>Calificación de Riesgo</Label>
                      <RadioGroup
                        value={watch("calificacion_riesgo")}
                        onValueChange={(value) => setValue("calificacion_riesgo", value)}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2"
                      >
                        <div className="flex items-center space-x-2 p-2 border rounded-lg">
                          <RadioGroupItem value="bajo" id="riesgo-bajo" />
                          <Label htmlFor="riesgo-bajo" className="font-normal text-green-600">Bajo</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 border rounded-lg">
                          <RadioGroupItem value="medio" id="riesgo-medio" />
                          <Label htmlFor="riesgo-medio" className="font-normal text-yellow-600">Medio</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 border rounded-lg">
                          <RadioGroupItem value="alto" id="riesgo-alto" />
                          <Label htmlFor="riesgo-alto" className="font-normal text-orange-600">Alto</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 border rounded-lg">
                          <RadioGroupItem value="muy_alto" id="riesgo-muy-alto" />
                          <Label htmlFor="riesgo-muy-alto" className="font-normal text-red-600">Muy Alto</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="observaciones_finales">Observaciones Finales</Label>
                      <Textarea
                        id="observaciones_finales"
                        placeholder="Conclusiones y recomendaciones finales del estudio..."
                        rows={4}
                        {...register("observaciones_finales")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </form>
          </Tabs>
        </ScrollArea>

        <div className="flex gap-2 p-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleSubmit(guardarBorrador)}
            disabled={isSubmitting}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Borrador
          </Button>
          <Button
            onClick={handleSubmit(enviarEstudio)}
            disabled={isSubmitting}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Estudio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
