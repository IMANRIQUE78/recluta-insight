import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VacantePublicaDetailModal } from "@/components/marketplace/VacantePublicaDetailModal";
import { EntrevistaPropuestaCard } from "./EntrevistaPropuestaCard";

interface Postulacion {
  id: string;
  fecha_postulacion: string;
  estado: string;
  etapa: string;
  notas_reclutador: string | null;
  publicacion: {
    id: string;
    titulo_puesto: string;
    ubicacion: string | null;
    lugar_trabajo: string;
    sueldo_bruto_aprobado: number | null;
    perfil_requerido: string | null;
    observaciones: string | null;
    fecha_publicacion: string;
    user_id: string;
  };
}

const etapaLabels: Record<string, string> = {
  recibida: "Recibida",
  revision: "En Revisión",
  entrevista: "Entrevista",
  rechazada: "Rechazada",
  contratada: "Contratada",
};

const etapaColors: Record<string, string> = {
  recibida: "bg-blue-500",
  revision: "bg-yellow-500",
  entrevista: "bg-purple-500",
  rechazada: "bg-red-500",
  contratada: "bg-green-500",
};

export const MisPostulaciones = () => {
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPublicacion, setSelectedPublicacion] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    loadPostulaciones();
    loadEntrevistas();
  }, []);

  const loadPostulaciones = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("postulaciones")
        .select(`
          id,
          fecha_postulacion,
          estado,
          etapa,
          notas_reclutador,
          publicacion:publicaciones_marketplace(
            id,
            titulo_puesto,
            ubicacion,
            lugar_trabajo,
            sueldo_bruto_aprobado,
            perfil_requerido,
            observaciones,
            fecha_publicacion,
            user_id
          )
        `)
        .eq("candidato_user_id", session.user.id)
        .order("fecha_postulacion", { ascending: false });

      if (error) throw error;

      setPostulaciones(data || []);
    } catch (error) {
      console.error("Error loading postulaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntrevistas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("entrevistas_candidato")
        .select(`
          *,
          postulacion:postulaciones!inner (
            id,
            publicacion:publicaciones_marketplace!inner (
              id,
              titulo_puesto,
              user_id
            )
          )
        `)
        .eq("candidato_user_id", session.user.id)
        .order("fecha_entrevista", { ascending: true });

      if (error) {
        console.error("Error loading entrevistas:", error);
        return;
      }

      // Ahora obtenemos los nombres de empresa de los reclutadores
      const entrevistasConEmpresa = await Promise.all(
        (data || []).map(async (entrevista) => {
          const { data: perfil } = await supabase
            .from("perfil_usuario")
            .select("nombre_empresa")
            .eq("user_id", entrevista.postulacion.publicacion.user_id)
            .single();
          
          return {
            ...entrevista,
            empresa: perfil?.nombre_empresa || "Empresa",
            titulo_puesto: entrevista.postulacion.publicacion.titulo_puesto
          };
        })
      );

      setEntrevistas(entrevistasConEmpresa);
    } catch (error) {
      console.error("Error loading entrevistas:", error);
    }
  };

  const formatSalary = (salary: number | null) => {
    if (!salary) return null;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(salary);
  };

  const getModalidadLabel = (modalidad: string) => {
    const labels: Record<string, string> = {
      remoto: "Remoto",
      presencial: "Presencial",
      hibrido: "Híbrido",
    };
    return labels[modalidad] || modalidad;
  };

  const handleVerDetalle = (publicacion: any) => {
    setSelectedPublicacion(publicacion);
    setDetailModalOpen(true);
  };

  if (loading) {
    return <div className="animate-pulse">Cargando postulaciones...</div>;
  }

  if (postulaciones.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Aún no te has postulado a ninguna vacante</p>
          <p className="text-sm text-muted-foreground">Explora el Marketplace para encontrar oportunidades</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sección de Entrevistas */}
      {entrevistas.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Propuestas de Entrevista</h2>
          <div className="grid gap-4">
            {entrevistas.map((entrevista) => (
              <EntrevistaPropuestaCard
                key={entrevista.id}
                entrevista={entrevista}
                onUpdate={loadEntrevistas}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sección de Postulaciones */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Mis Postulaciones</h2>
        <div className="space-y-4">
          {postulaciones.map((postulacion) => (
        <Card key={postulacion.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{postulacion.publicacion.titulo_puesto}</CardTitle>
                <div className="flex items-center gap-3 mt-2">
                  {postulacion.publicacion.ubicacion && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {postulacion.publicacion.ubicacion}
                    </span>
                  )}
                  <Badge variant="secondary">
                    {getModalidadLabel(postulacion.publicacion.lugar_trabajo)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <Badge className={etapaColors[postulacion.etapa]}>
                  {etapaLabels[postulacion.etapa]}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Postulado: {new Date(postulacion.fecha_postulacion).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {postulacion.publicacion.sueldo_bruto_aprobado && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {formatSalary(postulacion.publicacion.sueldo_bruto_aprobado)}
                  </span>
                </div>
              )}

              {postulacion.publicacion.perfil_requerido && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {postulacion.publicacion.perfil_requerido}
                </p>
              )}

              {postulacion.notas_reclutador && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-semibold mb-1">Notas del Reclutador:</p>
                  <p className="text-sm">{postulacion.notas_reclutador}</p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVerDetalle(postulacion.publicacion)}
                >
                  Ver Detalles de la Vacante
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

        </div>
      </div>

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