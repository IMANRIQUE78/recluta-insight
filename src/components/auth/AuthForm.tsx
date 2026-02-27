import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { z } from "zod";
import vvgiLogo from "@/assets/vvgi-logo.png";
import vvgiAbuelita from "@/assets/vvgi-abuelita.png";

// ─── Constantes de seguridad ────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5; // intentos antes de bloqueo temporal
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueo
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 72;
const EMAIL_MAX_LENGTH = 255;

// ─── Esquemas de validación ──────────────────────────────────────────────────
const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `La contraseña no puede exceder ${PASSWORD_MAX_LENGTH} caracteres`)
  .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
  .regex(/[0-9]/, "Debe contener al menos un número");

const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Correo electrónico inválido")
    .max(EMAIL_MAX_LENGTH, "El correo no puede exceder 255 caracteres"),
  password: passwordSchema,
});

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Correo electrónico inválido")
    .max(EMAIL_MAX_LENGTH, "El correo no puede exceder 255 caracteres"),
});

// ─── Helpers de requisitos de contraseña ────────────────────────────────────
interface PasswordRequirement {
  label: string;
  met: boolean;
}

const getPasswordRequirements = (password: string): PasswordRequirement[] => [
  { label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`, met: password.length >= PASSWORD_MIN_LENGTH },
  { label: "Al menos una mayúscula", met: /[A-Z]/.test(password) },
  { label: "Al menos un número", met: /[0-9]/.test(password) },
];

// ─── Helpers de bloqueo temporal (en memoria, no en localStorage) ────────────
interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
}

// Se almacena en memoria de la sesión del navegador, no persiste entre recargas
// Esto evita exponer información de intentos fallidos en storage
const loginState: LockoutState = { attempts: 0, lockedUntil: null };

const isLockedOut = (): boolean => {
  if (loginState.lockedUntil && Date.now() < loginState.lockedUntil) return true;
  if (loginState.lockedUntil && Date.now() >= loginState.lockedUntil) {
    // Desbloquear automáticamente al expirar
    loginState.attempts = 0;
    loginState.lockedUntil = null;
  }
  return false;
};

const getRemainingLockoutSeconds = (): number => {
  if (!loginState.lockedUntil) return 0;
  return Math.ceil((loginState.lockedUntil - Date.now()) / 1000);
};

const registerFailedAttempt = (): void => {
  loginState.attempts += 1;
  if (loginState.attempts >= MAX_LOGIN_ATTEMPTS) {
    loginState.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
};

const clearAttempts = (): void => {
  loginState.attempts = 0;
  loginState.lockedUntil = null;
};

// ─── Componente principal ────────────────────────────────────────────────────
export const AuthForm = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const navigate = useNavigate();

  // Limpiar campos al cambiar de pestaña para evitar fuga de datos entre formularios
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setEmail("");
    setPassword("");
    setShowPasswordRequirements(false);
  }, []);

  // Limpiar campos al abrir/cerrar recuperación de contraseña
  const handleShowForgotPassword = useCallback((show: boolean) => {
    setShowForgotPassword(show);
    setEmail("");
    setPassword("");
  }, []);

  // Preferencia de pestaña desde URL (ej: después de verificación de correo)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signin" || tab === "signup") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Temporizador de bloqueo visible para el usuario
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      const remaining = getRemainingLockoutSeconds();
      setLockoutSeconds(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // ── Registro ────────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = authSchema.safeParse({ email: email.trim(), password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // Guardar correo solo para la página de verificación, limpiar contraseña de estado
      sessionStorage.setItem("pendingVerificationEmail", trimmedEmail);
      setPassword(""); // limpiar contraseña del estado inmediatamente tras registro

      toast.success("¡Cuenta creada! Revisa tu correo para verificar tu cuenta.");
      navigate("/verify-email");
    } catch (error: any) {
      if (error.message?.includes("User already registered")) {
        // Mensaje genérico para no confirmar si el correo existe (evita enumeración de usuarios)
        toast.error("Si este correo no está registrado, recibirás una confirmación. Revisa tu bandeja.");
      } else {
        toast.error("Ocurrió un error al crear la cuenta. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Inicio de sesión ────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar bloqueo temporal antes de intentar
    if (isLockedOut()) {
      const remaining = getRemainingLockoutSeconds();
      setLockoutSeconds(remaining);
      toast.error(`Demasiados intentos. Espera ${remaining} segundos para intentar de nuevo.`);
      return;
    }

    // Para el login solo validamos formato básico, no los requisitos de contraseña nueva
    const emailValidation = emailSchema.safeParse({ email: email.trim() });
    if (!emailValidation.success) {
      toast.error(emailValidation.error.errors[0].message);
      return;
    }
    if (!password || password.length < 1) {
      toast.error("Ingresa tu contraseña.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("invalid_credentials")) {
          registerFailedAttempt();
          const attemptsLeft = MAX_LOGIN_ATTEMPTS - loginState.attempts;

          if (isLockedOut()) {
            setLockoutSeconds(getRemainingLockoutSeconds());
            toast.error(`Demasiados intentos fallidos. Espera ${getRemainingLockoutSeconds()} segundos.`);
          } else if (attemptsLeft > 0) {
            toast.error(`Credenciales incorrectas. Te quedan ${attemptsLeft} intento(s).`);
          } else {
            toast.error("Credenciales incorrectas.");
          }
        } else if (error.message.includes("Email not confirmed")) {
          sessionStorage.setItem("pendingVerificationEmail", email.trim());
          toast.error("Por favor, verifica tu correo electrónico primero.");
          navigate("/verify-email");
        } else {
          toast.error("Error al iniciar sesión. Intenta de nuevo.");
        }
        return;
      }

      // Login exitoso: limpiar intentos fallidos
      clearAttempts();
      setPassword(""); // limpiar contraseña del estado
      toast.success("Sesión iniciada exitosamente");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperación de contraseña ───────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = emailSchema.safeParse({ email: email.trim() });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // No lanzar el error real para no confirmar si el correo existe
      if (error) console.error("Password reset error (hidden from user):", error.message);

      // Siempre mostrar el mismo mensaje, exista o no el correo
      toast.success("Si el correo existe, recibirás un enlace para restablecer tu contraseña.");
      handleShowForgotPassword(false);
    } catch {
      toast.success("Si el correo existe, recibirás un enlace para restablecer tu contraseña.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Vista de recuperación de contraseña ────────────────────────────────────
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/5 p-4 overflow-hidden">
        <div className="relative flex items-center justify-center w-full max-w-4xl">
          <img
            src={vvgiAbuelita}
            alt="VVGI Abuelita"
            className="absolute z-0 w-[200px] sm:w-[260px] md:w-[340px] lg:w-[400px] h-auto object-contain left-0 sm:-left-4 md:-left-8 lg:-left-12 opacity-95 pointer-events-none select-none"
            style={{ bottom: "-15%", maxHeight: "85vh" }}
          />
          <Card className="relative z-10 w-full max-w-md shadow-elegant border-primary/10 bg-background/95 backdrop-blur-sm ml-auto mr-0 sm:mr-4 md:mr-0">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex justify-center">
                <img src={vvgiLogo} alt="VVGI Logo" className="h-16 w-auto" />
              </div>
              <CardDescription className="text-center text-base text-foreground/80">
                Recuperar Contraseña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Correo Electrónico</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={EMAIL_MAX_LENGTH}
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Te enviaremos un enlace para restablecer tu contraseña
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Enlace de Recuperación"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => handleShowForgotPassword(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Iniciar Sesión
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Vista principal ─────────────────────────────────────────────────────────
  const passwordRequirements = getPasswordRequirements(password);

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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            {/* ── Iniciar sesión ── */}
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
                    maxLength={EMAIL_MAX_LENGTH}
                    autoComplete="email"
                    disabled={lockoutSeconds > 0}
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
                    maxLength={PASSWORD_MAX_LENGTH}
                    autoComplete="current-password"
                    disabled={lockoutSeconds > 0}
                  />
                </div>

                {/* Bloqueo temporal visible */}
                {lockoutSeconds > 0 && (
                  <p className="text-sm text-destructive text-center font-medium">
                    Cuenta bloqueada temporalmente. Intenta en {lockoutSeconds}s
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loading || lockoutSeconds > 0}>
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

            {/* ── Registro ── */}
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
                    maxLength={EMAIL_MAX_LENGTH}
                    autoComplete="email"
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
                    onFocus={() => setShowPasswordRequirements(true)}
                    required
                    maxLength={PASSWORD_MAX_LENGTH}
                    autoComplete="new-password"
                  />

                  {/* Requisitos de contraseña en tiempo real */}
                  {showPasswordRequirements && (
                    <ul className="space-y-1 mt-2">
                      {passwordRequirements.map((req) => (
                        <li
                          key={req.label}
                          className={`flex items-center gap-2 text-xs transition-colors ${
                            req.met ? "text-green-600" : "text-muted-foreground"
                          }`}
                        >
                          {req.met ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 shrink-0" />
                          )}
                          {req.label}
                        </li>
                      ))}
                    </ul>
                  )}
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
        <p className="text-sm text-muted-foreground">un proyecto de Isra Manrique</p>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          hecho en México con <span className="text-red-500 animate-pulse">❤️</span> para toda Latinoamérica
        </p>
        <p className="text-xs text-muted-foreground/70">todos los derechos reservados 2025</p>
      </div>
    </div>
  );
};
