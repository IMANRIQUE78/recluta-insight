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

    // Verificar si tiene perfil de candidato
    const { data: perfilCandidato } = await supabase
      .from("perfil_candidato")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (perfilCandidato) {
      navigate("/candidate-dashboard");
      setChecking(false);
      return;
    }

    // Verificar si tiene perfil de reclutador
    const { data: perfilReclutador } = await supabase
      .from("perfil_reclutador")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (perfilReclutador) {
      navigate("/reclutador-dashboard");
      setChecking(false);
      return;
    }

    // Verificar si tiene rol de empresa
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id);

    if (userRoles && userRoles.length > 0) {
      const hasEmpresaRole = userRoles.some(r => r.role === "admin_empresa");
      if (hasEmpresaRole) {
        navigate("/dashboard");
        setChecking(false);
        return;
      }
    }

    // Si no tiene ningún perfil, ir a onboarding
    navigate("/onboarding");
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
