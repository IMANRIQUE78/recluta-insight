import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveProfile, ProfileType } from "@/contexts/ActiveProfileContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Briefcase, 
  Building2, 
  Shield, 
  ChevronDown, 
  Check,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const profileConfig: Record<ProfileType & string, { 
  icon: typeof User; 
  label: string; 
  color: string;
  bgColor: string;
  route: string;
}> = {
  candidato: {
    icon: User,
    label: "Candidato",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    route: "/candidate-dashboard",
  },
  reclutador: {
    icon: Briefcase,
    label: "Reclutador",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    route: "/reclutador-dashboard",
  },
  empresa: {
    icon: Building2,
    label: "Empresa",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-500/10",
    route: "/dashboard",
  },
  verificador: {
    icon: Shield,
    label: "Verificador",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    route: "/verificador-dashboard",
  },
};

interface ProfileSwitcherProps {
  variant?: "full" | "compact";
  showBadge?: boolean;
}

export const ProfileSwitcher = ({ variant = "full", showBadge = true }: ProfileSwitcherProps) => {
  const navigate = useNavigate();
  const { 
    activeProfile, 
    setActiveProfile, 
    availableProfiles, 
    loadingProfiles,
    currentProfileData,
    refreshProfiles 
  } = useActiveProfile();
  const [open, setOpen] = useState(false);

  if (loadingProfiles) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Cargando...</span>
      </Button>
    );
  }

  // Si solo tiene un perfil, no mostrar el switcher
  if (availableProfiles.length <= 1) {
    return null;
  }

  const currentConfig = activeProfile ? profileConfig[activeProfile] : null;
  const CurrentIcon = currentConfig?.icon || User;

  const handleProfileSwitch = (profileType: ProfileType) => {
    if (profileType === activeProfile) {
      setOpen(false);
      return;
    }
    
    setActiveProfile(profileType);
    setOpen(false);
    
    // Navegar al dashboard correspondiente
    const config = profileType ? profileConfig[profileType] : null;
    if (config?.route) {
      navigate(config.route);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={variant === "compact" ? "sm" : "default"}
          className={cn(
            "gap-2 transition-all duration-200 hover:shadow-md",
            currentConfig?.bgColor,
            "border-2 hover:border-primary/30"
          )}
        >
          <div className={cn(
            "flex items-center justify-center rounded-full",
            variant === "compact" ? "h-5 w-5" : "h-6 w-6",
            currentConfig?.bgColor
          )}>
            <CurrentIcon className={cn(
              variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5",
              currentConfig?.color
            )} />
          </div>
          
          {variant === "full" && (
            <>
              <div className="flex flex-col items-start">
                <span className={cn("text-xs font-medium", currentConfig?.color)}>
                  {currentConfig?.label}
                </span>
                {currentProfileData && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {currentProfileData.name}
                  </span>
                )}
              </div>
              
              {showBadge && availableProfiles.length > 1 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 w-5 p-0 flex items-center justify-center text-[10px] ml-1"
                >
                  {availableProfiles.length}
                </Badge>
              )}
            </>
          )}
          
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform duration-200",
            open && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-64 p-2"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-sm font-semibold">Cambiar Perfil</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault();
              refreshProfiles();
            }}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="space-y-1">
          {availableProfiles.map((profile) => {
            const config = profile.type ? profileConfig[profile.type] : null;
            const Icon = config?.icon || User;
            const isActive = profile.type === activeProfile;

            return (
              <DropdownMenuItem
                key={profile.type}
                onClick={() => handleProfileSwitch(profile.type)}
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-all",
                  isActive && "bg-primary/10 border border-primary/20",
                  !isActive && "hover:bg-muted"
                )}
              >
                <Avatar className={cn(
                  "h-10 w-10 border-2 transition-all",
                  isActive ? "border-primary" : "border-muted"
                )}>
                  <AvatarFallback className={cn(
                    config?.bgColor,
                    config?.color,
                    "font-semibold"
                  )}>
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", config?.color)} />
                    <span className={cn(
                      "text-xs font-medium",
                      config?.color
                    )}>
                      {config?.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{profile.name}</p>
                  {profile.code && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {profile.code}
                    </p>
                  )}
                </div>

                {isActive && (
                  <div className="p-1 rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-2" />
        
        <div className="px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground text-center">
            Los perfiles comparten la misma cuenta pero tienen acceso a diferentes funcionalidades
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
