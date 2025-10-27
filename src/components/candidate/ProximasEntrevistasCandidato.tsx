import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Video, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProximaEntrevista {
  id: string;
  fecha_entrevista: string;
  tipo_entrevista: string;
  duracion_minutos: number;
  detalles_reunion: string | null;
  titulo_puesto: string;
  empresa: string;
}

export function ProximasEntrevistasCandidato() {
  const [entrevistas, setEntrevistas] = useState<ProximaEntrevista[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntrevistas();
  }, []);

  const loadEntrevistas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const ahora = new Date().toISOString();

      const { data, error } = await supabase
        .from("entrevistas_candidato")
        .select(`
          id,
          fecha_entrevista,
          tipo_entrevista,
          duracion_minutos,
          detalles_reunion,
          postulacion:postulaciones(
            publicacion:publicaciones_marketplace(
              titulo_puesto,
              vacante:vacantes(
                perfil:perfil_usuario(nombre_empresa)
              )
            )
          )
        `)
        .eq("candidato_user_id", session.user.id)
        .eq("estado", "aceptada")
        .gte("fecha_entrevista", ahora)
        .order("fecha_entrevista", { ascending: true })
        .limit(5);

      if (error) throw error;

      const formattedData = (data || []).map((e: any) => ({
        id: e.id,
        fecha_entrevista: e.fecha_entrevista,
        tipo_entrevista: e.tipo_entrevista,
        duracion_minutos: e.duracion_minutos,
        detalles_reunion: e.detalles_reunion,
        titulo_puesto: e.postulacion?.publicacion?.titulo_puesto || "Sin título",
        empresa: e.postulacion?.publicacion?.vacante?.perfil?.nombre_empresa || "Empresa",
      }));

      setEntrevistas(formattedData);
    } catch (error) {
      console.error("Error loading entrevistas:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "virtual": return <Video className="h-4 w-4" />;
      case "presencial": return <MapPin className="h-4 w-4" />;
      case "telefonica": return <Phone className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Entrevistas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas Entrevistas</CardTitle>
      </CardHeader>
      <CardContent>
        {entrevistas.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tienes entrevistas programadas</p>
        ) : (
          <div className="space-y-4">
            {entrevistas.map((entrevista) => (
              <div key={entrevista.id} className="border-l-4 border-primary pl-4 py-2 space-y-1">
                <div className="flex items-center gap-2">
                  {getTipoIcon(entrevista.tipo_entrevista)}
                  <span className="font-medium">{entrevista.titulo_puesto}</span>
                </div>
                <p className="text-sm text-muted-foreground">{entrevista.empresa}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(entrevista.fecha_entrevista), "PPP", { locale: es })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(entrevista.fecha_entrevista), "p", { locale: es })}
                  </div>
                </div>
                {entrevista.detalles_reunion && (
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded mt-1">
                    {entrevista.detalles_reunion}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
