import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  Zap,
  Shield,
  ArrowRight,
  Star
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "KPIs en Tiempo Real",
      description: "Monitorea métricas clave como tiempo de cobertura, tasa de éxito y costos por contratación."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Marketplace de Talento",
      description: "Publica vacantes y conecta con candidatos calificados de forma eficiente."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Gestión de Vacantes",
      description: "Administra todo el ciclo de vida de tus vacantes desde solicitud hasta cierre."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Seguimiento de Entrevistas",
      description: "Agenda, coordina y da seguimiento a todas tus entrevistas en un solo lugar."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Automatización Inteligente",
      description: "Reduce tiempo en tareas repetitivas y enfócate en lo que importa."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Análisis Predictivo",
      description: "Forecasts y predicciones para planear mejor tus procesos de reclutamiento."
    }
  ];

  const benefits = [
    {
      metric: "45%",
      label: "Reducción en tiempo de contratación"
    },
    {
      metric: "3x",
      label: "Más candidatos calificados"
    },
    {
      metric: "60%",
      label: "Ahorro en costos de reclutamiento"
    },
    {
      metric: "95%",
      label: "Satisfacción de clientes"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navbar */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">TalentHub</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Características
            </a>
            <a href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">
              Beneficios
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Precios
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Comenzar Gratis
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background pointer-events-none" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="text-sm px-4 py-1">
              <Star className="h-3 w-3 mr-2 fill-primary text-primary" />
              Plataforma #1 de Reclutamiento Inteligente
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Transforma tu proceso de{" "}
              <span className="text-primary">Reclutamiento</span> con datos
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              La plataforma todo-en-uno que necesitas para gestionar vacantes, 
              conectar con talento y tomar decisiones basadas en métricas reales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="w-full sm:w-auto">
                Comenzar Ahora
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/marketplace")} className="w-full sm:w-auto">
                Ver Marketplace
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span>14 días gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span>Cancela cuando quieras</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Resultados que hablan por sí solos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Empresas líderes confían en nosotros para optimizar sus procesos
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, idx) => (
              <Card key={idx} className="text-center border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {benefit.metric}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {benefit.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Herramientas poderosas diseñadas para modernizar tu reclutamiento
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
            <CardContent className="pt-12 pb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Listo para revolucionar tu reclutamiento?
              </h2>
              <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                Únete a cientos de empresas que ya optimizan sus procesos con nuestra plataforma
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto"
                >
                  Comenzar Prueba Gratuita
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  onClick={() => navigate("/marketplace")}
                >
                  Explorar Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg">TalentHub</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                La plataforma de reclutamiento inteligente que transforma datos en decisiones.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Características</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Precios</a></li>
                <li><a href="/marketplace" className="hover:text-primary transition-colors">Marketplace</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Acerca de</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 TalentHub. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
