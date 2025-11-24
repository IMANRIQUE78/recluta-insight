import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, Building2, UserCircle, Code } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const sectoresLatam = [
  "Agroindustria", "Tecnología", "Manufactura", "Servicios Financieros",
  "Retail", "Salud", "Educación", "Construcción", "Energía", "Minería",
  "Turismo y Hospitalidad", "Telecomunicaciones", "Transporte y Logística",
  "Bienes Raíces", "Consultoría"
];

const OnboardingFlow = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<"empresa" | "reclutador" | "candidato" | "">("");
  
  // Datos Empresa
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [rfc, setRfc] = useState("");
  const [sector, setSector] = useState("");
  const [tamanoEmpresa, setTamanoEmpresa] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [adminNombre, setAdminNombre] = useState("");
  
  // Datos Reclutador
  const [nombreReclutador, setNombreReclutador] = useState("");
  const [emailReclutador, setEmailReclutador] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoReclutador, setTipoReclutador] = useState<"interno" | "freelance" | "">("");
  const [anosExperiencia, setAnosExperiencia] = useState(0);
  
  // Datos Candidato
  const [nombreCandidato, setNombreCandidato] = useState("");
  const [emailCandidato, setEmailCandidato] = useState("");
  const [telefonoCandidato, setTelefonoCandidato] = useState("");

  // Protección de ruta - redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      toast.error("Debes iniciar sesión primero");
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSubmitEmpresa = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión primero");
      return;
    }

    try {
      // Verificar sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        navigate("/auth");
        return;
      }

      // 1. Verificar si ya existe un rol de empresa
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (existingRole) {
        toast.error("Ya tienes un perfil de empresa creado");
        navigate("/dashboard");
        return;
      }

      // 2. Crear la empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .insert({
          nombre_empresa: nombreEmpresa,
          razon_social: razonSocial || nombreEmpresa,
          rfc: rfc,
          sector: sector,
          tamano_empresa: tamanoEmpresa,
          email_contacto: emailContacto || user.email || "",
          created_by: user.id,
        })
        .select()
        .single();

      if (empresaError) {
        console.error("Error creando empresa:", empresaError);
        throw empresaError;
      }

      // 3. Crear rol de admin_empresa
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "admin_empresa",
          empresa_id: empresaData.id,
        });

      if (roleError) throw roleError;

      // 4. Crear suscripción básica de empresa (con acceso COMPLETO para pruebas)
      const { error: suscripcionError } = await supabase
        .from("suscripcion_empresa")
        .insert({
          empresa_id: empresaData.id,
          plan: "profesional", // Iniciamos con plan profesional para que tengan todas las features
          activa: true,
          publicaciones_mes: 999, // Ilimitado para pruebas
          publicaciones_usadas: 0,
          acceso_marketplace: true,
          acceso_analytics_avanzado: true,
          soporte_prioritario: true,
        });

      if (suscripcionError) throw suscripcionError;

      toast.success("¡Empresa creada exitosamente! Todas las features están disponibles para pruebas.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al crear empresa: " + error.message);
    }
  };

  const handleSubmitReclutador = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión primero");
      return;
    }

    try {
      // Verificar sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        navigate("/auth");
        return;
      }

      // 1. Verificar si ya existe un perfil de reclutador
      const { data: existingProfile } = await supabase
        .from("perfil_reclutador")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        toast.error("Ya tienes un perfil de reclutador creado");
        navigate("/reclutador-dashboard");
        return;
      }

      // 2. Crear perfil de reclutador
      const { data: reclutadorData, error: reclutadorError } = await supabase
        .from("perfil_reclutador")
        .insert([{
          user_id: user.id,
          nombre_reclutador: nombreReclutador,
          email: emailReclutador || user.email || "",
          telefono: telefono || null,
          tipo_reclutador: tipoReclutador as "interno" | "freelance",
          anos_experiencia: anosExperiencia,
        }])
        .select()
        .single();

      if (reclutadorError) {
        console.error("Error creando perfil reclutador:", reclutadorError);
        throw reclutadorError;
      }

      // 3. Crear rol de reclutador
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "reclutador",
        });

      if (roleError) throw roleError;

      // 4. Crear suscripción premium para pruebas (con todas las features)
      const { error: suscripcionError } = await supabase
        .from("suscripcion_reclutador")
        .insert({
          reclutador_id: reclutadorData.id,
          plan: "premium", // Plan premium para acceso completo
          activa: true,
          max_asociaciones_simultaneas: 999, // Ilimitado para pruebas
          acceso_pool_premium: true,
          acceso_baterias_psicometricas: true,
          acceso_ia_sourcing: true,
          publicacion_destacada: true,
        });

      if (suscripcionError) throw suscripcionError;

      toast.success(`¡Perfil de reclutador creado! Código único: ${reclutadorData.codigo_reclutador}. Todas las features premium disponibles.`);
      navigate("/reclutador-dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al crear perfil: " + error.message);
    }
  };

  const handleSubmitCandidato = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión primero");
      return;
    }

    try {
      // Verificar sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        navigate("/auth");
        return;
      }

      // 1. Verificar si ya existe un perfil de candidato
      const { data: existingProfile } = await supabase
        .from("perfil_candidato")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        toast.error("Ya tienes un perfil de candidato creado");
        navigate("/candidate-dashboard");
        return;
      }

      // 2. Crear perfil de candidato
      const { error: candidatoError } = await supabase
        .from("perfil_candidato")
        .insert([{
          user_id: user.id,
          nombre_completo: nombreCandidato,
          email: emailCandidato || user.email || "",
          telefono: telefonoCandidato || null,
        }]);

      if (candidatoError) {
        console.error("Error creando perfil candidato:", candidatoError);
        throw candidatoError;
      }

      // 3. Crear rol de candidato
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "candidato",
        });

      if (roleError) throw roleError;

      toast.success("¡Perfil de candidato creado exitosamente!");
      navigate("/candidate-dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al crear perfil: " + error.message);
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No mostrar el formulario si no está autenticado
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader>
          <CardTitle className="text-2xl">Bienvenido a VVGI Light</CardTitle>
          <CardDescription>
            {step === 1 && "Selecciona cómo quieres usar la plataforma"}
            {step === 2 && userType === "empresa" && "Datos de tu Empresa"}
            {step === 2 && userType === "reclutador" && "Datos del Reclutador"}
            {step === 2 && userType === "candidato" && "Datos del Candidato"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PASO 1: Selección de tipo de usuario */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid gap-4 md:grid-cols-3">
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    userType === "empresa" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setUserType("empresa")}
                >
                  <CardHeader>
                    <Building2 className="h-12 w-12 mb-2 text-primary" />
                    <CardTitle>Soy Empresa</CardTitle>
                    <CardDescription>
                      Necesito gestionar requisiciones de personal, solicitar reclutadores
                      y medir indicadores de mi equipo de RRHH
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    userType === "reclutador" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setUserType("reclutador")}
                >
                  <CardHeader>
                    <UserCircle className="h-12 w-12 mb-2 text-primary" />
                    <CardTitle>Soy Reclutador</CardTitle>
                    <CardDescription>
                      Quiero publicar vacantes en el marketplace, gestionar entrevistas
                      y llevar mis estadísticas personales
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    userType === "candidato" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setUserType("candidato")}
                >
                  <CardHeader>
                    <UserCircle className="h-12 w-12 mb-2 text-accent" />
                    <CardTitle>Soy Candidato</CardTitle>
                    <CardDescription>
                      Busco oportunidades laborales y quiero postularme a vacantes
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg">
                <Code className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  <strong>Modo Pruebas:</strong> Todas las features básicas y premium están desbloqueadas
                </p>
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!userType}
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* PASO 2: Formulario Empresa */}
          {step === 2 && userType === "empresa" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="nombre_empresa">Nombre de la Empresa*</Label>
                <Input
                  id="nombre_empresa"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  placeholder="Mi Empresa S.A."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social</Label>
                <Input
                  id="razon_social"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Razón Social de la Empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value)}
                  placeholder="ABC123456XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector*</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectoresLatam.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tamaño de Empresa*</Label>
                <RadioGroup value={tamanoEmpresa} onValueChange={setTamanoEmpresa}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="startup" id="startup" />
                    <Label htmlFor="startup" className="cursor-pointer">Startup (1-10)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pyme" id="pyme" />
                    <Label htmlFor="pyme" className="cursor-pointer">PyME (11-50)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mediana" id="mediana" />
                    <Label htmlFor="mediana" className="cursor-pointer">Mediana (51-250)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grande" id="grande" />
                    <Label htmlFor="grande" className="cursor-pointer">Grande (250+)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="corporativo" id="corporativo" />
                    <Label htmlFor="corporativo" className="cursor-pointer">Corporativo (1000+)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_contacto">Email de Contacto*</Label>
                <Input
                  id="email_contacto"
                  type="email"
                  value={emailContacto}
                  onChange={(e) => setEmailContacto(e.target.value)}
                  placeholder="contacto@miempresa.com"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button 
                  onClick={handleSubmitEmpresa}
                  disabled={!nombreEmpresa || !sector || !tamanoEmpresa || !emailContacto}
                >
                  Crear Empresa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2: Formulario Reclutador */}
          {step === 2 && userType === "reclutador" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="nombre_reclutador">Nombre Completo*</Label>
                <Input
                  id="nombre_reclutador"
                  value={nombreReclutador}
                  onChange={(e) => setNombreReclutador(e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_reclutador">Email*</Label>
                <Input
                  id="email_reclutador"
                  type="email"
                  value={emailReclutador}
                  onChange={(e) => setEmailReclutador(e.target.value)}
                  placeholder="juan@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+52 55 1234 5678"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Reclutador*</Label>
                <RadioGroup value={tipoReclutador} onValueChange={(v: any) => setTipoReclutador(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="interno" id="interno" />
                    <Label htmlFor="interno" className="cursor-pointer">
                      Interno - Trabajo para una sola empresa
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="freelance" id="freelance" />
                    <Label htmlFor="freelance" className="cursor-pointer">
                      Freelance - Trabajo para varias empresas
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experiencia">Años de Experiencia</Label>
                <Input
                  id="experiencia"
                  type="number"
                  value={anosExperiencia}
                  onChange={(e) => setAnosExperiencia(parseInt(e.target.value) || 0)}
                  min="0"
                  max="50"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button 
                  onClick={handleSubmitReclutador}
                  disabled={!nombreReclutador || !emailReclutador || !tipoReclutador}
                >
                  Crear Perfil
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2: Formulario Candidato */}
          {step === 2 && userType === "candidato" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="nombre_candidato">Nombre Completo*</Label>
                <Input
                  id="nombre_candidato"
                  value={nombreCandidato}
                  onChange={(e) => setNombreCandidato(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_candidato">Email*</Label>
                <Input
                  id="email_candidato"
                  type="email"
                  value={emailCandidato}
                  onChange={(e) => setEmailCandidato(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono_candidato">Teléfono</Label>
                <Input
                  id="telefono_candidato"
                  value={telefonoCandidato}
                  onChange={(e) => setTelefonoCandidato(e.target.value)}
                  placeholder="+52 55 1234 5678"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button 
                  onClick={handleSubmitCandidato}
                  disabled={!nombreCandidato || !emailCandidato}
                >
                  Crear Perfil
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
