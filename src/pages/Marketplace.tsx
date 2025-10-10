import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VacantePublicaCard } from "@/components/marketplace/VacantePublicaCard";
import { VacantePublicaDetailModal } from "@/components/marketplace/VacantePublicaDetailModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Marketplace = () => {
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [filteredPublicaciones, setFilteredPublicaciones] = useState<any[]>([]);
  const [selectedPublicacion, setSelectedPublicacion] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicaciones();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPublicaciones(publicaciones);
    } else {
      const filtered = publicaciones.filter((pub) =>
        pub.titulo_puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.cliente_area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.perfil_requerido?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPublicaciones(filtered);
    }
  }, [searchTerm, publicaciones]);

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
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Marketplace de Vacantes</h1>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vacantes por título, empresa o perfil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
