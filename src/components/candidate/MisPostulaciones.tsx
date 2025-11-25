import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntrevistaPropuestaCard } from "./EntrevistaPropuestaCard";
import { PostulacionDetailModal } from "./PostulacionDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [selectedPostulacion, setSelectedPostulacion] = useState<Postulacion | null>(null);
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

  const handleVerDetalle = (postulacion: Postulacion) => {
    setSelectedPostulacion(postulacion);
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
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postulaciones.map((postulacion) => (
                  <TableRow key={postulacion.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {postulacion.publicacion.titulo_puesto}
                    </TableCell>
                    <TableCell>
                      {postulacion.publicacion.ubicacion || "No especificada"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {getModalidadLabel(postulacion.publicacion.lugar_trabajo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatSalary(postulacion.publicacion.sueldo_bruto_aprobado)}
                    </TableCell>
                    <TableCell>
                      <Badge className={etapaColors[postulacion.etapa]}>
                        {etapaLabels[postulacion.etapa]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(postulacion.fecha_postulacion).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerDetalle(postulacion)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {selectedPostulacion && (
        <PostulacionDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          postulacion={selectedPostulacion}
        />
      )}
    </div>
  );
};