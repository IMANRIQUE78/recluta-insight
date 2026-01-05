import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import vvgiLogo from "@/assets/vvgi-logo.png";

const authSchema = z.object({
  email: z.string().trim().email("Correo electrónico inválido").max(255, "El correo no puede exceder 255 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72, "La contraseña no puede exceder 72 caracteres"),
});

export const AuthForm = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email: email.trim(), password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/verify-email`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // Store email for verification page
      sessionStorage.setItem("pendingVerificationEmail", email.trim());
      
      // Show verification message and redirect to verify email page
      toast.success("¡Cuenta creada! Revisa tu correo para verificar tu cuenta.");
      navigate("/verify-email");
    } catch (error: any) {
      if (error.message.includes("User already registered")) {
        toast.error("Este correo ya está registrado. Intenta iniciar sesión.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email: email.trim(), password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else if (error.message.includes("Email not confirmed")) {
        sessionStorage.setItem("pendingVerificationEmail", email.trim());
        toast.error("Por favor, verifica tu correo electrónico primero.");
        navigate("/verify-email");
        return;
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Sesión iniciada exitosamente");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/5 p-4 gap-8">
      <Card className="w-full max-w-md shadow-elegant border-primary/10">
        <CardHeader className="space-y-4 pb-8">
          <div className="flex justify-center">
            <img 
              src={vvgiLogo} 
              alt="VVGI Logo" 
              className="h-16 w-auto animate-in zoom-in-50 duration-1000 hover:scale-110 transition-transform"
            />
          </div>
          <CardDescription className="text-center text-base text-foreground/80">
            Bienvenido a la mejor experiencia de reclutamiento en Latinoamérica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Correo Electrónico</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Contraseña</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={72}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo Electrónico</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={72}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    "Crear Cuenta"
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Al registrarte podrás elegir tu tipo de perfil: Candidato, Reclutador, Empresa o Verificador
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="text-center space-y-2 animate-in fade-in duration-1000 delay-300">
        <h2 className="text-3xl font-bold text-primary">VVGI</h2>
        <p className="text-sm text-muted-foreground">un proyecto de Israel Manrique</p>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          hecho en México con <span className="text-red-500 animate-pulse">❤️</span> para toda Latinoamérica
        </p>
        <p className="text-xs text-muted-foreground/70">todos los derechos reservados 2025</p>
      </div>
    </div>
  );
};