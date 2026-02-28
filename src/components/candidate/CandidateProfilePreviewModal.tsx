import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Calendar,
  DollarSign,
  Shield,
  Lock,
  Eye,
  Edit,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface CandidateProfilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick: () => void;
}

interface ExperienciaLaboral {
  puesto: string;
  empresa: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  tags: string;
}

interface Educacion {
  tipo: string;
  titulo: string;
  institucion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface CandidateProfile {
  nombre_completo: string;
  email: string;
  telefono: string | null;
  ubicacion: string | null;
  puesto_actual: string | null;
  empresa_actual: string | null;
  resumen_profesional: string | null;
  habilidades_tecnicas: string[] | null;
  habilidades_blandas: string[] | null;
  experiencia_laboral: ExperienciaLaboral[] | null;
  educacion: Educacion[] | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  salario_esperado_min: number | null;
  salario_esperado_max: number | null;
  modalidad_preferida: string | null;
  disponibilidad: string | null;
  created_at: string;
  codigo_candidato?: string;
}

// ─── Helpers de seguridad ─────────────────────────────────────────────────────

// Elimina caracteres peligrosos de cualquier texto antes de mostrarlo
const sanitizeText = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.replace(/[<>{}\[\]\\;`'"&|$^%*=+~]/g, "").trim();
};

// Valida que una URL sea segura (https) antes de usarla como enlace
const isSafeUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// Sanitiza una URL: si no es segura, regresa string vacío
const sanitizeUrl = (url: string | null | undefined): string => {
  if (!isSafeUrl(url)) return "";
  return url!.trim();
};

// ─── Helpers de formato ───────────────────────────────────────────────────────
const formatDisponibilidad = (disp: string | null): string => {
  if (!disp) return "No especificada";
  const map: Record<string, string> = {
    inmediata: "Inmediata",
    "2_semanas": "2 semanas",
    "1_mes": "1 mes",
    mas_1_mes: "Más de 1 mes",
  };
  return map[disp] || sanitizeText(disp);
};

const formatSalario = (min: number | null, max: number | null): string => {
  if (!min && !max) return "";
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `Desde $${min.toLocaleString()}`;
  return `Hasta $${max!.toLocaleString()}`;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const CandidateProfilePreviewModal = ({
  open,
  onOpenChange,
  onEditClick,
}: CandidateProfilePreviewModalProps) => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // maybeSingle() devuelve null limpiamente si no hay perfil,
      // en lugar de lanzar un error como single()
      const { data, error } = await supabase
        .from("perfil_candidato")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      // Supabase devuelve campos JSON como tipo genérico `Json`.
      // Hacemos un cast explícito y seguro para que TypeScript lo acepte.
      if (data) {
        setProfile({
          ...data,
          experiencia_laboral: Array.isArray(data.experiencia_laboral)
            ? (data.experiencia_laboral as unknown as ExperienciaLaboral[])
            : [],
          educacion: Array.isArray(data.educacion) ? (data.educacion as unknown as Educacion[]) : [],
        } as CandidateProfile);
      } else {
        setProfile(null);
      }
    } catch (error: any) {
      console.error("Error loading profile preview:", error.message);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadProfile();
  }, [open, loadProfile]);

  const handleEditClick = () => {
    onOpenChange(false);
    onEditClick();
  };

  // ── Estado: cargando ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <Skeleton className="h-8 w-64" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Estado: error de carga ────────────────────────────────────────────────────
  if (loadError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Error al cargar el perfil</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudo cargar tu perfil en este momento.{" "}
              <button type="button" className="underline font-medium" onClick={loadProfile}>
                Intentar de nuevo
              </button>
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Estado: sin perfil creado ────────────────────────────────────────────────
  if (!profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Perfil no disponible</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No tienes un perfil creado aún.</p>
            <Button onClick={handleEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Crear mi perfil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Datos sanitizados para renderizado seguro ────────────────────────────────
  const safe = {
    nombre_completo: sanitizeText(profile.nombre_completo),
    email: sanitizeText(profile.email),
    telefono: sanitizeText(profile.telefono),
    ubicacion: sanitizeText(profile.ubicacion),
    puesto_actual: sanitizeText(profile.puesto_actual),
    empresa_actual: sanitizeText(profile.empresa_actual),
    resumen_profesional: sanitizeText(profile.resumen_profesional),
    modalidad_preferida: sanitizeText(profile.modalidad_preferida),
    codigo_candidato: sanitizeText(profile.codigo_candidato),
    linkedin_url: sanitizeUrl(profile.linkedin_url),
    github_url: sanitizeUrl(profile.github_url),
    portfolio_url: sanitizeUrl(profile.portfolio_url),
    habilidades_tecnicas: (profile.habilidades_tecnicas || []).map(sanitizeText).filter(Boolean),
    habilidades_blandas: (profile.habilidades_blandas || []).map(sanitizeText).filter(Boolean),
    experiencia_laboral: (Array.isArray(profile.experiencia_laboral) ? profile.experiencia_laboral : []).map((exp) => ({
      puesto: sanitizeText(exp.puesto),
      empresa: sanitizeText(exp.empresa),
      fecha_inicio: sanitizeText(exp.fecha_inicio),
      fecha_fin: sanitizeText(exp.fecha_fin),
      descripcion: sanitizeText(exp.descripcion),
      // Tags: dividir, sanitizar cada uno y filtrar vacíos
      tags: (exp.tags || "")
        .split(",")
        .map((t: string) => sanitizeText(t))
        .filter(Boolean),
    })),
    educacion: (Array.isArray(profile.educacion) ? profile.educacion : []).map((edu) => ({
      tipo: sanitizeText(edu.tipo),
      titulo: sanitizeText(edu.titulo),
      institucion: sanitizeText(edu.institucion),
      fecha_inicio: sanitizeText(edu.fecha_inicio),
      fecha_fin: sanitizeText(edu.fecha_fin),
    })),
  };

  const salarioFormateado = formatSalario(profile.salario_esperado_min, profile.salario_esperado_max);

  const hayPerfil = safe.puesto_actual || safe.empresa_actual || safe.resumen_profesional;

  // ── Render principal ──────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Así ven tu perfil los reclutadores
            </DialogTitle>
            <Button onClick={handleEditClick} className="gap-2">
              <Edit className="h-4 w-4" />
              Editar Perfil
            </Button>
          </div>
        </DialogHeader>

        {/* Aviso informativo */}
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <Eye className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Vista previa:</strong> Esta es la información que los reclutadores pueden ver de tu perfil. Los
            datos de identidad y contacto solo serán visibles cuando te postules a una vacante o si el reclutador tiene
            un plan de pago activo.
          </AlertDescription>
        </Alert>

        <ScrollArea className="h-[calc(90vh-12rem)] pr-4">
          <div className="space-y-6">
            {/* ── DATOS DE IDENTIDAD Y CONTACTO ── */}
            <div className="border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Datos de Identidad y Contacto
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                      <Lock className="h-3 w-3 mr-1" />
                      Sección Protegida
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta información estará oculta hasta que te postules a una vacante o el reclutador tenga plan de
                    pago.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                  <User className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Nombre Completo</p>
                    <p className="font-medium truncate">{safe.nombre_completo || "No especificado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                  <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                    <p className="font-medium truncate">{safe.email || "No especificado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="font-medium truncate">{safe.telefono || "No especificado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Ubicación</p>
                    <p className="font-medium truncate">{safe.ubicacion || "No especificada"}</p>
                  </div>
                </div>
              </div>

              {/* Así lo ven sin acceso */}
              <div className="border-t border-amber-200 dark:border-amber-700 pt-4 mt-4">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Así lo verán los reclutadores SIN acceso:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { icon: <Lock className="h-3 w-3" />, label: "Oculto" },
                    { label: "***@*****.***" },
                    { label: "*** *** ****" },
                    { icon: <Lock className="h-3 w-3" />, label: "Oculta" },
                  ].map((item, i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded text-center">
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        {item.icon}
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* ── PERFIL PROFESIONAL ── */}
            {hayPerfil && (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Perfil Profesional
                    <Badge variant="secondary" className="text-xs">
                      Visible para todos
                    </Badge>
                  </h3>

                  {(safe.puesto_actual || safe.empresa_actual) && (
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-lg">{safe.puesto_actual || "Sin puesto especificado"}</p>
                      {safe.empresa_actual && <p className="text-muted-foreground">{safe.empresa_actual}</p>}
                    </div>
                  )}

                  {safe.resumen_profesional && (
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <p className="text-sm leading-relaxed">{safe.resumen_profesional}</p>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* ── PREFERENCIAS Y DISPONIBILIDAD ── */}
            {(salarioFormateado || safe.modalidad_preferida || profile.disponibilidad || safe.codigo_candidato) && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {salarioFormateado && (
                    <div className="p-3 bg-muted/30 rounded-lg border text-center">
                      <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Expectativa Salarial</p>
                      <p className="font-medium text-sm">{salarioFormateado}</p>
                    </div>
                  )}
                  {safe.modalidad_preferida && (
                    <div className="p-3 bg-muted/30 rounded-lg border text-center">
                      <Briefcase className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Modalidad</p>
                      <Badge variant="secondary" className="capitalize mt-1">
                        {safe.modalidad_preferida}
                      </Badge>
                    </div>
                  )}
                  <div className="p-3 bg-muted/30 rounded-lg border text-center">
                    <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Disponibilidad</p>
                    <p className="font-medium text-sm">{formatDisponibilidad(profile.disponibilidad)}</p>
                  </div>
                  {safe.codigo_candidato && (
                    <div className="p-3 bg-muted/30 rounded-lg border text-center">
                      <User className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Código</p>
                      <p className="font-mono font-medium text-sm text-primary">{safe.codigo_candidato}</p>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* ── HABILIDADES TÉCNICAS ── */}
            {safe.habilidades_tecnicas.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Habilidades Técnicas
                    <Badge variant="secondary" className="text-xs">
                      Visible para todos
                    </Badge>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {safe.habilidades_tecnicas.map((skill) => (
                      <Badge key={skill} variant="default">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* ── HABILIDADES BLANDAS ── */}
            {safe.habilidades_blandas.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Habilidades Blandas
                    <Badge variant="secondary" className="text-xs">
                      Visible para todos
                    </Badge>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {safe.habilidades_blandas.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* ── EXPERIENCIA LABORAL ── */}
            {safe.experiencia_laboral.length > 0 && (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Experiencia Laboral
                    <Badge variant="secondary" className="text-xs">
                      Visible para todos
                    </Badge>
                  </h3>
                  <div className="space-y-4">
                    {safe.experiencia_laboral.map((exp, idx) => (
                      <div
                        key={`exp-${idx}-${exp.empresa}`}
                        className="relative pl-6 pb-4 border-l-2 border-primary/30 last:pb-0"
                      >
                        <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />
                        <div className="space-y-1">
                          <p className="font-semibold">{exp.puesto}</p>
                          <p className="text-sm text-muted-foreground">{exp.empresa}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.fecha_inicio}
                            {exp.fecha_inicio && " - "}
                            {exp.fecha_fin || "Actual"}
                          </p>
                          {exp.descripcion && <p className="text-sm mt-2">{exp.descripcion}</p>}
                          {exp.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exp.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* ── EDUCACIÓN ── */}
            {safe.educacion.length > 0 && (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Educación y Certificaciones
                    <Badge variant="secondary" className="text-xs">
                      Visible para todos
                    </Badge>
                  </h3>
                  <div className="space-y-4">
                    {safe.educacion.map((edu, idx) => (
                      <div
                        key={`edu-${idx}-${edu.institucion}`}
                        className="relative pl-6 pb-4 border-l-2 border-primary/30 last:pb-0"
                      >
                        <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{edu.titulo}</p>
                            {edu.tipo && (
                              <Badge variant="outline" className="text-xs">
                                {edu.tipo}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{edu.institucion}</p>
                          <p className="text-xs text-muted-foreground">
                            {edu.fecha_inicio}
                            {edu.fecha_inicio && " - "}
                            {edu.fecha_fin || "En curso"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* ── ENLACES PROFESIONALES ── */}
            {(safe.linkedin_url || safe.github_url || safe.portfolio_url) && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-primary" />
                  Enlaces Profesionales
                  <Badge variant="secondary" className="text-xs">
                    Visible para todos
                  </Badge>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {safe.linkedin_url && (
                    <a
                      href={safe.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span className="text-sm">LinkedIn</span>
                    </a>
                  )}
                  {safe.github_url && (
                    <a
                      href={safe.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span className="text-sm">GitHub</span>
                    </a>
                  )}
                  {safe.portfolio_url && (
                    <a
                      href={safe.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span className="text-sm">Portfolio</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
