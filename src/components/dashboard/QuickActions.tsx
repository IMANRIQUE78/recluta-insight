import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UserPlus, Brain, Crown, Scale, Users, Calculator, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface QuickActionsProps {
  onNewRequisicion: () => void;
  onInvitarReclutador: () => void;
}

export const QuickActions = ({ onNewRequisicion, onInvitarReclutador }: QuickActionsProps) => {
  const navigate = useNavigate();

  const handleComingSoon = (moduleName: string) => {
    toast({
      title: "🚀 Lo estamos construyendo...",
      description: `El módulo de ${moduleName} está en desarrollo. ¡Serás de los primeros en saber cuando esté listo!`,
      duration: 5000,
    });
  };

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
        <Button 
          className="w-full justify-between group" 
          variant="outline"
          onClick={() => handleComingSoon("Legislación")}
        >
          <span className="flex items-center">
            <Scale className="mr-2 h-4 w-4" />
            Legislación
          </span>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] group-hover:bg-amber-500/20">
            <Rocket className="h-3 w-3 mr-1" />
            Próximamente
          </Badge>
        </Button>
        <Button 
          className="w-full justify-between group" 
          variant="outline"
          onClick={() => handleComingSoon("Base de Datos de Personal")}
        >
          <span className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Base de Datos de Personal
          </span>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] group-hover:bg-amber-500/20">
            <Rocket className="h-3 w-3 mr-1" />
            Próximamente
          </Badge>
        </Button>
        <Button 
          className="w-full justify-between group" 
          variant="outline"
          onClick={() => handleComingSoon("Contabilidad y Nóminas")}
        >
          <span className="flex items-center">
            <Calculator className="mr-2 h-4 w-4" />
            Módulo Contable y Nóminas
          </span>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] group-hover:bg-amber-500/20">
            <Rocket className="h-3 w-3 mr-1" />
            Próximamente
          </Badge>
        </Button>
      </CardContent>
    </Card>
  );
};