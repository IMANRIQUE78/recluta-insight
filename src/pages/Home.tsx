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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">VVGI Light</h1>
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 py-24 md:py-40 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <Badge variant="outline" className="text-sm px-4 py-2 border-primary/20 bg-primary/5 backdrop-blur-sm">
              <Star className="h-3 w-3 mr-2 fill-primary text-primary animate-pulse" />
              Plataforma #1 de Reclutamiento Inteligente
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              Transforma tu proceso de{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Reclutamiento
              </span>{" "}
              con datos
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              La plataforma todo-en-uno que necesitas para gestionar vacantes, 
              conectar con talento y tomar decisiones basadas en métricas reales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Comenzar Ahora
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/marketplace")} 
                className="w-full sm:w-auto border-2 hover:bg-primary/5 transition-all duration-300"
              >
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
      <section id="benefits" className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Resultados que hablan por sí solos
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empresas líderes confían en nosotros para optimizar sus procesos
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => (
              <Card 
                key={idx} 
                className="text-center border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-card to-card/80"
              >
                <CardContent className="pt-8 pb-6">
                  <div className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent mb-3">
                    {benefit.metric}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {benefit.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Herramientas poderosas diseñadas para modernizar tu reclutamiento
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <Card 
                key={idx} 
                className="border border-border/50 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group bg-gradient-to-br from-card to-card/80"
              >
                <CardContent className="pt-8 pb-6">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--accent)/0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 relative">
          <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
            <CardContent className="pt-16 pb-16 text-center relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                ¿Listo para revolucionar tu reclutamiento?
              </h2>
              <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto leading-relaxed">
                Únete a cientos de empresas que ya optimizan sus procesos con nuestra plataforma
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Comenzar Prueba Gratuita
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-white/30 text-white transition-all duration-300 hover:scale-105"
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
      <footer className="border-t py-16 bg-gradient-to-b from-muted/30 to-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">VVGI Light</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La plataforma de reclutamiento inteligente que transforma datos en decisiones.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Producto</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Características</a></li>
                <li><a href="#benefits" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Beneficios</a></li>
                <li><a href="/marketplace" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Marketplace</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Empresa</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="/auth" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Acerca de</a></li>
                <li><a href="/auth" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Blog</a></li>
                <li><a href="/auth" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="/auth" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Privacidad</a></li>
                <li><a href="/auth" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Términos</a></li>
                <li><a href="/auth" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            © 2025 VVGI Light. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
