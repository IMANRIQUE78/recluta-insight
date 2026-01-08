import { useActiveProfile, ProfileType } from "@/contexts/ActiveProfileContext";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase, Building2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const profileConfig: Record<ProfileType & string, { 
  icon: typeof User; 
  label: string; 
  color: string;
  borderColor: string;
}> = {
  candidato: {
    icon: User,
    label: "Modo Candidato",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/30",
  },
  reclutador: {
    icon: Briefcase,
    label: "Modo Reclutador",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  empresa: {
    icon: Building2,
    label: "Modo Empresa",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-500/30",
  },
  verificador: {
    icon: Shield,
    label: "Modo Verificador",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500/30",
  },
};

interface ProfileIndicatorProps {
  showOnlyIfMultiple?: boolean;
}

/**
 * Indicador visual del perfil activo - se muestra como badge 
 * para prevenir confusión de contexto
 */
export const ProfileIndicator = ({ showOnlyIfMultiple = true }: ProfileIndicatorProps) => {
  const { activeProfile, availableProfiles, loadingProfiles } = useActiveProfile();

  if (loadingProfiles) return null;
  
  // Solo mostrar si tiene múltiples perfiles
  if (showOnlyIfMultiple && availableProfiles.length <= 1) return null;
  
  if (!activeProfile) return null;

  const config = profileConfig[activeProfile];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 px-2 py-0.5 text-[10px] font-medium border animate-in fade-in-50 duration-300",
        config.color,
        config.borderColor
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
