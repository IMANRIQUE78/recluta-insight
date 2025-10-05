import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  unit?: string;
  icon?: React.ReactNode;
  onDoubleClick?: () => void;
}

export const KPICard = ({ title, value, trend, unit = "", icon, onDoubleClick }: KPICardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <ArrowUp className="h-4 w-4" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4" />;
    return null;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend > 0) return "text-success";
    if (trend < 0) return "text-destructive";
    return "";
  };

  return (
    <Card 
      className="hover:shadow-elegant transition-all duration-300 cursor-pointer border-border/50" 
      onDoubleClick={onDoubleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && <div className="text-muted-foreground opacity-60">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold tracking-tight">
          {value}
          {unit && <span className="text-lg ml-1 text-muted-foreground font-normal">{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1.5 text-sm font-medium ${getTrendColor()} bg-muted/30 px-3 py-1.5 rounded-md w-fit`}>
            {getTrendIcon()}
            <span>{Math.abs(trend)}% vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};