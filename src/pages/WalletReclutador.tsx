import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Wallet, CreditCard, Building2, TrendingUp, TrendingDown, Search, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CreditoHeredado {
  id: string;
  empresa_id: string;
  creditos_disponibles: number;
  creditos_totales_recibidos: number;
  empresa_nombre?: string;
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
  empresa_id: string | null;
}

export default function WalletReclutador() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [walletData, setWalletData] = useState<{
    id: string;
    creditos_propios: number;
    creditos_heredados: number;
    creditos_totales_comprados: number;
  } | null>(null);
  
  const [creditosHeredados, setCreditosHeredados] = useState<CreditoHeredado[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [reclutadorId, setReclutadorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  
  // Compra de créditos
  const [cantidadCompra, setCantidadCompra] = useState(10);
  const [comprando, setComprando] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Obtener perfil de reclutador
      const { data: perfil, error: perfilError } = await supabase
        .from("perfil_reclutador")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (perfilError || !perfil) {
        toast.error("No se encontró el perfil de reclutador");
        return;
      }

      setReclutadorId(perfil.id);

      // Obtener wallet
      const { data: wallet, error: walletError } = await supabase
        .from("wallet_reclutador")
        .select("*")
        .eq("reclutador_id", perfil.id)
        .single();

      if (walletError && walletError.code !== "PGRST116") {
        console.error("Error fetching wallet:", walletError);
      }

      if (wallet) {
        setWalletData(wallet);
      } else {
        // Crear wallet si no existe
        const { data: newWallet, error: createError } = await supabase
          .from("wallet_reclutador")
          .insert({ reclutador_id: perfil.id })
          .select()
          .single();

        if (!createError && newWallet) {
          setWalletData(newWallet);
        }
      }

      // Obtener créditos heredados por empresa
      const { data: heredados, error: heredadosError } = await supabase
        .from("creditos_heredados_reclutador")
        .select("*")
        .eq("reclutador_id", perfil.id);

      if (!heredadosError && heredados) {
        // Obtener nombres de empresas
        const empresaIds = heredados.map(h => h.empresa_id);
        if (empresaIds.length > 0) {
          const { data: empresas } = await supabase
            .from("empresas")
            .select("id, nombre_empresa")
            .in("id", empresaIds);

          const heredadosConNombre = heredados.map(h => ({
            ...h,
            empresa_nombre: empresas?.find(e => e.id === h.empresa_id)?.nombre_empresa || "Empresa desconocida"
          }));
          setCreditosHeredados(heredadosConNombre);
        }
      }

      // Obtener movimientos
      let query = supabase
        .from("movimientos_creditos")
        .select("*")
        .eq("reclutador_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (tipoFiltro !== "todos") {
        query = query.eq("tipo_accion", tipoFiltro as any);
      }

      const { data: movs, error: movsError } = await query;
      
      if (!movsError && movs) {
        setMovimientos(movs as Movimiento[]);
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleComprarCreditos = async () => {
    if (!user || !reclutadorId || !walletData) return;
    
    setComprando(true);
    try {
      // Actualizar wallet
      const nuevosCreditos = walletData.creditos_propios + cantidadCompra;
      const nuevoTotal = walletData.creditos_totales_comprados + cantidadCompra;

      const { error: updateError } = await supabase
        .from("wallet_reclutador")
        .update({
          creditos_propios: nuevosCreditos,
          creditos_totales_comprados: nuevoTotal
        })
        .eq("id", walletData.id);

      if (updateError) throw updateError;

      // Registrar movimiento
      const { error: movError } = await supabase
        .from("movimientos_creditos")
        .insert({
          origen_pago: "reclutador" as any,
          wallet_reclutador_id: walletData.id,
          reclutador_user_id: user.id,
          tipo_accion: "compra" as any,
          metodo: "manual" as any,
          creditos_cantidad: cantidadCompra,
          creditos_antes: walletData.creditos_propios,
          creditos_despues: nuevosCreditos,
          descripcion: `Compra de ${cantidadCompra} créditos propios`
        });

      if (movError) throw movError;

      toast.success(`Compra de ${cantidadCompra} créditos realizada`);
      fetchData();
      setCantidadCompra(10);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la compra");
    } finally {
      setComprando(false);
    }
  };

  const getTipoAccionBadge = (tipo: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      compra: { label: "Compra", variant: "default" },
      asignacion: { label: "Asignación", variant: "secondary" },
      consumo: { label: "Consumo", variant: "destructive" },
      devolucion: { label: "Devolución", variant: "outline" },
      transferencia: { label: "Transferencia", variant: "secondary" }
    };
    const c = config[tipo] || { label: tipo, variant: "outline" as const };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getOrigenBadge = (origen: string) => {
    if (origen === "empresa") {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">Empresa</Badge>;
    }
    return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Propio</Badge>;
  };

  const movimientosFiltrados = movimientos.filter(m => 
    busqueda === "" || m.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalHeredados = creditosHeredados.reduce((acc, c) => acc + c.creditos_disponibles, 0);
  const totalCreditos = (walletData?.creditos_propios || 0) + totalHeredados;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/reclutador-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Mi Wallet</h1>
              <p className="text-muted-foreground text-sm">Gestión de créditos y estado de cuenta</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Balance Principal */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Total Disponible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{totalCreditos}</div>
              <p className="text-sm text-muted-foreground mt-1">créditos totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Créditos Propios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{walletData?.creditos_propios || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">uso libre en cualquier vacante</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Créditos Heredados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalHeredados}</div>
              <p className="text-sm text-muted-foreground mt-1">restringidos por empresa</p>
            </CardContent>
          </Card>
        </div>

        {/* Créditos Heredados por Empresa */}
        {creditosHeredados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Créditos por Empresa
              </CardTitle>
              <CardDescription>
                Estos créditos solo pueden usarse en vacantes de la empresa que los otorgó
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {creditosHeredados.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div>
                      <p className="font-medium text-sm">{ch.empresa_nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Recibidos: {ch.creditos_totales_recibidos}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">{ch.creditos_disponibles}</div>
                      <p className="text-xs text-muted-foreground">disponibles</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Comprar Créditos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Comprar Créditos
              </CardTitle>
              <CardDescription>
                Los créditos comprados son de uso libre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cantidad de créditos</Label>
                <Input
                  type="number"
                  min={1}
                  value={cantidadCompra}
                  onChange={(e) => setCantidadCompra(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span>Créditos</span>
                  <span>{cantidadCompra}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Precio unitario</span>
                  <span>$50 MXN</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${(cantidadCompra * 50).toLocaleString()} MXN</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleComprarCreditos}
                disabled={comprando || cantidadCompra < 1}
              >
                {comprando ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Comprar Créditos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {walletData?.creditos_totales_comprados || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Total comprados</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <Building2 className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {creditosHeredados.reduce((acc, c) => acc + c.creditos_totales_recibidos, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total recibidos</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-500/10">
                  <TrendingDown className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    {movimientos.filter(m => m.tipo_accion === "consumo").reduce((acc, m) => acc + Math.abs(m.creditos_cantidad), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total consumidos</p>
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
                <CardTitle className="text-lg">Estado de Cuenta</CardTitle>
                <CardDescription>Historial de movimientos de créditos</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="compra">Compras</SelectItem>
                    <SelectItem value="asignacion">Asignaciones</SelectItem>
                    <SelectItem value="consumo">Consumos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Antes</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Después</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay movimientos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientosFiltrados.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(mov.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>{getTipoAccionBadge(mov.tipo_accion)}</TableCell>
                        <TableCell>{getOrigenBadge(mov.origen_pago)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{mov.descripcion}</TableCell>
                        <TableCell className="text-right font-mono">{mov.creditos_antes}</TableCell>
                        <TableCell className={`text-right font-mono font-bold ${
                          mov.creditos_cantidad > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {mov.creditos_cantidad > 0 ? "+" : ""}{mov.creditos_cantidad}
                        </TableCell>
                        <TableCell className="text-right font-mono">{mov.creditos_despues}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
