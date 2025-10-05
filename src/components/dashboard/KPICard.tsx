import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  unit?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const KPICard = ({ title, value, trend, unit = "", icon, onClick }: KPICardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-success" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-destructive" />;
    return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend > 0) return "text-success";
    if (trend < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">
            {value}
            {unit && <span className="text-lg ml-1 text-muted-foreground">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(trend)}% vs mes anterior</span>
            </div>
          )}
          {onClick && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Ver detalles
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};