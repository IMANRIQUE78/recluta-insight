import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const DashboardHeader = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Analítica de Reclutamiento
            </h1>
            <p className="text-sm text-muted-foreground">Panel de Control</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select defaultValue="30">
              <SelectTrigger className="w-[150px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>

            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};