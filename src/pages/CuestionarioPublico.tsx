import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { AvisoConfidencialidad } from "@/components/nom035/cuestionarios/AvisoConfidencialidad";
import { CuestionarioGuiaI } from "@/components/nom035/cuestionarios/CuestionarioGuiaI";
import { CuestionarioGuiaIII } from "@/components/nom035/cuestionarios/CuestionarioGuiaIII";
import { NivelRiesgo } from "@/components/nom035/cuestionarios/preguntasGuiaIII";
import vvgiLogo from "@/assets/vvgi-logo.png";

interface TokenData {
  id: string;
  trabajador_id: string;
  empresa_id: string;
  tipo_guia: string;
  usado: boolean;
  fecha_expiracion: string;
}

interface TrabajadorData {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
}

type Step = "loading" | "invalid" | "expired" | "used" | "auth" | "aviso" | "cuestionario" | "completado";

const CuestionarioPublico = () => {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<Step>("loading");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [trabajador, setTrabajador] = useState<TrabajadorData | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
  });

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      // Buscar el token
      const { data: tokenResult, error: tokenError } = await supabase
        .from("tokens_cuestionario_nom035")
        .select("*")
        .eq("token", token)
        .single();

      if (tokenError || !tokenResult) {
        setStep("invalid");
        return;
      }

      // Verificar si ya fue usado
      if (tokenResult.usado) {
        setStep("used");
        return;
      }

      // Verificar si expiró
      if (new Date(tokenResult.fecha_expiracion) < new Date()) {
        setStep("expired");
        return;
      }

      setTokenData(tokenResult);

      // Obtener datos del trabajador
      const { data: trabajadorResult, error: trabajadorError } = await supabase
        .from("trabajadores_nom035")
        .select("id, nombre_completo, email, telefono")
        .eq("id", tokenResult.trabajador_id)
        .single();

      if (trabajadorError || !trabajadorResult) {
        setStep("invalid");
        return;
      }

      setTrabajador(trabajadorResult);
      setStep("auth");
    } catch (error) {
      console.error("Error validating token:", error);
      setStep("invalid");
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trabajador) return;

    setAuthLoading(true);
    try {
      // Normalizar datos para comparación
      const nombreIngresado = authForm.nombre.trim().toLowerCase();
      const nombreRegistrado = trabajador.nombre_completo.trim().toLowerCase();
      const emailIngresado = authForm.email.trim().toLowerCase();
      const emailRegistrado = (trabajador.email || "").trim().toLowerCase();
      const telefonoIngresado = authForm.telefono.replace(/\D/g, '');
      const telefonoRegistrado = (trabajador.telefono || "").replace(/\D/g, '');

      // Validar coincidencia
      const nombreCoincide = nombreRegistrado.includes(nombreIngresado) || nombreIngresado.includes(nombreRegistrado);
      const emailCoincide = emailIngresado === emailRegistrado;
      const telefonoCoincide = telefonoIngresado === telefonoRegistrado || 
                              telefonoIngresado.endsWith(telefonoRegistrado.slice(-10)) ||
                              telefonoRegistrado.endsWith(telefonoIngresado.slice(-10));

      if (!nombreCoincide || !emailCoincide || !telefonoCoincide) {
        toast.error("Los datos ingresados no coinciden con los registrados. Verifica tu información.");
        return;
      }

      // Actualizar aviso de privacidad si no está aceptado
      const { error: updateError } = await supabase
        .from("trabajadores_nom035")
        .update({
          acepto_aviso_privacidad: true,
          fecha_acepto_aviso: new Date().toISOString(),
        })
        .eq("id", trabajador.id);

      if (updateError) throw updateError;

      setStep("aviso");
    } catch (error: any) {
      console.error("Error en autenticación:", error);
      toast.error("Error al verificar datos");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAvisoAceptar = () => {
    setStep("cuestionario");
  };

  const handleAvisoCancelar = () => {
    setStep("auth");
  };

  const handleGuiaIComplete = async (resultado: {
    respuestas: Record<number, boolean>;
    requiereAtencion: boolean;
    seccionesPositivas: string[];
    mensaje: string;
  }) => {
    if (!trabajador || !tokenData) return;

    try {
      // Crear evaluación
      const { data: evaluacion, error: evalError } = await supabase
        .from("evaluaciones_nom035")
        .insert({
          empresa_id: tokenData.empresa_id,
          trabajador_id: trabajador.id,
          tipo_guia: "guia_i",
          estado: "completada",
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date().toISOString(),
          nivel_riesgo: resultado.requiereAtencion ? "alto" : "nulo",
          requiere_accion: resultado.requiereAtencion,
          periodo_evaluacion: new Date().getFullYear().toString()
        })
        .select()
        .single();

      if (evalError) throw evalError;

      // Guardar respuestas
      const respuestasToInsert = Object.entries(resultado.respuestas).map(([id, valor]) => ({
        evaluacion_id: evaluacion.id,
        numero_pregunta: parseInt(id),
        seccion: `seccion_${id}`,
        respuesta_valor: valor ? 1 : 0,
        respuesta_texto: valor ? "Sí" : "No"
      }));

      await supabase.from("respuestas_nom035").insert(respuestasToInsert);

      // Marcar token como usado
      await supabase
        .from("tokens_cuestionario_nom035")
        .update({ usado: true })
        .eq("id", tokenData.id);

      setStep("completado");
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("Error al guardar la evaluación");
    }
  };

  const handleGuiaIIIComplete = async (resultado: {
    respuestas: Record<number, number>;
    puntajeTotal: number;
    nivelRiesgo: NivelRiesgo;
    puntajesPorCategoria: Record<string, number>;
  }) => {
    if (!trabajador || !tokenData) return;

    try {
      // Crear evaluación
      const { data: evaluacion, error: evalError } = await supabase
        .from("evaluaciones_nom035")
        .insert({
          empresa_id: tokenData.empresa_id,
          trabajador_id: trabajador.id,
          tipo_guia: "guia_iii",
          estado: "completada",
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date().toISOString(),
          puntaje_total: resultado.puntajeTotal,
          nivel_riesgo: resultado.nivelRiesgo.nivel,
          requiere_accion: resultado.nivelRiesgo.nivel === "medio" || 
                          resultado.nivelRiesgo.nivel === "alto" || 
                          resultado.nivelRiesgo.nivel === "muy_alto",
          periodo_evaluacion: new Date().getFullYear().toString()
        })
        .select()
        .single();

      if (evalError) throw evalError;

      // Guardar respuestas
      const respuestasToInsert = Object.entries(resultado.respuestas).map(([id, valor]) => ({
        evaluacion_id: evaluacion.id,
        numero_pregunta: parseInt(id),
        seccion: "guia_iii",
        respuesta_valor: valor
      }));

      await supabase.from("respuestas_nom035").insert(respuestasToInsert);

      // Guardar resultados por categoría
      const resultadosToInsert = Object.entries(resultado.puntajesPorCategoria).map(([cat, puntaje]) => ({
        evaluacion_id: evaluacion.id,
        dimension: cat,
        categoria: cat,
        puntaje: puntaje,
        nivel_riesgo: resultado.nivelRiesgo.nivel
      }));

      await supabase.from("resultados_dimension_nom035").insert(resultadosToInsert);

      // Marcar token como usado
      await supabase
        .from("tokens_cuestionario_nom035")
        .update({ usado: true })
        .eq("id", tokenData.id);

      setStep("completado");
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("Error al guardar la evaluación");
    }
  };

  // Renderizar según el paso
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Validando enlace...</p>
        </div>
      </div>
    );
  }

  if (step === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Enlace Inválido</CardTitle>
            <CardDescription>
              El enlace al que intentas acceder no es válido o no existe.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Por favor, solicita un nuevo enlace a tu departamento de Recursos Humanos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
            <CardTitle>Enlace Expirado</CardTitle>
            <CardDescription>
              Este enlace ha expirado y ya no puede ser utilizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Los enlaces tienen una vigencia de 7 días. Solicita un nuevo enlace a tu departamento de Recursos Humanos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "used") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle>Cuestionario Completado</CardTitle>
            <CardDescription>
              Este cuestionario ya fue respondido anteriormente.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Si necesitas realizar otra evaluación, solicita un nuevo enlace a tu departamento de Recursos Humanos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img src={vvgiLogo} alt="VVGI" className="h-12 mx-auto mb-4" />
            <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle>Verificación de Identidad</CardTitle>
            <CardDescription>
              Para acceder al cuestionario NOM-035, ingresa los datos con los que fuiste registrado(a).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  placeholder="Tu nombre completo"
                  value={authForm.nombre}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="55 1234 5678"
                  value={authForm.telefono}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, telefono: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verificar y Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "aviso" && trabajador && tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <AvisoConfidencialidad
          nombreTrabajador={trabajador.nombre_completo}
          tipoGuia={tokenData.tipo_guia === "guia_i" ? "Guía I - Acontecimientos Traumáticos" : "Guía III - Factores Psicosociales"}
          onAceptar={handleAvisoAceptar}
          onCancelar={handleAvisoCancelar}
        />
      </div>
    );
  }

  if (step === "cuestionario" && trabajador && tokenData) {
    if (tokenData.tipo_guia === "guia_i") {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-3xl mx-auto">
            <CuestionarioGuiaI
              trabajadorNombre={trabajador.nombre_completo}
              onComplete={handleGuiaIComplete}
              onCancel={() => setStep("aviso")}
            />
          </div>
        </div>
      );
    }

    if (tokenData.tipo_guia === "guia_iii") {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-3xl mx-auto">
            <CuestionarioGuiaIII
              trabajadorNombre={trabajador.nombre_completo}
              atieneClientes={false}
              esJefe={false}
              onComplete={handleGuiaIIIComplete}
              onCancel={() => setStep("aviso")}
            />
          </div>
        </div>
      );
    }
  }

  if (step === "completado") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>¡Gracias por participar!</CardTitle>
            <CardDescription>
              Tu evaluación ha sido registrada exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Tus respuestas han sido guardadas de forma confidencial. Los resultados serán analizados 
              de manera agregada para mejorar las condiciones laborales.
            </p>
            <p className="text-xs text-muted-foreground">
              Puedes cerrar esta ventana.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default CuestionarioPublico;
