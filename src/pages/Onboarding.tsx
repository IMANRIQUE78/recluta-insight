import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const kpisOptions = [
  "Tiempo de cobertura",
  "Tasa de éxito",
  "Costo por contratación",
  "Satisfacción del cliente",
  "Rotación de personal",
  "Fuente efectiva"
];

const sectoresLatam = [
  "Agroindustria",
  "Tecnología",
  "Manufactura",
  "Servicios Financieros",
  "Retail",
  "Salud",
  "Educación",
  "Construcción",
  "Energía",
  "Minería",
  "Turismo y Hospitalidad",
  "Telecomunicaciones",
  "Transporte y Logística",
  "Bienes Raíces",
  "Consultoría"
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<string>("");
  const [sector, setSector] = useState("");
  const [pais, setPais] = useState("México");
  const [tamanoEmpresa, setTamanoEmpresa] = useState<string>("");
  const [vacantesPromedio, setVacantesPromedio] = useState([10]);
  const [midenIndicadores, setMidenIndicadores] = useState(false);
  const [horizonte, setHorizonte] = useState("6");
  const [metricasClave, setMetricasClave] = useState<string[]>([]);
  const [frecuencia, setFrecuencia] = useState("mensual");
  const [mostrarEmpresaPublica, setMostrarEmpresaPublica] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleKPIToggle = (kpi: string) => {
    setMetricasClave(prev => 
      prev.includes(kpi) 
        ? prev.filter(k => k !== kpi)
        : [...prev, kpi]
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión primero");
      return;
    }

    const { error } = await supabase.from("perfil_usuario").insert({
      user_id: user.id,
      nombre_usuario: nombreUsuario,
      nombre_empresa: nombreEmpresa,
      tipo_usuario: tipoUsuario as any,
      sector,
      pais,
      tamano_empresa: tamanoEmpresa as any,
      vacantes_promedio_mes: vacantesPromedio[0],
      miden_indicadores: midenIndicadores,
      horizonte_planeacion: parseInt(horizonte),
      metricas_clave: metricasClave,
      frecuencia_actualizacion: frecuencia,
      mostrar_empresa_publica: mostrarEmpresaPublica,
    });

    if (error) {
      toast.error("Error al guardar el perfil: " + error.message);
      return;
    }

    toast.success("Perfil configurado exitosamente");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader>
          <CardTitle className="text-2xl">Configuración Inicial - Paso {step} de 3</CardTitle>
          <CardDescription>
            Ayúdanos a personalizar tu experiencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <Label htmlFor="nombre_usuario" className="text-base font-semibold">Nombre Completo*</Label>
                <Input
                  id="nombre_usuario"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="nombre_empresa" className="text-base font-semibold">Nombre de la Empresa*</Label>
                <Input
                  id="nombre_empresa"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  placeholder="Nombre de tu empresa"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Tipo de Usuario</Label>
                <RadioGroup value={tipoUsuario} onValueChange={setTipoUsuario}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dueno_direccion" id="dueno" />
                    <Label htmlFor="dueno" className="cursor-pointer">Dueño(a) de negocio / Dirección</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="profesional_rrhh" id="rrhh" />
                    <Label htmlFor="rrhh" className="cursor-pointer">Profesional de RRHH</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label htmlFor="sector" className="text-base font-semibold">Sector*</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger id="sector">
                    <SelectValue placeholder="Selecciona un sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectoresLatam.map((sec) => (
                      <SelectItem key={sec} value={sec}>
                        {sec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="pais" className="text-base font-semibold">País</Label>
                <Select value={pais} onValueChange={setPais}>
                  <SelectTrigger id="pais">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="México">México</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="Perú">Perú</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tamaño de Empresa</Label>
                <RadioGroup value={tamanoEmpresa} onValueChange={setTamanoEmpresa}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="micro" id="micro" />
                    <Label htmlFor="micro" className="cursor-pointer">Micro (1-10 empleados)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pyme" id="pyme" />
                    <Label htmlFor="pyme" className="cursor-pointer">PyME (11-50 empleados)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mediana" id="mediana" />
                    <Label htmlFor="mediana" className="cursor-pointer">Mediana (51-250 empleados)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grande" id="grande" />
                    <Label htmlFor="grande" className="cursor-pointer">Grande (250+ empleados)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Número promedio de vacantes al mes: {vacantesPromedio[0]}
                </Label>
                <Slider
                  value={vacantesPromedio}
                  onValueChange={setVacantesPromedio}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="miden"
                    checked={midenIndicadores}
                    onCheckedChange={(checked) => setMidenIndicadores(checked as boolean)}
                  />
                  <Label htmlFor="miden" className="cursor-pointer">
                    ¿Actualmente miden indicadores de reclutamiento?
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mostrar_empresa"
                    checked={mostrarEmpresaPublica}
                    onCheckedChange={(checked) => setMostrarEmpresaPublica(checked as boolean)}
                  />
                  <Label htmlFor="mostrar_empresa" className="cursor-pointer">
                    Mostrar nombre de empresa en vacantes públicas
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Si desactivas esta opción, tus vacantes mostrarán "Confidencial"
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Horizonte de Planeación</Label>
                <RadioGroup value={horizonte} onValueChange={setHorizonte}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="h3" />
                    <Label htmlFor="h3" className="cursor-pointer">3 meses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="6" id="h6" />
                    <Label htmlFor="h6" className="cursor-pointer">6 meses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="12" id="h12" />
                    <Label htmlFor="h12" className="cursor-pointer">12 meses</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Métricas Clave Preferidas</Label>
                <div className="grid grid-cols-2 gap-3">
                  {kpisOptions.map((kpi) => (
                    <div key={kpi} className="flex items-center space-x-2">
                      <Checkbox
                        id={kpi}
                        checked={metricasClave.includes(kpi)}
                        onCheckedChange={() => handleKPIToggle(kpi)}
                      />
                      <Label htmlFor={kpi} className="cursor-pointer text-sm">
                        {kpi}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Frecuencia de Actualización</Label>
                <RadioGroup value={frecuencia} onValueChange={setFrecuencia}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="semanal" id="semanal" />
                    <Label htmlFor="semanal" className="cursor-pointer">Semanal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mensual" id="mensual" />
                    <Label htmlFor="mensual" className="cursor-pointer">Mensual</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
            )}
            
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)} 
                className="ml-auto"
                disabled={
                  (step === 1 && (!nombreUsuario || !nombreEmpresa || !tipoUsuario || !sector)) ||
                  (step === 2 && !tamanoEmpresa)
                }
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="ml-auto">
                Finalizar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;