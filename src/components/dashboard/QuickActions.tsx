import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UserPlus } from "lucide-react";

interface QuickActionsProps {
  onNewRequisicion: () => void;
  onInvitarReclutador: () => void;
}

export const QuickActions = ({ onNewRequisicion, onInvitarReclutador }: QuickActionsProps) => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        <CardDescription>Gestiona tus requisiciones y equipo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={onNewRequisicion}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Requisición
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={onInvitarReclutador}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Reclutador
        </Button>
      </CardContent>
    </Card>
  );
};