import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, Briefcase, BarChart3, LogOut, Store, Eye } from "lucide-react";
import { CandidateProfileModal } from "@/components/candidate/CandidateProfileModal";
import { CandidateProfilePreviewModal } from "@/components/candidate/CandidateProfilePreviewModal";
import { CandidateStats } from "@/components/candidate/CandidateStats";
import { MisPostulaciones } from "@/components/candidate/MisPostulaciones";
import { MarketplacePublico } from "@/components/candidate/MarketplacePublico";
import { ProximasEntrevistasCandidato } from "@/components/candidate/ProximasEntrevistasCandidato";
import { MisFeedbacks } from "@/components/candidate/MisFeedbacks";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { ProfileIndicator } from "@/components/profile/ProfileIndicator";
import vvgiLogo from "@/assets/vvgi-logo.png";

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [userName, setUserName] = useState("");
  const [codigoCandidato, setCodigoCandidato] = useState("");
  const scrollDirection = useScrollDirection();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Verificar si tiene perfil de candidato
    const {
      data: profile
    } = await supabase.from("perfil_candidato").select("nombre_completo, codigo_candidato").eq("user_id", session.user.id).maybeSingle();
    if (profile) {
      setHasProfile(true);
      setUserName(profile.nombre_completo);
      setCodigoCandidato((profile as any).codigo_candidato || "");
    } else {
      setProfileModalOpen(true); // Abrir modal si no tiene perfil
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Cargando...</div>
      </div>;
  }

  return <div className="min-h-screen bg-background">
      <header className={`sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
      }`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img 
                src={vvgiLogo} 
                alt="VVGI Logo" 
                className="h-12 w-12 object-contain relative z-10 transition-transform duration-300 group-hover:scale-110" 
              />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent font-bold">
                  Portal
                </span>
                <span className="ml-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent font-bold">
                  Candidato
                </span>
              </h1>
              {hasProfile && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground font-medium">{userName}</p>
                  {codigoCandidato && (
                    <span className="font-mono text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">{codigoCandidato}</span>
                  )}
                  <ProfileIndicator />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProfileSwitcher variant="compact" />
            <Button variant="outline" onClick={() => setProfilePreviewOpen(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Perfil
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!hasProfile && <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
            <h2 className="text-xl font-semibold mb-2">Completa tu perfil</h2>
            <p className="text-muted-foreground mb-4">
              No usamos archivos por cuestiones de espacio, pero de esta forma mejoramos el match con las vacantes disponibles.
            </p>
            <Button onClick={() => setProfileModalOpen(true)}>
              Completar Perfil
            </Button>
          </Card>}

        <Tabs defaultValue="postulaciones" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="postulaciones">
              <Briefcase className="h-4 w-4 mr-2" />
              Mis Postulaciones
            </TabsTrigger>
            <TabsTrigger value="marketplace">
              <Store className="h-4 w-4 mr-2" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="estadisticas">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="postulaciones">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <ProximasEntrevistasCandidato />
                <MisFeedbacks />
              </div>
              <MisPostulaciones />
            </div>
          </TabsContent>

          <TabsContent value="marketplace">
            <MarketplacePublico />
          </TabsContent>

          <TabsContent value="estadisticas">
            <CandidateStats />
          </TabsContent>
        </Tabs>
      </main>

      <CandidateProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} onSuccess={() => {
        setHasProfile(true);
        checkAuth();
      }} />

      <CandidateProfilePreviewModal 
        open={profilePreviewOpen} 
        onOpenChange={setProfilePreviewOpen} 
        onEditClick={() => setProfileModalOpen(true)} 
      />
    </div>;
}