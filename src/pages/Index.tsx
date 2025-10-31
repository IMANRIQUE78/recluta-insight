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

    // Verificar si tiene perfil de usuario (reclutador)
    const { data: perfilUsuario } = await supabase
      .from("perfil_usuario")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Verificar si tiene perfil de candidato
    const { data: perfilCandidato } = await supabase
      .from("perfil_candidato")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (perfilUsuario) {
      navigate("/dashboard");
    } else if (perfilCandidato) {
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
