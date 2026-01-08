import { LogOut, User, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { UserProfileModal } from "./UserProfileModal";
import vvgiLogo from "@/assets/vvgi-logo.png";

interface DashboardHeaderProps {
  // Filtros removidos - ahora están en la sección de KPIs
}

export const DashboardHeader = ({}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const scrollDirection = useScrollDirection();

  useEffect(() => {
    loadPerfil();
  }, []);

  const loadPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Intentar obtener perfil de usuario
    const { data: perfilUsuario } = await supabase
      .from("perfil_usuario")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (perfilUsuario) {
      setPerfil(perfilUsuario);
      return;
    }

    // Si no hay perfil de usuario, intentar obtener datos de empresa
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("empresa_id")
      .eq("user_id", user.id)
      .eq("role", "admin_empresa")
      .maybeSingle();

    if (userRole?.empresa_id) {
      const { data: empresa } = await supabase
        .from("empresas")
        .select("nombre_empresa, codigo_empresa")
        .eq("id", userRole.empresa_id)
        .single();

      if (empresa) {
        setPerfil({ 
          nombre_empresa: empresa.nombre_empresa, 
          nombre_usuario: user.email?.split('@')[0],
          codigo_empresa: empresa.codigo_empresa 
        });
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate("/auth");
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={vvgiLogo} alt="VVGI" className="h-10 w-10 object-contain" />
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      VVGI
                    </h1>
                    {perfil?.codigo_empresa && (
                      <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded text-primary">
                        {perfil.codigo_empresa}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {perfil?.nombre_usuario && perfil?.nombre_empresa
                      ? `Centro de trabajo de ${perfil.nombre_usuario} de ${perfil.nombre_empresa}`
                      : "Panel de Control"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/marketplace")}
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Marketplace
                </Button>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowProfileModal(true)}
                >
                  <User className="h-4 w-4" />
                </Button>

                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir
                </Button>
              </div>
            </div>

          </div>
        </div>
      </header>

      <UserProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onSuccess={loadPerfil}
      />
    </>
  );
};
