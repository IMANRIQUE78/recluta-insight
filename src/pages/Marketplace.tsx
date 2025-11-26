import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VacantePublicaCard } from "@/components/marketplace/VacantePublicaCard";
import { VacantePublicaDetailModal } from "@/components/marketplace/VacantePublicaDetailModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, SlidersHorizontal, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import vvgiLogo from "@/assets/vvgi-logo.png";

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [filteredPublicaciones, setFilteredPublicaciones] = useState<any[]>([]);
  const [selectedPublicacion, setSelectedPublicacion] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [modalidadFilter, setModalidadFilter] = useState<string>("todas");
  const [ubicacionFilter, setUbicacionFilter] = useState<string>("todas");
  const [salarioMin, setSalarioMin] = useState<string>("");
  const [salarioMax, setSalarioMax] = useState<string>("");
  
  // Para opciones de ubicación disponibles
  const [ubicacionesDisponibles, setUbicacionesDisponibles] = useState<string[]>([]);

  useEffect(() => {
    loadPublicaciones();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, publicaciones, modalidadFilter, ubicacionFilter, salarioMin, salarioMax]);

  // Detectar parámetro de URL para abrir modal automáticamente
  useEffect(() => {
    const vacanteId = searchParams.get('vacante');
    if (vacanteId && publicaciones.length > 0) {
      const publicacion = publicaciones.find(p => p.id === vacanteId);
      if (publicacion) {
        setSelectedPublicacion(publicacion);
        // Limpiar el parámetro después de abrir
        setSearchParams({});
      }
    }
  }, [searchParams, publicaciones]);

  const applyFilters = () => {
    let filtered = [...publicaciones];

    // Filtro de búsqueda por texto
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((pub) =>
        pub.titulo_puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.cliente_area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.perfil_requerido?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de modalidad
    if (modalidadFilter !== "todas") {
      filtered = filtered.filter((pub) => pub.lugar_trabajo === modalidadFilter);
    }

    // Filtro de ubicación
    if (ubicacionFilter !== "todas") {
      filtered = filtered.filter((pub) => pub.ubicacion === ubicacionFilter);
    }

    // Filtro de salario mínimo
    if (salarioMin) {
      const minSalary = parseFloat(salarioMin);
      filtered = filtered.filter((pub) => 
        pub.sueldo_bruto_aprobado && pub.sueldo_bruto_aprobado >= minSalary
      );
    }

    // Filtro de salario máximo
    if (salarioMax) {
      const maxSalary = parseFloat(salarioMax);
      filtered = filtered.filter((pub) => 
        pub.sueldo_bruto_aprobado && pub.sueldo_bruto_aprobado <= maxSalary
      );
    }

    setFilteredPublicaciones(filtered);
  };

  const loadPublicaciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("publicaciones_marketplace")
      .select("*")
      .eq("publicada", true)
      .order("fecha_publicacion", { ascending: false });

    if (!error && data) {
      setPublicaciones(data);
      setFilteredPublicaciones(data);
      
      // Extraer ubicaciones únicas
      const ubicaciones = [...new Set(data.map(pub => pub.ubicacion).filter(Boolean))] as string[];
      setUbicacionesDisponibles(ubicaciones);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setModalidadFilter("todas");
    setUbicacionFilter("todas");
    setSalarioMin("");
    setSalarioMax("");
  };

  const hasActiveFilters = () => {
    return searchTerm !== "" || 
           modalidadFilter !== "todas" || 
           ubicacionFilter !== "todas" || 
           salarioMin !== "" || 
           salarioMax !== "";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={vvgiLogo} alt="VVGI Logo" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Marketplace
                </h1>
                <p className="text-xs text-muted-foreground">Encuentra tu próxima oportunidad</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate("/")}>
                Inicio
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Iniciar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar & Filters */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vacantes por título, empresa o perfil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border/50 focus-visible:ring-primary"
              />
            </div>

            {/* Filters toggle */}
            <div className="flex items-center justify-between">
              <Collapsible open={showFilters} onOpenChange={setShowFilters} className="w-full">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 border-border/50">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtros
                      {hasActiveFilters() && (
                        <Badge className="ml-1 h-5 px-1.5 bg-primary/10 text-primary">
                          {[
                            searchTerm !== "",
                            modalidadFilter !== "todas",
                            ubicacionFilter !== "todas",
                            salarioMin !== "",
                            salarioMax !== ""
                          ].filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  {hasActiveFilters() && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                      Limpiar filtros
                    </Button>
                  )}
                </div>

                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-card rounded-lg border border-border/50">
                    {/* Modalidad */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Modalidad</label>
                      <Select value={modalidadFilter} onValueChange={setModalidadFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas</SelectItem>
                          <SelectItem value="remoto">Remoto</SelectItem>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="hibrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ubicación */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                      <Select value={ubicacionFilter} onValueChange={setUbicacionFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas</SelectItem>
                          {ubicacionesDisponibles.map((ubicacion) => (
                            <SelectItem key={ubicacion} value={ubicacion}>
                              {ubicacion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Salario mínimo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Salario mínimo</label>
                      <Input
                        type="number"
                        placeholder="$ 0"
                        value={salarioMin}
                        onChange={(e) => setSalarioMin(e.target.value)}
                      />
                    </div>

                    {/* Salario máximo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Salario máximo</label>
                      <Input
                        type="number"
                        placeholder="$ 0"
                        value={salarioMax}
                        onChange={(e) => setSalarioMax(e.target.value)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredPublicaciones.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? "No se encontraron vacantes" : "No hay vacantes publicadas"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "Intenta con otros términos de búsqueda"
                : "Las vacantes aparecerán aquí cuando se publiquen"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {filteredPublicaciones.length} {filteredPublicaciones.length === 1 ? 'vacante disponible' : 'vacantes disponibles'}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPublicaciones.map((publicacion) => (
                <VacantePublicaCard
                  key={publicacion.id}
                  publicacion={publicacion}
                  onClick={() => setSelectedPublicacion(publicacion)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Detail Modal */}
      <VacantePublicaDetailModal
        open={!!selectedPublicacion}
        onOpenChange={(open) => !open && setSelectedPublicacion(null)}
        publicacion={selectedPublicacion}
      />
    </div>
  );
};

export default Marketplace;
