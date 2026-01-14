import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertTriangle,
  FileSearch,
  Home,
  CheckCircle,
  Clock,
  Unlock,
  Coins,
  FileText,
  Download,
  Eye
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";
import { useDesbloquearIdentidad } from "@/hooks/useDesbloquearIdentidad";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WhatsAppButton, useWhatsAppMessage } from "@/components/ui/whatsapp-button";

interface CandidateProfileViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidatoUserId: string;
  hasFullAccess?: boolean;
  reclutadorId?: string;
  empresaId?: string | null;
  allowUnlock?: boolean;
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
  experiencia_laboral: any;
  educacion: any;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  salario_esperado_min: number | null;
  salario_esperado_max: number | null;
  modalidad_preferida: string | null;
  disponibilidad: string | null;
  created_at: string;
  codigo_candidato?: string;
  cv_url: string | null;
  cv_filename: string | null;
}

interface EstudioSocioeconomico {
  id: string;
  folio: string;
  estatus: string;
  fecha_entrega: string | null;
  calificacion_riesgo: string | null;
  resultado_general: string | null;
  datos_sociodemograficos: any;
  datos_vivienda: any;
  datos_economicos: any;
  datos_referencias: any;
  observaciones_finales: string | null;
  fecha_visita: string | null;
  candidato_presente: boolean | null;
}

