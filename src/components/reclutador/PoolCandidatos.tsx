import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Eye, Briefcase, MapPin, DollarSign, Calendar, Lock, Search, X, Filter, Coins } from "lucide-react";
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
  resumen_profesional: string | null;
}

const truncateToWords = (text: string | null, wordCount: number): string => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(" ") + "...";
};

export const PoolCandidatos = ({ reclutadorId }: PoolCandidatosProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [filteredCandidatos, setFilteredCandidatos] = useState<Candidato[]>([]);
  const [selectedCandidatoUserId, setSelectedCandidatoUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [accessReason, setAccessReason] = useState<string>("");
  const [creditosDisponibles, setCreditosDisponibles] = useState<number>(0);
  const [empresaActiva, setEmpresaActiva] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [educacionFilter, setEducacionFilter] = useState<string>("all");
  const [experienciaFilter, setExperienciaFilter] = useState<string>("all");
  const [habilidadFilter, setHabilidadFilter] = useState<string>("all");
  const [allHabilidades, setAllHabilidades] = useState<string[]>([]);

  useEffect(() => {
    checkAccess();
  }, [reclutadorId]);

  const checkAccess = async () => {
    setLoading(true);
    try {
      // Obtener créditos disponibles del reclutador
      const { data: wallet } = await supabase
        .from("wallet_reclutador")
        .select("creditos_propios, creditos_heredados")
        .eq("reclutador_id", reclutadorId)
        .maybeSingle();

      const totalCreditos = (wallet?.creditos_propios || 0) + (wallet?.creditos_heredados || 0);
      setCreditosDisponibles(totalCreditos);

      // Obtener empresa activa (para usar créditos heredados si aplica)
      const { data: asociacion } = await supabase
        .from("reclutador_empresa")
        .select("empresa_id")
        .eq("reclutador_id", reclutadorId)
        .eq("estado", "activa")
        .limit(1)
        .maybeSingle();

      setEmpresaActiva(asociacion?.empresa_id || null);

      // Nuevo criterio: tiene acceso si tiene al menos 2 créditos
      if (totalCreditos >= 2) {
        setHasAccess(true);
        await loadCandidatos();
      } else {
        setHasAccess(false);
        setAccessReason("Necesitas al menos 2 créditos para acceder al pool de candidatos");
      }
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

    // Filtro de búsqueda por puesto (sin nombre para privacidad)
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.puesto_actual?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.habilidades_tecnicas?.some(h => h.toLowerCase().includes(searchTerm.toLowerCase()))
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
        
        const yearsOfExperience = experiencias.length;
        
        if (experienciaFilter === "0-2") return yearsOfExperience <= 2;
        if (experienciaFilter === "3-5") return yearsOfExperience >= 3 && yearsOfExperience <= 5;
        if (experienciaFilter === "6+") return yearsOfExperience >= 6;
        return true;
      });
    }

    // Filtro por habilidad
    if (habilidadFilter && habilidadFilter !== "all") {
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
    setHabilidadFilter("all");
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

  const handleRefreshCredits = () => {
    checkAccess();
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
            <Coins className="h-4 w-4" />
            <AlertTitle>Créditos Insuficientes</AlertTitle>
            <AlertDescription>
              <p className="mb-2">{accessReason}</p>
              <p className="text-sm text-muted-foreground">
                Actualmente tienes <strong>{creditosDisponibles} créditos</strong>.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Navegar el pool de candidatos requiere al menos 2 créditos</li>
                <li>Desbloquear la identidad de un candidato cuesta 2 créditos</li>
                <li>Compra créditos desde tu wallet para acceder</li>
              </ul>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Pool de Candidatos
                </CardTitle>
                <CardDescription>
                  {filteredCandidatos.length} de {candidatos.length} candidatos disponibles
                </CardDescription>
              </div>
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                <Coins className="h-4 w-4" />
                {creditosDisponibles} créditos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info de costos */}
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
              <Coins className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Costo de desbloqueo:</strong> Ver los datos de contacto e identidad de un candidato cuesta 2 créditos. 
                La experiencia, habilidades y perfil profesional están disponibles sin costo.
              </AlertDescription>
            </Alert>

            {/* Filtros */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros de Búsqueda
                </h3>
                {(searchTerm || educacionFilter !== "all" || experienciaFilter !== "all" || habilidadFilter !== "all") && (
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
                    placeholder="Buscar por puesto o habilidad..."
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
                    <SelectItem value="all">Todas las habilidades</SelectItem>
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
                            {/* No mostrar nombre, solo indicador */}
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              Candidato
                            </h3>
                            {candidato.puesto_actual && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {candidato.puesto_actual}
                              </p>
                            )}
                            {candidato.resumen_profesional && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {truncateToWords(candidato.resumen_profesional, 40)}
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
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatSalario(candidato.salario_esperado_min, candidato.salario_esperado_max)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDisponibilidad(candidato.disponibilidad)}
                          </span>
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

      {/* Modal de perfil con soporte para desbloqueo */}
      {selectedCandidatoUserId && (
        <CandidateProfileViewModal
          open={showProfileModal}
          onOpenChange={(open) => {
            setShowProfileModal(open);
            if (!open) {
              setSelectedCandidatoUserId(null);
              // Refrescar créditos al cerrar
              handleRefreshCredits();
            }
          }}
          candidatoUserId={selectedCandidatoUserId}
          hasFullAccess={false}
          reclutadorId={reclutadorId}
          empresaId={empresaActiva}
          allowUnlock={true}
        />
      )}
    </>
  );
};
