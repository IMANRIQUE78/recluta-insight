import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { VacantePublicaCard } from "@/components/marketplace/VacantePublicaCard";
import { VacantePublicaDetailModal } from "@/components/marketplace/VacantePublicaDetailModal";

export const MarketplacePublico = () => {
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [filteredPublicaciones, setFilteredPublicaciones] = useState<any[]>([]);
  const [selectedPublicacion, setSelectedPublicacion] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicaciones();
  }, []);

  useEffect(() => {
    filterPublicaciones();
  }, [searchTerm, publicaciones]);

  const loadPublicaciones = async () => {
    try {
      const { data, error } = await supabase
        .from("publicaciones_marketplace")
        .select("*")
        .eq("publicada", true)
        .order("fecha_publicacion", { ascending: false });

      if (error) throw error;

      setPublicaciones(data || []);
      setFilteredPublicaciones(data || []);
    } catch (error) {
      console.error("Error loading publicaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPublicaciones = () => {
    if (!searchTerm.trim()) {
      setFilteredPublicaciones(publicaciones);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = publicaciones.filter(
      (pub) =>
        pub.titulo_puesto?.toLowerCase().includes(term) ||
        pub.ubicacion?.toLowerCase().includes(term) ||
        pub.perfil_requerido?.toLowerCase().includes(term)
    );

    setFilteredPublicaciones(filtered);
  };

  const handleCardClick = (publicacion: any) => {
    setSelectedPublicacion(publicacion);
    setDetailModalOpen(true);
  };

  if (loading) {
    return <div className="animate-pulse">Cargando vacantes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por puesto, ubicación o perfil..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredPublicaciones.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? "No se encontraron vacantes con ese criterio" : "No hay vacantes disponibles"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPublicaciones.map((publicacion) => (
            <VacantePublicaCard
              key={publicacion.id}
              publicacion={publicacion}
              onClick={() => handleCardClick(publicacion)}
            />
          ))}
        </div>
      )}

      {selectedPublicacion && (
        <VacantePublicaDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          publicacion={selectedPublicacion}
        />
      )}
    </div>
  );
};