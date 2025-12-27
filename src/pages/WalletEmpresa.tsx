import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Users,
  FileText,
  Brain,
  Eye,
  Briefcase,
  UserCheck,
  Gift,
  AlertCircle,
  CheckCircle2,
  UserPlus
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AsignarCreditosReclutadorDialog } from "@/components/wallet/AsignarCreditosReclutadorDialog";

interface WalletData {
  id: string;
  empresa_id: string;
  creditos_disponibles: number;
  creditos_totales_comprados: number;
  creditos_heredados_totales: number;
}

interface Movimiento {
  id: string;
  tipo_accion: string;
  creditos_cantidad: number;
  creditos_antes: number;
  creditos_despues: number;
  descripcion: string;
  created_at: string;
  origen_pago: string;
  metodo: string;
  vacante_id: string | null;
  candidato_user_id: string | null;
  reclutador_user_id: string;
}

const tipoAccionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  compra_creditos: { label: "Compra de créditos", icon: <CreditCard className="h-4 w-4" />, color: "text-green-600" },
  publicacion_vacante: { label: "Publicación de vacante", icon: <Briefcase className="h-4 w-4" />, color: "text-blue-600" },
  acceso_pool_candidatos: { label: "Acceso a pool", icon: <Users className="h-4 w-4" />, color: "text-purple-600" },
  descarga_cv: { label: "Descarga de CV", icon: <FileText className="h-4 w-4" />, color: "text-orange-600" },
  contacto_candidato: { label: "Contacto candidato", icon: <UserCheck className="h-4 w-4" />, color: "text-cyan-600" },
  estudio_socioeconomico: { label: "Estudio socioeconómico", icon: <Eye className="h-4 w-4" />, color: "text-indigo-600" },
  evaluacion_psicometrica: { label: "Evaluación psicométrica", icon: <Brain className="h-4 w-4" />, color: "text-pink-600" },
  sourcing_ia: { label: "Sourcing IA", icon: <Brain className="h-4 w-4" />, color: "text-violet-600" },
  herencia_creditos: { label: "Asignación a reclutador", icon: <Gift className="h-4 w-4" />, color: "text-amber-600" },
  devolucion_creditos: { label: "Devolución", icon: <ArrowDownLeft className="h-4 w-4" />, color: "text-green-600" },
  ajuste_manual: { label: "Ajuste manual", icon: <AlertCircle className="h-4 w-4" />, color: "text-gray-600" },
  expiracion_creditos: { label: "Expiración", icon: <AlertCircle className="h-4 w-4" />, color: "text-red-600" }
};

