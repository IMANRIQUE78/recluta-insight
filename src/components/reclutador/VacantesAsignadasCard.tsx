import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Briefcase, Clock, CheckCircle, XCircle, Users } from "lucide-react";

interface VacantesAsignadasCardProps {
  reclutadorId: string;
}

export const VacantesAsignadasCard = ({ reclutadorId }: VacantesAsignadasCardProps) => {
  // TODO: Cargar vacantes asignadas al reclutador desde la base de datos
  const vacantesAsignadas = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Vacantes Asignadas
        </CardTitle>
        <CardDescription>
          Requisiciones de empresas que debes cubrir
        </CardDescription>
      </CardHeader>
      <CardContent>
        {vacantesAsignadas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aún no tienes vacantes asignadas</p>
            <p className="text-xs mt-1">Las empresas te asignarán requisiciones una vez aceptes sus invitaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vacantesAsignadas.map((vacante: any) => (
              <div key={vacante.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{vacante.titulo_puesto}</p>
                    <p className="text-sm text-muted-foreground">{vacante.empresa}</p>
                  </div>
                  <Badge variant="outline">{vacante.estatus}</Badge>
                </div>
                <Separator />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {vacante.fecha_solicitud}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {vacante.postulaciones || 0} candidatos
                  </span>
                </div>
                <Button size="sm" className="w-full" variant="outline">
                  Ver Detalles
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
