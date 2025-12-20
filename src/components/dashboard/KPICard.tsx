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

  const handleClick = () => {
    if (onDoubleClick) {
      console.log("KPI Card clicked:", title);
      onDoubleClick();
    }
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/50 hover:scale-[1.02] group bg-card/80 backdrop-blur-sm" 
      onClick={handleClick}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </CardTitle>
          {icon && (
            <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="text-2xl font-bold tracking-tight">
          {value}
          {unit && <span className="text-sm ml-1 text-muted-foreground font-normal">{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trend)}% vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};