import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Eye, Briefcase, MapPin, DollarSign, Calendar, Lock, Search, X, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateProfileViewModal } from "@/components/candidate/CandidateProfileViewModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  habilidades_blandas: string[] | null;
  salario_esperado_min: number | null;
  salario_esperado_max: number | null;
  disponibilidad: string | null;
  modalidad_preferida: string | null;
  nivel_educacion: string | null;
  experiencia_laboral: any;
}

export const PoolCandidatos = ({ reclutadorId }: PoolCandidatosProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [filteredCandidatos, setFilteredCandidatos] = useState<Candidato[]>([]);
  const [selectedCandidatoUserId, setSelectedCandidatoUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [accessReason, setAccessReason] = useState<string>("");
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [educacionFilter, setEducacionFilter] = useState<string>("all");
  const [experienciaFilter, setExperienciaFilter] = useState<string>("all");
  const [habilidadFilter, setHabilidadFilter] = useState<string>("");
  const [allHabilidades, setAllHabilidades] = useState<string[]>([]);

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
      setFilteredCandidatos(data || []);
      
      // Extraer todas las habilidades únicas
      const habilidadesSet = new Set<string>();
      data?.forEach((candidato) => {
        candidato.habilidades_tecnicas?.forEach((hab: string) => habilidadesSet.add(hab));
        candidato.habilidades_blandas?.forEach((hab: string) => habilidadesSet.add(hab));
      });
      setAllHabilidades(Array.from(habilidadesSet).sort());
    } catch (error: any) {
      toast({
        title: "Error al cargar candidatos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...candidatos];

    // Filtro de búsqueda por nombre o puesto
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.puesto_actual?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por educación
    if (educacionFilter !== "all") {
      filtered = filtered.filter(c => c.nivel_educacion === educacionFilter);
    }

    // Filtro por experiencia
    if (experienciaFilter !== "all") {
      filtered = filtered.filter(c => {
        const experiencias = c.experiencia_laboral;
        if (!Array.isArray(experiencias)) return false;
        
        const yearsOfExperience = experiencias.length; // Simplificado
        
        if (experienciaFilter === "0-2") return yearsOfExperience <= 2;
        if (experienciaFilter === "3-5") return yearsOfExperience >= 3 && yearsOfExperience <= 5;
        if (experienciaFilter === "6+") return yearsOfExperience >= 6;
        return true;
      });
    }

    // Filtro por habilidad
    if (habilidadFilter) {
      filtered = filtered.filter(c => 
        c.habilidades_tecnicas?.includes(habilidadFilter) ||
        c.habilidades_blandas?.includes(habilidadFilter)
      );
    }

    setFilteredCandidatos(filtered);
  }, [candidatos, searchTerm, educacionFilter, experienciaFilter, habilidadFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setEducacionFilter("all");
    setExperienciaFilter("all");
    setHabilidadFilter("");
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Pool de Candidatos
            </CardTitle>
            <CardDescription>
              {filteredCandidatos.length} de {candidatos.length} candidatos disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filtros */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros de Búsqueda
                </h3>
                {(searchTerm || educacionFilter !== "all" || experienciaFilter !== "all" || habilidadFilter) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda por texto */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o puesto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filtro por Educación */}
                <Select value={educacionFilter} onValueChange={setEducacionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nivel de Educación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las educaciones</SelectItem>
                    <SelectItem value="Secundaria">Secundaria</SelectItem>
                    <SelectItem value="Preparatoria">Preparatoria</SelectItem>
                    <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                    <SelectItem value="Maestría">Maestría</SelectItem>
                    <SelectItem value="Doctorado">Doctorado</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro por Experiencia */}
                <Select value={experienciaFilter} onValueChange={setExperienciaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Años de Experiencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda la experiencia</SelectItem>
                    <SelectItem value="0-2">0-2 años</SelectItem>
                    <SelectItem value="3-5">3-5 años</SelectItem>
                    <SelectItem value="6+">6+ años</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro por Habilidad */}
                <Select value={habilidadFilter} onValueChange={setHabilidadFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Habilidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las habilidades</SelectItem>
                    {allHabilidades.slice(0, 50).map((hab) => (
                      <SelectItem key={hab} value={hab}>
                        #{hab}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resultados */}
            {filteredCandidatos.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {candidatos.length === 0 
                    ? "No hay candidatos registrados en la plataforma"
                    : "No se encontraron candidatos con los filtros seleccionados"
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCandidatos.map((candidato) => (
                  <Card key={candidato.user_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-lg">{candidato.nombre_completo}</h3>
                            {candidato.puesto_actual && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {candidato.puesto_actual}
                                {candidato.empresa_actual && ` @ ${candidato.empresa_actual}`}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedCandidatoUserId(candidato.user_id);
                              setShowProfileModal(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {candidato.ubicacion && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {candidato.ubicacion}
                            </Badge>
                          )}
                          {candidato.modalidad_preferida && (
                            <Badge variant="secondary" className="capitalize">
                              {candidato.modalidad_preferida}
                            </Badge>
                          )}
                          {candidato.nivel_educacion && (
                            <Badge variant="outline">
                              {candidato.nivel_educacion}
                            </Badge>
                          )}
                        </div>

                        {candidato.habilidades_tecnicas && candidato.habilidades_tecnicas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {candidato.habilidades_tecnicas.slice(0, 4).map((skill, idx) => (
                              <Badge key={idx} variant="default" className="text-xs">
                                #{skill}
                              </Badge>
                            ))}
                            {candidato.habilidades_tecnicas.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{candidato.habilidades_tecnicas.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          {(candidato.salario_esperado_min || candidato.salario_esperado_max) && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatSalario(candidato.salario_esperado_min, candidato.salario_esperado_max)}
                            </div>
                          )}
                          {candidato.disponibilidad && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDisponibilidad(candidato.disponibilidad)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedCandidatoUserId && (
        <CandidateProfileViewModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          candidatoUserId={selectedCandidatoUserId}
          hasFullAccess={hasAccess}
        />
      )}
    </>
  );
};
