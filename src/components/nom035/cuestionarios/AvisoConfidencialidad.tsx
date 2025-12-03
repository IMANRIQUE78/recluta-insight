import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Lock, Eye, FileText } from "lucide-react";

interface AvisoConfidencialidadProps {
  nombreTrabajador: string;
  tipoGuia: string;
  onAceptar: () => void;
  onCancelar: () => void;
}

export const AvisoConfidencialidad = ({
  nombreTrabajador,
  tipoGuia,
  onAceptar,
  onCancelar
}: AvisoConfidencialidadProps) => {
  const [aceptado, setAceptado] = useState(false);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Aviso de Confidencialidad</CardTitle>
        <CardDescription>{tipoGuia}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium">Trabajador: {nombreTrabajador}</p>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4 text-sm">
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Lock className="h-4 w-4" />
                <h3 className="font-semibold">Confidencialidad de la Información</h3>
              </div>
              <p className="text-muted-foreground">
                La información que proporcione en este cuestionario es <strong>estrictamente confidencial</strong>. 
                Sus respuestas serán tratadas de manera anónima para fines estadísticos y de mejora 
                del entorno organizacional.
              </p>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Eye className="h-4 w-4" />
                <h3 className="font-semibold">Uso de la Información</h3>
              </div>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Los resultados individuales <strong>no serán compartidos</strong> con su jefe inmediato ni con terceros</li>
                <li>La información <strong>no se utilizará</strong> para evaluaciones de desempeño, promociones o cualquier decisión laboral</li>
                <li>Los reportes generados serán de carácter <strong>agregado y estadístico</strong></li>
                <li>El objetivo es <strong>identificar áreas de mejora</strong> en las condiciones de trabajo</li>
              </ul>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-4 w-4" />
                <h3 className="font-semibold">Marco Normativo</h3>
              </div>
              <p className="text-muted-foreground">
                Esta evaluación se realiza en cumplimiento de la <strong>NOM-035-STPS-2018</strong>, 
                que establece los elementos para identificar, analizar y prevenir los factores de 
                riesgo psicosocial, así como para promover un entorno organizacional favorable.
              </p>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-4 w-4" />
                <h3 className="font-semibold">Participación Voluntaria</h3>
              </div>
              <p className="text-muted-foreground">
                Su participación en esta evaluación es <strong>voluntaria</strong>. Puede suspender 
                el cuestionario en cualquier momento. Sin embargo, su participación es muy valiosa 
                para mejorar las condiciones laborales de todos los colaboradores.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Instrucciones Importantes</h3>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Responda con <strong>honestidad</strong> cada pregunta</li>
                <li>No hay respuestas correctas o incorrectas</li>
                <li>Considere su experiencia de los <strong>últimos meses</strong> en su trabajo</li>
                <li>Complete todas las preguntas para obtener un resultado válido</li>
              </ul>
            </section>
          </div>
        </ScrollArea>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
            <Checkbox
              id="acepto"
              checked={aceptado}
              onCheckedChange={(checked) => setAceptado(checked === true)}
            />
            <Label htmlFor="acepto" className="text-sm leading-relaxed cursor-pointer">
              He leído y entiendo que mi información será tratada de forma confidencial. 
              Acepto participar voluntariamente en esta evaluación conforme a la NOM-035-STPS-2018.
            </Label>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancelar} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={onAceptar} disabled={!aceptado} className="flex-1">
              <Shield className="h-4 w-4 mr-2" />
              Iniciar Evaluación
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};