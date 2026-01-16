import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle, CreditCard, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [credits, setCredits] = useState(0);

  const sessionId = searchParams.get("session_id");
  const walletType = searchParams.get("wallet_type");
  const creditsParam = searchParams.get("credits");

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setStatus("error");
      setMessage("No se encontró información del pago");
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { sessionId },
      });

      if (error) throw error;

      if (data.success) {
        setStatus("success");
        setCredits(data.credits || parseInt(creditsParam || "0"));
        setMessage(data.message || "¡Pago completado exitosamente!");
        toast.success("¡Créditos agregados a tu cuenta!");
      } else {
        setStatus("error");
        setMessage(data.message || "El pago no se pudo verificar");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      setStatus("error");
      setMessage("Error al verificar el pago. Por favor contacta soporte.");
    }
  };

  const handleContinue = () => {
    if (walletType === "empresa") {
      navigate("/wallet-empresa");
    } else {
      navigate("/wallet-reclutador");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle>Procesando tu pago...</CardTitle>
              <CardDescription>Por favor espera mientras verificamos tu compra</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-600">¡Pago Exitoso!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Error en el Pago</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "success" && credits > 0 && (
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-4xl font-bold text-primary">{credits}</p>
              <p className="text-sm text-muted-foreground">créditos agregados</p>
            </div>
          )}

          <Button 
            className="w-full gap-2" 
            onClick={handleContinue}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Continuar a mi Wallet
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          {status === "error" && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/")}
            >
              Volver al Inicio
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
