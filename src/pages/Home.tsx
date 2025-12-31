import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Facebook,
  Youtube,
  Check,
  Zap,
  Shield,
  Clock,
  Building2,
  UserCheck,
  Briefcase,
  Heart,
  Globe,
  Phone,
  Gift,
  Crown,
  Timer,
  PartyPopper,
  Loader2
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const scrollDirection = useScrollDirection();
  
  // Waiting list state
  const [waitlistForm, setWaitlistForm] = useState({
    nombre: "",
    email: "",
    whatsapp: "",
    perfilInteres: ""
  });
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  
  // Countdown state
  const launchDate = new Date("2026-03-29T00:00:00");
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setCountdown({ days, hours, minutes, seconds });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!waitlistForm.nombre || !waitlistForm.email || !waitlistForm.perfilInteres) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }
    
    setIsSubmittingWaitlist(true);
    
    try {
      const { error } = await supabase
        .from('lista_espera_lanzamiento')
        .insert({
          nombre: waitlistForm.nombre.trim(),
          email: waitlistForm.email.trim().toLowerCase(),
          whatsapp: waitlistForm.whatsapp.trim() || null,
          perfil_interes: waitlistForm.perfilInteres,
          fuente: 'landing'
        });
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error("Este correo ya está registrado en la lista de espera");
        } else {
          throw error;
        }
        return;
      }
      
      toast.success("¡Bienvenido a la lista VIP!", {
        description: "Te avisaremos antes que a nadie con beneficios exclusivos."
      });
      
      setWaitlistForm({ nombre: "", email: "", whatsapp: "", perfilInteres: "" });
    } catch (error) {
      console.error("Error registering to waitlist:", error);
      toast.error("Error al registrarse. Intenta de nuevo.");
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

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
      label: "Reducción en tiempo de contratación"
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

  const whyVVGI = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Seguridad Empresarial",
      description: "Datos encriptados, cumplimiento normativo y protección de información sensible bajo estándares internacionales."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Soporte Experto",
      description: "Equipo especializado en reclutamiento disponible para asesorarte en cada paso del proceso."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Cobertura LATAM",
      description: "Plataforma diseñada para el mercado latinoamericano con entendimiento de regulaciones locales."
    },
    {
      icon: <Building2 className="h-8 w-8" />,
      title: "Flexibilidad Total",
      description: "Adaptable a empresas de cualquier tamaño: desde startups hasta grandes corporativos."
    }
  ];

  const testimonials = [
    {
      quote: "VVGI redujo nuestro tiempo de contratación de 45 a 15 días. La IA realmente hace la diferencia.",
      author: "María González",
      role: "Directora de RRHH",
      company: "TechMex Solutions"
    },
    {
      quote: "Como reclutador freelance, VVGI me permite trabajar con múltiples empresas sin perder mi historial profesional.",
      author: "Carlos Mendoza",
      role: "Reclutador Senior",
      company: "Independiente"
    },
    {
      quote: "El marketplace nos conectó con candidatos de alta calidad que no encontrábamos en otras plataformas.",
      author: "Ana Martínez",
      role: "CEO",
      company: "InnovaGroup"
    }
  ];

  const pricingPlans = [
    {
      name: "Básico",
      price: "49",
      currency: "USD",
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
      currency: "USD",
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
      price: "Personalizado",
      currency: "",
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
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={vvgiLogo} alt="VVGI Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">VVGI</h1>
              <p className="text-xs text-muted-foreground">Reclutamiento Inteligente</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#soluciones" className="text-sm font-medium hover:text-primary transition-colors">
              Soluciones
            </a>
            <a href="#porque-vvgi" className="text-sm font-medium hover:text-primary transition-colors">
              ¿Por Qué VVGI?
            </a>
            <a href="#precios" className="text-sm font-medium hover:text-primary transition-colors">
              Precios
            </a>
            <a href="#contacto" className="text-sm font-medium hover:text-primary transition-colors">
              Contacto
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate("/auth")} className="shadow-lg shadow-primary/30">
              Registrarse Gratis
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
            {/* Prominent Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl blur-2xl scale-150" />
                <img 
                  src={vvgiLogo} 
                  alt="VVGI Logo" 
                  className="h-28 w-28 md:h-36 md:w-36 object-contain relative z-10 drop-shadow-2xl" 
                />
              </div>
            </div>

            <Badge variant="secondary" className="mb-4 shadow-lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Plataforma de Reclutamiento con IA
            </Badge>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Conectamos <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">Talento</span> con <span className="bg-gradient-to-r from-accent via-accent/80 to-primary bg-clip-text text-transparent">Oportunidades</span>
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              VVGI es la plataforma líder en Latinoamérica que conecta empresas, reclutadores y candidatos 
              con inteligencia artificial de última generación. Optimiza tu proceso de contratación y encuentra 
              el talento ideal en tiempo récord.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" onClick={() => document.getElementById('waitlist-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-lg px-8 shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 transition-all">
                <Rocket className="h-5 w-5 mr-2" />
                Únete a la Lista VIP
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/marketplace")} className="text-lg px-8">
                Explorar Vacantes
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center p-4 rounded-xl bg-card/50 backdrop-blur-sm border">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{benefit.metric}</div>
                  <div className="text-sm text-muted-foreground">{benefit.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section - Launch Countdown */}
      <section id="waitlist-section" className="py-16 border-y bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            {/* VIP Badge */}
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4 shadow-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-600 border-amber-500/30">
                <Crown className="h-4 w-4 mr-2" />
                Acceso VIP Exclusivo
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Sé de los <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Primeros en Acceder</span>
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Regístrate ahora y obtén <span className="font-semibold text-primary">descuentos exclusivos</span> y 
                <span className="font-semibold text-accent"> beneficios especiales</span> en nuestro lanzamiento oficial.
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="flex justify-center gap-4 md:gap-8 mb-10">
              <div className="text-center">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30">
                  <span className="text-3xl md:text-4xl font-bold text-primary-foreground">{countdown.days}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Días</p>
              </div>
              <div className="text-center">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-xl shadow-accent/30">
                  <span className="text-3xl md:text-4xl font-bold text-accent-foreground">{countdown.hours}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Horas</p>
              </div>
              <div className="text-center">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center shadow-xl">
                  <span className="text-3xl md:text-4xl font-bold text-primary-foreground">{countdown.minutes}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Minutos</p>
              </div>
              <div className="text-center">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-to-br from-accent/80 to-primary/80 flex items-center justify-center shadow-xl">
                  <span className="text-3xl md:text-4xl font-bold text-accent-foreground">{countdown.seconds}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Segundos</p>
              </div>
            </div>

            <p className="text-center text-muted-foreground mb-8">
              <Timer className="h-4 w-4 inline-block mr-2" />
              Lanzamiento oficial: <span className="font-semibold text-foreground">29 de Marzo, 2026</span>
            </p>

            {/* Registration Form */}
            <Card className="border-2 border-primary/30 shadow-2xl bg-card/95 backdrop-blur-sm max-w-2xl mx-auto overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              <CardContent className="pt-8 pb-8 px-6 md:px-8">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Gift className="h-6 w-6 text-primary" />
                  <h4 className="text-xl font-bold text-center">Únete a la Lista de Espera VIP</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Descuentos de lanzamiento</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Acceso anticipado exclusivo</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Contenido premium gratuito</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Soporte prioritario</span>
                  </div>
                </div>

                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="waitlist-nombre" className="text-sm font-medium">
                        Nombre completo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="waitlist-nombre"
                        placeholder="Tu nombre"
                        value={waitlistForm.nombre}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, nombre: e.target.value }))}
                        required
                        className="border-2 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waitlist-email" className="text-sm font-medium">
                        Correo electrónico <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="waitlist-email"
                        type="email"
                        placeholder="tu@correo.com"
                        value={waitlistForm.email}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="border-2 focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="waitlist-whatsapp" className="text-sm font-medium">
                        WhatsApp (opcional)
                      </Label>
                      <Input
                        id="waitlist-whatsapp"
                        type="tel"
                        placeholder="+52 55 1234 5678"
                        value={waitlistForm.whatsapp}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                        className="border-2 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waitlist-perfil" className="text-sm font-medium">
                        ¿Cuál es tu perfil? <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={waitlistForm.perfilInteres}
                        onValueChange={(value) => setWaitlistForm(prev => ({ ...prev, perfilInteres: value }))}
                        required
                      >
                        <SelectTrigger className="border-2 focus:border-primary">
                          <SelectValue placeholder="Selecciona tu perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="empresa">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Empresa
                            </div>
                          </SelectItem>
                          <SelectItem value="reclutador">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Reclutador
                            </div>
                          </SelectItem>
                          <SelectItem value="candidato">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              Candidato
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 transition-all text-lg"
                    disabled={isSubmittingWaitlist}
                  >
                    {isSubmittingWaitlist ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <PartyPopper className="h-5 w-5 mr-2" />
                        ¡Quiero Mi Acceso VIP!
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Al registrarte aceptas recibir comunicaciones sobre el lanzamiento. Sin spam, lo prometemos.
                </p>
              </CardContent>
            </Card>

            {/* Urgency message */}
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">+500 personas</span> ya se han registrado. 
                Los primeros 1,000 recibirán un <span className="font-semibold text-accent">30% de descuento permanente</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="soluciones" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Users className="h-4 w-4 mr-2" />
              Soluciones
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Una Plataforma, Tres Beneficiarios
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              VVGI ofrece herramientas especializadas para cada actor del proceso de reclutamiento.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* For Companies */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
              <CardContent className="pt-8 pb-6 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Building2 className="h-8 w-8" />
                </div>
                <h4 className="text-2xl font-bold">Para Empresas</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Gestiona tu proceso de reclutamiento de principio a fin con herramientas potenciadas por IA.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Dashboard de KPIs en tiempo real
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Publicación en Marketplace
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Gestión de reclutadores
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Análisis predictivo de demanda
                  </li>
                </ul>
                <Button className="w-full mt-4" onClick={() => navigate("/auth")}>
                  Registrar mi Empresa
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* For Recruiters */}
            <Card className="border-2 border-accent/50 hover:border-accent transition-all hover:shadow-2xl group relative overflow-hidden scale-105">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/50" />
              <div className="absolute top-4 right-4">
                <Badge className="bg-accent text-accent-foreground">Popular</Badge>
              </div>
              <CardContent className="pt-8 pb-6 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <UserCheck className="h-8 w-8" />
                </div>
                <h4 className="text-2xl font-bold">Para Reclutadores</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Tu perfil profesional es tuyo para siempre. Construye tu reputación y trabaja con múltiples empresas.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    Perfil 100% gratuito
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    Indicadores portables
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    Ranking profesional
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    Acceso a pool de candidatos
                  </li>
                </ul>
                <Button className="w-full mt-4 bg-accent hover:bg-accent/90" onClick={() => navigate("/auth")}>
                  Crear Mi Perfil Gratis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* For Candidates */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary" />
              <CardContent className="pt-8 pb-6 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h4 className="text-2xl font-bold">Para Candidatos</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Encuentra tu próxima oportunidad laboral con recomendaciones personalizadas por IA.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Perfil profesional gratuito
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Matching inteligente
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Seguimiento de postulaciones
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Feedback de entrevistas
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/marketplace")}>
                  Explorar Vacantes
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 bg-muted/30">
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

      {/* Features Grid Section */}
      <section className="py-20">
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
              Herramientas completas para gestionar todo el ciclo de reclutamiento.
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

      {/* Why VVGI Section */}
      <section id="porque-vvgi" className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Award className="h-4 w-4 mr-2" />
              ¿Por Qué VVGI?
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              La Diferencia que Nos Define
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Más que una plataforma, somos tu socio estratégico en la búsqueda del mejor talento.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyVVGI.map((item, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/30 transition-all hover:shadow-xl group">
                <CardContent className="pt-8 pb-6 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform text-primary">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-bold">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-4 w-4 mr-2" />
              Testimonios
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Lo que Dicen Nuestros Usuarios
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:shadow-xl transition-all">
                <CardContent className="pt-6 pb-6 space-y-4">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic leading-relaxed">"{testimonial.quote}"</p>
                  <div className="pt-4 border-t">
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm text-primary">{testimonial.company}</p>
                  </div>
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
      <section id="precios" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Zap className="h-4 w-4 mr-2" />
              Planes y Precios
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Inversión que Se Paga Sola
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Precios transparentes y flexibles que crecen con tu empresa. Sin sorpresas ni costos ocultos.
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
                      {plan.price !== "Personalizado" ? (
                        <>
                          <span className="text-4xl font-bold text-primary">${plan.price}</span>
                          <span className="text-muted-foreground">{plan.currency} / {plan.period}</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-primary">Contactar Ventas</span>
                      )}
                    </div>
                  </div>

                  <Button 
                    className={`w-full ${plan.popular ? 'shadow-lg shadow-primary/40' : ''}`}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() => navigate("/auth")}
                  >
                    {plan.price !== "Personalizado" ? "Comenzar Ahora" : "Agendar Demo"}
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
              Todos los planes incluyen acceso al Marketplace, actualizaciones gratuitas y soporte técnico.
              <br />
              ¿Necesitas un plan personalizado? <a href="mailto:admin@vvgi.com.mx" className="text-primary hover:underline">Contáctanos</a>
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
                ¿Listo para Transformar tu Reclutamiento?
              </h2>
              <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto leading-relaxed">
                Únete a cientos de empresas en Latinoamérica que ya optimizan sus procesos con nuestra plataforma impulsada por IA
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Comenzar Ahora — Es Gratis
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/marketplace")}
                  className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Ver Demo del Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Mail className="h-4 w-4 mr-2" />
              Contacto
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Tienes Preguntas? Estamos para Ayudarte
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Nuestro equipo está listo para asesorarte y resolver todas tus dudas.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="border-2 hover:border-primary/50 transition-all">
                <CardContent className="pt-6 pb-6 text-center">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">Email</h4>
                  <a href="mailto:admin@vvgi.com.mx" className="text-primary hover:underline">
                    admin@vvgi.com.mx
                  </a>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary/50 transition-all">
                <CardContent className="pt-6 pb-6 text-center">
                  <Phone className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">Teléfono</h4>
                  <p className="text-muted-foreground">Próximamente</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={vvgiLogo} alt="VVGI Logo" className="h-10 w-10 object-contain" />
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">VVGI</h3>
                  <p className="text-xs text-muted-foreground">Reclutamiento Inteligente</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Transformamos el reclutamiento en Latinoamérica con inteligencia artificial de última generación.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#soluciones" className="hover:text-primary transition-colors">Soluciones</a></li>
                <li><a href="#porque-vvgi" className="hover:text-primary transition-colors">¿Por Qué VVGI?</a></li>
                <li><a href="#precios" className="hover:text-primary transition-colors">Precios</a></li>
                <li><a href="/marketplace" className="hover:text-primary transition-colors">Marketplace</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Casos de Éxito</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
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
                  <a 
                    href="https://www.linkedin.com/company/vvgi" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="h-10 w-10 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors group"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  </a>
                  <a 
                    href="https://www.facebook.com/vvgioficial" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="h-10 w-10 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors group"
                    title="Facebook"
                  >
                    <Facebook className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  </a>
                  <a 
                    href="https://www.youtube.com/@VVGIReclutamiento" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="h-10 w-10 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors group"
                    title="YouTube"
                  >
                    <Youtube className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-8">
            {/* Main Footer Message */}
            <div className="text-center mb-6">
              <p className="text-base text-muted-foreground">
                Hecho en México con <Heart className="h-4 w-4 inline-block text-red-500 fill-red-500 mx-1" /> para toda Latinoamérica
              </p>
            </div>
            
            {/* Copyright and Links */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2025 VVGI. Todos los derechos reservados. Un proyecto de <span className="font-semibold text-foreground">Israel Manrique</span>
              </p>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">Aviso de Privacidad</a>
                <a href="#" className="hover:text-primary transition-colors">Términos y Condiciones</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