const riesgoConfig: Record<string, { label: string; color: string }> = {
  bajo: { label: "Bajo", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  medio: { label: "Medio", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  alto: { label: "Alto", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  muy_alto: { label: "Muy Alto", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export const CandidateProfileViewModal = ({
  open,
  onOpenChange,
  candidatoUserId,
  hasFullAccess = false,
  reclutadorId,
  empresaId,
  allowUnlock = false,
}: CandidateProfileViewModalProps) => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [estudios, setEstudios] = useState<EstudioSocioeconomico[]>([]);
  const [identityUnlocked, setIdentityUnlocked] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [creditosDisponibles, setCreditosDisponibles] = useState(0);
  const [reclutadorUserId, setReclutadorUserId] = useState<string | null>(null);
  const { generarMensajeGenerico } = useWhatsAppMessage();

  const { 
    desbloquearIdentidad, 
    verificarAccesoDesbloqueado, 
    obtenerCreditosDisponibles,
    loading: unlockLoading,
    costoDesbloqueo 
  } = useDesbloquearIdentidad();

  useEffect(() => {
    if (open && candidatoUserId) {
      loadProfile();
      loadEstudios();
      if (reclutadorId && allowUnlock) {
        checkUnlockStatus();
        loadCredits();
      }
    }
  }, [open, candidatoUserId, reclutadorId]);

  const checkUnlockStatus = async () => {
    if (!reclutadorId) return;
    
    // Obtener user_id del reclutador
    const { data: perfilReclutador } = await supabase
      .from("perfil_reclutador")
      .select("user_id")
      .eq("id", reclutadorId)
      .single();
    
    if (perfilReclutador) {
      setReclutadorUserId(perfilReclutador.user_id);
    }

    const unlocked = await verificarAccesoDesbloqueado(reclutadorId, candidatoUserId);
    setIdentityUnlocked(unlocked);
  };

  const loadCredits = async () => {
    if (!reclutadorId) return;
    const creditos = await obtenerCreditosDisponibles(reclutadorId);
    setCreditosDisponibles(creditos.total);
  };

  const handleUnlockIdentity = async () => {
    if (!reclutadorId || !reclutadorUserId) return;
    
    const result = await desbloquearIdentidad(
      reclutadorId,
      reclutadorUserId,
      candidatoUserId,
      empresaId
    );

    if (result.success) {
      setIdentityUnlocked(true);
      setShowUnlockDialog(false);
      loadCredits();
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("perfil_candidato")
        .select("*")
        .eq("user_id", candidatoUserId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEstudios = async () => {
    try {
      const seisaMesesAtras = new Date();
      seisaMesesAtras.setMonth(seisaMesesAtras.getMonth() - 6);

      const { data, error } = await supabase
        .from("estudios_socioeconomicos")
        .select("*")
        .eq("candidato_user_id", candidatoUserId)
        .eq("estatus", "entregado")
        .not("fecha_entrega", "is", null)
        .gte("fecha_entrega", seisaMesesAtras.toISOString())
        .order("fecha_entrega", { ascending: false });

      if (error) throw error;
      setEstudios(data || []);
    } catch (error: any) {
      console.error("Error loading estudios:", error);
    }
  };

  const isEstudioVisible = (fechaEntrega: string) => {
    const mesesTranscurridos = differenceInMonths(new Date(), new Date(fechaEntrega));
    return mesesTranscurridos < 6;
  };

  const formatDisponibilidad = (disp: string | null) => {
    if (!disp) return "No especificada";
    const map: Record<string, string> = {
      inmediata: "Inmediata",
      "2_semanas": "2 semanas",
      "1_mes": "1 mes",
      "mas_1_mes": "Más de 1 mes",
    };
    return map[disp] || disp;
  };

  // Determinar si se puede ver la identidad
  const canSeeIdentity = hasFullAccess || identityUnlocked;

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

  if (!profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Perfil no disponible</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            No se pudo cargar el perfil del candidato.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              {canSeeIdentity ? profile.nombre_completo : "Candidato"}
              {!canSeeIdentity && (
                <Badge variant="outline" className="ml-2 text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Identidad restringida
                </Badge>
              )}
              {identityUnlocked && (
                <Badge variant="default" className="ml-2 text-xs bg-green-600">
                  <Unlock className="h-3 w-3 mr-1" />
                  Desbloqueado
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
            <div className="space-y-6">
              
              {/* SECCIÓN RESTRINGIDA: DATOS DE IDENTIDAD Y CONTACTO */}
              <div className={`rounded-xl p-5 space-y-4 ${
                canSeeIdentity 
                  ? 'border bg-muted/30' 
                  : 'border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${canSeeIdentity ? 'bg-primary/10' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                    <Shield className={`h-5 w-5 ${canSeeIdentity ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      Datos de Identidad y Contacto
                      {!canSeeIdentity && (
                        <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                          <Lock className="h-3 w-3 mr-1" />
                          Sección Protegida
                        </Badge>
                      )}
                    </h3>
                    {!canSeeIdentity && allowUnlock && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Desbloquea esta información por {costoDesbloqueo} créditos. El consumo quedará registrado en auditoría.
                      </p>
                    )}
                  </div>
                </div>

                {!canSeeIdentity && allowUnlock && (
                  <Alert className="bg-amber-100/50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm flex items-center justify-between">
                      <span>
                        <strong>Acceso restringido:</strong> Desbloquea los datos de contacto de este candidato por {costoDesbloqueo} créditos.
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => setShowUnlockDialog(true)}
                        disabled={creditosDisponibles < costoDesbloqueo || unlockLoading}
                        className="ml-4"
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Desbloquear ({costoDesbloqueo} créditos)
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre Completo</p>
                      <p className="font-medium">
                        {canSeeIdentity ? profile.nombre_completo : (
                          <span className="text-muted-foreground italic flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Información oculta
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                      <p className="font-medium">
                        {canSeeIdentity ? profile.email : (
                          <span className="text-muted-foreground italic flex items-center gap-1">
                            <Lock className="h-3 w-3" /> ***@*****.***
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="font-medium">
                        {canSeeIdentity ? (profile.telefono || "No especificado") : (
                          <span className="text-muted-foreground italic flex items-center gap-1">
                            <Lock className="h-3 w-3" /> *** *** ****
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ubicación</p>
                      <p className="font-medium">
                        {canSeeIdentity ? (profile.ubicacion || "No especificada") : (
                          <span className="text-muted-foreground italic flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Ciudad oculta
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Botón de WhatsApp - Solo visible cuando se tiene acceso completo */}
                {canSeeIdentity && profile.telefono && (
                  <div className="pt-2">
                    <WhatsAppButton
                      telefono={profile.telefono}
                      mensaje={generarMensajeGenerico(profile.nombre_completo)}
                      variant="outline"
                      size="default"
                      showText={true}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Botón de CV - Solo visible cuando se tiene acceso completo */}
                {canSeeIdentity && profile.cv_url && (
                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(profile.cv_url!, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver CV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = profile.cv_url!;
                        link.download = profile.cv_filename || 'cv-candidato';
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Perfil Profesional */}
              {(profile.puesto_actual || profile.empresa_actual || profile.resumen_profesional) && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Perfil Profesional
                    </h3>
                    
                    {(profile.puesto_actual || profile.empresa_actual) && (
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <p className="font-medium text-lg">{profile.puesto_actual || "Sin puesto especificado"}</p>
                        {profile.empresa_actual && (
                          <p className="text-muted-foreground">{profile.empresa_actual}</p>
                        )}
                      </div>
                    )}
                    
                    {profile.resumen_profesional && (
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <p className="text-sm leading-relaxed">{profile.resumen_profesional}</p>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Preferencias y Disponibilidad */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(profile.salario_esperado_min || profile.salario_esperado_max) && (
                  <div className="p-3 bg-muted/30 rounded-lg border text-center">
                    <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Expectativa Salarial</p>
                    <p className="font-medium text-sm">
                      ${profile.salario_esperado_min?.toLocaleString()} - ${profile.salario_esperado_max?.toLocaleString()}
                    </p>
                  </div>
                )}
                {profile.modalidad_preferida && (
                  <div className="p-3 bg-muted/30 rounded-lg border text-center">
                    <Briefcase className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Modalidad</p>
                    <Badge variant="secondary" className="capitalize mt-1">
                      {profile.modalidad_preferida}
                    </Badge>
                  </div>
                )}
                <div className="p-3 bg-muted/30 rounded-lg border text-center">
                  <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Disponibilidad</p>
                  <p className="font-medium text-sm">{formatDisponibilidad(profile.disponibilidad)}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border text-center">
                  <User className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Registro</p>
                  <p className="font-medium text-sm">
                    {new Date(profile.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Habilidades Técnicas */}
              {profile.habilidades_tecnicas && profile.habilidades_tecnicas.length > 0 && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Habilidades Técnicas</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.habilidades_tecnicas.map((skill, idx) => (
                        <Badge key={idx} variant="default">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Habilidades Blandas */}
              {profile.habilidades_blandas && profile.habilidades_blandas.length > 0 && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Habilidades Blandas</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.habilidades_blandas.map((skill, idx) => (
                        <Badge key={idx} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Experiencia Laboral */}
              {profile.experiencia_laboral && Array.isArray(profile.experiencia_laboral) && profile.experiencia_laboral.length > 0 && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Experiencia Laboral
                    </h3>
                    <div className="space-y-4">
                      {profile.experiencia_laboral.map((exp: any, idx: number) => (
                        <div key={idx} className="relative pl-6 pb-4 border-l-2 border-primary/30 last:pb-0">
                          <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />
                          <div className="space-y-1">
                            <p className="font-semibold">{exp.puesto}</p>
                            <p className="text-sm text-muted-foreground">{exp.empresa}</p>
                            <p className="text-xs text-muted-foreground">
                              {exp.fecha_inicio} - {exp.fecha_fin || "Actual"}
                            </p>
                          {exp.descripcion && (
                            <p className="text-sm mt-2">{exp.descripcion}</p>
                          )}
                          {exp.tags && Array.isArray(exp.tags) && exp.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exp.tags.map((tag: string, tIdx: number) => (
                                <Badge key={tIdx} variant="secondary" className="text-xs">
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

              {/* Educación */}
              {profile.educacion && Array.isArray(profile.educacion) && profile.educacion.length > 0 && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Educación
                    </h3>
                    <div className="space-y-3">
                      {profile.educacion.map((edu: any, idx: number) => (
                        <div key={idx} className="p-4 bg-muted/30 rounded-lg border">
                          <p className="font-semibold">{edu.titulo}</p>
                          <p className="text-sm text-muted-foreground">{edu.institucion}</p>
                          <p className="text-xs text-muted-foreground">
                            {edu.fecha_inicio} - {edu.fecha_fin || "En curso"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Links - solo si tiene acceso completo */}
              {canSeeIdentity && (profile.linkedin_url || profile.github_url || profile.portfolio_url) && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-primary" />
                      Enlaces
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          <LinkIcon className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                      {profile.github_url && (
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          <LinkIcon className="h-4 w-4" />
                          GitHub
                        </a>
                      )}
                      {profile.portfolio_url && (
                        <a
                          href={profile.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Portfolio
                        </a>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Estudios Socioeconómicos - solo con acceso completo */}
              {canSeeIdentity && estudios.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileSearch className="h-5 w-5 text-primary" />
                    Estudios Socioeconómicos
                    <Badge variant="outline" className="ml-2">
                      {estudios.length} disponible{estudios.length > 1 ? "s" : ""}
                    </Badge>
                  </h3>
                  
                  <div className="space-y-4">
                    {estudios.filter(e => e.fecha_entrega && isEstudioVisible(e.fecha_entrega)).map((estudio) => (
                      <Card key={estudio.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <FileSearch className="h-4 w-4" />
                              Folio: {estudio.folio}
                            </CardTitle>
                            {estudio.calificacion_riesgo && (
                              <Badge className={riesgoConfig[estudio.calificacion_riesgo]?.color || ""}>
                                Riesgo {riesgoConfig[estudio.calificacion_riesgo]?.label || estudio.calificacion_riesgo}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Fecha Entrega</p>
                                <p className="font-medium">
                                  {estudio.fecha_entrega && format(new Date(estudio.fecha_entrega), "dd MMM yyyy", { locale: es })}
                                </p>
                              </div>
                            </div>
                            {estudio.fecha_visita && (
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Fecha Visita</p>
                                  <p className="font-medium">
                                    {format(new Date(estudio.fecha_visita), "dd MMM yyyy", { locale: es })}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              {estudio.candidato_presente ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-600" />
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground">Candidato</p>
                                <p className="font-medium">
                                  {estudio.candidato_presente ? "Presente" : "Ausente"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {estudio.resultado_general && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Resultado General</p>
                              <p className="text-sm">{estudio.resultado_general}</p>
                            </div>
                          )}

                          {estudio.observaciones_finales && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
                              <p className="text-sm">{estudio.observaciones_finales}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para desbloquear identidad */}
      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Confirmar Desbloqueo de Identidad
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Estás a punto de desbloquear los datos de contacto e identidad de este candidato.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                <p className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Información importante:
                </p>
                <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>Se descontarán <strong>{costoDesbloqueo} créditos</strong> de tu wallet</li>
                  <li>Esta acción quedará registrada en la <strong>auditoría de movimientos</strong></li>
                  <li>Una vez desbloqueado, tendrás acceso permanente a la identidad de este candidato</li>
                  <li>Créditos disponibles: <strong>{creditosDisponibles}</strong></li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlockLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnlockIdentity}
              disabled={unlockLoading || creditosDisponibles < costoDesbloqueo}
              className="bg-primary"
            >
              {unlockLoading ? (
                "Procesando..."
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Desbloquear por {costoDesbloqueo} créditos
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
