import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Eye, Briefcase, DollarSign, Calendar, Lock, Search, X, Filter, Coins, AlertCircle } from "lucide-react";
import { CandidateProfileViewModal } from "@/components/candidate/CandidateProfileViewModal";

// ─── Constantes ───────────────────────────────────────────────────────────────
const CREDITOS_MINIMOS = 2;

// ─── Helpers de seguridad ─────────────────────────────────────────────────────
const sanitizeText = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.replace(/[<>{}\[\]\\;`'"&|$^%*=+~]/g, "").trim();
};

const sanitizeSearch = (value: string): string =>
  value
    .replace(/[<>{}\[\]\\;`'"&|$^%*=+~]/g, "")
    .trim()
    .slice(0, 100);

const truncateToWords = (text: string | null, wordCount: number): string => {
  if (!text) return "";
  const sanitized = sanitizeText(text);
  const words = sanitized.trim().split(/\s+/);
  if (words.length <= wordCount) return sanitized;
  return words.slice(0, wordCount).join(" ") + "...";
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface PoolCandidatosProps {
  reclutadorId: string;
}

interface Candidato {
  user_id: string;
  puesto_actual: string | null;
  resumen_profesional: string | null;
  habilidades_tecnicas: string[] | null;
  habilidades_blandas: string[] | null;
  salario_esperado_min: number | null;
  salario_esperado_max: number | null;
  disponibilidad: string | null;
  modalidad_preferida: string | null;
  nivel_educacion: string | null;
  experiencia_laboral: any;
}

// ─── Helpers de formato ───────────────────────────────────────────────────────
const formatSalario = (min: number | null, max: number | null): string => {
  if (!min && !max) return "No especificado";
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `Desde $${min.toLocaleString()}`;
  return `Hasta $${max!.toLocaleString()}`;
};

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

// ─── Componente principal ─────────────────────────────────────────────────────
export const PoolCandidatos = ({ reclutadorId }: PoolCandidatosProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState(false);
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

  // ── Cargar candidatos — solo columnas públicas, sin datos de identidad ────────
  const loadCandidatos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("perfil_candidato")
        // String literal inline — necesario para que TypeScript infiera los tipos.
        // Una constante externa produce GenericStringError porque TS no puede
        // analizar el contenido en tiempo de compilación.
        .select(
          "user_id, puesto_actual, resumen_profesional, habilidades_tecnicas, habilidades_blandas, salario_esperado_min, salario_esperado_max, disponibilidad, modalidad_preferida, nivel_educacion, experiencia_laboral",
        )
        .order("puesto_actual", { ascending: true });

      if (error) throw error;

      const candidatosSanitizados: Candidato[] = (data || []).map((c) => ({
        user_id: c.user_id,
        puesto_actual: sanitizeText(c.puesto_actual),
        resumen_profesional: sanitizeText(c.resumen_profesional),
        habilidades_tecnicas: (c.habilidades_tecnicas || []).map(sanitizeText).filter(Boolean),
        habilidades_blandas: (c.habilidades_blandas || []).map(sanitizeText).filter(Boolean),
        salario_esperado_min: typeof c.salario_esperado_min === "number" ? c.salario_esperado_min : null,
        salario_esperado_max: typeof c.salario_esperado_max === "number" ? c.salario_esperado_max : null,
        disponibilidad: c.disponibilidad,
        modalidad_preferida: sanitizeText(c.modalidad_preferida),
        nivel_educacion: sanitizeText(c.nivel_educacion),
        experiencia_laboral: c.experiencia_laboral,
      }));

      setCandidatos(candidatosSanitizados);
      setFilteredCandidatos(candidatosSanitizados);

      // Extraer habilidades únicas sanitizadas
      const habilidadesSet = new Set<string>();
      candidatosSanitizados.forEach((c) => {
        c.habilidades_tecnicas?.forEach((h) => h && habilidadesSet.add(h));
        c.habilidades_blandas?.forEach((h) => h && habilidadesSet.add(h));
      });
      setAllHabilidades(Array.from(habilidadesSet).sort());
    } catch (error: any) {
      console.error("Error cargando candidatos:", error.message);
      toast({
        title: "Error al cargar candidatos",
        description: "No se pudieron cargar los candidatos. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // ── Verificar acceso por créditos ─────────────────────────────────────────────
  const checkAccess = useCallback(async () => {
    setLoading(true);
    setAccessError(false);
    try {
      const { data: wallet } = await supabase
        .from("wallet_reclutador")
        .select("creditos_propios, creditos_heredados")
        .eq("reclutador_id", reclutadorId)
        .maybeSingle();

      const totalCreditos = (wallet?.creditos_propios || 0) + (wallet?.creditos_heredados || 0);
      setCreditosDisponibles(totalCreditos);

      const { data: asociacion } = await supabase
        .from("reclutador_empresa")
        .select("empresa_id")
        .eq("reclutador_id", reclutadorId)
        .eq("estado", "activa")
        .limit(1)
        .maybeSingle();

      setEmpresaActiva(asociacion?.empresa_id || null);

      if (totalCreditos >= CREDITOS_MINIMOS) {
        setHasAccess(true);
        await loadCandidatos();
      } else {
        setHasAccess(false);
        setAccessReason(`Necesitas al menos ${CREDITOS_MINIMOS} créditos para acceder al pool de candidatos`);
      }
    } catch (error: any) {
      console.error("Error verificando acceso:", error.message);
      setHasAccess(false);
      setAccessError(true);
      setAccessReason("Error al verificar acceso");
    } finally {
      setLoading(false);
    }
  }, [reclutadorId, loadCandidatos]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // ── Aplicar filtros ───────────────────────────────────────────────────────────
  useEffect(() => {
    const termLower = sanitizeSearch(searchTerm).toLowerCase();
    let filtered = [...candidatos];

    if (termLower) {
      filtered = filtered.filter(
        (c) =>
          c.puesto_actual?.toLowerCase().includes(termLower) ||
          c.habilidades_tecnicas?.some((h) => h.toLowerCase().includes(termLower)),
      );
    }

    if (educacionFilter !== "all") {
      filtered = filtered.filter((c) => c.nivel_educacion === educacionFilter);
    }

    if (experienciaFilter !== "all") {
      filtered = filtered.filter((c) => {
        const exp = c.experiencia_laboral;
        if (!Array.isArray(exp)) return false;
        const count = exp.length;
        if (experienciaFilter === "0-2") return count <= 2;
        if (experienciaFilter === "3-5") return count >= 3 && count <= 5;
        if (experienciaFilter === "6+") return count >= 6;
        return true;
      });
    }

    if (habilidadFilter && habilidadFilter !== "all") {
      filtered = filtered.filter(
        (c) => c.habilidades_tecnicas?.includes(habilidadFilter) || c.habilidades_blandas?.includes(habilidadFilter),
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

  const hayFiltrosActivos =
    searchTerm || educacionFilter !== "all" || experienciaFilter !== "all" || habilidadFilter !== "all";

  // ── Estado: cargando ──────────────────────────────────────────────────────────
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

  // ── Estado: error de acceso ───────────────────────────────────────────────────
  if (accessError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-muted-foreground" />
            Pool de Candidatos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de verificación</AlertTitle>
            <AlertDescription>
              No se pudo verificar tu acceso.{" "}
              <button type="button" className="underline font-medium" onClick={checkAccess}>
                Intentar de nuevo
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ── Estado: sin acceso ────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-muted-foreground" />
            Pool de Candidatos
          </CardTitle>
          <CardDescription>Accede a todos los candidatos registrados en la plataforma</CardDescription>
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
                <li>Navegar el pool requiere al menos {CREDITOS_MINIMOS} créditos</li>
                <li>Desbloquear la identidad de un candidato cuesta {CREDITOS_MINIMOS} créditos</li>
                <li>Compra créditos desde tu wallet para acceder</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────────
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
                <strong>Costo de desbloqueo:</strong> Ver los datos de contacto e identidad de un candidato cuesta{" "}
                {CREDITOS_MINIMOS} créditos. La experiencia, habilidades y perfil profesional están disponibles sin
                costo adicional.
              </AlertDescription>
            </Alert>

            {/* Filtros */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros de Búsqueda
                </h3>
                {hayFiltrosActivos && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por puesto o habilidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    maxLength={100}
                    className="pl-9"
                  />
                </div>

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
                    : "No se encontraron candidatos con los filtros seleccionados"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCandidatos.map((candidato) => (
                  <Card key={candidato.user_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1 min-w-0">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                              Candidato
                            </h3>
                            {candidato.puesto_actual && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3 shrink-0" />
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
                            className="shrink-0 ml-2"
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
                          {candidato.nivel_educacion && <Badge variant="outline">{candidato.nivel_educacion}</Badge>}
                        </div>

                        {candidato.habilidades_tecnicas && candidato.habilidades_tecnicas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {candidato.habilidades_tecnicas.slice(0, 4).map((skill) => (
                              <Badge key={skill} variant="default" className="text-xs">
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
              checkAccess(); // Refrescar créditos al cerrar
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
