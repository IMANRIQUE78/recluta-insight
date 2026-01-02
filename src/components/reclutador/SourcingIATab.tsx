import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Zap, 
  Users, 
  Target, 
  Coins, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Eye,
  Send
} from "lucide-react";
import { useSourcingIA } from "@/hooks/useSourcingIA";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { CandidateProfileViewModal } from "@/components/candidate/CandidateProfileViewModal";

interface SourcingIATabProps {
  vacanteId: string;
  publicacionId: string;
  tituloPuesto: string;
  reclutadorId: string | null;
}

interface SourcingResult {
  id: string;
  candidato_user_id: string;
  score_match: number;
  razon_match: string;
  habilidades_coincidentes: string[];
  experiencia_relevante: string[];
  estado: string;
  notas_contacto?: string;
  fecha_contacto?: string;
  created_at: string;
  lote_sourcing?: string;
  perfil_candidato?: {
    nombre_completo: string;
    email: string;
    telefono: string;
    ubicacion: string;
    puesto_actual: string;
    empresa_actual: string;
  };
}

const estadoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: <Clock className="h-3 w-3" /> },
  contactado: { label: "Contactado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: <Send className="h-3 w-3" /> },
  interesado: { label: "Interesado", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  no_interesado: { label: "No Interesado", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: <AlertTriangle className="h-3 w-3" /> },
  postulado: { label: "Postulado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: <Users className="h-3 w-3" /> },
  descartado: { label: "Descartado", color: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400", icon: <AlertTriangle className="h-3 w-3" /> },
};

export const SourcingIATab = ({ vacanteId, publicacionId, tituloPuesto, reclutadorId }: SourcingIATabProps) => {
  const { 
    loading, 
    simulando, 
    simularSourcing, 
    obtenerResultadosSourcing, 
    actualizarEstadoSourcing,
    COSTO_SOURCING,
    MAX_CANDIDATOS 
  } = useSourcingIA();

  const [simulacion, setSimulacion] = useState<any>(null);
  const [resultados, setResultados] = useState<SourcingResult[]>([]);
  const [loadingResultados, setLoadingResultados] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notasTemp, setNotasTemp] = useState("");
  const [selectedCandidato, setSelectedCandidato] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (vacanteId) {
      loadResultados();
    }
  }, [vacanteId]);

  const loadResultados = async () => {
    setLoadingResultados(true);
    const data = await obtenerResultadosSourcing(vacanteId);
    setResultados(data);
    setLoadingResultados(false);
  };

  const handleSimular = async () => {
    const result = await simularSourcing(publicacionId);
    if (result) {
      setSimulacion(result);
    }
  };

  const handleCambiarEstado = async (sourcingId: string, nuevoEstado: string) => {
    const success = await actualizarEstadoSourcing(
      sourcingId, 
      nuevoEstado as any,
      editingNotes === sourcingId ? notasTemp : undefined
    );
    if (success) {
      setEditingNotes(null);
      setNotasTemp("");
      loadResultados();
    }
  };

  const handleGuardarNotas = async (sourcingId: string) => {
    const resultado = resultados.find(r => r.id === sourcingId);
    if (resultado) {
      const success = await actualizarEstadoSourcing(sourcingId, resultado.estado as any, notasTemp);
      if (success) {
        setEditingNotes(null);
        setNotasTemp("");
        loadResultados();
      }
    }
  };

  const handleVerPerfil = async (candidatoUserId: string) => {
    try {
      const { data: perfil } = await supabase
        .from('perfil_candidato')
        .select('*')
        .eq('user_id', candidatoUserId)
        .single();
      
      if (perfil) {
        setSelectedCandidato(perfil);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error loading candidate profile:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  // Agrupar resultados por lote
  const lotes = resultados.reduce((acc, r) => {
    const lote = r.lote_sourcing || 'sin-lote';
    if (!acc[lote]) acc[lote] = [];
    acc[lote].push(r);
    return acc;
  }, {} as Record<string, SourcingResult[]>);

  return (
    <div className="space-y-6">
      {/* Header con información del servicio */}
      <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
        <div className="p-3 bg-primary/20 rounded-lg">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Sourcing con IA
            <Badge variant="secondary" className="text-xs">Premium</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            La IA analiza el pool de candidatos y encuentra los {MAX_CANDIDATOS} mejores matches para tu vacante.
            <strong className="text-foreground"> Las identidades se desbloquean automáticamente.</strong>
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{COSTO_SOURCING} créditos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-500" />
              <span>{MAX_CANDIDATOS} candidatos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-green-500" />
              <span>Match inteligente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de simulación */}
      {resultados.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Probar antes de ejecutar
            </CardTitle>
            <CardDescription>
              Simula el sourcing para ver cuántos candidatos están disponibles sin gastar créditos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!simulacion ? (
              <Button 
                onClick={handleSimular} 
                disabled={simulando}
                variant="outline"
                className="w-full"
              >
                {simulando ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Simular Sourcing (Gratis)
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Simulación completada</AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Candidatos disponibles:</span>
                        <p className="font-semibold text-lg">{simulacion.candidatos_disponibles}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Se analizarán:</span>
                        <p className="font-semibold text-lg">{simulacion.candidatos_a_analizar}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Costo:</span>
                        <p className="font-semibold text-lg">{simulacion.costo_creditos} créditos</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tus créditos:</span>
                        <p className="font-semibold text-lg">{simulacion.creditos_disponibles}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {simulacion.creditos_disponibles >= simulacion.costo_creditos ? (
                  <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Modo desarrollo</AlertTitle>
                    <AlertDescription>
                      El botón de ejecución está deshabilitado para evitar consumo de créditos durante pruebas. 
                      Se habilitará cuando termines la fase de producción.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Créditos insuficientes</AlertTitle>
                    <AlertDescription>
                      Necesitas {simulacion.costo_creditos} créditos pero solo tienes {simulacion.creditos_disponibles}.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSimular}
                    variant="outline"
                    size="sm"
                    disabled={simulando}
                  >
                    Volver a simular
                  </Button>
                  
                  {/* Botón deshabilitado durante desarrollo */}
                  <Button 
                    disabled={true}
                    className="flex-1 opacity-50"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ejecutar Sourcing ({COSTO_SOURCING} créditos)
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultados existentes */}
      {loadingResultados ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : resultados.length > 0 ? (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resultados.length}</p>
                  <p className="text-xs text-muted-foreground">Encontrados</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resultados.filter(r => r.estado === 'pendiente').length}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resultados.filter(r => r.estado === 'interesado').length}</p>
                  <p className="text-xs text-muted-foreground">Interesados</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Send className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resultados.filter(r => r.estado === 'contactado').length}</p>
                  <p className="text-xs text-muted-foreground">Contactados</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Lista de candidatos */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              Candidatos encontrados por IA
            </h4>
            
            {resultados.map((resultado) => {
              const isExpanded = expandedCard === resultado.id;
              const estado = estadoConfig[resultado.estado] || estadoConfig.pendiente;
              
              return (
                <Card 
                  key={resultado.id} 
                  className={cn(
                    "transition-all duration-200",
                    isExpanded && "ring-2 ring-primary/20"
                  )}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedCard(isExpanded ? null : resultado.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Info principal */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Score circular */}
                        <div className="relative">
                          <div className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center",
                            "bg-gradient-to-br from-primary/20 to-primary/5 border-2",
                            resultado.score_match >= 80 ? "border-green-500" : 
                            resultado.score_match >= 60 ? "border-yellow-500" : "border-orange-500"
                          )}>
                            <span className={cn("text-lg font-bold", getScoreColor(resultado.score_match))}>
                              {resultado.score_match}%
                            </span>
                          </div>
                        </div>

                        {/* Datos del candidato */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-semibold truncate">
                              {resultado.perfil_candidato?.nombre_completo || "Candidato"}
                            </h5>
                            <Badge className={cn("text-xs", estado.color)}>
                              {estado.icon}
                              <span className="ml-1">{estado.label}</span>
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                            {resultado.perfil_candidato?.puesto_actual && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {resultado.perfil_candidato.puesto_actual}
                              </span>
                            )}
                            {resultado.perfil_candidato?.ubicacion && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {resultado.perfil_candidato.ubicacion}
                              </span>
                            )}
                          </div>

                          {/* Habilidades coincidentes */}
                          {resultado.habilidades_coincidentes?.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {resultado.habilidades_coincidentes.slice(0, 3).map((hab, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-primary/5">
                                  {hab}
                                </Badge>
                              ))}
                              {resultado.habilidades_coincidentes.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{resultado.habilidades_coincidentes.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acciones y chevron */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerPerfil(resultado.candidato_user_id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver perfil
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t pt-4 space-y-4">
                      {/* Razón del match */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">¿Por qué este candidato?</p>
                        <p className="text-sm text-muted-foreground">{resultado.razon_match}</p>
                      </div>

                      {/* Datos de contacto */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{resultado.perfil_candidato?.email || "No disponible"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{resultado.perfil_candidato?.telefono || "No disponible"}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Gestión de estado */}
                      <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-medium">Estado del contacto</label>
                          <Select 
                            value={resultado.estado}
                            onValueChange={(value) => handleCambiarEstado(resultado.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(estadoConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <span className="flex items-center gap-2">
                                    {config.icon}
                                    {config.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Notas de seguimiento
                          </label>
                          {editingNotes === resultado.id ? (
                            <div className="flex gap-2">
                              <Textarea 
                                value={notasTemp}
                                onChange={(e) => setNotasTemp(e.target.value)}
                                placeholder="Agrega notas sobre el contacto..."
                                className="text-sm"
                                rows={2}
                              />
                              <div className="flex flex-col gap-1">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleGuardarNotas(resultado.id)}
                                >
                                  Guardar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingNotes(null);
                                    setNotasTemp("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="p-2 border rounded-md text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 min-h-[60px]"
                              onClick={() => {
                                setEditingNotes(resultado.id);
                                setNotasTemp(resultado.notas_contacto || "");
                              }}
                            >
                              {resultado.notas_contacto || "Clic para agregar notas..."}
                            </div>
                          )}
                        </div>
                      </div>

                      {resultado.fecha_contacto && (
                        <p className="text-xs text-muted-foreground">
                          Último contacto: {format(new Date(resultado.fecha_contacto), "PPp", { locale: es })}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Botón para nuevo sourcing */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">¿Necesitas más candidatos?</p>
                <p className="text-sm text-muted-foreground">
                  Ejecuta otro sourcing para encontrar candidatos adicionales
                </p>
              </div>
              <Button variant="outline" onClick={handleSimular} disabled={simulando}>
                <Zap className="mr-2 h-4 w-4" />
                Simular nuevo sourcing
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aún no has ejecutado sourcing IA</p>
          <p className="text-sm">Simula primero para ver los candidatos disponibles</p>
        </div>
      )}

      {/* Modal de perfil */}
      {selectedCandidato && (
        <CandidateProfileViewModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          candidatoUserId={selectedCandidato.user_id}
          reclutadorId={reclutadorId || undefined}
          hasFullAccess={true} // Ya desbloqueado por sourcing
          allowUnlock={false}
        />
      )}
    </div>
  );
};
