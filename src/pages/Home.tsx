import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import vvgiLogo from "@/assets/vvgi-logo.png";
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  ArrowRight,
  Star,
  Brain,
  Sparkles,
  Rocket,
  Award,
  Mail,
  Linkedin,
  Twitter,
  Facebook,
  Instagram
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "IA para Reclutadores",
      description: "Asistente inteligente que analiza perfiles, sugiere candidatos ideales y automatiza la selección con precisión."
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "IA para Empresas",
      description: "Predicción de necesidades de personal, análisis de tendencias salariales y optimización de procesos de contratación."
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "IA para Candidatos",
      description: "Recomendaciones personalizadas de vacantes, optimización de perfiles y preparación inteligente para entrevistas."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "KPIs en Tiempo Real",
      description: "Dashboard inteligente con métricas clave, forecasts y análisis predictivo impulsado por IA."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Marketplace de Talento",
      description: "Matching inteligente entre candidatos y vacantes usando algoritmos de IA para mejores resultados."
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: "Automatización Total",
      description: "Desde la publicación hasta la contratación, la IA trabaja 24/7 optimizando cada paso del proceso."
    }
  ];

  const benefits = [
    {
      metric: "70%",
      label: "Reducción en tiempo con IA"
    },
    {
      metric: "5x",
      label: "Más matches precisos"
    },
    {
      metric: "80%",
      label: "Ahorro en costos operativos"
    },
    {
      metric: "98%",
      label: "Satisfacción del cliente"
    }
  ];

  const aiFeatures = [
    {
      title: "Análisis Inteligente de CVs",
      description: "La IA lee y evalúa miles de perfiles en segundos, identificando los mejores candidatos automáticamente.",
      icon: <Brain className="h-6 w-6 text-primary" />
    },
    {
      title: "Predicción de Éxito",
      description: "Algoritmos que predicen la probabilidad de éxito de cada candidato basándose en datos históricos.",
      icon: <Award className="h-6 w-6 text-primary" />
    },
    {
      title: "Asistente Virtual 24/7",
      description: "Chatbot inteligente que responde preguntas de candidatos y reclutadores en tiempo real.",
      icon: <Sparkles className="h-6 w-6 text-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navbar */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={vvgiLogo} alt="VVGI Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">VVGI</h1>
              <p className="text-xs text-muted-foreground">Powered by AI</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Características
            </a>
            <a href="#ai" className="text-sm font-medium hover:text-primary transition-colors">
              Inteligencia Artificial
            </a>
            <a href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">
              Beneficios
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate("/auth")} className="shadow-lg shadow-primary/30">
              Comenzar Gratis
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4 shadow-lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Impulsado por Inteligencia Artificial
            </Badge>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              La <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">Inteligencia Artificial</span> que Transforma el Reclutamiento
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              VVGI conecta a empresas, reclutadores y candidatos con tecnología de IA de última generación. 
              Optimiza cada paso del proceso, reduce costos y encuentra el talento perfecto en tiempo récord.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 transition-all">
                <Rocket className="h-5 w-5 mr-2" />
                Comenzar Ahora
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/marketplace")} className="text-lg px-8">
                Explorar Marketplace
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{benefit.metric}</div>
                  <div className="text-sm text-muted-foreground">{benefit.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="ai" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Brain className="h-4 w-4 mr-2" />
              Inteligencia Artificial
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              IA que Potencia Cada Decisión
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nuestra plataforma integra algoritmos avanzados de machine learning para automatizar, 
              optimizar y predecir resultados en tiempo real.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {aiFeatures.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-xl group">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-semibold">{feature.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="shadow-lg shadow-primary/30">
              Descubre el Poder de la IA
              <Sparkles className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-4 w-4 mr-2" />
              Funcionalidades
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que Necesitas en Una Plataforma
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desde reclutadores hasta empresas y candidatos, VVGI ofrece herramientas especializadas para cada rol.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all border-2 hover:border-primary/30 group">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-semibold">{feature.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
            <CardContent className="pt-16 pb-16 text-center relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                ¿Listo para Revolucionar tu Reclutamiento?
              </h2>
              <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto leading-relaxed">
                Únete a cientos de empresas que ya optimizan sus procesos con nuestra plataforma impulsada por IA
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
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
                  className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Ver Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={vvgiLogo} alt="VVGI Logo" className="h-10 w-10 object-contain" />
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">VVGI</h3>
                  <p className="text-xs text-muted-foreground">Powered by AI</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Transformamos el reclutamiento con inteligencia artificial
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Características</a></li>
                <li><a href="#ai" className="hover:text-primary transition-colors">Inteligencia Artificial</a></li>
                <li><a href="#benefits" className="hover:text-primary transition-colors">Beneficios</a></li>
                <li><a href="/marketplace" className="hover:text-primary transition-colors">Marketplace</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Casos de Éxito</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contacto</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <div className="space-y-3">
                <a href="mailto:admin@vvgi.com.mx" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-4 w-4" />
                  admin@vvgi.com.mx
                </a>
                <div className="flex gap-3 pt-2">
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Linkedin className="h-4 w-4 text-primary" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Twitter className="h-4 w-4 text-primary" />
                  </a>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Facebook className="h-4 w-4 text-primary" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Instagram className="h-4 w-4 text-primary" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 VVGI. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Términos</a>
              <a href="#" className="hover:text-primary transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}