import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";

interface VacantesPublicadasCardProps {
  count: number;
  loading?: boolean;
}

export const VacantesPublicadasCard = ({ count, loading }: VacantesPublicadasCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Vacantes Publicadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-elegant transition-all duration-300 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Vacantes Publicadas
        </CardTitle>
        <CardDescription>
          En marketplace público
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Globe className="h-8 w-8 text-primary opacity-60" />
          <span className="text-3xl font-bold tracking-tight">{count}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Visibles para candidatos
        </p>
      </CardContent>
    </Card>
  );
};
