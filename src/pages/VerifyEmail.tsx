import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react";
import vvgiLogo from "@/assets/vvgi-logo.png";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("pendingVerificationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }

    // Check for token_hash in URL (from Supabase email link)
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    
    // Also check for error in URL (Supabase redirects with error on expired links)
    const errorDescription = searchParams.get("error_description");
    const errorCode = searchParams.get("error_code");
    
    if (errorDescription || errorCode) {
      // Handle error from Supabase redirect (e.g., expired link)
      if (errorDescription?.includes("expired") || errorCode === "otp_expired") {
        setError("El enlace de verificación ha expirado. Por favor, solicita uno nuevo.");
      } else {
        setError(errorDescription || "Error en la verificación. Por favor, solicita un nuevo enlace.");
      }
      return;
    }
    
    if (tokenHash && (type === "signup" || type === "email")) {
      verifyToken(tokenHash, type);
    }
  }, [searchParams]);

  const verifyToken = async (tokenHash: string, type: string) => {
    setVerifying(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "signup" | "email",
      });

      if (error) {
        // Check for specific error types
        if (error.message.includes("expired") || error.message.includes("Token has expired")) {
          throw new Error("El enlace de verificación ha expirado. Por favor, solicita uno nuevo.");
        }
        if (error.message.includes("invalid") || error.message.includes("not found")) {
          throw new Error("El enlace de verificación es inválido o ya fue utilizado.");
        }
        throw error;
      }

      setVerified(true);
      sessionStorage.removeItem("pendingVerificationEmail");
      toast.success("¡Correo verificado exitosamente! Ahora puedes iniciar sesión.");
      
      // Redirect to auth page (login tab) after 2 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al verificar el correo");
      toast.error("Error al verificar el correo");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("No se encontró el correo. Por favor, regístrate de nuevo.");
      navigate("/auth");
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) throw error;

      toast.success("Correo de verificación reenviado");
    } catch (err: any) {
      toast.error(err.message || "Error al reenviar el correo");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/5 p-4 gap-8">
      <Card className="w-full max-w-md shadow-elegant border-primary/10">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="flex justify-center">
            <img 
              src={vvgiLogo} 
              alt="VVGI Logo" 
              className="h-16 w-auto"
            />
          </div>
          {verifying ? (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
              <CardTitle className="text-xl">Verificando tu correo...</CardTitle>
            </>
          ) : verified ? (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <CardTitle className="text-xl text-green-600">¡Correo verificado!</CardTitle>
              <CardDescription>
                Redirigiendo a inicio de sesión...
              </CardDescription>
            </>
          ) : error ? (
            <>
              <XCircle className="h-16 w-16 mx-auto text-destructive" />
              <CardTitle className="text-xl text-destructive">Error de verificación</CardTitle>
              <CardDescription className="text-base">{error}</CardDescription>
            </>
          ) : (
            <>
              <Mail className="h-16 w-16 mx-auto text-primary" />
              <CardTitle className="text-xl">Verifica tu correo electrónico</CardTitle>
              <CardDescription className="text-base">
                {email ? (
                  <>
                    Hemos enviado un enlace de verificación a <strong>{email}</strong>
                  </>
                ) : (
                  "Revisa tu bandeja de entrada para verificar tu cuenta"
                )}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!verified && !verifying && (
            <>
              {error ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive space-y-2">
                  <p>⚠️ El enlace ha expirado o es inválido</p>
                  <p>Solicita un nuevo enlace de verificación</p>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                  <p>📧 Revisa tu bandeja de entrada</p>
                  <p>📁 También revisa tu carpeta de spam</p>
                  <p>⏰ El enlace expira en 24 horas</p>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <Button 
                  variant={error ? "default" : "outline"}
                  onClick={handleResendEmail}
                  disabled={verifying || !email}
                  className={error ? "w-full" : ""}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    error ? "Solicitar nuevo enlace de verificación" : "Reenviar correo de verificación"
                  )}
                </Button>
                
                {!email && error && (
                  <p className="text-xs text-center text-muted-foreground">
                    Para solicitar un nuevo enlace, regresa a la página de inicio de sesión
                  </p>
                )}
                
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/auth")}
                >
                  Volver a inicio de sesión
                </Button>
              </div>
            </>
          )}
          
          {verified && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Serás redirigido automáticamente...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center space-y-2 animate-in fade-in duration-1000 delay-300">
        <h2 className="text-3xl font-bold text-primary">VVGI</h2>
        <p className="text-sm text-muted-foreground">un proyecto de Israel Manrique</p>
      </div>
    </div>
  );
};

export default VerifyEmail;
