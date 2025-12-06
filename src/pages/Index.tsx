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

    // Verificar si tiene perfil de verificador
    const { data: perfilVerificador } = await supabase
      .from("perfil_verificador")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (perfilVerificador) {
      navigate("/verificador-dashboard");
      setChecking(false);
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

    // Verificar si tiene rol de empresa CON empresa_id asignado
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id);

    if (userRoles && userRoles.length > 0) {
      // Solo considerar válido si tiene rol admin_empresa Y empresa_id asignado
      const validEmpresaRole = userRoles.find(r => r.role === "admin_empresa" && r.empresa_id);
      if (validEmpresaRole) {
        navigate("/dashboard");
        setChecking(false);
        return;
      }
    }

    // Si no tiene ningún perfil completo, ir a onboarding
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
