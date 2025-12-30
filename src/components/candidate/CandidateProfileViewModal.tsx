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
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";

interface CandidateProfileViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidatoUserId: string;
  hasFullAccess?: boolean; // true si el candidato se postuló a una vacante del reclutador o si tiene plan de pago
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
}: CandidateProfileViewModalProps) => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [estudios, setEstudios] = useState<EstudioSocioeconomico[]>([]);

  useEffect(() => {
    if (open && candidatoUserId) {
      loadProfile();
      loadEstudios();
    }
  }, [open, candidatoUserId]);

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
      // Solo cargar estudios entregados de los últimos 6 meses
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

  // Verificar si un estudio es visible (dentro de 6 meses desde su entrega)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            {hasFullAccess ? profile.nombre_completo : "Candidato"}
            {!hasFullAccess && (
              <Badge variant="outline" className="ml-2 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Identidad restringida
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            
            {/* ============================================ */}
            {/* SECCIÓN RESTRINGIDA: DATOS DE IDENTIDAD Y CONTACTO */}
            {/* ============================================ */}
            <div className={`rounded-xl p-5 space-y-4 ${
              hasFullAccess 
                ? 'border bg-muted/30' 
                : 'border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${hasFullAccess ? 'bg-primary/10' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                  <Shield className={`h-5 w-5 ${hasFullAccess ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Datos de Identidad y Contacto
                    {!hasFullAccess && (
                      <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                        <Lock className="h-3 w-3 mr-1" />
                        Sección Protegida
                      </Badge>
                    )}
                  </h3>
                  {!hasFullAccess && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Esta información está restringida. Podrás verla cuando el candidato se postule a una de tus vacantes o con un plan de pago activo.
                    </p>
                  )}
                </div>
              </div>

              {!hasFullAccess && (
                <Alert className="bg-amber-100/50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                    <strong>Acceso restringido:</strong> Para ver los datos de contacto de este candidato, necesitas un plan de pago activo o esperar a que el candidato se postule a una de tus vacantes publicadas.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre Completo</p>
                    <p className="font-medium">
                      {hasFullAccess ? profile.nombre_completo : (
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
                      {hasFullAccess ? profile.email : (
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
                      {hasFullAccess ? (profile.telefono || "No especificado") : (
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
                      {hasFullAccess ? (profile.ubicacion || "No especificada") : (
                        <span className="text-muted-foreground italic flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Ciudad oculta
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
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
                          {exp.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exp.tags.split(',').map((tag: string, tagIdx: number) => (
                                <Badge key={tagIdx} variant="secondary" className="text-xs">
                                  {tag.trim()}
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
                    Educación y Certificaciones
                  </h3>
                  <div className="space-y-4">
                    {profile.educacion.map((edu: any, idx: number) => (
                      <div key={idx} className="relative pl-6 pb-4 border-l-2 border-primary/30 last:pb-0">
                        <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{edu.titulo}</p>
                            {edu.tipo && (
                              <Badge variant="outline" className="text-xs">{edu.tipo}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{edu.institucion}</p>
                          <p className="text-xs text-muted-foreground">
                            {edu.fecha_inicio} - {edu.fecha_fin || "En curso"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Enlaces Profesionales */}
            {(profile.linkedin_url || profile.github_url || profile.portfolio_url) && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-primary" />
                  Enlaces Profesionales
                </h3>
                <div className="flex flex-wrap gap-3">
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5]/10 text-[#0077b5] rounded-lg hover:bg-[#0077b5]/20 transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition-colors"
                    >
                      GitHub
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      Portafolio
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* SECCIÓN: ESTUDIOS SOCIOECONÓMICOS (visibilidad 6 meses) */}
            {/* ============================================ */}
            {hasFullAccess && estudios.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileSearch className="h-5 w-5 text-primary" />
                    Estudios Socioeconómicos
                    <Badge variant="secondary" className="ml-2">{estudios.length}</Badge>
                  </h3>
                  
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                      Los estudios socioeconómicos son visibles durante 6 meses desde su fecha de entrega.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {estudios.filter(e => e.fecha_entrega && isEstudioVisible(e.fecha_entrega)).map((estudio) => {
                      const riesgoInfo = estudio.calificacion_riesgo ? riesgoConfig[estudio.calificacion_riesgo] : null;
                      
                      return (
                        <Card key={estudio.id} className="border-primary/20">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-sm font-mono text-muted-foreground">
                                  {estudio.folio}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Entregado
                                  </Badge>
                                  {riesgoInfo && (
                                    <Badge className={riesgoInfo.color}>
                                      Riesgo {riesgoInfo.label}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {estudio.fecha_entrega && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(estudio.fecha_entrega), "dd MMM yyyy", { locale: es })}
                                </span>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {/* Resultado General */}
                            {estudio.resultado_general && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Resultado General</p>
                                <p className="font-medium capitalize">{estudio.resultado_general.replace(/_/g, ' ')}</p>
                              </div>
                            )}

                            {/* Datos Sociodemográficos */}
                            {estudio.datos_sociodemograficos && Object.keys(estudio.datos_sociodemograficos).length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {estudio.datos_sociodemograficos.estado_civil && (
                                  <div className="p-2 bg-muted/30 rounded">
                                    <p className="text-xs text-muted-foreground">Estado Civil</p>
                                    <p className="font-medium text-sm">{estudio.datos_sociodemograficos.estado_civil}</p>
                                  </div>
                                )}
                                {estudio.datos_sociodemograficos.numero_dependientes && (
                                  <div className="p-2 bg-muted/30 rounded">
                                    <p className="text-xs text-muted-foreground">Dependientes</p>
                                    <p className="font-medium text-sm">{estudio.datos_sociodemograficos.numero_dependientes}</p>
                                  </div>
                                )}
                                {estudio.datos_sociodemograficos.escolaridad && (
                                  <div className="p-2 bg-muted/30 rounded col-span-2">
                                    <p className="text-xs text-muted-foreground">Escolaridad Verificada</p>
                                    <p className="font-medium text-sm">{estudio.datos_sociodemograficos.escolaridad}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Datos de Vivienda */}
                            {estudio.datos_vivienda && Object.keys(estudio.datos_vivienda).length > 0 && (
                              <div className="p-3 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Home className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-sm">Vivienda</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {estudio.datos_vivienda.tipo_vivienda && (
                                    <div>
                                      <span className="text-muted-foreground">Tipo:</span>{' '}
                                      <span>{estudio.datos_vivienda.tipo_vivienda}</span>
                                    </div>
                                  )}
                                  {estudio.datos_vivienda.propiedad_vivienda && (
                                    <div>
                                      <span className="text-muted-foreground">Propiedad:</span>{' '}
                                      <span>{estudio.datos_vivienda.propiedad_vivienda}</span>
                                    </div>
                                  )}
                                  {estudio.datos_vivienda.estado_vivienda && (
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Estado:</span>{' '}
                                      <span>{estudio.datos_vivienda.estado_vivienda}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Datos Económicos */}
                            {estudio.datos_economicos && Object.keys(estudio.datos_economicos).length > 0 && (
                              <div className="p-3 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <DollarSign className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-sm">Datos Económicos</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {estudio.datos_economicos.ingreso_mensual && (
                                    <div>
                                      <span className="text-muted-foreground">Ingreso:</span>{' '}
                                      <span>{estudio.datos_economicos.ingreso_mensual}</span>
                                    </div>
                                  )}
                                  {estudio.datos_economicos.gastos_mensuales && (
                                    <div>
                                      <span className="text-muted-foreground">Gastos:</span>{' '}
                                      <span>{estudio.datos_economicos.gastos_mensuales}</span>
                                    </div>
                                  )}
                                  {estudio.datos_economicos.vehiculo_propio && (
                                    <div>
                                      <span className="text-muted-foreground">Vehículo:</span>{' '}
                                      <span>{estudio.datos_economicos.vehiculo_propio}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Observaciones Finales */}
                            {estudio.observaciones_finales && (
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Observaciones del Verificador</p>
                                <p className="text-sm">{estudio.observaciones_finales}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
