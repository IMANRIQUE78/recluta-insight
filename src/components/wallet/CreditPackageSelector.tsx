import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Sparkles, Zap, Crown, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreditPackage {
  size: "20" | "50" | "100";
  credits: number;
  price: number;
  pricePerCredit: number;
  discount?: number;
  icon: React.ReactNode;
  popular?: boolean;
}

const packages: CreditPackage[] = [
  {
    size: "20",
    credits: 20,
    price: 2400,
    pricePerCredit: 120,
    icon: <Zap className="h-5 w-5" />,
  },
  {
    size: "50",
    credits: 50,
    price: 5580,
    pricePerCredit: 111.6,
    discount: 7,
    icon: <Sparkles className="h-5 w-5" />,
    popular: true,
  },
  {
    size: "100",
    credits: 100,
    price: 10800,
    pricePerCredit: 108,
    discount: 10,
    icon: <Crown className="h-5 w-5" />,
  },
];

interface CreditPackageSelectorProps {
  walletType: "empresa" | "reclutador";
}

export function CreditPackageSelector({ walletType }: CreditPackageSelectorProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>("50");
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          packageSize: selectedPackage,
          walletType,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, "_blank");
      } else {
        throw new Error("No se recibió URL de checkout");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Error al iniciar el proceso de pago");
    } finally {
      setLoading(false);
    }
  };

  const selected = packages.find((p) => p.size === selectedPackage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Comprar Créditos
        </CardTitle>
        <CardDescription>
          Selecciona un paquete de créditos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {packages.map((pkg) => (
            <button
              key={pkg.size}
              onClick={() => setSelectedPackage(pkg.size)}
              className={cn(
                "relative flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                selectedPackage === pkg.size
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    selectedPackage === pkg.size
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {pkg.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{pkg.credits} créditos</span>
                    {pkg.discount && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200">
                        -{pkg.discount}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${pkg.pricePerCredit.toFixed(0)} por crédito
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">${pkg.price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">MXN</p>
              </div>
              {pkg.popular && (
                <Badge className="absolute -top-2 right-4 bg-primary">
                  Popular
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Paquete seleccionado:</span>
            <span className="font-medium">{selected?.credits} créditos</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total a pagar:</span>
            <span className="text-primary">${selected?.price.toLocaleString()} MXN</span>
          </div>
        </div>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando pago...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pagar con Stripe
              <ExternalLink className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Serás redirigido a Stripe para completar el pago de forma segura
        </p>
      </CardContent>
    </Card>
  );
}
