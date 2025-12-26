import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History,
  Users,
  Plus,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  descripcion: string;
  created_at: string;
  origen_pago: string;
}

const tipoAccionLabels: Record<string, string> = {
  compra_creditos: "Compra de créditos",
  publicacion_vacante: "Publicación de vacante",
  acceso_pool_candidatos: "Acceso a pool",
  descarga_cv: "Descarga de CV",
  contacto_candidato: "Contacto candidato",
  estudio_socioeconomico: "Estudio socioeconómico",
  evaluacion_psicometrica: "Evaluación psicométrica",
  sourcing_ia: "Sourcing IA",
  herencia_creditos: "Herencia de créditos",
  devolucion_creditos: "Devolución",
  ajuste_manual: "Ajuste manual",
  expiracion_creditos: "Expiración"
};

export const WalletEmpresaCard = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener empresa_id del usuario
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (!userRole?.empresa_id) {
        setLoading(false);
        return;
      }

      setEmpresaId(userRole.empresa_id);

      // Obtener o crear wallet
      let { data: walletData } = await supabase
        .from("wallet_empresa")
        .select("*")
        .eq("empresa_id", userRole.empresa_id)
        .maybeSingle();

      if (!walletData) {
        // Crear wallet si no existe
        const { data: newWallet, error } = await supabase
          .from("wallet_empresa")
          .insert({ empresa_id: userRole.empresa_id })
          .select()
          .single();
        
        if (!error) {
          walletData = newWallet;
        }
      }

      if (walletData) {
        setWallet(walletData);

        // Obtener últimos movimientos
        const { data: movimientosData } = await supabase
          .from("movimientos_creditos")
          .select("*")
          .eq("empresa_id", userRole.empresa_id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (movimientosData) {
          setMovimientos(movimientosData);
        }
      }
    } catch (error) {
      console.error("Error loading wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Wallet Empresa</CardTitle>
              <CardDescription className="text-xs">Balance y movimientos</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={loadWallet}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Balance Principal */}
        <div className="text-center p-4 rounded-lg bg-background border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Créditos Disponibles
          </p>
          <p className="text-4xl font-bold text-amber-600">
            {wallet?.creditos_disponibles?.toLocaleString() ?? 0}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Comprados: {wallet?.creditos_totales_comprados?.toLocaleString() ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Heredados: {wallet?.creditos_heredados_totales?.toLocaleString() ?? 0}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Plus className="h-3 w-3" />
            Comprar Créditos
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Users className="h-3 w-3" />
            Asignar a Reclutador
          </Button>
        </div>

        <Separator />

        {/* Historial de Movimientos */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Últimos Movimientos</span>
          </div>
          
          <ScrollArea className="h-[200px]">
            {movimientos.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay movimientos registrados
              </div>
            ) : (
              <div className="space-y-2">
                {movimientos.map((mov) => (
                  <div 
                    key={mov.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {mov.creditos_cantidad > 0 ? (
                        <div className="p-1 rounded-full bg-green-500/10">
                          <ArrowDownLeft className="h-3 w-3 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-full bg-red-500/10">
                          <ArrowUpRight className="h-3 w-3 text-red-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium">
                          {tipoAccionLabels[mov.tipo_accion] || mov.tipo_accion}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(mov.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={mov.creditos_cantidad > 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {mov.creditos_cantidad > 0 ? "+" : ""}{mov.creditos_cantidad}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