const WalletEmpresa = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [periodoFiltro, setPeriodoFiltro] = useState<string>("30");
  
  // Compra de créditos
  const [cantidadCompra, setCantidadCompra] = useState<number>(100);
  const [comprando, setComprando] = useState(false);
  
  // Dialog asignar créditos
  const [asignarDialogOpen, setAsignarDialogOpen] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    totalGastado: 0,
    totalComprado: 0,
    totalAsignado: 0
  });

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    if (empresaId) {
      loadMovimientos();
    }
  }, [empresaId, tipoFiltro, periodoFiltro]);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (!userRole?.empresa_id) {
        toast.error("No tienes acceso a la wallet de empresa");
        navigate("/dashboard");
        return;
      }

      setEmpresaId(userRole.empresa_id);

      let { data: walletData } = await supabase
        .from("wallet_empresa")
        .select("*")
        .eq("empresa_id", userRole.empresa_id)
        .maybeSingle();

      if (!walletData) {
        const { data: newWallet } = await supabase
          .from("wallet_empresa")
          .insert({ empresa_id: userRole.empresa_id })
          .select()
          .single();
        walletData = newWallet;
      }

      if (walletData) {
        setWallet(walletData);
      }
    } catch (error) {
      console.error("Error loading wallet:", error);
      toast.error("Error al cargar la wallet");
    } finally {
      setLoading(false);
    }
  };

  const loadMovimientos = async () => {
    if (!empresaId) return;

    try {
      let query = supabase
        .from("movimientos_creditos")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });

      // Filtro por periodo
      if (periodoFiltro !== "todos") {
        const diasAtras = parseInt(periodoFiltro);
        const fechaInicio = subDays(new Date(), diasAtras).toISOString();
        query = query.gte("created_at", fechaInicio);
      }

      // Filtro por tipo
      if (tipoFiltro !== "todos") {
        query = query.eq("tipo_accion", tipoFiltro as any);
      }

      const { data } = await query.limit(500);

      if (data) {
        setMovimientos(data);
        
        // Calcular estadísticas
        const gastado = data
          .filter(m => m.creditos_cantidad < 0 && m.tipo_accion !== "herencia_creditos")
          .reduce((acc, m) => acc + Math.abs(m.creditos_cantidad), 0);
        
        const comprado = data
          .filter(m => m.tipo_accion === "compra_creditos")
          .reduce((acc, m) => acc + m.creditos_cantidad, 0);
        
        const asignado = data
          .filter(m => m.tipo_accion === "herencia_creditos")
          .reduce((acc, m) => acc + Math.abs(m.creditos_cantidad), 0);

        setStats({ totalGastado: gastado, totalComprado: comprado, totalAsignado: asignado });
      }
    } catch (error) {
      console.error("Error loading movimientos:", error);
    }
  };

  const handleComprarCreditos = async () => {
    if (!wallet || !empresaId || cantidadCompra <= 0) return;

    setComprando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Registrar el movimiento
      const { error: movError } = await supabase.rpc("registrar_movimiento_creditos", {
        p_origen_pago: "empresa",
        p_wallet_empresa_id: wallet.id,
        p_wallet_reclutador_id: null,
        p_empresa_id: empresaId,
        p_reclutador_user_id: user.id,
        p_tipo_accion: "compra_creditos",
        p_creditos_cantidad: cantidadCompra,
        p_descripcion: `Compra de ${cantidadCompra} créditos`,
        p_metodo: "manual"
      });

      if (movError) throw movError;

      // Actualizar wallet
      const { error: walletError } = await supabase
        .from("wallet_empresa")
        .update({
          creditos_disponibles: wallet.creditos_disponibles + cantidadCompra,
          creditos_totales_comprados: wallet.creditos_totales_comprados + cantidadCompra
        })
        .eq("id", wallet.id);

      if (walletError) throw walletError;

      toast.success(`Se compraron ${cantidadCompra} créditos exitosamente`);
      loadWallet();
      loadMovimientos();
      setCantidadCompra(100);
    } catch (error) {
      console.error("Error comprando créditos:", error);
      toast.error("Error al comprar créditos");
    } finally {
      setComprando(false);
    }
  };

  const filteredMovimientos = movimientos.filter(m => 
    m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipoAccionConfig[m.tipo_accion]?.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Wallet className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Wallet de Empresa</h1>
                  <p className="text-sm text-muted-foreground">Gestión de créditos y estado de cuenta</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => { loadWallet(); loadMovimientos(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Balance y Compra */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Balance Principal */}
          <Card className="lg:col-span-2 border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                Balance de Créditos
              </CardTitle>
              <CardDescription>Resumen de tu cuenta de créditos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="text-center p-6 rounded-xl bg-background border-2 border-amber-500/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Disponibles
                  </p>
                  <p className="text-5xl font-bold text-amber-600">
                    {wallet?.creditos_disponibles?.toLocaleString() ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">créditos</p>
                </div>
                
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Total Comprados
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {wallet?.creditos_totales_comprados?.toLocaleString() ?? 0}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>Histórico</span>
                  </div>
                </div>
                
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Asignados a Reclutadores
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {wallet?.creditos_heredados_totales?.toLocaleString() ?? 0}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs text-blue-600">
                    <Users className="h-3 w-3" />
                    <span>Distribuidos</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => setAsignarDialogOpen(true)}
                  disabled={!wallet || wallet.creditos_disponibles <= 0}
                >
                  <UserPlus className="h-4 w-4" />
                  Asignar Créditos a Reclutador
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Compra de Créditos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Comprar Créditos
              </CardTitle>
              <CardDescription>Agrega créditos a tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cantidad de créditos</Label>
                <Input
                  type="number"
                  min={1}
                  value={cantidadCompra}
                  onChange={(e) => setCantidadCompra(parseInt(e.target.value) || 0)}
                  className="text-lg font-medium"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((cantidad) => (
                  <Button
                    key={cantidad}
                    variant="outline"
                    size="sm"
                    onClick={() => setCantidadCompra(cantidad)}
                    className={cantidadCompra === cantidad ? "border-primary bg-primary/10" : ""}
                  >
                    {cantidad}
                  </Button>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Precio estimado:</span>
                <span className="font-bold">${(cantidadCompra * 10).toLocaleString()} MXN</span>
              </div>

              <Button 
                className="w-full gap-2" 
                onClick={handleComprarCreditos}
                disabled={comprando || cantidadCompra <= 0}
              >
                {comprando ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirmar Compra
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas del Periodo */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-red-500/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Consumido</p>
                  <p className="text-2xl font-bold text-red-600">{stats.totalGastado.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-full bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Comprado</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalComprado.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Asignado</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalAsignado.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estado de Cuenta */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Estado de Cuenta
                </CardTitle>
                <CardDescription>Historial completo de movimientos de créditos</CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid gap-3 sm:grid-cols-4 mt-4">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en movimientos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="compra_creditos">Compras</SelectItem>
                  <SelectItem value="publicacion_vacante">Publicaciones</SelectItem>
                  <SelectItem value="estudio_socioeconomico">Estudios</SelectItem>
                  <SelectItem value="sourcing_ia">Sourcing IA</SelectItem>
                  <SelectItem value="herencia_creditos">Asignaciones</SelectItem>
                  <SelectItem value="contacto_candidato">Contactos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                  <SelectItem value="365">Último año</SelectItem>
                  <SelectItem value="todos">Todo el historial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px]">Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Anterior</TableHead>
                    <TableHead className="text-right">Movimiento</TableHead>
                    <TableHead className="text-right">Nuevo Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No hay movimientos en el periodo seleccionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovimientos.map((mov) => {
                      const config = tipoAccionConfig[mov.tipo_accion] || { 
                        label: mov.tipo_accion, 
                        icon: <AlertCircle className="h-4 w-4" />, 
                        color: "text-gray-600" 
                      };
                      const isPositive = mov.creditos_cantidad > 0;
                      
                      return (
                        <TableRow key={mov.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-md bg-muted ${config.color}`}>
                                {config.icon}
                              </div>
                              <span className="font-medium text-sm">{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {mov.descripcion}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {mov.creditos_antes?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={isPositive ? "default" : "destructive"}
                              className={`font-mono ${isPositive ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"}`}
                            >
                              {isPositive ? (
                                <ArrowDownLeft className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                              )}
                              {isPositive ? "+" : ""}{mov.creditos_cantidad?.toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {mov.creditos_despues?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {filteredMovimientos.length > 0 && (
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>Mostrando {filteredMovimientos.length} movimientos</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog Asignar Créditos */}
      {wallet && empresaId && (
        <AsignarCreditosReclutadorDialog
          open={asignarDialogOpen}
          onOpenChange={setAsignarDialogOpen}
          empresaId={empresaId}
          walletEmpresaId={wallet.id}
          creditosDisponibles={wallet.creditos_disponibles}
          onSuccess={() => { loadWallet(); loadMovimientos(); }}
        />
      )}
    </div>
  );
};

export default WalletEmpresa;
