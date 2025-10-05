import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface QuickActionsProps {
  onNewVacante: () => void;
}

export const QuickActions = ({ onNewVacante }: QuickActionsProps) => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        <CardDescription>Gestiona tus datos de reclutamiento</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={onNewVacante}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Vacante
        </Button>
      </CardContent>
    </Card>
  );
};