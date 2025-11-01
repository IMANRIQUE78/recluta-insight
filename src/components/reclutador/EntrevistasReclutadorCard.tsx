import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, User, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EntrevistasReclutadorCardProps {
  reclutadorUserId: string;
}

export const EntrevistasReclutadorCard = ({ reclutadorUserId }: EntrevistasReclutadorCardProps) => {
  const { toast } = useToast();
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntrevistas();
  }, [reclutadorUserId]);

  const loadEntrevistas = async () => {
    try {
      const { data, error } = await supabase
        .from("entrevistas_candidato")
        .select(`
          *,
          postulaciones (
            publicaciones_marketplace (
              titulo_puesto,
              vacantes (
                folio
              )
            ),
            perfil_candidato (
              nombre_completo,
              email
            )
          )
        `)
        .eq("reclutador_user_id", reclutadorUserId)
        .gte("fecha_entrevista", new Date().toISOString())
        .order("fecha_entrevista", { ascending: true })
        .limit(5);

      if (error) throw error;
      setEntrevistas(data || []);
    } catch (error: any) {
      console.error("Error cargando entrevistas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarAsistencia = async (entrevistaId: string) => {
    try {
      const { error } = await supabase
        .from("entrevistas_candidato")
        .update({ asistio: true })
        .eq("id", entrevistaId);

      if (error) throw error;

      toast({
        title: "✅ Asistencia confirmada",
        description: "La asistencia ha sido registrada",
      });

      loadEntrevistas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Entrevistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Entrevistas
        </CardTitle>
        <CardDescription>
          Entrevistas programadas con candidatos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entrevistas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tienes entrevistas programadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entrevistas.map((entrevista) => (
              <div key={entrevista.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">
                      {entrevista.postulaciones?.publicaciones_marketplace?.titulo_puesto}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {entrevista.postulaciones?.perfil_candidato?.nombre_completo}
                    </p>
                  </div>
                  <Badge variant={entrevista.estado === "confirmada" ? "default" : "secondary"}>
                    {entrevista.estado}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(entrevista.fecha_entrevista).toLocaleDateString()}
                  </span>
                  <span>
                    {new Date(entrevista.fecha_entrevista).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                {entrevista.detalles_reunion && (
                  <p className="text-xs text-muted-foreground">{entrevista.detalles_reunion}</p>
                )}
                {!entrevista.asistio && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleMarcarAsistencia(entrevista.id)}
                  >
                    <CheckCircle className="mr-2 h-3 w-3" />
                    Marcar como realizada
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
