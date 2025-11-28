import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useScrollDirection } from "@/hooks/useScrollDirection";
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
  Instagram,
  Check,
  Zap
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const scrollDirection = useScrollDirection();

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

  const pricingPlans = [
    {
      name: "Básico",
      price: "49",
      period: "mes",
      description: "Perfecto para empresas pequeñas que inician",
      popular: false,
      features: [
        "Hasta 5 vacantes activas",
        "Publicación en Marketplace",
        "Dashboard básico de KPIs",
        "Soporte por email",
        "1 usuario administrador",
        "Análisis básico de CVs con IA"
      ]
    },
    {
      name: "Profesional",
      price: "149",
      period: "mes",
      description: "Ideal para empresas en crecimiento",
      popular: true,
      features: [
        "Hasta 20 vacantes activas",
        "Publicaciones destacadas",
        "Analytics avanzado con IA",
        "Soporte prioritario 24/7",
        "Hasta 5 usuarios",
        "Predicción de éxito de candidatos",
        "Integración con reclutadores freelance",
        "Pool de candidatos premium",
        "Reportes personalizados"
      ]
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Solución completa para grandes corporativos",
      popular: false,
      features: [
        "Vacantes ilimitadas",
        "IA personalizada para tu industria",
        "Account manager dedicado",
        "Onboarding y capacitación",
        "Usuarios ilimitados",
        "API access completo",
        "Integraciones personalizadas",
        "SLA garantizado",
        "Cumplimiento y seguridad enterprise"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navbar */}
      <header className={`border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 transition-transform duration-300 ${
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
      }`}>
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
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Precios
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

      {/* Recruiter Profile Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4 shadow-lg">
                <Award className="h-4 w-4 mr-2" />
                Para Reclutadores
              </Badge>
              <h3 className="text-3xl md:text-5xl font-bold mb-6">
                Tu Perfil, Tu Prestigio, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Siempre Contigo</span>
              </h3>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                En VVGI, tu perfil profesional es tuyo para siempre. Construye tu reputación, acumula indicadores y mantén tu prestigio sin importar con qué empresa trabajes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2 border-primary/30 bg-background/80 backdrop-blur-sm hover:shadow-2xl transition-all group">
                <CardContent className="pt-8 pb-6 space-y-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold">100% Gratis</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Tu perfil de reclutador es completamente gratuito. Sin costos ocultos, sin límites de tiempo.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-accent/30 bg-background/80 backdrop-blur-sm hover:shadow-2xl transition-all group scale-105">
                <CardContent className="pt-8 pb-6 space-y-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-8 w-8 text-accent" />
                  </div>
                  <h4 className="text-xl font-bold">Tus Indicadores</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Todas tus métricas, vacantes cerradas y calificaciones se acumulan en tu perfil personal.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-background/80 backdrop-blur-sm hover:shadow-2xl transition-all group">
                <CardContent className="pt-8 pb-6 space-y-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold">Tu Prestigio</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Cambia de empresa cuando quieras. Tu reputación, ranking y logros te acompañan siempre.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Rocket className="h-10 w-10 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-2xl font-bold mb-2">Libertad Total para Reclutadores</h4>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Trabaja con múltiples empresas, construye tu portafolio y haz crecer tu carrera profesional. 
                      En VVGI, tú eres dueño de tu éxito, no la empresa para la que trabajas.
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={() => navigate("/auth")} 
                    className="shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 transition-all shrink-0"
                  >
                    Crear Mi Perfil Gratis
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Zap className="h-4 w-4 mr-2" />
              Planes y Precios
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Elige el Plan Perfecto para tu Negocio
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Precios transparentes y flexibles que crecen con tu empresa. Sin sorpresas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative overflow-hidden transition-all hover:shadow-2xl ${
                  plan.popular 
                    ? 'border-2 border-primary shadow-xl scale-105 md:scale-110' 
                    : 'border-2 hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-bl-lg">
                    MÁS POPULAR
                  </div>
                )}
                <CardContent className="pt-8 pb-8 space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      {plan.price !== "Custom" ? (
                        <>
                          <span className="text-4xl font-bold text-primary">${plan.price}</span>
                          <span className="text-muted-foreground">/ {plan.period}</span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold text-primary">Contactar</span>
                      )}
                    </div>
                  </div>

                  <Button 
                    className={`w-full ${plan.popular ? 'shadow-lg shadow-primary/40' : ''}`}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() => navigate("/auth")}
                  >
                    {plan.price !== "Custom" ? "Comenzar Ahora" : "Contactar Ventas"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <div className="space-y-3 pt-4">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Todos los planes incluyen acceso al Marketplace y actualizaciones gratuitas
            </p>
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