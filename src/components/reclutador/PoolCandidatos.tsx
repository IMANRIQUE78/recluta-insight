import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Eye, Briefcase, MapPin, DollarSign, Calendar, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateProfileViewModal } from "@/components/candidate/CandidateProfileViewModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PoolCandidatosProps {
  reclutadorId: string;
}

interface Candidato {
  user_id: string;
  nombre_completo: string;
  email: string;
  puesto_actual: string | null;
  empresa_actual: string | null;
  ubicacion: string | null;
  habilidades_tecnicas: string[] | null;
  salario_esperado_min: number | null;
  salario_esperado_max: number | null;
  disponibilidad: string | null;
  modalidad_preferida: string | null;
}

export const PoolCandidatos = ({ reclutadorId }: PoolCandidatosProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [selectedCandidatoUserId, setSelectedCandidatoUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [accessReason, setAccessReason] = useState<string>("");

  useEffect(() => {
    checkAccess();
  }, [reclutadorId]);

  const checkAccess = async () => {
    setLoading(true);
    try {
      // Verificar que el reclutador tenga:
      // 1. Asociación activa con alguna empresa
      const { data: asociaciones } = await supabase
        .from("reclutador_empresa")
        .select("*")
        .eq("reclutador_id", reclutadorId)
        .eq("estado", "activa");

      if (!asociaciones || asociaciones.length === 0) {
        setHasAccess(false);
        setAccessReason("No tienes asociaciones activas con empresas");
        setLoading(false);
        return;
      }

      // 2. Vacante asignada y abierta
      const { data: vacantes } = await supabase
        .from("vacantes")
        .select("*")
        .eq("reclutador_asignado_id", reclutadorId)
        .eq("estatus", "abierta");

      if (!vacantes || vacantes.length === 0) {
        setHasAccess(false);
        setAccessReason("No tienes vacantes asignadas y abiertas");
        setLoading(false);
        return;
      }

      // Si pasa las verificaciones, tiene acceso
      setHasAccess(true);
      await loadCandidatos();
    } catch (error: any) {
      console.error("Error checking access:", error);
      setHasAccess(false);
      setAccessReason("Error al verificar acceso");
    } finally {
      setLoading(false);
    }
  };

  const loadCandidatos = async () => {
    try {
      const { data, error } = await supabase
        .from("perfil_candidato")
        .select("*")
        .order("nombre_completo", { ascending: true });

      if (error) throw error;
      setCandidatos(data || []);
    } catch (error: any) {
      toast({
        title: "Error al cargar candidatos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatSalario = (min: number | null, max: number | null) => {
    if (!min && !max) return "No especificado";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `Desde $${min.toLocaleString()}`;
    return `Hasta $${max?.toLocaleString()}`;
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
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-muted-foreground" />
            Pool de Candidatos
          </CardTitle>
          <CardDescription>
            Accede a todos los candidatos registrados en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Acceso Restringido</AlertTitle>
            <AlertDescription>
              <p className="mb-2">{accessReason}</p>
              <p className="text-sm text-muted-foreground">
                Para acceder al pool de candidatos necesitas:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Tener una asociación activa con una empresa</li>
                <li>Tener al menos una vacante asignada y abierta</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                En el futuro, también podrás acceder con un plan de suscripción premium.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Pool de Candidatos
          </CardTitle>
          <CardDescription>
            {candidatos.length} candidatos disponibles en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidatos.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay candidatos registrados en la plataforma
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {candidatos.map((candidato) => (
                <Card key={candidato.user_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{candidato.nombre_completo}</h3>
                          <p className="text-sm text-muted-foreground">{candidato.email}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {candidato.puesto_actual && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {candidato.puesto_actual}
                              {candidato.empresa_actual && ` @ ${candidato.empresa_actual}`}
                            </Badge>
                          )}
                          {candidato.ubicacion && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {candidato.ubicacion}
                            </Badge>
                          )}
                          {candidato.modalidad_preferida && (
                            <Badge variant="outline">
                              {candidato.modalidad_preferida}
                            </Badge>
                          )}
                        </div>

                        {candidato.habilidades_tecnicas && candidato.habilidades_tecnicas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {candidato.habilidades_tecnicas.slice(0, 5).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {candidato.habilidades_tecnicas.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{candidato.habilidades_tecnicas.length - 5} más
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {(candidato.salario_esperado_min || candidato.salario_esperado_max) && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatSalario(candidato.salario_esperado_min, candidato.salario_esperado_max)}
                            </div>
                          )}
                          {candidato.disponibilidad && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDisponibilidad(candidato.disponibilidad)}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedCandidatoUserId(candidato.user_id);
                          setShowProfileModal(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCandidatoUserId && (
        <CandidateProfileViewModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          candidatoUserId={selectedCandidatoUserId}
        />
      )}
    </>
  );
};
