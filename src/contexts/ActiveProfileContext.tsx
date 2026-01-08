import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProfileType = "candidato" | "reclutador" | "empresa" | "verificador" | null;

export interface UserProfile {
  type: ProfileType;
  id: string;
  name: string;
  code?: string;
  avatarUrl?: string;
}

interface ActiveProfileContextType {
  activeProfile: ProfileType;
  setActiveProfile: (profile: ProfileType) => void;
  availableProfiles: UserProfile[];
  loadingProfiles: boolean;
  refreshProfiles: () => Promise<void>;
  currentProfileData: UserProfile | null;
}

const ActiveProfileContext = createContext<ActiveProfileContextType | undefined>(undefined);

const STORAGE_KEY = "vvgi_active_profile";

export const ActiveProfileProvider = ({ children }: { children: ReactNode }) => {
  const [activeProfile, setActiveProfileState] = useState<ProfileType>(null);
  const [availableProfiles, setAvailableProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Cargar perfil activo desde localStorage al montar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setActiveProfileState(stored as ProfileType);
    }
    loadAvailableProfiles();
  }, []);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        loadAvailableProfiles();
      } else if (event === "SIGNED_OUT") {
        setAvailableProfiles([]);
        setActiveProfileState(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAvailableProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAvailableProfiles([]);
        setLoadingProfiles(false);
        return;
      }

      const profiles: UserProfile[] = [];

      // Verificar perfil de candidato
      const { data: candidato } = await supabase
        .from("perfil_candidato")
        .select("id, nombre_completo, codigo_candidato")
        .eq("user_id", user.id)
        .maybeSingle();

      if (candidato) {
        profiles.push({
          type: "candidato",
          id: candidato.id,
          name: candidato.nombre_completo,
          code: candidato.codigo_candidato || undefined,
        });
      }

      // Verificar perfil de reclutador
      const { data: reclutador } = await supabase
        .from("perfil_reclutador")
        .select("id, nombre_reclutador, codigo_reclutador")
        .eq("user_id", user.id)
        .maybeSingle();

      if (reclutador) {
        profiles.push({
          type: "reclutador",
          id: reclutador.id,
          name: reclutador.nombre_reclutador,
          code: reclutador.codigo_reclutador || undefined,
        });
      }

      // Verificar perfil de verificador
      const { data: verificador } = await supabase
        .from("perfil_verificador")
        .select("id, nombre_verificador, codigo_verificador")
        .eq("user_id", user.id)
        .maybeSingle();

      if (verificador) {
        profiles.push({
          type: "verificador",
          id: verificador.id,
          name: verificador.nombre_verificador,
          code: verificador.codigo_verificador || undefined,
        });
      }

      // Verificar rol de empresa
      const { data: empresaRole } = await supabase
        .from("user_roles")
        .select("empresa_id, empresas(id, nombre_empresa, codigo_empresa)")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .not("empresa_id", "is", null)
        .maybeSingle();

      if (empresaRole?.empresas) {
        const empresa = empresaRole.empresas as any;
        profiles.push({
          type: "empresa",
          id: empresa.id,
          name: empresa.nombre_empresa,
          code: empresa.codigo_empresa || undefined,
        });
      }

      setAvailableProfiles(profiles);

      // Si no hay perfil activo pero hay perfiles disponibles, seleccionar el primero
      const storedProfile = localStorage.getItem(STORAGE_KEY) as ProfileType;
      if (storedProfile && profiles.some(p => p.type === storedProfile)) {
        setActiveProfileState(storedProfile);
      } else if (profiles.length > 0 && !storedProfile) {
        setActiveProfileState(profiles[0].type);
        localStorage.setItem(STORAGE_KEY, profiles[0].type as string);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const setActiveProfile = (profile: ProfileType) => {
    setActiveProfileState(profile);
    if (profile) {
      localStorage.setItem(STORAGE_KEY, profile);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const currentProfileData = availableProfiles.find(p => p.type === activeProfile) || null;

  return (
    <ActiveProfileContext.Provider
      value={{
        activeProfile,
        setActiveProfile,
        availableProfiles,
        loadingProfiles,
        refreshProfiles: loadAvailableProfiles,
        currentProfileData,
      }}
    >
      {children}
    </ActiveProfileContext.Provider>
  );
};

export const useActiveProfile = () => {
  const context = useContext(ActiveProfileContext);
  if (context === undefined) {
    throw new Error("useActiveProfile must be used within an ActiveProfileProvider");
  }
  return context;
};
