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
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap,
  Link as LinkIcon,
  Calendar,
  DollarSign
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CandidateProfileViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidatoUserId: string;
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
}

export const CandidateProfileViewModal = ({
  open,
  onOpenChange,
  candidatoUserId,
}: CandidateProfileViewModalProps) => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && candidatoUserId) {
      loadProfile();
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

  const formatDisponibilidad = (disp: string | null) => {
    if (!disp) return "No especificada";
    const map: Record<string, string> = {
      inmediata: "Inmediata",
      "2_semanas": "2 semanas",
      "1_mes": "1 mes",
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
            <User className="h-6 w-6" />
            {profile.nombre_completo}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Información de contacto */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
              {profile.telefono && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.telefono}</span>
                </div>
              )}
              {profile.ubicacion && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.ubicacion}</span>
                </div>
              )}
            </div>

            {/* Posición actual */}
            {(profile.puesto_actual || profile.empresa_actual) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Posición Actual
                  </h3>
                  <div className="text-sm space-y-1">
                    {profile.puesto_actual && <p className="font-medium">{profile.puesto_actual}</p>}
                    {profile.empresa_actual && <p className="text-muted-foreground">{profile.empresa_actual}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Resumen profesional */}
            {profile.resumen_profesional && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Resumen Profesional</h3>
                  <p className="text-sm text-muted-foreground">{profile.resumen_profesional}</p>
                </div>
              </>
            )}

            {/* Salario y disponibilidad */}
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(profile.salario_esperado_min || profile.salario_esperado_max) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Expectativa Salarial
                  </div>
                  <p className="text-sm">
                    ${profile.salario_esperado_min?.toLocaleString()} - ${profile.salario_esperado_max?.toLocaleString()}
                  </p>
                </div>
              )}
              {profile.modalidad_preferida && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Modalidad Preferida</p>
                  <Badge variant="secondary" className="capitalize">
                    {profile.modalidad_preferida}
                  </Badge>
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Disponibilidad
                </div>
                <p className="text-sm">{formatDisponibilidad(profile.disponibilidad)}</p>
              </div>
            </div>

            {/* Habilidades técnicas */}
            {profile.habilidades_tecnicas && profile.habilidades_tecnicas.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Habilidades Técnicas</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.habilidades_tecnicas.map((skill, idx) => (
                      <Badge key={idx} variant="default">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Habilidades blandas */}
            {profile.habilidades_blandas && profile.habilidades_blandas.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Habilidades Blandas</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.habilidades_blandas.map((skill, idx) => (
                      <Badge key={idx} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Experiencia laboral */}
            {profile.experiencia_laboral && Array.isArray(profile.experiencia_laboral) && profile.experiencia_laboral.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Experiencia Laboral
                  </h3>
                  {profile.experiencia_laboral.map((exp: any, idx: number) => (
                    <div key={idx} className="space-y-2 pb-4 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{exp.puesto}</p>
                        <p className="text-sm text-muted-foreground">{exp.empresa}</p>
                        <p className="text-xs text-muted-foreground">
                          {exp.fecha_inicio} - {exp.fecha_fin || "Actual"}
                        </p>
                      </div>
                      {exp.descripcion && (
                        <p className="text-sm text-muted-foreground">{exp.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Educación */}
            {profile.educacion && Array.isArray(profile.educacion) && profile.educacion.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Educación
                  </h3>
                  {profile.educacion.map((edu: any, idx: number) => (
                    <div key={idx} className="space-y-1 pb-4 border-b last:border-b-0">
                      <p className="font-medium">{edu.titulo}</p>
                      <p className="text-sm text-muted-foreground">{edu.institucion}</p>
                      <p className="text-xs text-muted-foreground">
                        {edu.tipo} • {edu.fecha_inicio} - {edu.fecha_fin}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Enlaces */}
            {(profile.linkedin_url || profile.github_url || profile.portfolio_url) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Enlaces
                  </h3>
                  <div className="space-y-2">
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-2"
                      >
                        LinkedIn
                      </a>
                    )}
                    {profile.github_url && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-2"
                      >
                        GitHub
                      </a>
                    )}
                    {profile.portfolio_url && (
                      <a
                        href={profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-2"
                      >
                        Portafolio
                      </a>
                    )}
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
