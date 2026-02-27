import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Shield,
  User,
  Briefcase,
  GraduationCap,
  Heart,
  Target,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ImproveResumenDialog } from "@/components/candidate/ImproveResumenDialog";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// ─── Constantes de límites de texto ─────────────────────────────────────────
const LIMITS = {
  nombre: 120,
  email: 255,
  telefono: 20,
  ubicacion: 120,
  resumen: 2000,
  puesto: 100,
  empresa: 120,
  descripcion: 1000,
  tags: 300,
  habilidades: 500,
  titulo: 120,
  institucion: 120,
  url: 300,
  fecha: 7,
};

// ─── Sanitización: elimina caracteres peligrosos para inyección ──────────────
// Bloquea: < > { } [ ] ( ) \ ; ` ' " & | $ ^ % * = + ~ y variantes HTML
const DANGEROUS_CHARS_REGEX = /[<>{}\[\]\\;`'"&|$^%*=+~]/g;

const sanitize = (value: string): string => value.replace(DANGEROUS_CHARS_REGEX, "").trimStart();

// Sanitización para URLs: solo permite caracteres válidos en una URL segura
const sanitizeUrl = (value: string): string => value.replace(/[<>{}\[\]\\;`'"&|$^%*=+~\s]/g, "").trimStart();

// ─── Esquemas de validación con Zod ─────────────────────────────────────────
const urlSchema = z
  .string()
  .max(LIMITS.url, "URL demasiado larga")
  .refine((val) => val === "" || /^https:\/\/.+\..+/.test(val), "La URL debe comenzar con https://")
  .optional();

const experienciaSchema = z.object({
  id: z.string(),
  empresa: z.string().max(LIMITS.empresa, "Empresa: máximo 120 caracteres"),
  puesto: z.string().max(LIMITS.puesto, "Puesto: máximo 100 caracteres"),
  fecha_inicio: z
    .string()
    .max(LIMITS.fecha)
    .refine((val) => val === "" || /^(0[1-9]|1[0-2])\/\d{4}$/.test(val), "Fecha de inicio inválida. Usa MM/AAAA"),
  fecha_fin: z
    .string()
    .max(LIMITS.fecha)
    .refine(
      (val) => val === "" || val.toLowerCase() === "actual" || /^(0[1-9]|1[0-2])\/\d{4}$/.test(val),
      "Fecha de fin inválida. Usa MM/AAAA o escribe 'Actual'",
    ),
  descripcion: z.string().max(LIMITS.descripcion, "Descripción: máximo 1000 caracteres"),
  tags: z.string().max(LIMITS.tags, "Tags: máximo 300 caracteres"),
});

const educacionSchema = z.object({
  id: z.string(),
  tipo: z.string().max(50),
  titulo: z.string().max(LIMITS.titulo, "Título: máximo 120 caracteres"),
  institucion: z.string().max(LIMITS.institucion, "Institución: máximo 120 caracteres"),
  fecha_inicio: z
    .string()
    .max(LIMITS.fecha)
    .refine((val) => val === "" || /^(0[1-9]|1[0-2])\/\d{4}$/.test(val), "Fecha de inicio inválida. Usa MM/AAAA"),
  fecha_fin: z
    .string()
    .max(LIMITS.fecha)
    .refine(
      (val) => val === "" || val.toLowerCase() === "actual" || /^(0[1-9]|1[0-2])\/\d{4}$/.test(val),
      "Fecha de fin inválida. Usa MM/AAAA",
    ),
});

const profileSchema = z.object({
  nombre_completo: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(LIMITS.nombre, "Nombre: máximo 120 caracteres"),
  email: z.string().trim().email("Correo electrónico inválido").max(LIMITS.email, "Correo: máximo 255 caracteres"),
  telefono: z
    .string()
    .min(7, "Teléfono demasiado corto")
    .max(LIMITS.telefono, "Teléfono: máximo 20 caracteres")
    .regex(/^[+\d\s\-()]+$/, "El teléfono solo puede contener números, +, espacios y guiones"),
  ubicacion: z.string().min(2, "Ubicación demasiado corta").max(LIMITS.ubicacion, "Ubicación: máximo 120 caracteres"),
  resumen_profesional: z.string().max(LIMITS.resumen, "Resumen: máximo 2000 caracteres"),
  puesto_actual: z.string().max(LIMITS.puesto, "Puesto: máximo 100 caracteres"),
  empresa_actual: z.string().max(LIMITS.empresa, "Empresa: máximo 120 caracteres"),
  habilidades_tecnicas: z.string().max(LIMITS.habilidades, "Habilidades técnicas: máximo 500 caracteres"),
  habilidades_blandas: z.string().max(LIMITS.habilidades, "Habilidades blandas: máximo 500 caracteres"),
  salario_esperado_min: z
    .number()
    .min(0, "El salario no puede ser negativo")
    .max(10_000_000, "Valor de salario fuera de rango"),
  salario_esperado_max: z
    .number()
    .min(0, "El salario no puede ser negativo")
    .max(10_000_000, "Valor de salario fuera de rango"),
  modalidad_preferida: z.enum(["remoto", "presencial", "hibrido", ""]),
  disponibilidad: z.enum(["inmediata", "2_semanas", "1_mes", "mas_1_mes", ""]),
  linkedin_url: urlSchema,
  github_url: urlSchema,
  portfolio_url: urlSchema,
});

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ExperienciaLaboral {
  id: string;
  empresa: string;
  puesto: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  tags: string;
}

interface Educacion {
  id: string;
  tipo: string;
  titulo: string;
  institucion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface CandidateProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ─── Datos estáticos ──────────────────────────────────────────────────────────
const tiposEducacion = [
  "Licenciatura",
  "Maestría",
  "Doctorado",
  "Curso",
  "Diplomado",
  "Certificación",
  "Técnico",
  "Preparatoria",
];

const nuevaExperiencia = (): ExperienciaLaboral => ({
  id: uuidv4(),
  empresa: "",
  puesto: "",
  fecha_inicio: "",
  fecha_fin: "",
  descripcion: "",
  tags: "",
});

const nuevaEducacion = (): Educacion => ({
  id: uuidv4(),
  tipo: "",
  titulo: "",
  institucion: "",
  fecha_inicio: "",
  fecha_fin: "",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcularDuracion = (inicio: string, fin: string): string => {
  if (!inicio) return "";

  const parseDate = (dateStr: string): { mes: number; anio: number } | null => {
    if (!dateStr) return null;
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 2) {
        const mes = parseInt(parts[0], 10);
        const anio = parseInt(parts[1], 10);
        if (!isNaN(mes) && !isNaN(anio) && mes >= 1 && mes <= 12 && anio >= 1900) {
          return { mes, anio };
        }
      }
    }
    if (dateStr.length >= 6) {
      const mes = parseInt(dateStr.substring(0, 2), 10);
      const anio = parseInt(dateStr.substring(2), 10);
      if (!isNaN(mes) && !isNaN(anio) && mes >= 1 && mes <= 12 && anio >= 1900) {
        return { mes, anio };
      }
    }
    return null;
  };

  const inicioDate = parseDate(inicio);
  if (!inicioDate) return "";

  const finLower = fin?.toLowerCase().trim() || "";
  const esActual = finLower === "actual" || finLower === "" || finLower === "-";

  let finDate: { mes: number; anio: number };
  if (esActual) {
    const now = new Date();
    finDate = { mes: now.getMonth() + 1, anio: now.getFullYear() };
  } else {
    const parsed = parseDate(fin);
    if (!parsed) return "";
    finDate = parsed;
  }

  const meses = (finDate.anio - inicioDate.anio) * 12 + (finDate.mes - inicioDate.mes);
  if (meses < 0) return "";
  if (meses === 0) return "< 1 mes";

  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;

  if (anios === 0) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  if (mesesRestantes === 0) return `${anios} ${anios === 1 ? "año" : "años"}`;
  return `${anios}a ${mesesRestantes}m`;
};

const calcularPorcentajeLlenado = (data: any): number => {
  let filled = 0;
  let total = 0;

  // Identidad (20 puntos — quitamos fecha_nacimiento que no existe en el form)
  const identityFields = ["nombre_completo", "email", "telefono", "ubicacion"];
  identityFields.forEach((field) => {
    total += 5;
    if (data[field]) filled += 5;
  });

  // Experiencia laboral (25 puntos)
  total += 25;
  if (data.experiencia_laboral?.length >= 2) filled += 25;
  else if (data.experiencia_laboral?.length > 0) filled += (data.experiencia_laboral.length / 2) * 25;

  // Educación (15 puntos)
  total += 15;
  if (data.educacion?.length >= 1) filled += 15;

  // Habilidades (15 puntos)
  total += 15;
  if (data.habilidades_tecnicas?.length > 0) filled += 8;
  if (data.habilidades_blandas?.length > 0) filled += 7;

  // Resumen (10 puntos)
  total += 10;
  if (data.resumen_profesional?.length > 50) filled += 10;

  // Preferencias (5 puntos)
  total += 5;
  if (data.modalidad_preferida && data.disponibilidad) filled += 5;

  // Salario (5 puntos) — corregido: antes no contaba
  total += 5;
  if (data.salario_esperado_min > 0 || data.salario_esperado_max > 0) filled += 5;

  // Enlaces (5 puntos)
  total += 5;
  if (data.linkedin_url || data.github_url || data.portfolio_url) filled += 5;

  return Math.round((filled / total) * 100);
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const CandidateProfileModal = ({ open, onOpenChange, onSuccess }: CandidateProfileModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [porcentajeLlenado, setPorcentajeLlenado] = useState(0);
  const [improveDialogOpen, setImproveDialogOpen] = useState(false);
  const [codigoCandidato, setCodigoCandidato] = useState<string>("");

  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    ubicacion: "",
    resumen_profesional: "",
    puesto_actual: "",
    empresa_actual: "",
    habilidades_tecnicas: "",
    habilidades_blandas: "",
    salario_esperado_min: 0,
    salario_esperado_max: 0,
    modalidad_preferida: "" as "remoto" | "presencial" | "hibrido" | "",
    disponibilidad: "" as "inmediata" | "2_semanas" | "1_mes" | "mas_1_mes" | "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  const [experiencias, setExperiencias] = useState<ExperienciaLaboral[]>([nuevaExperiencia()]);
  const [educaciones, setEducaciones] = useState<Educacion[]>([nuevaEducacion()]);

  // ── Cargar perfil ────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoadError(false);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("perfil_candidato")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCodigoCandidato((data as any).codigo_candidato || "");
        setFormData({
          nombre_completo: data.nombre_completo || "",
          email: data.email || session.user.email || "",
          telefono: data.telefono || "",
          ubicacion: data.ubicacion || "",
          resumen_profesional: data.resumen_profesional || "",
          puesto_actual: data.puesto_actual || "",
          empresa_actual: data.empresa_actual || "",
          habilidades_tecnicas: data.habilidades_tecnicas?.join(", ") || "",
          habilidades_blandas: data.habilidades_blandas?.join(", ") || "",
          salario_esperado_min: data.salario_esperado_min || 0,
          salario_esperado_max: data.salario_esperado_max || 0,
          modalidad_preferida: (data.modalidad_preferida as any) || "",
          disponibilidad: (data.disponibilidad as any) || "",
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          portfolio_url: data.portfolio_url || "",
        });

        if (Array.isArray(data.experiencia_laboral) && data.experiencia_laboral.length > 0) {
          // Asegurar que cada experiencia cargada tenga un id único
          setExperiencias((data.experiencia_laboral as any[]).map((e) => ({ ...e, id: e.id || uuidv4() })));
        }
        if (Array.isArray(data.educacion) && data.educacion.length > 0) {
          setEducaciones((data.educacion as any[]).map((e) => ({ ...e, id: e.id || uuidv4() })));
        }
      } else {
        setFormData((prev) => ({ ...prev, email: session.user.email || "" }));
      }
    } catch (err) {
      setLoadError(true);
      toast({
        title: "Error al cargar el perfil",
        description: "No se pudieron cargar tus datos. Intenta cerrar y abrir el formulario.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (open) loadProfile();
  }, [open, loadProfile]);

  // Actualizar porcentaje de llenado al cambiar datos
  useEffect(() => {
    const profileData = {
      ...formData,
      experiencia_laboral: experiencias.filter((e) => e.empresa || e.puesto),
      educacion: educaciones.filter((e) => e.titulo || e.institucion),
    };
    setPorcentajeLlenado(calcularPorcentajeLlenado(profileData));
  }, [formData, experiencias, educaciones]);

  // ── Guardar perfil ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario principal con Zod
    const validation = profileSchema.safeParse({
      ...formData,
      linkedin_url: formData.linkedin_url || undefined,
      github_url: formData.github_url || undefined,
      portfolio_url: formData.portfolio_url || undefined,
    });

    if (!validation.success) {
      toast({
        title: "Datos inválidos",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Validar que salario mínimo no sea mayor que el máximo
    if (
      formData.salario_esperado_min > 0 &&
      formData.salario_esperado_max > 0 &&
      formData.salario_esperado_min > formData.salario_esperado_max
    ) {
      toast({
        title: "Salario inválido",
        description: "El salario mínimo no puede ser mayor que el máximo.",
        variant: "destructive",
      });
      return;
    }

    // Validar experiencias
    const expFiltradas = experiencias.filter((e) => e.empresa || e.puesto);
    for (const exp of expFiltradas) {
      const expVal = experienciaSchema.safeParse(exp);
      if (!expVal.success) {
        toast({
          title: "Error en experiencia laboral",
          description: expVal.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Validar educaciones
    const eduFiltradas = educaciones.filter((e) => e.titulo || e.institucion);
    for (const edu of eduFiltradas) {
      const eduVal = educacionSchema.safeParse(edu);
      if (!eduVal.success) {
        toast({
          title: "Error en educación",
          description: eduVal.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      // Limpiar datos antes de guardar — eliminar id interno de listas (no necesario en BD)
      const expParaGuardar = expFiltradas.map(({ id, ...rest }) => rest);
      const eduParaGuardar = eduFiltradas.map(({ id, ...rest }) => rest);

      const profileData = {
        user_id: session.user.id,
        nombre_completo: formData.nombre_completo,
        email: formData.email.trim(),
        telefono: formData.telefono,
        ubicacion: formData.ubicacion,
        resumen_profesional: formData.resumen_profesional,
        puesto_actual: formData.puesto_actual,
        empresa_actual: formData.empresa_actual,
        habilidades_tecnicas: formData.habilidades_tecnicas
          .split(",")
          .map((h) => sanitize(h.trim()))
          .filter((h) => h),
        habilidades_blandas: formData.habilidades_blandas
          .split(",")
          .map((h) => sanitize(h.trim()))
          .filter((h) => h),
        salario_esperado_min: formData.salario_esperado_min,
        salario_esperado_max: formData.salario_esperado_max,
        modalidad_preferida: formData.modalidad_preferida || null,
        disponibilidad: formData.disponibilidad || null,
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
        portfolio_url: formData.portfolio_url || null,
        experiencia_laboral: expParaGuardar,
        educacion: eduParaGuardar,
      };

      const { error } = await supabase.from("perfil_candidato").upsert([profileData as any], { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Perfil guardado",
        description: "Tu perfil se ha actualizado correctamente.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      // No exponer el mensaje interno de Supabase al usuario
      console.error("Error guardando perfil:", error.message);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el perfil. Intenta de nuevo en unos momentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers de campos con sanitización inline ────────────────────────────────
  const updateField = useCallback((field: keyof typeof formData, value: string | number) => {
    if (typeof value === "string") {
      const isUrl = field.endsWith("_url");
      setFormData((prev) => ({
        ...prev,
        [field]: isUrl ? sanitizeUrl(value) : sanitize(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  // ── Experiencia laboral ───────────────────────────────────────────────────────
  const agregarExperiencia = () => setExperiencias((prev) => [...prev, nuevaExperiencia()]);

  const eliminarExperiencia = (id: string) => {
    if (experiencias.length > 1) setExperiencias((prev) => prev.filter((e) => e.id !== id));
  };

  const actualizarExperiencia = (id: string, field: keyof Omit<ExperienciaLaboral, "id">, value: string) => {
    setExperiencias((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: sanitize(value) } : e)));
  };

  // ── Educación ────────────────────────────────────────────────────────────────
  const agregarEducacion = () => setEducaciones((prev) => [...prev, nuevaEducacion()]);

  const eliminarEducacion = (id: string) => {
    if (educaciones.length > 1) setEducaciones((prev) => prev.filter((e) => e.id !== id));
  };

  const actualizarEducacion = (id: string, field: keyof Omit<Educacion, "id">, value: string) => {
    setEducaciones((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: sanitize(value) } : e)));
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                Mi Perfil Profesional
              </DialogTitle>
              <DialogDescription className="mt-1">
                Completa tu perfil para aumentar tus oportunidades laborales
              </DialogDescription>
            </div>
            {codigoCandidato && (
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg border border-primary/20">
                <span className="text-xs text-muted-foreground">Código:</span>
                <span className="font-mono font-bold text-primary">{codigoCandidato}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Error de carga */}
        {loadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudieron cargar tus datos. Tu información anterior está segura.{" "}
              <button type="button" className="underline font-medium" onClick={loadProfile}>
                Intentar de nuevo
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Barra de progreso */}
        <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Completitud del perfil</span>
            <span
              className={`text-sm font-bold ${
                porcentajeLlenado >= 80
                  ? "text-green-600"
                  : porcentajeLlenado >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {porcentajeLlenado}%
            </span>
          </div>
          <Progress value={porcentajeLlenado} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {porcentajeLlenado < 50 && "Completa más campos para mejorar tu visibilidad"}
            {porcentajeLlenado >= 50 && porcentajeLlenado < 80 && "Buen progreso, sigue completando tu perfil"}
            {porcentajeLlenado >= 80 && "¡Excelente! Tu perfil está casi completo"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                    Sección Protegida
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta información solo será visible para reclutadores cuando te postules a una vacante o cuando cuenten
                  con un plan de pago activo.
                </p>
              </div>
            </div>

            <Alert className="bg-amber-100/50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                <strong>Tu privacidad es importante:</strong> Los reclutadores sin plan de pago o con plan heredado de
                empresa no podrán ver estos datos a menos que te postules directamente a sus vacantes.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="md:col-span-2">
                <Label htmlFor="nombre_completo" className="flex items-center gap-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre_completo"
                  required
                  placeholder="Tu nombre completo como aparece en documentos oficiales"
                  value={formData.nombre_completo}
                  onChange={(e) => updateField("nombre_completo", e.target.value)}
                  maxLength={LIMITS.nombre}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  maxLength={LIMITS.email}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="telefono" className="flex items-center gap-1">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefono"
                  required
                  placeholder="+52 55 1234 5678"
                  value={formData.telefono}
                  onChange={(e) => updateField("telefono", e.target.value)}
                  maxLength={LIMITS.telefono}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Incluye código de país</p>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="ubicacion" className="flex items-center gap-1">
                  Ubicación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ubicacion"
                  required
                  placeholder="Ciudad, Estado, País (ej: Guadalajara, Jalisco, México)"
                  value={formData.ubicacion}
                  onChange={(e) => updateField("ubicacion", e.target.value)}
                  maxLength={LIMITS.ubicacion}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── PERFIL PROFESIONAL ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Perfil Profesional</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="puesto_actual">Puesto Buscado</Label>
                <Input
                  id="puesto_actual"
                  placeholder="Administrador, Auxiliar Contable, Auxiliar Administrativo"
                  value={formData.puesto_actual}
                  onChange={(e) => updateField("puesto_actual", e.target.value)}
                  maxLength={LIMITS.puesto}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="empresa_actual">Empresa Actual</Label>
                <Input
                  id="empresa_actual"
                  placeholder="Nombre de la empresa donde trabajas actualmente"
                  value={formData.empresa_actual}
                  onChange={(e) => updateField("empresa_actual", e.target.value)}
                  maxLength={LIMITS.empresa}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="resumen_profesional">Resumen Profesional</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImproveDialogOpen(true)}
                  disabled={!formData.resumen_profesional || formData.resumen_profesional.length < 20}
                  className="h-7 text-xs gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Mejorar con IA
                </Button>
              </div>
              <Textarea
                id="resumen_profesional"
                rows={4}
                placeholder="Describe brevemente tu perfil profesional, logros destacados y lo que te hace un candidato ideal..."
                value={formData.resumen_profesional}
                onChange={(e) => updateField("resumen_profesional", e.target.value)}
                maxLength={LIMITS.resumen}
                className="mt-1"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Escribe al menos 20 caracteres y usa el botón "Mejorar con IA" para optimizar tu resumen
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.resumen_profesional.length}/{LIMITS.resumen}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── EXPERIENCIA LABORAL ── */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Experiencia Laboral</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={agregarExperiencia}>
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>

            {experiencias.map((exp, index) => (
              <div
                key={exp.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm text-primary">
                    {index === 0 ? "Experiencia más reciente" : `Experiencia ${index + 1}`}
                  </h4>
                  {experiencias.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarExperiencia(exp.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Empresa</Label>
                    <Input
                      value={exp.empresa}
                      onChange={(e) => actualizarExperiencia(exp.id, "empresa", e.target.value)}
                      placeholder="Nombre de la empresa"
                      maxLength={LIMITS.empresa}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Puesto</Label>
                    <Input
                      value={exp.puesto}
                      onChange={(e) => actualizarExperiencia(exp.id, "puesto", e.target.value)}
                      placeholder="Título del puesto"
                      maxLength={LIMITS.puesto}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Inicio</Label>
                      <Input
                        value={exp.fecha_inicio}
                        onChange={(e) => actualizarExperiencia(exp.id, "fecha_inicio", e.target.value)}
                        placeholder="MM/AAAA"
                        maxLength={LIMITS.fecha}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Fin</Label>
                      <Input
                        value={exp.fecha_fin}
                        onChange={(e) => actualizarExperiencia(exp.id, "fecha_fin", e.target.value)}
                        placeholder="Actual"
                        maxLength={LIMITS.fecha}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    {calcularDuracion(exp.fecha_inicio, exp.fecha_fin) && (
                      <Badge
                        variant="secondary"
                        className="h-8 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 whitespace-nowrap"
                      >
                        {calcularDuracion(exp.fecha_inicio, exp.fecha_fin)}
                      </Badge>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm">Descripción y logros</Label>
                    <Textarea
                      value={exp.descripcion}
                      onChange={(e) => actualizarExperiencia(exp.id, "descripcion", e.target.value)}
                      placeholder="Describe tus responsabilidades y logros. Usa verbos de acción y cifras cuando sea posible."
                      rows={3}
                      maxLength={LIMITS.descripcion}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {exp.descripcion.length}/{LIMITS.descripcion}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm">Tecnologías y habilidades utilizadas</Label>
                    <Input
                      value={exp.tags}
                      onChange={(e) => actualizarExperiencia(exp.id, "tags", e.target.value)}
                      placeholder="React, Node.js, Liderazgo, SAP, Excel Avanzado..."
                      maxLength={LIMITS.tags}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* ── EDUCACIÓN ── */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Educación y Certificaciones</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={agregarEducacion}>
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>

            {educaciones.map((edu, index) => (
              <div
                key={edu.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm text-primary">
                    {index === 0 ? "Formación principal" : `Formación ${index + 1}`}
                  </h4>
                  {educaciones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarEducacion(edu.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Tipo</Label>
                    <Select value={edu.tipo} onValueChange={(value) => actualizarEducacion(edu.id, "tipo", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposEducacion.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Título / Nombre</Label>
                    <Input
                      value={edu.titulo}
                      onChange={(e) => actualizarEducacion(edu.id, "titulo", e.target.value)}
                      placeholder="Ej: Ingeniería en Sistemas, MBA"
                      maxLength={LIMITS.titulo}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Institución</Label>
                    <Input
                      value={edu.institucion}
                      onChange={(e) => actualizarEducacion(edu.id, "institucion", e.target.value)}
                      placeholder="Nombre de la institución"
                      maxLength={LIMITS.institucion}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Inicio</Label>
                      <Input
                        value={edu.fecha_inicio}
                        onChange={(e) => actualizarEducacion(edu.id, "fecha_inicio", e.target.value)}
                        placeholder="MM/AAAA"
                        maxLength={LIMITS.fecha}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Fin</Label>
                      <Input
                        value={edu.fecha_fin}
                        onChange={(e) => actualizarEducacion(edu.id, "fecha_fin", e.target.value)}
                        placeholder="MM/AAAA"
                        maxLength={LIMITS.fecha}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    {calcularDuracion(edu.fecha_inicio, edu.fecha_fin) && (
                      <Badge
                        variant="secondary"
                        className="h-8 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 whitespace-nowrap"
                      >
                        {calcularDuracion(edu.fecha_inicio, edu.fecha_fin)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* ── HABILIDADES ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Habilidades</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="habilidades_tecnicas">Habilidades Técnicas</Label>
                <Input
                  id="habilidades_tecnicas"
                  placeholder="React, TypeScript, Node.js, Python, SQL, Excel, SAP..."
                  value={formData.habilidades_tecnicas}
                  onChange={(e) => updateField("habilidades_tecnicas", e.target.value)}
                  maxLength={LIMITS.habilidades}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Separa cada habilidad con coma</p>
              </div>
              <div>
                <Label htmlFor="habilidades_blandas">Habilidades Blandas</Label>
                <Input
                  id="habilidades_blandas"
                  placeholder="Comunicación, Trabajo en equipo, Liderazgo, Negociación..."
                  value={formData.habilidades_blandas}
                  onChange={(e) => updateField("habilidades_blandas", e.target.value)}
                  maxLength={LIMITS.habilidades}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Separa cada habilidad con coma</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── PREFERENCIAS LABORALES ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Preferencias Laborales</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salario_esperado_min">Salario Mínimo Esperado (MXN)</Label>
                <Input
                  id="salario_esperado_min"
                  type="number"
                  min="0"
                  max="10000000"
                  value={formData.salario_esperado_min || ""}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(10_000_000, parseFloat(e.target.value) || 0));
                    updateField("salario_esperado_min", val);
                  }}
                  placeholder="Ej: 25000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="salario_esperado_max">Salario Máximo Esperado (MXN)</Label>
                <Input
                  id="salario_esperado_max"
                  type="number"
                  min="0"
                  max="10000000"
                  value={formData.salario_esperado_max || ""}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(10_000_000, parseFloat(e.target.value) || 0));
                    updateField("salario_esperado_max", val);
                  }}
                  placeholder="Ej: 35000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="modalidad_preferida">Modalidad Preferida</Label>
                <Select
                  value={formData.modalidad_preferida}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, modalidad_preferida: value as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar modalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remoto">Remoto</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="disponibilidad">Disponibilidad para iniciar</Label>
                <Select
                  value={formData.disponibilidad}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, disponibilidad: value as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar disponibilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inmediata">Inmediata</SelectItem>
                    <SelectItem value="2_semanas">2 semanas</SelectItem>
                    <SelectItem value="1_mes">1 mes</SelectItem>
                    <SelectItem value="mas_1_mes">Más de 1 mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── ENLACES PROFESIONALES ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Enlaces Profesionales</h3>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Solo se aceptan URLs que comiencen con https://</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedin_url}
                  onChange={(e) => updateField("linkedin_url", e.target.value)}
                  maxLength={LIMITS.url}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="github_url">GitHub</Label>
                <Input
                  id="github_url"
                  placeholder="https://github.com/..."
                  value={formData.github_url}
                  onChange={(e) => updateField("github_url", e.target.value)}
                  maxLength={LIMITS.url}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="portfolio_url">Portfolio / Web Personal</Label>
                <Input
                  id="portfolio_url"
                  placeholder="https://..."
                  value={formData.portfolio_url}
                  onChange={(e) => updateField("portfolio_url", e.target.value)}
                  maxLength={LIMITS.url}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* ── BOTONES ── */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="min-w-32">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Perfil
            </Button>
          </div>
        </form>
      </DialogContent>

      <ImproveResumenDialog
        open={improveDialogOpen}
        onOpenChange={setImproveDialogOpen}
        resumenActual={formData.resumen_profesional}
        puestoBuscado={formData.puesto_actual}
        habilidadesTecnicas={formData.habilidades_tecnicas
          .split(",")
          .map((h) => sanitize(h.trim()))
          .filter((h) => h)}
        habilidadesBlandas={formData.habilidades_blandas
          .split(",")
          .map((h) => sanitize(h.trim()))
          .filter((h) => h)}
        experienciaLaboral={experiencias
          .filter((e) => e.empresa || e.puesto)
          .map((e) => ({
            empresa: e.empresa,
            puesto: e.puesto,
            descripcion: e.descripcion,
            tags: e.tags,
          }))}
        onSuccess={(resumenMejorado) => {
          setFormData((prev) => ({ ...prev, resumen_profesional: sanitize(resumenMejorado) }));
        }}
      />
    </Dialog>
  );
};
