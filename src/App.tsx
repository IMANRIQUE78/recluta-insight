import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import OnboardingFlow from "./pages/OnboardingFlow";
import Dashboard from "./pages/Dashboard";
import ReclutadorDashboard from "./pages/ReclutadorDashboard";
import VerificadorDashboard from "./pages/VerificadorDashboard";
import Marketplace from "./pages/Marketplace";
import CandidateDashboard from "./pages/CandidateDashboard";
import NOM035Dashboard from "./pages/NOM035Dashboard";
import CuestionarioPublico from "./pages/CuestionarioPublico";
import WalletEmpresa from "./pages/WalletEmpresa";
import NotFound from "./pages/NotFound";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/home" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/candidate-dashboard" element={
            <ProtectedRoute>
              <CandidateDashboard />
            </ProtectedRoute>
          } />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingFlow />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/reclutador-dashboard" element={
            <ProtectedRoute>
              <ReclutadorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/nom035" element={
            <ProtectedRoute>
              <NOM035Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/verificador-dashboard" element={
            <ProtectedRoute>
              <VerificadorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/wallet-empresa" element={
            <ProtectedRoute>
              <WalletEmpresa />
            </ProtectedRoute>
          } />
          {/* Ruta pública para cuestionarios NOM-035 */}
          <Route path="/cuestionario/:token" element={<CuestionarioPublico />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
