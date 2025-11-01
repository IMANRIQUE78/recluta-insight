import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkUserProfile();
  }, [user, loading]);

  const checkUserProfile = async () => {
    if (loading) return;

    if (!user) {
      navigate("/home");
      return;
    }

    // Verificar si tiene rol de empresa o reclutador
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id);

    // Verificar si tiene perfil de candidato
    const { data: perfilCandidato } = await supabase
      .from("perfil_candidato")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (userRoles && userRoles.length > 0) {
      // Si tiene rol de empresa o reclutador, ir al dashboard
      const hasEmpresaOrReclutador = userRoles.some(r => 
        r.role === "admin_empresa" || r.role === "reclutador"
      );
      if (hasEmpresaOrReclutador) {
        navigate("/dashboard");
        return;
      }
    }

    if (perfilCandidato) {
      navigate("/candidate-dashboard");
    } else {
      // Si no tiene ningún perfil, ir a onboarding
      navigate("/onboarding");
    }
    
    setChecking(false);
  };

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
};

export default Index;
