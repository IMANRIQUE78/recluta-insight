import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UserPlus, Brain, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuickActionsProps {
  onNewRequisicion: () => void;
  onInvitarReclutador: () => void;
}

export const QuickActions = ({ onNewRequisicion, onInvitarReclutador }: QuickActionsProps) => {
  const navigate = useNavigate();

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
        <Button 
          className="w-full justify-between group" 
          variant="outline"
          onClick={() => navigate("/nom035")}
        >
          <span className="flex items-center">
            <Brain className="mr-2 h-4 w-4" />
            NOM-035 Psicosocial
          </span>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] group-hover:bg-primary/20">
            <Crown className="h-3 w-3 mr-1" />
            Enterprise
          </Badge>
        </Button>
      </CardContent>
    </Card>
  );
};